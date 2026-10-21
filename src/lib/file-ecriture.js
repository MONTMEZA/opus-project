/**
 * LA FILE D'ÉCRITURE D'UN DEVIS — une requête à la fois, et rien en double.
 *
 * POURQUOI ELLE EXISTE (lot 1 du module devis, 21/10/2026)
 * --------------------------------------------------------
 * Une ligne de devis s'enregistre quand on la quitte, quand on touche une
 * pastille, quand on ferme sa carte. Envoyées telles quelles, ces écritures
 * se croiseraient :
 *   - deux enregistrements rapprochés d'une ligne neuve partiraient avant
 *     la première réponse : deux insertions, deux lignes ;
 *   - les réponses reviennent dans le DÉSORDRE : un total plus ancien
 *     s'afficherait par-dessus le bon ;
 *   - une requête qui ne revient jamais n'atteint jamais le `catch`
 *     (l'incident du 01/10/2026) : la ligne aurait l'air enregistrée.
 *
 * CE QU'ELLE GARANTIT
 * -------------------
 *   1. UNE requête en vol à la fois, dans l'ordre d'arrivée — la création
 *      du devis passe toujours avant ses lignes ;
 *   2. deux écritures en attente pour la même ligne FUSIONNENT : la file ne
 *      garde que la valeur VOULUE de chaque ligne, et ne calcule ce qu'elle
 *      envoie qu'au moment de l'envoyer. Une insertion pas encore partie
 *      absorbe donc les modifications qui la suivent ;
 *   3. une ligne s'INSÈRE une fois, entière, puis ne se MODIFIE que par ce
 *      qui a changé. JAMAIS d'« upsert » : PostgreSQL juge la ligne
 *      PROPOSÉE avant de la fusionner, et un upsert partiel est refusé avec
 *      le mauvais message (le piège du lot T) ;
 *   4. chaque requête porte un DÉLAI (`avecDelai`, 8 s), et un délai dépassé
 *      ANNULE la requête (`signal`, que `ecrire` passe à `.abortSignal()`) :
 *      sans l'annulation, une écriture « perdue » pouvait arriver au serveur
 *      APRÈS la suivante et l'écraser (une modification), ou recréer une
 *      ligne que l'artisan venait de retirer (une insertion) — mesuré par la
 *      relecture des étapes 0-2 du 21/10/2026 ;
 *   5. une écriture renvoyée est la MÊME écriture : l'identifiant est choisi
 *      par le téléphone (`identifiant.js`). Une insertion qui rend 23505
 *      (la clé existe déjà) est RELUE : si la base la rend, c'est qu'elle
 *      était déjà faite — jamais un doublon, jamais un message ;
 *   6. une écriture dont on ignore l'issue (délai dépassé, réseau coupé)
 *      n'est jamais tenue pour faite NI pour refusée :
 *        - une insertion reste une INSERTION à renvoyer, jamais une
 *          modification (modifier une ligne absente ne fait rien, sans
 *          erreur) ; et retirer la ligne envoie une suppression ;
 *        - les colonnes d'une modification deviennent INCONNUES : elles
 *          repartent à la prochaine écriture, même si l'artisan revient à
 *          l'ancienne valeur (sinon la file croirait la base à 45 € quand elle
 *          est peut-être à 50 €) ;
 *   7. quand la file devient INACTIVE après une écriture confirmée (ou dont
 *      l'issue est inconnue), les totaux sont RELUS — quelle que soit l'issue
 *      de la dernière opération : une ligne refusée après une ligne
 *      enregistrée ne doit pas laisser à l'écran un total qui ignore la
 *      première. Un compteur de génération jette une relecture partie avant
 *      une autre écriture : une réponse en retard n'affiche jamais un total
 *      périmé ;
 *   8. l'état de chaque ligne est public : `locale` (jamais partie :
 *      incomplète, ou refusée avant l'envoi), `en_cours`, `enregistree`,
 *      `echec` — et `null` pour ce que la file ne connaît plus (retiré, ou le
 *      devis supprimé ; l'événement `supprimee` le dit). `enAttente()` compte
 *      les lignes qui ne sont pas enregistrées, UNE SUPPRESSION PAS ENCORE
 *      FAITE COMPRISE : une ligne retirée à l'écran mais toujours en base
 *      n'a pas l'air d'un travail fait ;
 *   9. un interblocage (40P01) se retente UNE fois : la transaction a été
 *      annulée en entier, la retenter ne double rien. Au second, `echec` ;
 *  10. supprimer le brouillon ne perd RIEN quand la suppression échoue : la
 *      file se met en pause (plus rien ne PART, ce qui attend reste), la
 *      requête en vol finit, la suppression part ; si elle échoue, le devis
 *      reprend son état et la file repart. Une fois supprimé, plus rien ne
 *      s'y écrit.
 *
 * LE RISQUE QUI RESTE, DIT : l'annulation n'arrête que ce que le serveur n'a
 * pas encore reçu. Une requête déjà reçue, mais dont la réponse se perd,
 * s'exécute quand même — et si elle passe APRÈS la suivante, la base garde
 * la valeur la plus ancienne. Ce cas ne se ferme que côté base (une version
 * de ligne comparée à chaque écriture) ; la file ne fait que le rendre rare.
 *
 * CE FICHIER N'IMPORTE RIEN. Il reçoit tout ce qu'il appelle : les
 * écritures (`ecrire`), les relectures (`relireUn`, `relireTotaux`), le
 * délai (`avecDelai`, celui de `erreurs.js`) et le générateur
 * d'identifiants. C'est ce qui permet à `verifier-devis` de le faire
 * tourner sous `node`, avec de fausses écritures, des délais dépassés et des
 * réponses dans le désordre — ce qu'aucun navigateur ne reproduit à la
 * demande.
 *
 * LES VALEURS sont celles de l'application (camelCase) ; `ecrire` les
 * traduit pour la base. Le devis porte la clé `'devis'`, chaque ligne son
 * `id`, et une ligne nomme son devis par `devisId`.
 *
 * LA LIMITE, DITE : une application tuée perd ce qui était encore dans la
 * file. Ce n'est pas un mode hors ligne ; la parade est l'enregistrement
 * ligne par ligne, et une file qui DIT ce qui n'est pas parti.
 */

/** Le délai de chaque requête : 8 secondes, la borne que la vraie base
 *  impose elle-même à une requête (`statement_timeout`). */
export const DELAI_ECRITURE = 8000;

/** Les quatre états d'une ligne, tels que l'écran les affiche. Ce que la file
 *  ne connaît plus (une ligne retirée, le devis supprimé) n'a pas d'état :
 *  `etatDe()` rend `null`, et l'événement `{ type: 'supprimee' }` le dit. */
export const ETATS = Object.freeze(['locale', 'en_cours', 'enregistree', 'echec']);

const DEVIS = 'devis';

/* La valeur d'une colonne dont on ne sait pas ce que la base a gardé (une
   modification partie, sans réponse). Elle n'est égale à rien : la colonne
   repart à la prochaine écriture, quelle que soit la valeur voulue. */
const INCONNU = Symbol('valeur inconnue en base');

/* Une erreur de clé primaire déjà prise : 23505 sur `…_pkey` (le devis et
   ses lignes n'ont AUCUNE autre contrainte d'unicité — un index unique sur
   (pro, client) est même interdit, D4). */
function estUneCleDejaPrise(e) {
  if (!e || e.code !== '23505') return false;
  const texte = `${e.message || ''} ${e.details || ''}`;
  const nom = (texte.match(/"([a-z0-9_]+)"/i) || [])[1];
  return !nom || /_pkey$/.test(nom);
}

const estUnInterblocage = (e) => Boolean(e && e.code === '40P01');

/* Ce qui a changé entre ce qu'on veut et ce que la base a confirmé. Une
   valeur `undefined` ne dit rien (elle n'est pas « vider ») ; une colonne
   que la base n'a pas rendue vaut `null` ; l'identifiant ne se modifie
   jamais. */
function changements(voulu, confirme) {
  const diff = {};
  Object.keys(voulu).forEach((c) => {
    if (c === 'id' || voulu[c] === undefined) return;
    const avant = confirme && confirme[c] !== undefined ? confirme[c] : null;
    if (!Object.is(voulu[c], avant)) diff[c] = voulu[c];
  });
  return diff;
}

/* Une erreur SANS code de la base — un délai dépassé, un réseau coupé —
   ne dit pas si l'écriture est passée. Une erreur avec un code (23514, une
   règle d'accès…) dit qu'elle a été refusée. */
const issueInconnue = (e) => !(e && e.code) || (e && e.name === 'AbortError');

/**
 * Une file pour UN devis.
 *
 * @param {object} o
 * @param {string} o.devisId          l'identifiant du devis (choisi par le téléphone)
 * @param {object} [o.devis]          les valeurs du devis connues à l'ouverture
 * @param {boolean} [o.devisEnBase]   le devis existe-t-il déjà en base ?
 * @param {object[]} [o.lignesEnBase] les lignes déjà en base (valeurs complètes)
 * @param {Function} o.ecrire         ({ quoi, action, id, valeurs, signal }) → Promise ;
 *                                    quoi : 'devis' | 'ligne' ; action : 'inserer' | 'modifier' | 'supprimer'.
 *                                    LE CONTRAT, que `api.js` doit tenir (vérifié au lot 4, D-27) :
 *                                      - passer `signal` à la requête (`.abortSignal(signal)` de
 *                                        supabase-js) : c'est lui qui annule une requête hors délai ;
 *                                      - rejeter avec l'erreur de PostgREST TELLE QUELLE — son `code`
 *                                        (23505, 40P01, 23514…) et le nom de la contrainte dans
 *                                        `message` ou `details`. Une erreur déjà traduite par
 *                                        `messageClair()` perd son code : un 23505 ne serait plus
 *                                        reconnu (un doublon affiché), ni un 40P01 (aucune reprise).
 *                                        La phrase de l'écran se fait APRÈS, depuis `erreurDe()`.
 * @param {Function} o.relireUn       ({ quoi, id }) → Promise de la ligne, ou de `null` si elle n'est pas à moi
 * @param {Function} [o.relireTotaux] (devisId) → Promise des totaux et de la ventilation
 * @param {Function} o.avecDelai      (promesse, ms, quoi) → Promise : celui de `erreurs.js`
 * @param {Function} [o.nouvelIdentifiant] pour le cas, en pratique jamais vu, d'un identifiant pris ailleurs
 * @param {number} [o.delaiMs]
 */
export function creerFileEcriture({
  devisId,
  devis = {},
  devisEnBase = false,
  lignesEnBase = [],
  ecrire,
  relireUn,
  relireTotaux = null,
  avecDelai,
  nouvelIdentifiant = null,
  delaiMs = DELAI_ECRITURE,
} = {}) {
  /* Sans délai, une requête qui ne revient jamais laisserait la ligne « en
     cours » pour toujours : la file refuse de naître sans lui. */
  if (typeof avecDelai !== 'function') {
    throw new Error('La file d’écriture d’un devis exige `avecDelai` : sans délai, une requête qui ne revient '
      + 'jamais n’atteint jamais le `catch`.');
  }
  if (typeof ecrire !== 'function' || typeof relireUn !== 'function') {
    throw new Error('La file d’écriture d’un devis exige `ecrire` et `relireUn`.');
  }
  if (!devisId) throw new Error('La file d’écriture d’un devis exige l’identifiant du devis.');

  /* Une entrée par objet : le devis (clé 'devis') et chaque ligne (son id).
       voulu    : les valeurs COMPLÈTES que l'écran veut voir en base ;
       confirme : ce que la base a confirmé (null : jamais inséré, ou on ne
                  sait pas si l'insertion est passée) ;
       retire   : l'écran a demandé la suppression ;
       etat, erreur, essais. */
  const entrees = new Map();
  entrees.set(DEVIS, {
    cle: DEVIS,
    voulu: { ...devis, id: devisId },
    confirme: devisEnBase ? { ...devis, id: devisId } : null,
    retire: false,
    etat: devisEnBase ? 'enregistree' : 'locale',
    erreur: null,
  });
  (lignesEnBase || []).forEach((l) => {
    entrees.set(l.id, { cle: l.id, voulu: { ...l }, confirme: { ...l }, retire: false, etat: 'enregistree', erreur: null });
  });

  /* `attente` : les clés à écrire, dans l'ordre d'arrivée, chacune une
     fois. `enVol` : la clé dont la requête est partie. `generation` monte à
     chaque requête d'écriture qui part. `enRelecture` : les relectures de
     totaux en cours. `aRelire` : une écriture a été confirmée (ou son issue
     est inconnue) depuis la dernière relecture — les totaux affichés ne la
     comptent peut-être pas. `enPause` : la suppression du devis est en
     cours, rien ne part. `supprime` : le devis n'existe plus.
     `fermetures` : les promesses de `attendre()` ; `finsDeVol` : celles de
     la suppression, qui attend la fin de la requête en vol. */
  const attente = [];
  let enVol = null;
  let generation = 0;
  let enRelecture = 0;
  let aRelire = false;
  let enPause = false;
  let supprime = false;
  let suppression = null;
  const abonnes = new Set();
  const fermetures = [];
  const finsDeVol = [];

  const prevenir = (evenement) => abonnes.forEach((f) => {
    try { f(evenement); } catch (e) { /* un écran qui casse n'arrête pas la file */ }
  });
  const poser = (e, etat, erreur = null) => {
    e.etat = etat;
    e.erreur = erreur;
    prevenir({ type: 'etat', cle: e.cle, etat, erreur });
  };
  const estVide = () => attente.length === 0 && enVol === null && enRelecture === 0;
  const verifierFermetures = () => {
    if (!estVide()) return;
    fermetures.splice(0).forEach((f) => f(true));
  };
  /* La requête en vol est finie : ceux qui l'attendaient (la suppression du
     devis) repartent. */
  const liberer = () => {
    enVol = null;
    finsDeVol.splice(0).forEach((f) => f());
  };
  /* Un brouillon supprimé ne reçoit plus rien : écrire dedans recréerait un
     devis que l'artisan vient d'effacer — ou le supprimerait une seconde
     fois. L'écran qui appelle encore la file après la suppression a un
     défaut, et il doit le voir. */
  const refuserSiSupprime = () => {
    if (supprime) throw new Error('Ce brouillon a été supprimé : plus rien ne s’y enregistre.');
  };

  /* Mettre une clé dans la file, une seule fois. Une ligne dont le devis
     n'est pas encore en base fait passer le devis DEVANT elle. */
  function enfiler(cle) {
    if (cle !== DEVIS) {
      const d = entrees.get(DEVIS);
      if (!d.confirme && enVol !== DEVIS && !attente.includes(DEVIS)) {
        attente.push(DEVIS);
        if (d.etat !== 'en_cours') poser(d, 'en_cours');
      }
    }
    if (!attente.includes(cle)) attente.push(cle);
    /* Une ligne qui attend dans la file n'est PAS enregistrée : elle le dit
       dès maintenant (« enregistrement… »), et le pied la compte. */
    const e = entrees.get(cle);
    if (e) e.attendDevis = false;
    if (e && e.etat !== 'en_cours') poser(e, 'en_cours');
    pomper();
  }

  /* L'opération à envoyer pour une clé, calculée AU DERNIER MOMENT : c'est
     ce qui fusionne les écritures en attente. `null` : rien à envoyer. */
  function operation(e) {
    const quoi = e.cle === DEVIS ? 'devis' : 'ligne';
    if (e.retire) {
      /* Une ligne jamais insérée (et dont aucune insertion n'est restée en
         suspens) n'a rien à supprimer en base. */
      if (!e.confirme && !e.peutEtreInseree) return null;
      return { quoi, action: 'supprimer', id: e.voulu.id };
    }
    if (!e.confirme) return { quoi, action: 'inserer', id: e.voulu.id, valeurs: { ...e.voulu } };
    const diff = changements(e.voulu, e.confirme);
    if (!Object.keys(diff).length) return null;
    return { quoi, action: 'modifier', id: e.voulu.id, valeurs: diff };
  }

  const delai = (promesse) => avecDelai(promesse, delaiMs, 'L’enregistrement du devis');

  /* UN envoi : la requête porte un signal d'annulation, et un délai dépassé
     (ou toute autre issue sans réponse) l'ANNULE. Ce que le serveur n'a pas
     encore reçu ne partira donc jamais plus tard, par-dessus l'écriture
     suivante. Annuler une requête déjà finie ne fait rien. */
  function unEnvoi(op) {
    const controle = typeof AbortController === 'function' ? new AbortController() : null;
    const requete = controle ? { ...op, signal: controle.signal } : { ...op };
    return delai(Promise.resolve().then(() => ecrire(requete))).catch((e) => {
      if (controle) {
        try { controle.abort(); } catch (x) { /* rien à annuler */ }
      }
      throw e;
    });
  }

  async function envoyer(op) {
    generation += 1;
    try {
      return await unEnvoi(op);
    } catch (e) {
      if (!estUnInterblocage(e)) throw e;
      /* Deux enregistrements de ce devis se sont croisés : la transaction a
         été annulée EN ENTIER, la retenter ne double rien. Une fois. */
      generation += 1;
      return unEnvoi(op);
    }
  }

  /* Une insertion qui rend « clé déjà prise » : déjà faite par nous, ou un
     identifiant pris ailleurs. On RELIT par l'identifiant. */
  async function dejaFaite(e, op) {
    const ligne = await delai(Promise.resolve().then(() => relireUn({ quoi: op.quoi, id: op.id })));
    if (ligne) {
      /* Ce que la base a VRAIMENT : peut-être une version plus ancienne,
         insérée par une requête qu'on croyait perdue. La différence avec ce
         qu'on veut repartira en modification. */
      e.confirme = { ...ligne };
      e.peutEtreInseree = false;
      return true;
    }
    /* Pris par quelqu'un d'autre — en pratique jamais. Un nouvel
       identifiant, et l'écran le sait (sa clé de rangée change). */
    const nouveau = typeof nouvelIdentifiant === 'function' ? nouvelIdentifiant() : null;
    if (!nouveau) return false;
    const ancien = e.voulu.id;
    if (e.cle === DEVIS) {
      e.voulu.id = nouveau;
      entrees.forEach((x) => { if (x.cle !== DEVIS && x.voulu.devisId === ancien) x.voulu.devisId = nouveau; });
    } else {
      entrees.delete(ancien);
      e.cle = nouveau;
      e.voulu.id = nouveau;
      entrees.set(nouveau, e);
    }
    prevenir({ type: 'renomme', ancien, nouveau, quoi: op.quoi });
    /* À renvoyer, sous le nouvel identifiant. */
    return null;
  }

  async function pomper() {
    if (enVol !== null) return;
    /* La suppression du devis est en cours (rien ne part ; ce qui attend
       reste), ou elle est faite (plus rien ne partira). */
    if (enPause || supprime) { verifierFermetures(); return; }
    if (!attente.length) {
      /* LA FILE DEVIENT INACTIVE : si une écriture a été confirmée depuis la
         dernière relecture, les totaux se relisent MAINTENANT — même si la
         dernière opération a échoué, ou n'avait rien à envoyer. */
      if (aRelire) {
        aRelire = false;
        relire();
      }
      verifierFermetures();
      return;
    }
    const cle = attente.shift();
    const e = entrees.get(cle);
    if (!e) { pomper(); return; }

    /* Le devis d'abord : une ligne dont le devis n'a pas pu être créé ne
       part pas — elle échouerait sur une clé étrangère, avec une phrase qui
       ne dirait pas pourquoi. Elle repartira TOUTE SEULE quand le devis sera
       créé (`attendDevis`), ou par « Réessayer ». */
    if (cle !== DEVIS) {
      const d = entrees.get(DEVIS);
      if (!d.confirme && d.etat === 'echec') {
        poser(e, 'echec', d.erreur);
        e.attendDevis = true;
        pomper();
        return;
      }
    }

    const op = operation(e);
    if (!op) {
      if (e.retire) {
        entrees.delete(cle);
        prevenir({ type: 'supprimee', cle });
      } else {
        poser(e, e.locale ? 'locale' : 'enregistree');
      }
      pomper();
      return;
    }

    enVol = cle;
    poser(e, 'en_cours');
    let fini = false;
    let dejaEnBase = false;
    try {
      await envoyer(op);
      fini = true;
    } catch (err) {
      if (op.action === 'inserer' && estUneCleDejaPrise(err)) {
        try {
          const r = await dejaFaite(e, op);
          if (r === true) { fini = true; dejaEnBase = true; }
          else if (r === null) { liberer(); attente.unshift(e.cle); pomper(); return; }
          else poser(e, 'echec', err);
        } catch (err2) {
          /* La relecture n'a pas répondu. Mais un 23505 PROUVE qu'une ligne
             porte cet identifiant : retirer la ligne doit envoyer une
             suppression, jamais l'oublier en local (la ligne resterait en
             base, comptée dans les totaux, absente de l'écran). */
          e.peutEtreInseree = true;
          aRelire = true;
          poser(e, 'echec', err2);
        }
      } else {
        if (issueInconnue(err)) {
          /* Le délai dépassé, le réseau coupé : l'écriture a PU passer. Les
             totaux se reliront ; une insertion reste à renvoyer comme une
             INSERTION (le 23505 dira si elle était faite), et une suppression
             de ce qui a peut-être été inséré reste à faire ; les colonnes
             d'une modification deviennent INCONNUES — elles repartiront. */
          aRelire = true;
          if (op.action === 'inserer') e.peutEtreInseree = true;
          if (op.action === 'modifier') {
            const c = { ...(e.confirme || {}) };
            Object.keys(op.valeurs).forEach((k) => { c[k] = INCONNU; });
            e.confirme = c;
          }
        }
        poser(e, 'echec', err);
      }
    }
    liberer();

    if (fini) {
      aRelire = true;
      if (op.action === 'supprimer') {
        if (e.retire) {
          entrees.delete(e.cle);
          prevenir({ type: 'supprimee', cle: e.cle });
        } else {
          /* L'écran a REMIS la ligne pendant que sa suppression partait : elle
             n'est plus en base, elle repart en insertion — sinon elle
             disparaîtrait de la base ET de la file, sans un mot. */
          e.confirme = null;
          e.peutEtreInseree = false;
          if (!attente.includes(e.cle)) attente.push(e.cle);
        }
      } else {
        if (!dejaEnBase) e.confirme = { ...(e.confirme || {}), ...op.valeurs };
        e.peutEtreInseree = false;
        /* Ce qui a été voulu PENDANT le vol repart : l'écran qui écrit
           entre-temps remet la clé dans la file (`enfiler`). Et ce que la
           base avait de différent, après un 23505, repart en modification.
           SAUF pour une ligne devenue « locale » pendant le vol : ce que
           l'écran montre n'est pas recevable, rien de plus ne part. */
        const reste = !e.locale && (e.retire || Object.keys(changements(e.voulu, e.confirme)).length > 0);
        if (reste && !attente.includes(e.cle)) attente.push(e.cle);
        if (e.locale) poser(e, 'locale');
        else if (!reste) poser(e, 'enregistree');
        /* Le devis existe enfin : les lignes qui l'attendaient repartent. */
        if (e.cle === DEVIS) {
          entrees.forEach((x, c) => {
            if (c !== DEVIS && x.attendDevis && x.etat === 'echec' && !attente.includes(c)) {
              x.attendDevis = false;
              attente.push(c);
              poser(x, 'en_cours');
            }
          });
        }
      }
    }
    pomper();
  }

  /* Les totaux, relus quand la file devient inactive. Une relecture partie
     avant une autre écriture est jetée : elle montrerait un total périmé
     comme « le total de la base ». */
  function relire() {
    if (typeof relireTotaux !== 'function' || supprime) return;
    const g = generation;
    const id = entrees.get(DEVIS).voulu.id;
    enRelecture += 1;
    delai(Promise.resolve().then(() => relireTotaux(id)))
      .then((totaux) => { if (g === generation) prevenir({ type: 'totaux', totaux }); })
      .catch((err) => { if (g === generation) prevenir({ type: 'totaux_illisibles', erreur: err }); })
      .finally(() => { enRelecture -= 1; verifierFermetures(); });
  }

  function attendre(ms = DELAI_ECRITURE) {
    if (estVide()) return Promise.resolve(true);
    return new Promise((resoudre) => {
      const minuteur = setTimeout(() => {
        const i = fermetures.indexOf(fin);
        if (i >= 0) fermetures.splice(i, 1);
        resoudre(false);
      }, ms);
      function fin(v) { clearTimeout(minuteur); resoudre(v); }
      fermetures.push(fin);
    });
  }

  /* La fin de la requête en vol, ou `false` au bout de `ms`. */
  function attendreLeVol(ms) {
    if (enVol === null) return Promise.resolve(true);
    return new Promise((resoudre) => {
      const minuteur = setTimeout(() => {
        const i = finsDeVol.indexOf(fin);
        if (i >= 0) finsDeVol.splice(i, 1);
        resoudre(false);
      }, ms);
      function fin() { clearTimeout(minuteur); resoudre(true); }
      finsDeVol.push(fin);
    });
  }

  /* Le devis n'existe plus : la file oublie tout, et le dit. */
  function oublier() {
    supprime = true;
    attente.splice(0);
    [...entrees.keys()].forEach((c) => { if (c !== DEVIS) entrees.delete(c); });
    const d = entrees.get(DEVIS);
    d.retire = true;
    prevenir({ type: 'supprimee', cle: DEVIS });
  }

  /* ------------------------------------------------------------------ */
  /*  CE QUE L'ÉCRAN APPELLE                                              */
  /* ------------------------------------------------------------------ */

  return {
    /** Les valeurs du devis (en-tête) : fusionnées dans ce qu'on veut, puis envoyées. */
    devis(valeurs) {
      refuserSiSupprime();
      const e = entrees.get(DEVIS);
      e.voulu = { ...e.voulu, ...valeurs, id: e.voulu.id };
      enfiler(DEVIS);
    },

    /** Une ligne COMPLÈTE, déjà passée par `validerLigne()` : insérée si elle
     *  est neuve, sinon modifiée par ce qui a changé. */
    ligne(valeurs) {
      refuserSiSupprime();
      if (!valeurs || !valeurs.id) throw new Error('Une ligne de devis s’enregistre avec son identifiant.');
      const ancienne = entrees.get(valeurs.id);
      const devisIdCourant = entrees.get(DEVIS).voulu.id;
      if (ancienne) {
        ancienne.voulu = { ...ancienne.voulu, ...valeurs, devisId: devisIdCourant };
        ancienne.retire = false;
        ancienne.locale = false;
      } else {
        entrees.set(valeurs.id, {
          cle: valeurs.id, voulu: { ...valeurs, devisId: devisIdCourant }, confirme: null,
          retire: false, etat: 'locale', erreur: null,
        });
      }
      enfiler(valeurs.id);
    },

    /** Quelques champs d'une ligne déjà connue : fusionnés dans ce qu'on veut. */
    modifierLigne(id, changementsVoulus) {
      refuserSiSupprime();
      const e = entrees.get(id);
      if (!e) throw new Error('Cette ligne n’est pas connue de la file : envoyez-la entière.');
      e.voulu = { ...e.voulu, ...changementsVoulus, id };
      e.retire = false;
      e.locale = false;
      enfiler(id);
    },

    /** Retirer une ligne. Jamais insérée : elle disparaît sans requête. */
    retirerLigne(id) {
      refuserSiSupprime();
      const e = entrees.get(id);
      if (!e) return;
      e.retire = true;
      /* Retirer n'est pas « locale » : l'artisan veut qu'elle parte. */
      e.locale = false;
      if (!e.confirme && !e.peutEtreInseree && enVol !== id) {
        /* Jamais en base : rien à supprimer, et surtout pas de devis à
           créer pour l'occasion. */
        const i = attente.indexOf(id);
        if (i >= 0) attente.splice(i, 1);
        entrees.delete(id);
        prevenir({ type: 'supprimee', cle: id });
        verifierFermetures();
        return;
      }
      enfiler(id);
    },

    /** L'écran n'a PAS envoyé cette ligne (incomplète, ou refusée par
     *  `validerLigne()`) : elle est `locale`, et ce qui l'attendait encore
     *  dans la file en sort — y compris une valeur voulue pendant une
     *  requête en vol, qui ne repartira pas à la fin du vol. La version déjà
     *  en base, s'il y en a une, reste. */
    marquerLocale(id, valeurs = null) {
      refuserSiSupprime();
      let e = entrees.get(id);
      if (!e) {
        e = { cle: id, voulu: { ...(valeurs || {}), id }, confirme: null, retire: false, etat: 'locale', erreur: null };
        entrees.set(id, e);
      }
      const i = attente.indexOf(id);
      if (i >= 0) attente.splice(i, 1);
      /* Si une écriture plus ancienne est en vol, elle finit — mais la ligne
         reste « locale » : ce que l'écran montre n'est pas en base. */
      e.locale = true;
      poser(e, 'locale');
      verifierFermetures();
    },

    /** « Réessayer » : une ligne en échec, ou tout ce qui a échoué (le devis d'abord). */
    reessayer(id = null) {
      refuserSiSupprime();
      const cles = id ? [id] : [...entrees.values()].filter((e) => e.etat === 'echec').map((e) => e.cle);
      cles.sort((a, b) => (a === DEVIS ? -1 : b === DEVIS ? 1 : 0)).forEach((c) => {
        const e = entrees.get(c);
        if (e && e.etat === 'echec') enfiler(c);
      });
    },

    /** Supprimer le brouillon, et ses lignes avec lui (la cascade de la base).
     *
     *  RIEN NE SE PERD SI ELLE ÉCHOUE : la file se met en PAUSE — plus rien ne
     *  part, ce qui attend reste dans la file —, la requête en vol finit (elle
     *  porte un délai : trois au plus, l'envoi, sa reprise après un
     *  interblocage, la relecture d'un 23505), puis la suppression part. Si
     *  elle est refusée, ou si l'on ne sait pas — et qu'une relecture trouve
     *  encore le devis —, il reprend son état, la file repart, et l'erreur
     *  remonte à l'écran. Si elle passe, la file oublie tout : plus rien ne
     *  s'écrit dans ce brouillon. Jamais deux suppressions à la fois. */
    supprimerDevis() {
      if (supprime) return Promise.resolve(true);
      if (suppression) return suppression;
      const d = entrees.get(DEVIS);
      /* L'état à rendre au devis si la suppression échoue : celui d'APRÈS la
         requête en vol — elle a pu être sa propre création. */
      let avant = null;
      enPause = true;
      suppression = (async () => {
        try {
          if (!(await attendreLeVol(delaiMs * 4))) {
            throw new Error('Un enregistrement de ce devis est encore en cours : réessayez dans un instant.');
          }
          avant = { etat: d.etat, erreur: d.erreur };
          if (!d.confirme && !d.peutEtreInseree) {
            /* Jamais en base : rien à supprimer. */
            oublier();
            return true;
          }
          enVol = DEVIS;
          poser(d, 'en_cours');
          try {
            await envoyer({ quoi: 'devis', action: 'supprimer', id: d.voulu.id });
          } catch (err) {
            if (!issueInconnue(err)) throw err;
            /* Le délai dépassé : la suppression a PU passer. On relit. */
            let encore = null;
            try {
              encore = await delai(Promise.resolve().then(() => relireUn({ quoi: 'devis', id: d.voulu.id })));
            } catch (e2) {
              throw err;
            }
            if (encore) throw err;
          }
          oublier();
          return true;
        } catch (err) {
          if (enVol === DEVIS) liberer();
          if (avant) poser(d, avant.etat, avant.erreur);
          throw err;
        } finally {
          if (enVol === DEVIS) liberer();
          enPause = false;
          suppression = null;
          if (supprime) verifierFermetures();
          else pomper();
        }
      })();
      return suppression;
    },

    /** L'état d'une ligne (ou du devis, clé `'devis'`) ; `null` si la file
     *  ne la connaît plus (retirée, ou le devis supprimé). */
    etatDe(id) {
      if (supprime) return null;
      const e = entrees.get(id);
      return e ? e.etat : null;
    },
    /** L'erreur d'une ligne en échec, pour la phrase de l'écran. */
    erreurDe(id) {
      const e = entrees.get(id);
      return e ? e.erreur : null;
    },
    /** La ligne a-t-elle été retirée à l'écran, sans que sa suppression soit
     *  encore faite ? L'écran dit alors « suppression non enregistrée ». */
    retiree(id) {
      const e = entrees.get(id);
      return Boolean(e && e.retire && id !== DEVIS);
    },
    /** L'identifiant courant du devis (il ne change qu'après un 23505 pris ailleurs). */
    devisId() {
      return entrees.get(DEVIS).voulu.id;
    },
    /** Le devis existe-t-il en base ? */
    devisEnBase() {
      return !supprime && Boolean(entrees.get(DEVIS).confirme);
    },
    /** `{ [id]: état }` pour chaque ligne connue. */
    etats() {
      const r = {};
      entrees.forEach((e, c) => { if (c !== DEVIS) r[c] = e.etat; });
      return r;
    },
    /** Combien de LIGNES ne sont pas enregistrées — ce que disent le pied et
     *  la garde de sortie. Une ligne retirée dont la suppression n'est pas
     *  faite (en cours, ou refusée) en est : elle est encore en base. */
    enAttente() {
      let n = 0;
      entrees.forEach((e, c) => { if (c !== DEVIS && (e.locale || e.etat !== 'enregistree')) n += 1; });
      return n;
    },
    /** Plus rien en vol ni en attente ? */
    vide: estVide,
    /** Une promesse qui se résout à `true` quand la file est vide, ou à
     *  `false` au bout de `ms` — la garde de sortie attend 8 s au plus. */
    attendre,
    /** Écouter : `{ type: 'etat' | 'totaux' | 'totaux_illisibles' | 'renomme' | 'supprimee', … }`. */
    abonner(f) {
      abonnes.add(f);
      return () => abonnes.delete(f);
    },
    /** Le compteur de génération (pour les contrôles). */
    generation() {
      return generation;
    },
  };
}

/**
 * DIRE CE QUI S'EST PASSÉ, EN FRANÇAIS, ET CE QU'IL FAUT FAIRE.
 *
 * POURQUOI CE FICHIER EXISTE
 * --------------------------
 * La traduction des erreurs vivait ENFERMÉE dans `AuthScreen.js`. Un
 * échec de connexion disait donc « Email ou mot de passe incorrect » —
 * très bien —, mais partout ailleurs dans l'application, le même défaut
 * sortait en anglais, tel que Supabase l'avait écrit :
 *
 *     « Failed to fetch »
 *     « new row violates row-level security policy for table "posts" »
 *     « JWT expired »
 *
 * Un propriétaire qui débute lit ça et ne peut rien en faire. Pire : il ne
 * peut même pas savoir si c'est SON réseau, SA faute, ou un défaut du
 * programme.
 *
 * LE CAS LE PLUS FRÉQUENT N'ÉTAIT PAS TRAITÉ DU TOUT
 * ---------------------------------------------------
 * Le réseau. Un artisan travaille dans une cave, dans un sous-sol, dans un
 * hameau. Perdre la 4G est la situation NORMALE, pas l'exception — et
 * l'application répondait « Failed to fetch », ce qui ressemble à une
 * panne du logiciel alors que c'est l'ascenseur.
 *
 * LA RÈGLE TENUE ICI
 * ------------------
 *   1. on dit ce qui s'est passé, en français ;
 *   2. on dit ce qu'il faut FAIRE, quand il y a quelque chose à faire ;
 *   3. on garde le motif technique quand on ne sait pas traduire — c'est
 *      souvent la seule chose exploitable, et la jeter serait pire.
 *
 * Ce qu'on ne fait PAS : inventer une explication rassurante. « Une erreur
 * est survenue » tout seul ne vaut rien.
 */

/** Vrai quand l'erreur vient manifestement du réseau, pas du programme. */
export function estUnProblemeDeReseau(e) {
  const m = String((e && e.message) || e || '').toLowerCase();
  const nom = String((e && e.name) || '').toLowerCase();
  return (
    m.includes('failed to fetch')
    || m.includes('network request failed')
    || m.includes('load failed')
    || m.includes('networkerror')
    || m.includes('timeout')
    || m.includes('timed out')
    || nom === 'typeerror' && m.includes('fetch')
    || nom === 'aborterror'
  );
}

/** Vrai quand la session a expiré : il faut se reconnecter, rien d'autre. */
export function estUneSessionExpiree(e) {
  const m = String((e && e.message) || e || '').toLowerCase();
  return m.includes('jwt expired')
    || m.includes('invalid refresh token')
    || m.includes('refresh_token_not_found')
    || m.includes('aucune session ouverte');
}

/**
 * Le message à montrer. Toujours en français, toujours utilisable.
 *
 * `quoi` dit ce qu'on était en train de faire — « Votre publication »,
 * « Votre profil ». Sans lui, « Impossible » ne dit pas impossible de quoi.
 */
export function messageClair(e, quoi = '') {
  const brut = String((e && e.message) || e || '').trim();
  const m = brut.toLowerCase();
  const sujet = quoi ? `${quoi} : ` : '';

  /* Le réseau d'abord : c'est le cas le plus fréquent sur un chantier, et
     celui où l'utilisateur n'a rien fait de mal. */
  if (estUnProblemeDeReseau(e)) {
    return `${sujet}pas de connexion. Vérifiez votre réseau — `
      + 'ce qui est déjà affiché reste lisible, et vous pourrez réessayer.';
  }
  if (estUneSessionExpiree(e)) {
    return `${sujet}votre session a expiré. Fermez et rouvrez l'application `
      + 'pour vous reconnecter.';
  }

  /* --- l'authentification, reprise d'AuthScreen où elle était enfermée --- */
  if (m.includes('invalid login credentials')) return 'Email ou mot de passe incorrect.';
  if (m.includes('already registered') || m.includes('already been registered')) {
    return 'Un compte existe déjà avec cet email. Utilisez « Se connecter ».';
  }
  if (m.includes('email not confirmed')) {
    return "Votre email n'est pas encore confirmé. Regardez votre boîte mail.";
  }
  if (m.includes('password')) return 'Mot de passe trop court (6 caractères minimum).';
  if (m.includes('invalid email') || m.includes('unable to validate email')) {
    return "Cette adresse email n'est pas valide.";
  }
  if (m.includes('signups not allowed') || m.includes('signup is disabled')) {
    return 'Les inscriptions sont désactivées dans les réglages Supabase.';
  }

  /* --- ce que la BASE refuse, et qui a déjà coûté des heures --- */

  /* Le cas du 30/09 : le format « montage » envoyé sans avoir été ajouté à
     `posts_type_check`. La base refusait, le mode démo n'y voyait rien, et
     le message ne parlait que de contrainte. */
  if (m.includes('violates check constraint') || m.includes('check constraint')) {
    const nom = (brut.match(/"([a-z0-9_]+_check)"/i) || [])[1];
    return `${sujet}la base a refusé cette valeur`
      + (nom ? ` (contrainte « ${nom} »)` : '')
      + '. Le plus souvent, `supabase/schema.sql` n’a pas été rejoué.';
  }
  if (m.includes('row-level security') || m.includes('violates row-level')) {
    return `${sujet}la base a refusé l’enregistrement : vous n’avez pas le `
      + 'droit d’écrire cette ligne. Ce n’est pas une panne, c’est une règle.';
  }
  if (m.includes('duplicate key') || m.includes('already exists')) {
    return `${sujet}cela existe déjà.`;
  }
  if (m.includes('permission denied for function')) {
    const nom = (brut.match(/function ([a-z0-9_]+)/i) || [])[1];
    return `${sujet}la base refuse d’exécuter ${nom ? `« ${nom} »` : 'une fonction'}. `
      + 'Il manque un `grant execute … to authenticated` dans `schema.sql`.';
  }
  if (m.includes('permission denied') || m.includes('42501')) {
    return `${sujet}la base refuse cet accès.`;
  }
  /* Le code maison du 30/09 : un commentaire auquel on a répondu se fige. */
  if (m.includes('op001') || m.includes('ne peut plus être corrigé')) {
    return brut;
  }
  if (m.includes('payload too large') || m.includes('entity too large')) {
    return `${sujet}le fichier est trop lourd.`;
  }

  /* On ne sait pas traduire : on rend le motif tel quel plutôt qu'une
     phrase creuse. C'est souvent la seule chose exploitable. */
  return brut ? `${sujet}${brut}` : `${sujet}une erreur est survenue. Réessayez.`;
}

/**
 * NE JAMAIS ATTENDRE LE RÉSEAU INDÉFINIMENT.
 *
 * CONSTATÉ LE 01/10/2026, en coupant la liaison pour de vrai.
 * ---------------------------------------------------------
 * Avec une session valide et la base injoignable, l'application restait
 * bloquée sur son squelette de démarrage — **pour toujours**. Pas d'erreur,
 * pas de message : les blocs gris battaient doucement, et c'est tout.
 *
 * La cause n'est pas une faute de logique : `setDemarrage(false)` est bien
 * écrit après l'attente. Mais une requête qui ne revient JAMAIS n'atteint
 * jamais la ligne suivante. Un `catch` ne protège de rien quand rien
 * n'échoue — il ne se passe simplement rien.
 *
 * C'est le défaut le plus trompeur de cette famille : l'écran a l'air
 * vivant (le squelette bat), donc on attend. Puis on attend encore. Puis on
 * ferme l'application.
 *
 * > **Tout appel réseau sur le chemin du démarrage porte un délai.** Au
 * > bout, on considère que c'est le réseau — ce qui est vrai dans
 * > l'immense majorité des cas — et on ouvre quand même l'application.
 *
 * Douze secondes : assez pour une 4G faible sur un chantier, trop peu pour
 * qu'on se demande si c'est cassé.
 */
export function avecDelai(promesse, ms = 12000, quoi = 'La base') {
  let minuteur;
  const limite = new Promise((_, rejeter) => {
    minuteur = setTimeout(() => {
      const e = new Error(`${quoi} ne répond pas (plus de ${Math.round(ms / 1000)} secondes).`);
      /* `AbortError` : `estUnProblemeDeReseau()` le reconnaît, donc le
         message affiché parlera de connexion et pas de panne. */
      e.name = 'AbortError';
      rejeter(e);
    }, ms);
  });
  return Promise.race([promesse, limite]).finally(() => clearTimeout(minuteur));
}

/**
 * UN SERVEUR QUI SE RÉVEILLE N'EST PAS UN SERVEUR EN PANNE.
 *
 * CONSTATÉ LE 02/10/2026, sur la vraie base, par le propriétaire.
 * --------------------------------------------------------------
 * « Plus rien ne fonctionne, plus de contenu, et une phrase d'erreur. »
 * Rien n'était cassé : à cet instant précis, la couche API du projet
 * Supabase REDÉMARRAIT. Les journaux le disent à la seconde près —
 * « Successfully connected to PostgreSQL », « Connection Pool
 * initialized », « Schema cache loaded 26 Relations » — deux fois de
 * suite. Aucune requête refusée (zéro réponse 4xx, zéro erreur
 * PostgreSQL) : il n'y avait simplement personne au bout du fil.
 *
 * L'application a fait exactement ce qu'on lui avait appris : elle a
 * attendu, échoué, et affiché « Le chargement a échoué ». Ce qu'elle n'a
 * PAS fait, c'est redemander. Or un serveur qui démarre répond deux
 * secondes plus tard. Le propriétaire a dû fermer et rouvrir — ce qui,
 * du point de vue du réseau, est exactement ce qu'un simple nouvel essai
 * aurait fait.
 *
 * > **Un échec réseau sur le chemin du démarrage se retente UNE fois**,
 * > après une courte pause. Une seule : au deuxième échec, c'est une vraie
 * > panne, et la taire derrière un sablier serait pire que de le dire.
 *
 * Ce qu'on ne retente PAS : une session expirée, un droit refusé, une
 * contrainte violée. Ces trois-là donneront la même réponse mille fois —
 * les retenter ne fait qu'ajouter de l'attente à une mauvaise nouvelle.
 */
export const PAUSE_REPRISE = 2500;

export function estDefinitif(e) {
  if (estUneSessionExpiree(e)) return true;
  const m = String((e && (e.message || e.error_description)) || e).toLowerCase();
  const code = String((e && e.code) || '');
  /* Un refus de la base est une réponse, pas une absence de réponse. */
  return m.includes('permission denied')
    || m.includes('row-level security')
    || m.includes('violates')
    || code.startsWith('23')   // contraintes
    || code.startsWith('42');  // droits, syntaxe
}

export async function avecReprise(faire, { pause = PAUSE_REPRISE, quoi = 'La base' } = {}) {
  try {
    return await avecDelai(faire(), 12000, quoi);
  } catch (e) {
    if (estDefinitif(e)) throw e;
    await new Promise((r) => setTimeout(r, pause));
    /* Le second essai n'est pas enveloppé d'un `try` : s'il échoue aussi,
       c'est l'appelant qui doit le dire à l'utilisateur. */
    return avecDelai(faire(), 12000, quoi);
  }
}

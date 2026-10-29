/**
 * UNE FICHE CLIENT — créer, modifier, archiver, supprimer.
 *
 * UNE FENÊTRE PLEIN ÉCRAN, ET PAS UNE FEUILLE DU BAS, et ce n'est pas un
 * goût : c'est le défaut du 04/10 évité par construction. Une feuille
 * transparente collée au bas de l'écran se fait recouvrir par le clavier
 * de l'iPhone — le champ ET la croix de fermeture —, et l'application a
 * l'air plantée alors qu'elle fonctionne. Ici la croix est en HAUT : le
 * clavier monte du bas, il ne peut enfermer personne. C'est exactement ce
 * que `verifier-feuilles` avait constaté à propos de `SelecteurMetiers`,
 * en lui donnant tort — le risque a une forme précise, et ce formulaire
 * ne l'a pas.
 *
 * Et neuf champs ne tiennent pas dans une feuille : sur un petit écran
 * avec un grand clavier, il faudrait faire défiler une feuille pour
 * atteindre son propre bouton.
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, Modal, ScrollView, Pressable, StyleSheet, Linking,
} from 'react-native';
import { X, Archive, ArchiveRestore, Trash, AlertTriangle } from './icons';
import ChampVille from './ChampVille';
import { C, F, T, S, R, TOUCHE, viser, interligne, surFond } from '../theme';
import {
  BtnMain, BtnMini, BtnOutline, Field, TextArea, PillToggle, SectionLabel, Montant,
} from './ui';
import { CLAVIER } from '../lib/clavier';
import {
  TYPES_CLIENT, LONGUEUR_MAX, validerClient, clientsDuMemeNom, siretPropre,
} from '../lib/clients';
import { depuisLisible } from '../lib/devis';
import { PHRASE_POSTES_D_UN_CLIENT } from '../lib/postes';

/* « Ses devis » en montre 20 au plus : la lecture en demande 21, pour SAVOIR
   qu'il y en a d'autres. Une boucle, pas une liste virtualisée : on est dans
   le `ScrollView` de la fiche, et vingt éléments ne pèsent rien. */
const SES_DEVIS_MAX = 20;

const VIDE = {
  type: 'particulier', nom: '', siret: '', telephone: '', email: '',
  adresse: '', codePostal: '', ville: '', notes: '',
};

export default function FicheClient({
  ouvert, fiche = null, depuis = null, tousLesClients = [],
  onFermer, onEnregistrer, onArchiver, onSupprimer, onOuvrirAutre,
  /* Lot 1 du devis : « Ses devis » (la lecture, puis l'ouverture d'un devis)
     et « Faire un devis ». Absents — un particulier, ou la fiche ouverte
     depuis la saisie d'un devis —, la section n'existe pas. */
  lireSesDevis = null, onOuvrirDevis = null, onFaireDevis = null,
  /* Une fiche EXISTANTE ouverte pour un devis — depuis sa saisie (« vous
     avez déjà un client de ce nom »), ou depuis « Faire un devis » sur une
     demande dont le numéro est déjà au carnet (29/10/2026) : on la choisit
     pour ce devis, d'un appui — c'est ce que le geste cherchait. Absent
     partout ailleurs. */
  onChoisirPourLeDevis = null,
  /* Pourquoi la fiche s'affiche au lieu du devis (« Faire un devis » sur une
     demande, `POURQUOI_LA_FICHE`) — une phrase, ou rien. */
  pourquoi = null,
}) {
  /* `depuis` pré-remplit le formulaire avec ce qu'une demande reçue sait
     déjà du client. La `key` du composant est changée par l'appelant à
     chaque ouverture : sans elle, l'état initial ne serait lu qu'une fois
     et la deuxième fiche ouverte montrerait la première. C'est le piège
     de `defaut` sur `ChampLocal` (lot I). */
  const depart = fiche
    ? {
      type: fiche.type || 'particulier',
      nom: fiche.nom || '',
      siret: fiche.siret || '',
      telephone: fiche.telephone || '',
      email: fiche.email || '',
      adresse: fiche.adresse || '',
      codePostal: fiche.codePostal || '',
      ville: fiche.ville || '',
      notes: fiche.notes || '',
    }
    : { ...VIDE, ...(depuis || {}) };

  const [v, setV] = useState(depart);
  const [erreur, setErreur] = useState(null);
  const [occupe, setOccupe] = useState(false);
  const [confirmeSuppression, setConfirmeSuppression] = useState(false);

  /* « SES DEVIS » — le premier lecteur du carnet qui ne soit pas son propre
     écran. Lus à l'ouverture d'une fiche existante ; un échec se DIT, et ne
     cache pas ce qu'une suppression laisserait derrière elle. */
  const [sesDevis, setSesDevis] = useState(() => (fiche && lireSesDevis ? { etat: 'lecture', liste: [] } : null));
  const [tentativeDevis, setTentativeDevis] = useState(0);
  useEffect(() => {
    if (!fiche || !lireSesDevis) return undefined;
    let vivant = true;
    (async () => {
      try {
        const liste = await lireSesDevis(fiche.id);
        if (vivant) setSesDevis({ etat: 'ok', liste: liste || [] });
      } catch (e) {
        if (vivant) setSesDevis({ etat: 'echec', liste: [] });
      }
    })();
    return () => { vivant = false; };
  }, [tentativeDevis]); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * « SUIVANT » DOIT ALLER QUELQUE PART — et il ne pouvait aller nulle part.
   *
   * Les huit champs portaient tous `returnKeyType="next"` et AUCUN
   * `onSubmitEditing`. Donc la touche affichait « Suivant » et ne faisait
   * que refermer le clavier : on la touche, le clavier tombe, et il faut
   * viser le champ suivant — celui que le clavier cachait justement.
   * C'est la moitié invisible du défaut du 11/10.
   *
   * ET TROIS DE CES HUIT NE POUVAIENT MÊME PAS L'AFFICHER : un clavier
   * `number-pad` ou `phone-pad` d'iOS n'a PAS de touche retour. Le SIRET,
   * le téléphone et le code postal ne peuvent donc pas enchaîner, quoi
   * qu'on écrive — leur `returnKeyType` a été retiré plutôt que laissé à
   * mentir. On en sort en touchant le champ suivant, que la brique du
   * clavier garde désormais visible.
   *
   * `blurOnSubmit={false}` sur ceux qui enchaînent : sans lui le clavier
   * se referme puis se rouvre, et toute la page saute entre les deux.
   *
   * Et la lecture de la référence vit DANS le gestionnaire, jamais au
   * rendu : le linter l'a refusée sous la forme `allerA(refTelephone)`,
   * et il avait raison — une fonction qui reçoit une référence pendant le
   * rendu peut en lire la valeur à cet instant, où elle n'est pas encore
   * attachée. C'est le défaut du champ vide du lot I, en plus discret.
   */
  const refSiret = useRef(null);
  const refTelephone = useRef(null);
  const refEmail = useRef(null);
  const refAdresse = useRef(null);
  const refCodePostal = useRef(null);
  const refVille = useRef(null);

  const poser = (champ) => (valeur) => {
    setV((x) => ({ ...x, [champ]: valeur }));
    setErreur(null);
  };

  /**
   * CHANGER DE TYPE VIDE LE SIRET, ET ÇA SE VOIT.
   *
   * Un particulier n'a pas de SIRET : le numéro saisi ne veut plus rien
   * dire. Le déclencheur `tient_le_client()` le vide de toute façon
   * (section 41.3) et `validerClient()` aussi — mais si l'écran le
   * laissait affiché, on enregistrerait en croyant l'avoir gardé, et on
   * le retrouverait vide au rechargement sans comprendre pourquoi.
   *
   * On supprime le défaut au lieu de le contrôler : la règle du
   * calendrier du 04/10.
   */
  const changerType = (type) => {
    setV((x) => ({ ...x, type, siret: type === 'entreprise' ? x.siret : '' }));
    setErreur(null);
  };

  const estEntreprise = v.type === 'entreprise';
  const doublons = clientsDuMemeNom(v.nom, tousLesClients, fiche ? fiche.id : null);

  const valider = async () => {
    if (occupe) return;
    const r = validerClient(v);
    if (!r.ok) { setErreur(r); return; }
    setOccupe(true);
    try { await onEnregistrer(r.valeurs, fiche ? fiche.id : null); }
    finally { setOccupe(false); }
  };

  /* UNE FONCTION, PAS UN COMPOSANT. Le linter a raison de le refuser :
     `const Erreur = ({…}) => …` crée un TYPE de composant à chaque rendu,
     donc React le démonte et le remonte à chaque lettre tapée. Une
     fonction qui rend du JSX donne exactement le même résultat sans ce
     coût. C'est la deuxième fois que le linter trouve en un passage ce
     que l'œil n'avait pas vu (lot 8). */
  const messageErreur = (champ) => (
    erreur && erreur.champ === champ
      ? <Text style={s.erreur}>{erreur.message}</Text>
      : null
  );

  return (
    <Modal
      visible={!!ouvert}
      animationType="slide"
      onRequestClose={onFermer}
      transparent={false}
    >
      <View style={s.ecran}>
        <View style={s.entete}>
          <Text style={s.titre} numberOfLines={1}>
            {fiche ? v.nom || 'Fiche client' : 'Nouveau client'}
          </Text>
          <Pressable
            onPress={onFermer}
            hitSlop={viser(24)}
            accessibilityRole="button"
            accessibilityLabel="Fermer"
          >
            <X size={20} color={C.ink} />
          </Pressable>
        </View>

        <ScrollView
          {...CLAVIER}
          contentContainerStyle={s.contenu}
        >
          {/* CE QUE CE CARNET N'EST PAS. Il porte le nom, le téléphone et
              l'adresse de quelqu'un qui n'est pas sur Opus et qui n'a rien
              accepté. Le dire une fois, à la création, et nulle part
              ailleurs : un bandeau permanent finit par ne plus se lire. */}
          {!fiche && (
            <View style={s.garde}>
              <Text style={s.gardeTitre}>Ces informations restent chez vous</Text>
              <Text style={s.gardeTexte}>
                Votre carnet n&apos;est visible que de vous. Rien n&apos;en
                apparaît sur votre fiche publique, ni dans le fil, ni pour
                un autre artisan.
              </Text>
            </View>
          )}

          {!!pourquoi && (
            <View style={s.garde}>
              <Text style={s.gardeTitre}>Pour ce devis</Text>
              <Text style={s.gardeTexte}>{pourquoi}</Text>
            </View>
          )}

          {/* POUR UN DEVIS, la fiche d'un client existant ne mène pas à un
              AUTRE devis (la garde de la saisie ne le permettrait pas sans
              la lire) : elle se choisit pour celui qu'on est en train
              d'écrire. */}
          {!!fiche && !!onChoisirPourLeDevis && (
            <BtnMain
              label="Choisir ce client pour ce devis"
              accessibilityLabel={`Choisir ${fiche.nom} pour le devis en cours`}
              onPress={() => onChoisirPourLeDevis(fiche)}
            />
          )}

          <SectionLabel>Qui est-ce ?</SectionLabel>
          <PillToggle
            options={TYPES_CLIENT.map((t) => ({ key: t.cle, label: t.label }))}
            value={v.type}
            onChange={changerType}
          />

          <Text style={s.label}>
            {estEntreprise ? "Nom de l'entreprise" : 'Nom du client'}
          </Text>
          <Field
            placeholder={estEntreprise ? 'SCI des Verlusses' : 'Mme Martin'}
            value={v.nom}
            onChangeText={poser('nom')}
            autoFocus={!fiche}
            maxLength={LONGUEUR_MAX.nom}
            returnKeyType="next"
            blurOnSubmit={false}
            onSubmitEditing={() => {
              const suivant = estEntreprise ? refSiret : refTelephone;
              if (suivant.current) suivant.current.focus();
            }}
          />
          {messageErreur('nom')}

          {/* L'AVERTISSEMENT, ET PAS UN REFUS. La section 36.2 pose un
              index unique sur le titre d'un chantier ; ici il n'y en a
              pas, et c'est voulu : dans un village il y a souvent trois
              Martin. On montre celui qu'on a déjà et on laisse décider. */}
          {doublons.length > 0 && (
            <Pressable
              style={s.doublon}
              onPress={() => onOuvrirAutre && onOuvrirAutre(doublons[0])}
              accessibilityRole="button"
              accessibilityLabel={`Vous avez déjà un client nommé ${doublons[0].nom}. Ouvrir sa fiche.`}
            >
              <AlertTriangle size={14} color={C.accentTexte} />
              <Text style={s.doublonTexte}>
                Vous avez déjà {doublons.length > 1 ? `${doublons.length} clients` : 'un client'} de
                ce nom{doublons[0].ville ? ` (${doublons[0].ville})` : ''}.
                {onOuvrirAutre ? ' Ouvrir sa fiche.' : ''}
              </Text>
            </Pressable>
          )}

          {/* LE SIRET N'APPARAÎT QUE POUR UNE ENTREPRISE. Le demander à un
              particulier, c'est demander un numéro qui n'existe pas — et
              c'est le genre de champ devant lequel on abandonne. Il décide
              des mentions obligatoires d'une facture, d'où sa présence
              dès maintenant. */}
          {estEntreprise && (
            <>
              <Text style={s.label}>SIRET</Text>
              <Field
                ref={refSiret}
                placeholder="123 456 789 00012"
                value={v.siret}
                onChangeText={poser('siret')}
                keyboardType="number-pad"
                maxLength={20}
              />
              <Text style={s.aide}>
                {siretPropre(v.siret).length > 0
                  ? `${siretPropre(v.siret).length} chiffre${siretPropre(v.siret).length > 1 ? 's' : ''} sur 14`
                  : 'Il figurera sur les factures que vous lui adresserez.'}
              </Text>
              {messageErreur('siret')}
            </>
          )}

          <SectionLabel>Pour le joindre</SectionLabel>
          <Text style={s.label}>Téléphone</Text>
          <Field
            ref={refTelephone}
            placeholder="06 39 98 00 00"
            value={v.telephone}
            onChangeText={poser('telephone')}
            keyboardType="phone-pad"
            maxLength={LONGUEUR_MAX.telephone}
          />
          {messageErreur('telephone')}

          <Text style={s.label}>E-mail</Text>
          <Field
            ref={refEmail}
            placeholder="client@exemple.fr"
            value={v.email}
            onChangeText={poser('email')}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={LONGUEUR_MAX.email}
            returnKeyType="next"
            blurOnSubmit={false}
            onSubmitEditing={() => refAdresse.current && refAdresse.current.focus()}
          />
          {messageErreur('email')}

          <SectionLabel>Adresse de facturation</SectionLabel>
          {/* UNE SEULE ADRESSE, et c'est celle de FACTURATION. L'adresse du
              chantier appartiendra au chantier de gestion (§12) : en poser
              une seconde ici, c'est deviner laquelle des deux on écrit.

              ELLE SE PROPOSE, demandé par le propriétaire le 11/10/2026 —
              « comme les autres endroits de l'application ». Un appui
              remplit les TROIS cases : la rue ici, le code postal et la
              ville juste en dessous. Le mode `rue` n'offre qu'un numéro ou
              une rue : le code postal d'une commune est le plus petit de
              cette commune (Paris → 75001), donc le remplir depuis une
              suggestion de commune serait faux sur chaque facture.

              ET ON NE REMPLIT RIEN TOUT SEUL. La Base Adresse ne répond
              jamais « introuvable » : elle rend une AUTRE adresse, bien
              formée. Taper « 4 rue des lilas charleval », où cette rue
              n'existe pas, propose « 4 Rue des Acacias 13350 Charleval » —
              mesuré. C'est pour ça que la liste montre l'adresse ENTIÈRE
              et qu'il faut la choisir : on lit « Acacias », et on sait. */}
          <ChampVille
            ref={refAdresse}
            type="rue"
            placeholder="N° et rue"
            valeur={v.adresse}
            maxLength={LONGUEUR_MAX.adresse}
            onChange={(lieu) => {
              setV((x) => ({
                ...x,
                adresse: lieu.rue || lieu.affichage || '',
                /* Une frappe libre ne rend que `affichage` : le code postal
                   et la ville déjà saisis ne doivent PAS s'effacer sous les
                   doigts de celui qui corrige sa rue. */
                codePostal: lieu.codePostal || x.codePostal,
                ville: lieu.ville || x.ville,
              }));
              setErreur(null);
            }}
          />
          {messageErreur('adresse')}

          <View style={s.ligne}>
            <View style={s.cp}>
              <Text style={s.label}>Code postal</Text>
              <Field
                ref={refCodePostal}
                placeholder="Code postal"
                value={v.codePostal}
                onChangeText={poser('codePostal')}
                keyboardType="number-pad"
                maxLength={5}
              />
            </View>
            <View style={s.villeBoite}>
              <Text style={s.label}>Ville</Text>
              <Field
                ref={refVille}
                placeholder="Commune"
                value={v.ville}
                onChangeText={poser('ville')}
                maxLength={LONGUEUR_MAX.ville}
                returnKeyType="done"
              />
            </View>
          </View>
          {messageErreur('codePostal')}

          {!!sesDevis && (
            <>
              <SectionLabel>Ses devis</SectionLabel>
              {!!onFaireDevis && !fiche.archive && (
                <BtnOutline
                  label="Faire un devis"
                  accessibilityLabel={`Faire un devis pour ${fiche.nom}`}
                  onPress={() => onFaireDevis(fiche)}
                />
              )}
              {sesDevis.etat === 'lecture' && <Text style={s.aide}>Lecture de ses devis…</Text>}
              {sesDevis.etat === 'echec' && (
                <View style={s.sesDevisEchec}>
                  <Text style={s.erreur}>
                    Ses devis n&apos;ont pas pu être lus. Ce n&apos;est pas qu&apos;il n&apos;en a pas.
                  </Text>
                  <BtnOutline label="Réessayer" onPress={() => {
                    setSesDevis({ etat: 'lecture', liste: [] });
                    setTentativeDevis((k) => k + 1);
                  }} />
                </View>
              )}
              {sesDevis.etat === 'ok' && sesDevis.liste.length === 0 && (
                <Text style={s.aide}>Aucun devis pour ce client.</Text>
              )}
              {sesDevis.etat === 'ok' && sesDevis.liste.slice(0, SES_DEVIS_MAX).map((d) => (
                <Pressable
                  key={d.id}
                  style={s.unDevis}
                  onPress={() => onOuvrirDevis && onOuvrirDevis(d)}
                  accessibilityRole="button"
                  accessibilityLabel={`Ouvrir le devis ${d.objet || 'sans objet'}`}
                >
                  <View style={s.unDevisTextes}>
                    <Text style={s.unDevisObjet} numberOfLines={2}>{d.objet || 'Sans objet'}</Text>
                    <Text style={s.aide}>{`Brouillon · modifié ${depuisLisible(d.modifieLe)}`}</Text>
                  </View>
                  <Montant centimes={d.totalTtcCentimes} />
                </Pressable>
              ))}
              {sesDevis.etat === 'ok' && sesDevis.liste.length > SES_DEVIS_MAX && (
                <Text style={s.aide}>Et d&apos;autres : voir « Mes devis ».</Text>
              )}
            </>
          )}

          <SectionLabel>Ce qu&apos;il faut se rappeler</SectionLabel>
          <TextArea
            placeholder="Portail à gauche. Prévenir la veille."
            value={v.notes}
            onChangeText={poser('notes')}
            maxLength={LONGUEUR_MAX.notes}
          />
          {messageErreur('notes')}

          <BtnMain
            block
            disabled={occupe}
            label={occupe ? 'Enregistrement…' : (fiche ? 'Enregistrer' : 'Ajouter ce client')}
            onPress={valider}
            style={{ marginTop: S.lg }}
          />

          {/* APPELER ET ÉCRIRE N'EXISTENT QUE SI LA DONNÉE EXISTE.
              Un bouton « Appeler » sur une fiche sans téléphone composerait
              une chaîne vide : on appuie, rien ne se passe, et on croit
              l'application cassée. C'est la règle de `FicheContactPro`, et
              celle du lot E — « un appui qui ne fait rien est pire que pas
              d'appui du tout ». */}
          {!!fiche && (!!fiche.telephone || !!fiche.email) && (
            <View style={s.joindre}>
              {!!fiche.telephone && (
                <BtnMini
                  label="Appeler"
                  accessibilityLabel={`Appeler ${fiche.nom} au ${fiche.telephone}`}
                  onPress={() => Linking.openURL(`tel:${String(fiche.telephone).replace(/\s/g, '')}`)}
                />
              )}
              {!!fiche.email && (
                <BtnMini
                  outline
                  label="Écrire"
                  accessibilityLabel={`Écrire à ${fiche.nom} à l'adresse ${fiche.email}`}
                  onPress={() => Linking.openURL(`mailto:${fiche.email}`)}
                />
              )}
            </View>
          )}

          {!!fiche && (
            <View style={s.bas}>
              {/* ARCHIVER SE DÉFAIT, comme « Terminer » un chantier : un
                  appui par erreur ne doit pas enterrer une fiche. */}
              <Pressable
                style={s.action}
                onPress={() => onArchiver(fiche, !fiche.archive)}
                accessibilityRole="button"
                accessibilityLabel={fiche.archive ? 'Remettre ce client dans la liste' : 'Archiver ce client'}
              >
                {fiche.archive
                  ? <ArchiveRestore size={15} color={C.accent2} />
                  : <Archive size={15} color={C.accent2} />}
                <Text style={s.actionTexte}>
                  {fiche.archive ? 'Remettre dans ma liste' : 'Archiver'}
                </Text>
              </Pressable>
              <Text style={s.aide}>
                Un client archivé n&apos;apparaît plus dans votre liste, mais
                il n&apos;est pas supprimé.
              </Text>

              {/* LA SUPPRESSION DEMANDE DEUX APPUIS, et le second le DIT.
                  Elle est définitive, et la base ne la retient pas : la
                  politique « mes clients » ouvre bien la porte du `delete`,
                  parce qu'une faute de frappe doit pouvoir partir et qu'un
                  client qui demande à être oublié doit pouvoir l'être. */}
              <Pressable
                style={[s.action, confirmeSuppression && s.actionDanger]}
                onPress={() => {
                  if (!confirmeSuppression) { setConfirmeSuppression(true); return; }
                  onSupprimer(fiche);
                }}
                accessibilityRole="button"
                accessibilityLabel={confirmeSuppression
                  ? 'Confirmer la suppression définitive de cette fiche'
                  : 'Supprimer cette fiche'}
              >
                <Trash size={15} color={confirmeSuppression ? surFond(C.bad) : C.bad} />
                <Text style={[s.actionTexte, confirmeSuppression && s.actionDangerTexte]}>
                  {confirmeSuppression ? 'Confirmer la suppression' : 'Supprimer cette fiche'}
                </Text>
              </Pressable>
              {confirmeSuppression && (
                <Text style={s.aide}>
                  Définitif. Pour garder la fiche sans la voir, archivez-la.
                </Text>
              )}
              {/* LA SUPPRESSION DIT CE QUI RESTE (la critique « droit », I5) :
                  un devis garde l'adresse des travaux — souvent le domicile —
                  et ce que l'artisan y a écrit. Le taire, ce serait laisser
                  croire que les données de ce client sont parties. Et un
                  échec de lecture ne cache pas ce risque. */}
              {confirmeSuppression && !!sesDevis && sesDevis.etat === 'ok' && sesDevis.liste.length > 0 && (
                <Text style={s.erreur}>
                  {`Ce client a ${sesDevis.liste.length > SES_DEVIS_MAX ? `plus de ${SES_DEVIS_MAX}` : sesDevis.liste.length} `
                    + `devis : ${sesDevis.liste.length > 1 ? 'ils resteront, détachés' : 'il restera, détaché'} de sa fiche, `
                    + 'avec l’adresse des travaux et ce que vous y avez écrit. Pour effacer ses données, supprimez '
                    + 'aussi ces devis — ou archivez la fiche pour garder le lien.'}
                </Text>
              )}
              {confirmeSuppression && !!sesDevis && sesDevis.etat !== 'ok' && (
                <Text style={s.erreur}>
                  Ses devis n&apos;ont pas pu être lus : s&apos;il en a, ils resteront, avec l&apos;adresse des
                  travaux.
                </Text>
              )}
              {/* ET LA BASE DE POSTES, À CHAQUE CONFIRMATION (relecture
                  « textes », TEXTES1) — avec ou sans devis, lus ou non : c'est
                  quand il n'a plus de devis qu'une phrase de la base peut être
                  la dernière copie de son nom. `verifier-legal` exige cette
                  ligne sous la seule condition `confirmeSuppression`. */}
              {confirmeSuppression && <Text style={s.erreur}>{PHRASE_POSTES_D_UN_CLIENT}</Text>}
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  ecran: { flex: 1, backgroundColor: C.surface, paddingTop: S.xxl + S.md },

  entete: {
    flexDirection: 'row', alignItems: 'center', gap: S.md,
    paddingHorizontal: S.lg, paddingBottom: S.md,
    borderBottomWidth: 1, borderBottomColor: C.line,
  },
  /* Un cran de l'échelle, et pas `T.sousTitre + 1` : une arithmétique sur un
     jeton fabrique une taille que l'échelle n'a pas (lot 1 du devis). */
  titre: { flex: 1, fontFamily: F.oswald6, fontSize: T.titre, color: C.ink },

  contenu: { padding: S.lg, paddingBottom: S.xxl * 2 },

  label: {
    fontFamily: F.oswald6, fontSize: T.petit, color: C.ink,
    marginTop: S.md, marginBottom: S.xs,
  },
  /* `T.minuscule` n'existait pas dans `theme.js` : la taille valait
     `undefined` — donc le défaut de React Native, 14 — et l'interligne
     `NaN`, sans erreur (relevé par la critique « écran » du lot 1). Le
     premier correctif avait pris `T.micro` (10, « étiquettes posées sur une
     image ») : il rapetissait de quatre points TOUTES les aides et TOUTES
     les erreurs de la fiche, dont la phrase que le droit a fait ajouter à la
     suppression (relecture « écran » des étapes 4 à 7, B6). Une aide se lit
     en `T.petit`, comme dans la saisie d'un devis ; une erreur et un
     avertissement de suppression en `T.corps` — c'est ce qu'on doit lire
     avant d'appuyer. */
  aide: {
    fontFamily: F.inter, fontSize: T.petit, color: C.muted,
    marginTop: S.xs, lineHeight: interligne(T.petit),
  },
  erreur: {
    fontFamily: F.inter, fontSize: T.corps, color: C.bad,
    marginTop: S.xs, lineHeight: interligne(T.corps),
  },
  sesDevisEchec: { gap: S.sm },
  unDevis: {
    flexDirection: 'row', alignItems: 'center', gap: S.sm, minHeight: TOUCHE,
    paddingVertical: S.sm, borderBottomWidth: 1, borderBottomColor: C.line,
  },
  unDevisTextes: { flex: 1, minWidth: 0 },
  unDevisObjet: { fontFamily: F.oswald6, fontSize: T.courant, color: C.ink },

  /* Angle VIF : ces blocs PORTENT l'information, ils ne flottent pas. */
  garde: {
    padding: S.md, marginBottom: S.md,
    backgroundColor: C.bg, borderLeftWidth: 3, borderLeftColor: C.accentTexte,
  },
  gardeTitre: { fontFamily: F.oswald6, fontSize: T.petit, color: C.accentTexte },
  gardeTexte: {
    fontFamily: F.inter, fontSize: T.petit, color: C.muted,
    marginTop: S.xs, lineHeight: interligne(T.petit),
  },

  doublon: {
    flexDirection: 'row', alignItems: 'center', gap: S.sm,
    marginTop: S.sm, padding: S.md, minHeight: TOUCHE,
    backgroundColor: C.bg, borderLeftWidth: 3, borderLeftColor: C.accent,
  },
  doublonTexte: {
    flex: 1, fontFamily: F.inter, fontSize: T.petit, color: C.ink,
    lineHeight: interligne(T.petit),
  },

  ligne: { flexDirection: 'row', gap: S.md },
  cp: { width: 110 },
  villeBoite: { flex: 1, minWidth: 0 },

  joindre: { flexDirection: 'row', gap: S.sm, marginTop: S.lg },

  bas: { marginTop: S.xxl, borderTopWidth: 1, borderTopColor: C.line, paddingTop: S.lg },
  /* Arrondi : ces deux-là FLOTTENT au-dessus du formulaire, on appuie
     dessus. Et `minHeight: TOUCHE`, pas `paddingVertical` — React Native
     aplatit par précision, la forme longue l'emporte (lot E). */
  action: {
    flexDirection: 'row', alignItems: 'center', gap: S.sm,
    minHeight: TOUCHE, paddingHorizontal: S.md, marginTop: S.md,
    borderWidth: 1, borderColor: C.line, borderRadius: R.doux,
  },
  actionTexte: { fontFamily: F.oswald6, fontSize: T.petit, color: C.ink },
  actionDanger: { backgroundColor: C.bad, borderColor: C.bad },
  /* MESURÉ, pas choisi : le blanc sur #B4432B donne 5,56 : 1 et l'encre
     sombre 3,11. `surFond()` tranche par le calcul — c'est ce qui rend
     lisible une étiquette dont la couleur changerait un jour. */
  actionDangerTexte: { color: surFond(C.bad) },
});

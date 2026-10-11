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
import React, { useState } from 'react';
import {
  View, Text, Modal, ScrollView, Pressable, StyleSheet, Linking,
} from 'react-native';
import { X, Archive, ArchiveRestore, Trash, AlertTriangle } from './icons';
import { C, F, T, S, R, TOUCHE, viser, interligne, surFond } from '../theme';
import { BtnMain, BtnMini, Field, TextArea, PillToggle, SectionLabel } from './ui';
import {
  TYPES_CLIENT, LONGUEUR_MAX, validerClient, clientsDuMemeNom, siretPropre,
} from '../lib/clients';

const VIDE = {
  type: 'particulier', nom: '', siret: '', telephone: '', email: '',
  adresse: '', codePostal: '', ville: '', notes: '',
};

export default function FicheClient({
  ouvert, fiche = null, depuis = null, tousLesClients = [],
  onFermer, onEnregistrer, onArchiver, onSupprimer, onOuvrirAutre,
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
          contentContainerStyle={s.contenu}
          keyboardShouldPersistTaps="handled"
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
            placeholder={estEntreprise ? 'SCI du Moulin' : 'Mme Martin'}
            value={v.nom}
            onChangeText={poser('nom')}
            autoFocus={!fiche}
            maxLength={LONGUEUR_MAX.nom}
            returnKeyType="next"
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
                placeholder="123 456 789 00012"
                value={v.siret}
                onChangeText={poser('siret')}
                keyboardType="number-pad"
                maxLength={20}
                returnKeyType="next"
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
            placeholder="06 12 34 56 78"
            value={v.telephone}
            onChangeText={poser('telephone')}
            keyboardType="phone-pad"
            maxLength={LONGUEUR_MAX.telephone}
            returnKeyType="next"
          />
          {messageErreur('telephone')}

          <Text style={s.label}>E-mail</Text>
          <Field
            placeholder="client@exemple.fr"
            value={v.email}
            onChangeText={poser('email')}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={LONGUEUR_MAX.email}
            returnKeyType="next"
          />
          {messageErreur('email')}

          <SectionLabel>Adresse de facturation</SectionLabel>
          {/* UNE SEULE ADRESSE, et c'est celle de FACTURATION. L'adresse du
              chantier appartiendra au chantier de gestion (§12) : en poser
              une seconde ici, c'est deviner laquelle des deux on écrit. */}
          <Field
            placeholder="4 rue des Lilas"
            value={v.adresse}
            onChangeText={poser('adresse')}
            maxLength={LONGUEUR_MAX.adresse}
            returnKeyType="next"
          />
          {messageErreur('adresse')}

          <View style={s.ligne}>
            <View style={s.cp}>
              <Text style={s.label}>Code postal</Text>
              <Field
                placeholder="13350"
                value={v.codePostal}
                onChangeText={poser('codePostal')}
                keyboardType="number-pad"
                maxLength={5}
                returnKeyType="next"
              />
            </View>
            <View style={s.villeBoite}>
              <Text style={s.label}>Ville</Text>
              <Field
                placeholder="Charleval"
                value={v.ville}
                onChangeText={poser('ville')}
                maxLength={LONGUEUR_MAX.ville}
                returnKeyType="next"
              />
            </View>
          </View>
          {messageErreur('codePostal')}

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
  titre: { flex: 1, fontFamily: F.oswald6, fontSize: T.sousTitre + 1, color: C.ink },

  contenu: { padding: S.lg, paddingBottom: S.xxl * 2 },

  label: {
    fontFamily: F.oswald6, fontSize: T.petit, color: C.ink,
    marginTop: S.md, marginBottom: S.xs,
  },
  aide: {
    fontFamily: F.inter, fontSize: T.minuscule, color: C.muted,
    marginTop: S.xs, lineHeight: interligne(T.minuscule),
  },
  erreur: {
    fontFamily: F.inter, fontSize: T.minuscule, color: C.bad,
    marginTop: S.xs, lineHeight: interligne(T.minuscule),
  },

  /* Angle VIF : ces blocs PORTENT l'information, ils ne flottent pas. */
  garde: {
    padding: S.md, marginBottom: S.md,
    backgroundColor: C.bg, borderLeftWidth: 3, borderLeftColor: C.accent,
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

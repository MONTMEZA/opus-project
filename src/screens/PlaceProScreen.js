/**
 * La Place des pros — les annonces entre professionnels.
 *
 * CE QUE CETTE PAGE REMPLACE
 * --------------------------
 * Un artisan connecté voyait « Assistant IA — trouver le bon pro ». Il n'a
 * pas besoin qu'on lui trouve un artisan : il en est un. C'était un onglet
 * principal gâché.
 *
 * POURQUOI ELLE PEUT MARCHER
 * --------------------------
 * La sous-traitance se traite aujourd'hui par bouche-à-oreille et par
 * groupes Facebook, où la question « ce plaquiste est-il vraiment assuré ? »
 * reste toujours sans réponse. Ici elle en a une : le badge vérifié est
 * adossé au Kbis et à l'attestation d'assurance décennale, contrôlés par un
 * humain. D'où le filtre « artisans vérifiés uniquement », qui n'a de sens
 * que dans une application qui vérifie vraiment.
 *
 * ET LES DATES
 * ------------
 * Un chantier se joue sur une semaine précise. « Je cherche un plaquiste du
 * 12 au 20 octobre » est une information exploitable ; « je cherche un
 * plaquiste » ne l'est pas. Aucune des places de marché existantes ne fait
 * correspondre les annonces sur les dates — c'est ce qui nous distingue le
 * plus sûrement.
 */
import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, FlatList, Pressable, StyleSheet, RefreshControl } from 'react-native';
import { C, F, T, S, R, TOUCHE, viser, surFond } from '../theme';
import {
  Avatar, BtnMain, BtnMini, Chip, Field, TextArea, EmptyState, SectionLabel,
} from '../components/ui';
import Media from '../components/Media';
import ChampVille from '../components/ChampVille';
import {
  MapPin, BadgeCheck, MessageCircle, Calendar, Check, X, Plus, Search, Flag,
} from '../components/icons';
import {
  TYPES_ANNONCE, UNITES, typeAnnonce, libelleDates, libellePrix,
} from '../data/annonces';
import { ChampMetier } from '../components/SelecteurMetiers';
import { nomMetier } from '../lib/metiers';
import { distanceKm, libelleDistance } from '../lib/adresse';
import { correspond, texteDe } from '../lib/recherche';
import { useRechercheDifferee } from '../lib/frappe';
import { libelleMetiers } from '../lib/metiers';

/** Une date au format que la base attend : 2026-10-12. */
function versISO(saisie) {
  const m = String(saisie || '').trim().match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?$/);
  if (!m) return null;
  const jour = Number(m[1]);
  const mois = Number(m[2]);
  if (jour < 1 || jour > 31 || mois < 1 || mois > 12) return null;
  let annee = m[3] ? Number(m[3]) : new Date().getFullYear();
  if (annee < 100) annee += 2000;
  return `${annee}-${String(mois).padStart(2, '0')}-${String(jour).padStart(2, '0')}`;
}

/**
 * La barre de recherche, dans SON composant — et ce n'est pas un rangement.
 *
 * Deux raisons, mesurées au navigateur avec le processeur bridé six fois
 * (voir src/lib/frappe.js) :
 *   1. le texte tapé reste ici, donc une lettre ne redessine que ce champ
 *      et non les annonces, les filtres et les cartes ;
 *   2. le filtrage part quand la frappe retombe, pas à chaque lettre.
 *
 * Mettre seulement le point 2 dans l'écran ne sert à RIEN : l'écran entier
 * se redessinait quand même, et le minuteur en plus faisait perdre du
 * temps. Vérifié : 93 ms par lettre avant, 180 ms avec le différé seul.
 */
function BarreRecherche({ valeur, onChange }) {
  const [texte, setTexte] = useRechercheDifferee(valeur, onChange);

  return (
    <View style={s.recherche}>
      <Search size={15} color={C.muted} />
      <Field
        style={s.rechercheChamp}
        value={texte}
        onChangeText={setTexte}
        placeholder="placo, nacelle, IPN, un fournisseur..."
        autoCorrect={false}
        returnKeyType="search"
      />
      {!!texte && (
        <Pressable
          onPress={() => { setTexte(''); onChange(''); }}
          hitSlop={viser(24)}
          accessibilityRole="button"
          accessibilityLabel="Effacer la recherche"
        >
          <X size={15} color={C.muted} />
        </Pressable>
      )}
    </View>
  );
}

export default function PlaceProScreen({
  annonces = [], moi, onPublier, onRepondre, onFermer, onVoirProfil, onErreur, onSignaler,
  onRafraichir, rafraichit = false,
}) {
  const [recherche, setRecherche] = useState('');
  const [filtreType, setFiltreType] = useState(null);
  const [filtreMetier, setFiltreMetier] = useState(null);
  const [verifiesSeulement, setVerifiesSeulement] = useState(false);
  const [formOuvert, setFormOuvert] = useState(false);

  /* --- le formulaire --- */
  const [type, setType] = useState(TYPES_ANNONCE[0].cle);
  const [titre, setTitre] = useState('');
  const [texte, setTexte] = useState('');
  const [metier, setMetier] = useState(null);
  const [lieu, setLieu] = useState({ affichage: moi ? moi.ville || '' : '' });
  const [du, setDu] = useState('');
  const [au, setAu] = useState('');
  const [prix, setPrix] = useState('');
  const [unite, setUnite] = useState('total');

  const reglages = typeAnnonce(type);

  const liste = useMemo(() => {
    const avecDistance = annonces.map((a) => {
      const laLat = a.latitude ?? (a.auteur ? a.auteur.latitude : null);
      const laLon = a.longitude ?? (a.auteur ? a.auteur.longitude : null);
      const km = (moi && moi.latitude && laLat)
        ? distanceKm(moi.latitude, moi.longitude, laLat, laLon)
        : null;
      return { ...a, km };
    });

    return avecDistance
      /* La recherche passe AVANT les filtres : on tape « placo », on voit
         tout ce qui contient placo, tous types confondus. Restreindre
         ensuite par type est un choix, pas une obligation. */
      .filter((a) => correspond(texteDe(a), recherche))
      .filter((a) => (!filtreType || a.type === filtreType))
      .filter((a) => (!filtreMetier || a.metier === filtreMetier))
      .filter((a) => (!verifiesSeulement || (a.auteur && a.auteur.verifie)))
      /* À distance connue, le plus proche d'abord : un chantier à 150 km
         n'intéresse personne. Les annonces sans coordonnées restent à leur
         place plutôt que d'être reléguées à la fin. */
      .sort((a, b) => {
        if (a.km === null || b.km === null) return 0;
        return a.km - b.km;
      });
  }, [annonces, recherche, filtreType, filtreMetier, verifiesSeulement, moi]);

  const publier = () => {
    if (!titre.trim() || !texte.trim()) return;

    const dateDebut = reglages.avecDates ? versISO(du) : null;
    const dateFin = reglages.avecDates ? versISO(au) : null;
    if (reglages.avecDates && du.trim() && !dateDebut) {
      onErreur('La date de début se note 12/10 ou 12/10/2026.');
      return;
    }
    if (reglages.avecDates && au.trim() && !dateFin) {
      onErreur('La date de fin se note 20/10 ou 20/10/2026.');
      return;
    }
    if (dateDebut && dateFin && dateFin < dateDebut) {
      onErreur('La date de fin est avant la date de début.');
      return;
    }

    onPublier({
      type,
      titre: titre.trim(),
      texte: texte.trim(),
      metier: reglages.avecMetier ? metier : null,
      ville: (lieu.affichage || '').trim() || null,
      codePostal: lieu.codePostal || null,
      latitude: lieu.latitude || null,
      longitude: lieu.longitude || null,
      dateDebut,
      dateFin,
      prix: reglages.avecPrix && prix.trim() ? Number(prix.replace(',', '.')) : null,
      unite: reglages.avecUnite ? unite : 'total',
    });

    setTitre(''); setTexte(''); setDu(''); setAu(''); setPrix('');
    setFormOuvert(false);
  };

  const manque = !titre.trim() || !texte.trim()
    || (reglages.avecMetier && !metier);

  /* UNE LISTE VIRTUALISÉE, et tout le reste en EN-TÊTE.
     Avant : une boucle dans un `ScrollView`, donc toutes les annonces
     montées d'un coup, chacune avec jusqu'à deux photos. Avec sept
     annonces de démonstration ça ne se voit pas ; avec deux cents,
     c'est le blocage de l'iPhone du 29/09 qui revient, et sur l'écran
     où l'artisan cherche du travail.
     Le formulaire, la recherche et les filtres deviennent l'en-tête de
     la liste : ils défilent avec elle, exactement comme avant. */
  return (
    <FlatList
      style={s.pad}
      keyboardShouldPersistTaps="handled"
      data={liste}
      keyExtractor={(a) => String(a.id)}
      initialNumToRender={4}
      maxToRenderPerBatch={6}
      windowSize={5}
      removeClippedSubviews
      contentContainerStyle={{ paddingBottom: 24 }}
      refreshControl={onRafraichir ? (
        <RefreshControl refreshing={!!rafraichit} onRefresh={onRafraichir}
          tintColor={C.muted} colors={[C.accent]} />
      ) : undefined}
      /* L'en-tête d'une FlatList n'est PAS séparé du premier élément par
         `ItemSeparatorComponent` : sans cette marge, le filtre se collait
         au bord de la première carte. */
      ListHeaderComponentStyle={{ marginBottom: 10 }}
      ListHeaderComponent={(
        <>
      <View style={s.entete}>
        <Text style={s.enteteTitre}>La Place des pros</Text>
        <Text style={s.enteteTexte}>
          Sous-traitance, matériel, fournisseurs, coups de main. Entre
          professionnels seulement : un particulier ne voit rien de cette page.
        </Text>
        {!formOuvert && (
          <BtnMain block onPress={() => setFormOuvert(true)}>
            <Plus size={13} color={C.surAccent} />
            <Text style={s.btnTexte}>Poser une annonce</Text>
          </BtnMain>
        )}
      </View>

      {/* --- le formulaire --- */}
      {formOuvert && (
        <View style={s.form}>
          <View style={s.formHaut}>
            <Text style={s.formTitre}>Nouvelle annonce</Text>
            <Pressable
              onPress={() => setFormOuvert(false)}
              hitSlop={viser(24)}
              accessibilityRole="button"
              accessibilityLabel="Fermer le formulaire"
            >
              <X size={16} color={C.muted} />
            </Pressable>
          </View>

          <Text style={s.label}>De quoi s'agit-il ?</Text>
          <View style={s.chipRow}>
            {TYPES_ANNONCE.map((t) => (
              <Chip key={t.cle} label={t.label} on={type === t.cle} onPress={() => setType(t.cle)} />
            ))}
          </View>
          <Text style={s.aide}>{reglages.aide}</Text>

          <Text style={s.label}>Titre</Text>
          <Field
            value={titre}
            onChangeText={setTitre}
            placeholder="Ex. : plaquiste recherché — chantier de 180 m²"
          />

          <Text style={s.label}>Détails</Text>
          <TextArea
            value={texte}
            onChangeText={setTexte}
            placeholder="Ce qu'il faut savoir pour se décider : surface, accès, matériel fourni..."
          />

          {reglages.avecMetier && (
            <>
              <Text style={s.label}>Métier concerné</Text>
              <ChampMetier
                valeur={metier}
                onChange={setMetier}
                titre="Quel type de partenaire recherchez-vous ?"
                placeholder="Choisir le métier concerné..."
              />
            </>
          )}

          <Text style={s.label}>Où</Text>
          <ChampVille valeur={lieu.affichage} onChange={setLieu} placeholder="Ville du chantier" />

          {reglages.avecDates && (
            <>
              <Text style={s.label}>Quand</Text>
              <Text style={s.aide}>
                C'est ce qui fait toute la différence : un artisan disponible
                cette semaine-là vous trouvera.
              </Text>
              <View style={s.deuxChamps}>
                <View style={{ flex: 1 }}>
                  <Field value={du} onChangeText={setDu} placeholder="Du 12/10" />
                </View>
                <View style={{ flex: 1 }}>
                  <Field value={au} onChangeText={setAu} placeholder="Au 20/10" />
                </View>
              </View>
            </>
          )}

          {reglages.avecPrix && (
            <>
              <Text style={s.label}>Prix (euros)</Text>
              <View style={s.deuxChamps}>
                <View style={{ flex: 1 }}>
                  <Field
                    value={prix}
                    onChangeText={setPrix}
                    keyboardType="decimal-pad"
                    placeholder="180"
                  />
                </View>
              </View>
              {reglages.avecUnite && (
                <View style={s.chipRow}>
                  {UNITES.map((u) => (
                    <Chip key={u.cle} label={u.label} on={unite === u.cle} onPress={() => setUnite(u.cle)} />
                  ))}
                </View>
              )}
            </>
          )}

          <View style={s.formBtns}>
            <BtnMini outline label="Annuler" onPress={() => setFormOuvert(false)} />
            <BtnMain label="Publier l'annonce" disabled={manque} onPress={publier} />
          </View>
          {manque && (
            <Text style={s.aide}>
              Il manque {!titre.trim() ? 'le titre' : ''}
              {!titre.trim() && !texte.trim() ? ' et ' : ''}
              {!texte.trim() ? 'les détails' : ''}
              {reglages.avecMetier && !metier ? ((!titre.trim() || !texte.trim()) ? ' et le métier' : 'le métier') : ''}.
            </Text>
          )}
        </View>
      )}

      {/* --- la recherche ---
          Elle passe avant les filtres parce que c'est par là qu'on commence :
          on sait ce qu'on cherche (« placo », « nacelle », « IPN ») bien
          avant de savoir dans quelle catégorie ça a été rangé. */}
      <BarreRecherche valeur={recherche} onChange={setRecherche} />

      {/* --- filtres --- */}
      <SectionLabel>
        {liste.length} {liste.length > 1 ? 'annonces' : 'annonce'}
        {recherche.trim() ? ` pour « ${recherche.trim()} »` : ''}
      </SectionLabel>

      <View style={s.chipRow}>
        {TYPES_ANNONCE.map((t) => (
          <Chip
            key={t.cle}
            label={t.label}
            on={filtreType === t.cle}
            onPress={() => setFiltreType(filtreType === t.cle ? null : t.cle)}
          />
        ))}
      </View>

      <Pressable
        style={[s.verifies, verifiesSeulement && s.verifiesOn]}
        onPress={() => setVerifiesSeulement((v) => !v)}
      >
        <View style={[s.case, verifiesSeulement && s.caseOn]}>
          {verifiesSeulement && <Check size={11} color="#fff" />}
        </View>
        <BadgeCheck size={14} color={verifiesSeulement ? C.verif : C.muted} />
        <Text style={[s.verifiesTexte, verifiesSeulement && { color: C.ink }]}>
          Artisans vérifiés uniquement
        </Text>
      </Pressable>

      {filtreType && typeAnnonce(filtreType).avecMetier && (
        <ChampMetier
          valeur={filtreMetier}
          onChange={setFiltreMetier}
          titre="Métier recherché"
          placeholder="Filtrer par métier..."
          avecTous
          style={{ marginTop: 10 }}
        />
      )}
        </>
      )}
      ListEmptyComponent={(
          <EmptyState>
            {recherche.trim()
              ? `Rien pour « ${recherche.trim()} ». Essayez un mot plus court, ou le nom que les artisans emploient sur le chantier.`
              : verifiesSeulement
                ? 'Aucune annonce d’artisan vérifié pour ce filtre.'
                : 'Aucune annonce pour le moment. Posez la première.'}
          </EmptyState>
      )}
      ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
      renderItem={({ item: a }) => (
        <Annonce
          annonce={a}
          onRepondre={() => onRepondre(a)}
          onFermer={() => onFermer(a)}
          onVoirProfil={onVoirProfil}
          onSignaler={onSignaler}
        />
      )}
    />
  );
}

function Annonce({ annonce: a, onRepondre, onFermer, onVoirProfil, onSignaler }) {
  const t = typeAnnonce(a.type);
  const dates = libelleDates(a.dateDebut, a.dateFin);
  const prix = libellePrix(a.prix, a.unite);
  const auteur = a.auteur;

  return (
    <View style={s.carte}>
      {/* La couleur du bandeau vient du TYPE d'annonce, pas d'ici : le
          texte posé dessus se calcule donc, il ne s'écrit pas. En dur, le
          blanc ne donnait que 3,51 : 1 sur l'orange de « Je cherche ». */}
      <View style={[s.bandeau, { backgroundColor: t.couleur }]}>
        <Text style={[s.bandeauTexte, { color: surFond(t.couleur) }]}>{t.long}</Text>
        {a.metier && (
          <Text style={[s.bandeauMetier, { color: surFond(t.couleur) }]}>
            {nomMetier(a.metier)}
          </Text>
        )}
      </View>

      <View style={s.carteCorps}>
        <Text style={s.titre}>{a.titre}</Text>

        <View style={s.reperes}>
          {!!dates && (
            <View style={s.repere}>
              <Calendar size={11} color={C.accent} />
              <Text style={[s.repereTexte, { color: C.accentTexte }]}>{dates}</Text>
            </View>
          )}
          {!!prix && (
            <View style={s.repere}>
              <Text style={s.prix}>{prix}</Text>
            </View>
          )}
          {!!a.ville && (
            <View style={s.repere}>
              <MapPin size={11} color={C.muted} />
              <Text style={s.repereTexte}>
                {a.ville}{libelleDistance(a.km) ? ` · ${libelleDistance(a.km)}` : ''}
              </Text>
            </View>
          )}
        </View>

        <Text style={s.texte}>{a.texte}</Text>

        {(a.medias || []).slice(0, 2).map((m, i) => (
          <Media key={i} media={m} style={s.media} />
        ))}

        {auteur && (
          <Pressable style={s.auteur} onPress={() => onVoirProfil && onVoirProfil(auteur.id)}>
            <Avatar seed={auteur.id} uri={auteur.avatarUrl} size={30} nom={auteur.entreprise} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <View style={s.auteurNom}>
                <Text style={s.auteurTexte} numberOfLines={1}>{auteur.entreprise}</Text>
                {auteur.verifie && <BadgeCheck size={12} color={C.verif} />}
              </View>
              <Text style={s.auteurMeta} numberOfLines={1}>
                {libelleMetiers(auteur)} · {a.time}
              </Text>
            </View>
          </Pressable>
        )}

        <View style={s.bas}>
          <Text style={s.reponses}>
            {a.reponses} {a.reponses > 1 ? 'réponses' : 'réponse'}
          </Text>
          {/* Une annonce entre pros aussi peut être une arnaque — matériel
              qui n'existe pas, acompte demandé puis disparition. */}
          {!!onSignaler && !a.aMoi && !!auteur && (
            <Pressable
              /* 14 px à l'écran : on ne l'atteint jamais avec un gant. La
                 boîte grandit à 44 sans bouger l'icône — c'est le
                 remplissage qui change. */
              style={{ marginLeft: 'auto', marginRight: 4, width: TOUCHE, minHeight: TOUCHE,
                alignItems: 'center', justifyContent: 'center' }}
              accessibilityRole="button"
              accessibilityLabel="Signaler cette annonce"
              onPress={() => onSignaler({
                cibleType: 'annonce',
                cibleId: a.id,
                auteurId: auteur.id,
                auteurNom: auteur.entreprise,
                extrait: `${a.titre} — ${a.texte}`,
              })}
            >
              <Flag size={13} color={C.muted} />
            </Pressable>
          )}

          {a.aMoi ? (
            <BtnMini outline label="Retirer" onPress={onFermer} />
          ) : a.jyAiRepondu ? (
            <View style={s.dejaRepondu}>
              <Check size={12} color={C.accent2} />
              <Text style={s.dejaReponduTexte}>Vous avez répondu</Text>
            </View>
          ) : (
            <BtnMini onPress={onRepondre}>
              <MessageCircle size={12} color="#111" />
              <Text style={s.repondreTexte}>Répondre</Text>
            </BtnMini>
          )}
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  pad: { flex: 1, paddingTop: 12, paddingHorizontal: 16 },

  /* La barre de recherche : une seule ligne, la loupe à gauche, la croix à
     droite quand il y a quelque chose à effacer. Le champ garde ses angles
     vifs — c'est un champ de saisie, donc de la structure (règle des bords
     dans src/theme.js) — mais le bloc entier est posé sur le fond blanc
     pour qu'on le voie tout de suite en arrivant. */
  recherche: {
    flexDirection: 'row', alignItems: 'center', gap: S.sm,
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.line,
    paddingHorizontal: S.md, marginBottom: S.xs,
  },
  rechercheChamp: {
    flex: 1, borderWidth: 0, backgroundColor: 'transparent',
    paddingHorizontal: 0, fontSize: T.corps,
  },

  entete: {
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.accent2,
    padding: 12, marginBottom: 14, gap: 8,
  },
  enteteTitre: { fontFamily: F.oswald6, fontSize: 14, color: C.ink },
  enteteTexte: { fontFamily: F.inter, fontSize: 11.5, color: C.muted, lineHeight: 17 },
  btnTexte: { fontFamily: F.oswald6, fontSize: 12.5, color: C.surAccent },

  form: {
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.line,
    padding: 12, marginBottom: 14,
  },
  formHaut: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  formTitre: { fontFamily: F.oswald6, fontSize: 13, color: C.ink },
  label: { fontFamily: F.oswald6, fontSize: 11.5, color: C.muted, marginTop: 12, marginBottom: 6 },
  aide: { fontFamily: F.inter, fontSize: 11, color: C.muted, lineHeight: 16, marginTop: 6 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  deuxChamps: { flexDirection: 'row', gap: 8 },
  formBtns: { flexDirection: 'row', gap: 8, justifyContent: 'flex-end', marginTop: 14 },

  verifies: {
    flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 10,
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.line,
    paddingVertical: 9, paddingHorizontal: 11,
  },
  verifiesOn: { borderColor: C.verif },
  case: {
    width: 17, height: 17, borderWidth: 1.5, borderColor: C.line,
    alignItems: 'center', justifyContent: 'center',
  },
  caseOn: { backgroundColor: C.verif, borderColor: C.verif },
  verifiesTexte: { fontFamily: F.inter, fontSize: 12, color: C.muted },

  carte: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.line },
  bandeau: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 5, paddingHorizontal: 10,
  },
  bandeauTexte: { fontFamily: F.oswald6, fontSize: 10.5, color: '#fff' },
  /* L'atténuation passe par `opacity` et non par un blanc translucide :
     la couleur, elle, est calculée depuis le fond (`surFond`). */
  bandeauMetier: { fontFamily: F.oswald6, fontSize: 10.5, opacity: 0.85 },
  carteCorps: { padding: 12, gap: 8 },
  titre: { fontFamily: F.oswald6, fontSize: 14, color: C.ink, lineHeight: 19 },

  reperes: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  repere: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  repereTexte: { fontFamily: F.inter, fontSize: 11.5, color: C.muted },
  prix: { fontFamily: F.oswald6, fontSize: 13, color: C.ink },

  texte: { fontFamily: F.inter, fontSize: 12.8, color: C.ink, lineHeight: 18 },
  media: { width: '100%', aspectRatio: 16 / 10 },

  auteur: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingTop: 8, borderTopWidth: 1, borderTopColor: C.line,
  },
  auteurNom: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  auteurTexte: { fontFamily: F.inter6, fontSize: 12.5, color: C.ink },
  auteurMeta: { fontFamily: F.inter, fontSize: 11, color: C.muted, marginTop: 1 },

  bas: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 8, borderTopWidth: 1, borderTopColor: C.line,
  },
  reponses: { fontFamily: F.inter, fontSize: 11, color: C.muted },
  repondreTexte: { fontFamily: F.oswald6, fontSize: 11, color: C.surAccent },
  dejaRepondu: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dejaReponduTexte: { fontFamily: F.oswald6, fontSize: 11, color: C.accent2 },
});

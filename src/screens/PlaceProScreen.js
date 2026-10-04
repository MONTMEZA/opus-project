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
import { View, Text, FlatList, Pressable, StyleSheet, RefreshControl } from 'react-native';
import {
  C, F, T, S, R, APPUI, TOUCHE, viser, surFond, GOUTTIERE, CARTE,
} from '../theme';
import {
  Avatar, BtnMain, BtnMini, Chip, Field, TextArea, EmptyState, SectionLabel,
} from '../components/ui';
import Media from '../components/Media';
import ChampVille from '../components/ChampVille';
import {
  MapPin, BadgeCheck, MessageCircle, Calendar, Check, X, Plus, Search, Flag, Camera,
} from '../components/icons';
import {
  TYPES_ANNONCE, UNITES, typeAnnonce, libelleDates, libellePrix,
} from '../data/annonces';
import {
  jourCourant, jourCourt, chevauche, estTerminee, libelleProximite,
  creneauSemaine, creneauMois,
} from '../lib/formats';
import { ChampMetier } from '../components/SelecteurMetiers';
import { nomMetier , libelleMetiers } from '../lib/metiers';
import { distanceKm, libelleDistance } from '../lib/adresse';
import { correspond, texteDe } from '../lib/recherche';
import { useRechercheDifferee } from '../lib/frappe';
import { choisirImage } from '../lib/media';
import Carrousel from '../components/Carrousel';

import { EcrireReponse, ListeReponses } from '../components/ReponsesAnnonce';
import FeuilleDates, { ChampDate } from '../components/Calendrier';

/**
 * QUATRE PHOTOS, et pas trois comme une demande de particulier.
 *
 * Une demande montre un PROBLÈME — une fuite, une fissure : trois angles
 * suffisent. Une annonce de matériel montre un OBJET qu'on achète sans
 * l'avoir vu : la bétonnière de face, son moteur, sa cuve, son état réel.
 * C'est la différence entre décrire et vendre.
 */
const PHOTOS_ANNONCE = 4;

/* LES DATES NE SE TAPENT PLUS — 04/10/2026, à la demande du propriétaire.
   Les quatre champs de date de cet écran (deux dans le formulaire, deux
   dans le filtre) sont devenus des BOUTONS qui ouvrent un calendrier
   (`src/components/Calendrier.js`). Ils portent donc directement des
   « AAAA-MM-JJ », et `versISO` — le découpage de « 12/10 » écrit à la
   main — a quitté le dépôt, faute d'appelant.

   CE QUE ÇA SUPPRIME EN PLUS DES FAUTES DE FRAPPE : les trois contrôles de
   saisie de `publier()`. « La date de fin est avant la date de début » ne
   peut plus arriver, parce que le calendrier ne sait pas produire un
   créneau à l'envers. Un message d'erreur qu'on ne peut plus déclencher
   est un message de moins à traduire, à placer et à tester. */

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
  onEcrire, onRafraichir, rafraichit = false,
}) {
  const [recherche, setRecherche] = useState('');
  const [filtreType, setFiltreType] = useState(null);
  const [filtreMetier, setFiltreMetier] = useState(null);
  const [verifiesSeulement, setVerifiesSeulement] = useState(false);
  const [formOuvert, setFormOuvert] = useState(false);
  /* MES ANNONCES : sans ce filtre, retrouver la sienne demandait de faire
     défiler la liste publique en espérant la reconnaître. Or c'est là qu'on
     revient — pour lire les réponses. */
  const [miennesSeulement, setMiennesSeulement] = useState(false);
  /* QUAND — le filtre qui n'existait pas, alors que l'en-tête de ce fichier
     en fait depuis le début la différence d'Opus face aux groupes
     Facebook. `null` = pas de contrainte de dates. */
  const [creneau, setCreneau] = useState(null);         // 'semaine' | 'mois' | 'precises'
  /* Les deux champs portent des « AAAA-MM-JJ », posés par le calendrier.
     `creneauOuvert` dit si sa feuille est ouverte — un seul calendrier
     pour les deux bornes, parce qu'on choisit un CRÉNEAU, pas deux dates
     sans rapport. */
  const [creneauDu, setCreneauDu] = useState('');
  const [creneauAu, setCreneauAu] = useState('');
  const [creneauOuvert, setCreneauOuvert] = useState(false);
  /* Les deux feuilles portent l'annonce concernée, pas un booléen : il faut
     savoir à LAQUELLE on répond, et de laquelle on lit les réponses. */
  const [aRepondre, setARepondre] = useState(null);
  const [aLire, setALire] = useState(null);

  /* --- le formulaire --- */
  const [type, setType] = useState(TYPES_ANNONCE[0].cle);
  const [titre, setTitre] = useState('');
  const [texte, setTexte] = useState('');
  const [metier, setMetier] = useState(null);
  const [lieu, setLieu] = useState({ affichage: moi ? moi.ville || '' : '' });
  const [du, setDu] = useState('');
  const [au, setAu] = useState('');
  const [datesOuvertes, setDatesOuvertes] = useState(false);
  const [prix, setPrix] = useState('');
  const [unite, setUnite] = useState('total');
  /* LES PHOTOS D'UNE ANNONCE. La colonne `medias` existait en base, l'API
     l'acceptait, et la carte savait l'afficher — mais AUCUN écran ne la
     remplissait. C'est le défaut du 01/10 vu dans l'autre sens : du code
     qui LIT ce que personne n'écrit. Relevé par le propriétaire le
     04/10/2026 : « pour ça je pense que sur les annonces on pourrait
     afficher des photos ». */
  const [photos, setPhotos] = useState([]);

  const ajouterPhoto = async (camera) => {
    try {
      const uri = await choisirImage({ camera, usage: 'photo' });
      if (uri) setPhotos((p) => [...p, uri].slice(0, PHOTOS_ANNONCE));
    } catch (e) {
      if (onErreur) onErreur(e.message || String(e));
    }
  };

  const reglages = typeAnnonce(type);

  /* LE JOUR EST FIGÉ POUR TOUT LE RENDU. Appeler `jourCourant()` dans
     chaque carte le recalculerait des centaines de fois, et — pire — deux
     cartes pourraient tomber de part et d'autre de minuit. */
  const jour = useMemo(() => jourCourant(), []);

  /* LES BORNES DU FILTRE, calculées depuis le mode choisi.
     « Dates précises » sans rien de saisi ne filtre RIEN : on n'invente pas
     un créneau à partir d'un champ vide, et la liste ne doit pas se vider
     entre le moment où l'on ouvre les champs et celui où l'on écrit. */
  const bornes = useMemo(() => {
    if (creneau === 'semaine') return creneauSemaine();
    if (creneau === 'mois') return creneauMois();
    if (creneau === 'precises') {
      if (!creneauDu && !creneauAu) return null;
      return { debut: creneauDu || null, fin: creneauAu || null };
    }
    return null;
  }, [creneau, creneauDu, creneauAu]);

  const choisirCreneau = (mode) => {
    setCreneau(mode);
    if (mode !== 'precises') { setCreneauDu(''); setCreneauAu(''); }
  };

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
      .filter((a) => (!miennesSeulement || a.aMoi))
      /* UNE ANNONCE DONT LE CHANTIER EST PASSÉ SORT DE LA LISTE — mais
         elle reste visible à SON AUTEUR. La faire disparaître de son côté
         aussi, sans un mot, lui ferait croire qu'elle a été supprimée ;
         il doit pouvoir la retirer ou la reposter en connaissance de
         cause. */
      .filter((a) => (a.aMoi || !estTerminee(a.dateFin, jour)))
      /* LE FILTRE PAR DATES. Une annonce SANS dates passe toujours : une
         bétonnière à vendre est disponible n'importe quand, et la retirer
         d'une recherche par créneau ferait disparaître du matériel qui
         n'a jamais cessé d'être à vendre. */
      .filter((a) => (!bornes || chevauche(a.dateDebut, a.dateFin, bornes.debut, bornes.fin)))
      /* À distance connue, le plus proche d'abord : un chantier à 150 km
         n'intéresse personne. Les annonces sans coordonnées restent à leur
         place plutôt que d'être reléguées à la fin. */
      .sort((a, b) => {
        if (a.km === null || b.km === null) return 0;
        return a.km - b.km;
      });
  }, [annonces, recherche, filtreType, filtreMetier, verifiesSeulement,
    miennesSeulement, bornes, jour, moi]);

  /* Combien d'annonces sont à moi : la puce ne s'affiche que si j'en ai. */
  const nbMiennes = useMemo(() => annonces.filter((a) => a.aMoi).length, [annonces]);

  const publier = () => {
    if (!titre.trim() || !texte.trim()) return;

    /* LE CALENDRIER NE SAIT PAS PRODUIRE UNE DATE FAUSSE : pas de 31
       février, pas de fin avant le début, pas de texte à découper. Les
       trois contrôles qui vivaient ici n'avaient plus rien à refuser. */
    const dateDebut = reglages.avecDates ? (du || null) : null;
    const dateFin = reglages.avecDates ? (au || null) : null;

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
      medias: photos,
    });

    setTitre(''); setTexte(''); setDu(''); setAu(''); setPrix(''); setPhotos([]);
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
    <>
    <FlatList
      style={{ flex: 1 }}
      keyboardShouldPersistTaps="handled"
      data={liste}
      keyExtractor={(a) => String(a.id)}
      initialNumToRender={4}
      maxToRenderPerBatch={6}
      windowSize={5}
      removeClippedSubviews
      contentContainerStyle={[s.pad, { paddingBottom: S.xl }]}
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
              {/* UN SEUL CALENDRIER POUR LES DEUX BORNES. Appuyer sur l'un
                  ou l'autre des deux boutons ouvre la même feuille : on
                  choisit un créneau, et on le VOIT — c'est la durée qui
                  décide un artisan, pas les deux dates prises à part. */}
              <View style={s.deuxChamps}>
                <View style={{ flex: 1 }}>
                  <ChampDate
                    valeur={jourCourt(du)}
                    placeholder="Du 12/10"
                    onPress={() => setDatesOuvertes(true)}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <ChampDate
                    valeur={jourCourt(au)}
                    placeholder="Au 20/10"
                    onPress={() => setDatesOuvertes(true)}
                  />
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

          {/* UNE PHOTO VEND, UN TEXTE DÉCRIT. « Bétonnière 160 L, bon état »
          n'engage personne ; la photo de la cuve, si. C'est encore plus
          vrai entre professionnels, qui savent lire l'usure sur une
          image. */}
      <Text style={s.label}>Photos</Text>
      {photos.length > 0 && (
        <View style={s.apercus}>
          {photos.map((uri, i) => (
            <View key={`${uri}-${i}`}>
              <Media media={uri} style={s.apercu} />
              <Pressable
                style={s.retirer}
                hitSlop={viser(TOUCHE)}
                onPress={() => setPhotos((p) => p.filter((_, k) => k !== i))}
                accessibilityRole="button"
                accessibilityLabel={`Retirer la photo ${i + 1}`}
              >
                <X size={11} color="#fff" />
              </Pressable>
            </View>
          ))}
        </View>
      )}
      <View style={s.photoBtns}>
        <BtnMini outline onPress={() => ajouterPhoto(true)} disabled={photos.length >= PHOTOS_ANNONCE}>
          <Camera size={12} color={C.ink} />
          <Text style={s.photoBtnTexte}>Photographier</Text>
        </BtnMini>
        <BtnMini
          outline
          label="Galerie"
          onPress={() => ajouterPhoto(false)}
          disabled={photos.length >= PHOTOS_ANNONCE}
        />
      </View>

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

      <Text style={s.axe}>Quoi ?</Text>

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

      {/* LES DEUX AXES SE NOMMENT, parce qu'ils se ressemblaient trop.
          Mesuré au navigateur : six puces de TYPE sur deux rangées, puis
          trois puces de DATES sur une troisième — neuf puces identiques,
          et rien pour dire que « Cette semaine » et « Fournisseur » ne
          répondent pas à la même question. */}
      <Text style={s.axe}>Quand ?</Text>

      {/* QUAND — LE FILTRE QUI NOUS DISTINGUE.
          Un plaquiste a un trou dans son planning du 12 au 20 ; il veut
          voir ce qui TOMBE DEDANS, pas tout ce qui existe. Les deux
          raccourcis couvrent le cas courant ; les deux champs servent
          quand on connaît ses dates. */}
      <View style={s.chipRow}>
        <Chip
          label="Cette semaine"
          on={creneau === 'semaine'}
          onPress={() => choisirCreneau(creneau === 'semaine' ? null : 'semaine')}
        />
        <Chip
          label="Ce mois-ci"
          on={creneau === 'mois'}
          onPress={() => choisirCreneau(creneau === 'mois' ? null : 'mois')}
        />
        <Chip
          label="Dates précises"
          on={creneau === 'precises'}
          onPress={() => choisirCreneau(creneau === 'precises' ? null : 'precises')}
        />
      </View>

      {creneau === 'precises' && (
        <View style={s.rangeeDates}>
          <View style={{ flex: 1 }}>
            <ChampDate
              valeur={jourCourt(creneauDu)}
              placeholder="Du 12/10"
              onPress={() => setCreneauOuvert(true)}
            />
          </View>
          <View style={{ flex: 1 }}>
            <ChampDate
              valeur={jourCourt(creneauAu)}
              placeholder="Au 20/10"
              onPress={() => setCreneauOuvert(true)}
            />
          </View>
        </View>
      )}

      {/* MES ANNONCES — elle n'apparaît que si j'en ai. Une puce qui ne
          filtre jamais rien est du bruit, et elle apprend à ne plus
          regarder cette rangée. */}
      {nbMiennes > 0 && (
        <View style={s.chipRow}>
          <Chip
            label={`Mes annonces (${nbMiennes})`}
            on={miennesSeulement}
            onPress={() => setMiennesSeulement((v) => !v)}
          />
        </View>
      )}

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
          jour={jour}
          onRepondre={() => setARepondre(a)}
          onLireReponses={() => setALire(a)}
          onFermer={() => onFermer(a)}
          onVoirProfil={onVoirProfil}
          onSignaler={onSignaler}
        />
      )}
    />

    {/* LES DEUX FEUILLES. Elles vivent ici, et pas dans `OpusApp` : elles
        ne concernent que cet écran, et les remonter ferait redessiner
        toute l'application pour un champ de texte. C'est la règle du
        lot 4. */}
    {!!aRepondre && (
      <EcrireReponse
        annonce={aRepondre}
        onFermer={() => setARepondre(null)}
        /* LA FEUILLE SE FERME AVANT D'AGIR, et ce n'est pas du confort.
           Répondre OUVRE LA CONVERSATION : l'écran change sous la feuille.
           En la fermant seulement après, elle reste posée par-dessus
           pendant toute la navigation et tout l'envoi — et sur iPhone, une
           `Modal` qu'on démonte alors que l'écran a changé dessous laisse
           un voile invisible qui avale les touches. L'application a l'air
           figée alors qu'elle fonctionne.
           On ferme, PUIS on agit. L'annonce est copiée d'abord, parce que
           `aRepondre` vaut déjà `null` à la ligne suivante. */
        onEnvoyer={async (texte) => {
          const annonce = aRepondre;
          setARepondre(null);
          await onRepondre(annonce, texte);
        }}
      />
    )}

    {!!aLire && (
      <ListeReponses
        annonce={aLire}
        onFermer={() => setALire(null)}
        onVoirProfil={(id) => { setALire(null); onVoirProfil(id); }}
        onEcrire={(pro) => { setALire(null); onEcrire(pro); }}
        onErreur={onErreur}
      />
    )}

    {/* LE CALENDRIER DU FORMULAIRE. `minimum` vaut aujourd'hui : poser une
        annonce pour un chantier déjà passé ne produirait qu'une ligne qui
        sort aussitôt de la liste publique. */}
    {datesOuvertes && (
      <FeuilleDates
        titre="Dates du chantier"
        debut={du}
        fin={au}
        minimum={jour}
        onValider={(d, f) => { setDu(d || ''); setAu(f || ''); }}
        onFermer={() => setDatesOuvertes(false)}
      />
    )}

    {/* LE CALENDRIER DU FILTRE — sans minimum, lui. Un filtre est une
        question, pas un engagement : l'auteur d'une annonce terminée doit
        pouvoir la retrouver, puisqu'elle lui reste visible. */}
    {creneauOuvert && (
      <FeuilleDates
        titre="Chercher sur ces dates"
        debut={creneauDu}
        fin={creneauAu}
        onValider={(d, f) => { setCreneauDu(d || ''); setCreneauAu(f || ''); }}
        onFermer={() => setCreneauOuvert(false)}
      />
    )}
    </>
  );
}

function Annonce({
  annonce: a, jour, onRepondre, onLireReponses, onFermer, onVoirProfil, onSignaler,
}) {
  const t = typeAnnonce(a.type);
  const dates = libelleDates(a.dateDebut, a.dateFin);
  /* « DANS 3 JOURS » PLUTÔT QUE « DU 12 AU 20 ». La date brute oblige à
     calculer de tête, et sur un chantier on ne calcule pas. Les deux
     cohabitent : la proximité fait agir, la date dit quoi noter. */
  const proche = libelleProximite(a.dateDebut, a.dateFin, jour);
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
          {!!proche && (
            <View style={[s.pastilleDate, s[`date_${proche.etat}`]]}>
              <Text style={[s.pastilleDateTexte, s[`dateTexte_${proche.etat}`]]}>
                {proche.texte}
              </Text>
            </View>
          )}
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

        {/* TOUTES LES PHOTOS, PAS DEUX. La carte en affichait au plus deux,
            empilées — les suivantes n'existaient pour personne. Le
            carrousel du lot 0 les montre toutes, et il ne MONTE que celle
            qu'on regarde et ses voisines : c'est ce qui le rend sûr dans
            une liste. */}
        {(a.medias || []).length > 0 && (
          <Carrousel medias={a.medias} style={s.media} />
        )}

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
          {/* SUR MON ANNONCE, CE NOMBRE S'OUVRE. Jusqu'au 04/10/2026 il ne
              faisait rien : on voyait « 3 réponses » et on ne pouvait ni
              savoir qui, ni lire quoi. Un compteur qu'on ne peut pas
              ouvrir est une promesse en l'air. */}
          {a.aMoi && a.reponses > 0 ? (
            <Pressable
              onPress={onLireReponses}
              hitSlop={viser(TOUCHE)}
              accessibilityRole="button"
              accessibilityLabel={`Lire les ${a.reponses} réponses à cette annonce`}
              style={({ pressed }) => [pressed && APPUI.discret]}
            >
              <Text style={[s.reponses, s.reponsesOuvrables]}>
                {a.reponses} {a.reponses > 1 ? 'réponses' : 'réponse'} →
              </Text>
            </Pressable>
          ) : (
            <Text style={s.reponses}>
              {a.reponses} {a.reponses > 1 ? 'réponses' : 'réponse'}
            </Text>
          )}
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
  pad: { paddingTop: S.md, paddingHorizontal: GOUTTIERE },

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
  enteteTexte: { fontFamily: F.inter, fontSize: T.courant, color: C.muted, lineHeight: 17 },
  btnTexte: { fontFamily: F.oswald6, fontSize: T.corps, color: C.surAccent },

  form: {
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.line,
    padding: 12, marginBottom: 14,
  },
  formHaut: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  formTitre: { fontFamily: F.oswald6, fontSize: T.corps, color: C.ink },
  label: { fontFamily: F.oswald6, fontSize: T.courant, color: C.muted, marginTop: 12, marginBottom: 6 },
  aide: { fontFamily: F.inter, fontSize: T.petit, color: C.muted, lineHeight: 16, marginTop: 6 },
  rangeeDates: { flexDirection: 'row', gap: S.sm, marginTop: S.sm },

  /* Les aperçus du formulaire, repris de l'écran des demandes : même
     geste, même forme, pour que ça s'apprenne une seule fois. */
  apercus: { flexDirection: 'row', flexWrap: 'wrap', gap: S.sm, marginTop: S.sm },
  apercu: { width: 72, height: 72 },
  retirer: {
    position: 'absolute', top: -6, right: -6,
    width: 22, height: 22, borderRadius: R.gelule, backgroundColor: C.ink,
    alignItems: 'center', justifyContent: 'center',
  },
  photoBtns: { flexDirection: 'row', gap: S.sm, marginTop: S.sm },
  photoBtnTexte: { fontFamily: F.oswald6, fontSize: T.petit, color: C.ink },
  /* Il NOMME un axe de filtre, il ne crie pas : c'est un repère qu'on lit
     une fois, pas un titre de section. */
  axe: {
    fontFamily: F.inter6, fontSize: T.micro, color: C.muted,
    marginTop: S.md, marginBottom: S.xs, textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  /* UNE PASTILLE FLOTTE au-dessus de la carte : elle s'arrondit, alors que
     la carte garde son angle vif. Règle des bords, `src/theme.js`.
     Les trois états ne se valent pas, et leur couleur le dit :
       bientôt  — orange de signature, c'est ce qui fait agir ;
       en cours — bleu : l'information est utile, l'urgence est passée ;
       terminée — gris : l'annonce n'est plus visible que de son auteur. */
  pastilleDate: {
    paddingVertical: S.xs, paddingHorizontal: S.sm, borderRadius: R.gelule,
  },
  pastilleDateTexte: { fontFamily: F.oswald6, fontSize: T.micro },
  date_bientot: { backgroundColor: C.accent },
  dateTexte_bientot: { color: C.surAccent },
  date_encours: { backgroundColor: C.accent2 },
  dateTexte_encours: { color: '#fff' },
  date_terminee: { backgroundColor: C.line },
  dateTexte_terminee: { color: C.ink },
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
  verifiesTexte: { fontFamily: F.inter, fontSize: T.courant, color: C.muted },

  carte: { ...CARTE },
  bandeau: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 5, paddingHorizontal: 10,
  },
  bandeauTexte: { fontFamily: F.oswald6, fontSize: T.petit, color: '#fff' },
  /* L'atténuation passe par `opacity` et non par un blanc translucide :
     la couleur, elle, est calculée depuis le fond (`surFond`). */
  bandeauMetier: { fontFamily: F.oswald6, fontSize: T.petit, opacity: 0.85 },
  carteCorps: { padding: 12, gap: 8 },
  titre: { fontFamily: F.oswald6, fontSize: 14, color: C.ink, lineHeight: 19 },

  reperes: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  repere: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  repereTexte: { fontFamily: F.inter, fontSize: T.courant, color: C.muted },
  prix: { fontFamily: F.oswald6, fontSize: T.corps, color: C.ink },

  texte: { fontFamily: F.inter, fontSize: T.corps, color: C.ink, lineHeight: 18 },
  media: { width: '100%', aspectRatio: 16 / 10 },

  auteur: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingTop: 8, borderTopWidth: 1, borderTopColor: C.line,
  },
  auteurNom: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  auteurTexte: { fontFamily: F.inter6, fontSize: T.corps, color: C.ink },
  auteurMeta: { fontFamily: F.inter, fontSize: T.petit, color: C.muted, marginTop: 1 },

  bas: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 8, borderTopWidth: 1, borderTopColor: C.line,
  },
  reponses: { fontFamily: F.inter, fontSize: T.petit, color: C.muted },
  /* Ce qui S'OUVRE se lit comme un lien : l'encre de l'orange, celle qu'on
     LIT (5,74 sur blanc), jamais l'orange de remplissage. Lot 5. */
  reponsesOuvrables: { fontFamily: F.inter6, color: C.accentTexte },
  repondreTexte: { fontFamily: F.oswald6, fontSize: T.petit, color: C.surAccent },
  dejaRepondu: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dejaReponduTexte: { fontFamily: F.oswald6, fontSize: T.petit, color: C.accent2 },
});

/**
 * LE SÉLECTEUR DE MÉTIER — un seul, partout dans Opus.
 *
 * CE QU'IL REMPLACE
 * -----------------
 * Des grilles de puces, recopiées dans neuf écrans, chacune affichant les
 * douze mêmes métiers. Avec douze, c'était lourd ; avec quatre-vingt-douze,
 * c'est illisible. Et surtout, chaque grille était une occasion de plus de
 * diverger du reste.
 *
 * POURQUOI UN PANNEAU PLEIN ÉCRAN, ET PAS UN VRAI MENU DÉROULANT
 * --------------------------------------------------------------
 * Le propriétaire a demandé « des menus déroulants ». C'est la bonne idée,
 * mais un menu déroulant classique sur un téléphone fait quatre lignes de
 * haut, se rate au doigt et cache ce qu'on lisait. Un panneau plein écran,
 * c'est la même chose en utilisable : on ouvre, on tape ou on déplie, on
 * choisit, ça se referme.
 *
 * DEUX FAÇONS DE TROUVER, ET C'EST VOULU
 * --------------------------------------
 *   - **On sait** : on tape « plomb », on voit Plombier, on appuie. Trois
 *     secondes, et les catégories ne s'affichent même pas (§16 : personne
 *     ne doit avoir à comprendre notre classement).
 *   - **On ne sait pas** : les catégories se déplient, et on découvre
 *     qu'« Économiste de la construction » existe.
 *
 * LA RECHERCHE VOIT AUSSI LES SPÉCIALITÉS
 * ---------------------------------------
 * Taper « mur de soutènement » rend **Maçon** : ce n'est pas un métier,
 * c'est ce qu'un maçon fait. Sans cela, quelqu'un qui décrit son chantier
 * avec ses mots à lui ne trouve rien (§13).
 *
 * LE CHAMP DE SAISIE A SON PROPRE COMPOSANT
 * -----------------------------------------
 * Règle du projet, payée cher : un champ de recherche qui vit dans l'écran
 * fait re-rendre l'écran entier à chaque lettre — 219 ms par touche mesurés
 * sur l'assistant IA, c'est-à-dire « on ne peut pas écrire ». Le texte vit
 * donc dans `BarreRecherche`, et le filtrage part quand la frappe retombe.
 */
import React, { useState, useMemo } from 'react';
import {
  View, Text, Pressable, Modal, FlatList, StyleSheet,
} from 'react-native';
import { C, F, T, S, R, interligne, viser } from '../theme';
import { Field } from './ui';
import { Search, X, ChevronDown, ChevronRight, Check } from './icons';
import { CATEGORIES } from '../data/catalogue-metiers';
import { chercherMetiers, metiersActifs, MAP_METIERS } from '../lib/metiers';
import { useRechercheDifferee } from '../lib/frappe';

function BarreRecherche({ valeur, onChange }) {
  const [texte, setTexte] = useRechercheDifferee(valeur, onChange);

  return (
    <View style={s.barre}>
      <Search size={16} color={C.muted} />
      <Field
        style={s.champ}
        placeholder="Rechercher un métier..."
        value={texte}
        onChangeText={setTexte}
        autoCorrect={false}
        accessibilityLabel="Rechercher un métier"
      />
      {!!texte && (
        <Pressable
          onPress={() => setTexte('')}
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

/** Une ligne de métier — la même qu'on l'ait trouvée en tapant ou en dépliant. */
function LigneMetier({ metier, deja, bloque, onPress, decale }) {
  const nbSpe = (metier.spe || []).length;
  const inactif = deja || bloque;

  return (
    <Pressable
      style={[s.ligne, decale && s.ligneDecalee, inactif && s.ligneInactive]}
      onPress={inactif ? undefined : onPress}
      disabled={inactif}
      accessibilityRole="button"
      aria-disabled={inactif}
      accessibilityLabel={
        deja ? `${metier.nom}, déjà choisi`
          : bloque ? `${metier.nom}, non sélectionnable : quatre métiers au maximum`
            : `Choisir le métier ${metier.nom}`
      }
    >
      <View style={s.ligneCorps}>
        <Text style={[s.ligneNom, inactif && s.ligneNomInactive]}>{metier.nom}</Text>
        {/* Ce que ce métier COUVRE, en trois mots : c'est ce qui permet de
            reconnaître le bon quand deux se ressemblent. */}
        {nbSpe > 0 && (
          <Text style={s.ligneSpe} numberOfLines={1}>
            {metier.spe.slice(0, 3).map((x) => x.nom).join(' · ')}
            {nbSpe > 3 ? '…' : ''}
          </Text>
        )}
      </View>
      {deja && <Check size={15} color={C.ok} />}
    </Pressable>
  );
}

export default function SelecteurMetiers({
  ouvert,
  onFermer,
  onChoisir,
  choisis = [],
  titre = 'Choisir un métier',
  /* Reste-t-il de la place ? À zéro, on laisse VOIR la liste mais rien
     n'est sélectionnable, avec la phrase qui dit quoi faire — c'est ce que
     demande le §2. Fermer le panneau serait plus simple et plus brutal. */
  restant = 1,
  /* Pour les filtres : « Tous les métiers » remet la liste à zéro. */
  avecTous = false,
}) {
  const [recherche, setRecherche] = useState('');
  const [deplies, setDeplies] = useState(() => new Set());

  const resultats = useMemo(
    () => (recherche.trim() ? chercherMetiers(recherche) : null),
    [recherche],
  );

  /* Les métiers rangés par catégorie, une fois pour toutes. */
  const parCategorie = useMemo(() => {
    const paquets = Object.fromEntries(CATEGORIES.map((c) => [c.cle, []]));
    metiersActifs().forEach((m) => { (paquets[m.categorie] || []).push(m); });
    return paquets;
  }, []);

  const basculer = (cle) => setDeplies((s0) => {
    const n = new Set(s0);
    if (n.has(cle)) n.delete(cle); else n.add(cle);
    return n;
  });

  const choisir = (cle) => {
    onChoisir(cle);
    setRecherche('');
    onFermer();
  };

  /* La liste à afficher : soit les résultats, soit les catégories dépliables.
     Une seule `FlatList` dans les deux cas — elle ne monte que ce qui est à
     l'écran, ce qui compte avec quatre-vingt-douze lignes possibles. */
  const donnees = useMemo(() => {
    if (resultats) return resultats.map((m) => ({ type: 'metier', cle: m.cle, m }));

    const lignes = [];
    CATEGORIES.forEach((cat) => {
      const metiers = parCategorie[cat.cle] || [];
      if (!metiers.length) return;
      lignes.push({ type: 'categorie', cle: cat.cle, cat, nb: metiers.length });
      if (deplies.has(cat.cle)) {
        metiers.forEach((m) => lignes.push({ type: 'metier', cle: m.cle, m, decale: true }));
      }
    });
    return lignes;
  }, [resultats, parCategorie, deplies]);

  const plein = restant <= 0;

  return (
    <Modal
      visible={!!ouvert}
      animationType="slide"
      onRequestClose={onFermer}
      transparent={false}
    >
      <View style={s.ecran}>
        <View style={s.entete}>
          <Text style={s.titre} numberOfLines={1}>{titre}</Text>
          <Pressable
            onPress={onFermer}
            hitSlop={viser(24)}
            accessibilityRole="button"
            accessibilityLabel="Fermer"
          >
            <X size={20} color={C.ink} />
          </Pressable>
        </View>

        <BarreRecherche valeur={recherche} onChange={setRecherche} />

        {plein && (
          <Text style={s.plein}>
            Vous pouvez sélectionner jusqu'à 4 métiers maximum. Supprimez un
            métier pour en sélectionner un autre.
          </Text>
        )}

        {avecTous && !resultats && (
          <Pressable
            style={s.tous}
            onPress={() => choisir(null)}
            accessibilityRole="button"
            accessibilityLabel="Tous les métiers, sans filtre"
          >
            <Text style={s.tousTexte}>Tous les métiers</Text>
          </Pressable>
        )}

        <FlatList
          data={donnees}
          keyExtractor={(x) => `${x.type}-${x.cle}`}
          keyboardShouldPersistTaps="handled"
          /* Une liste de cette longueur ne se monte pas d'un bloc : c'est la
             règle tirée du fil vidéo, où dix éléments montés ensemble
             bloquaient le téléphone quelques secondes. */
          initialNumToRender={12}
          maxToRenderPerBatch={12}
          windowSize={5}
          ListEmptyComponent={
            <Text style={s.vide}>
              Aucun métier ne correspond à « {recherche.trim()} ».{'\n'}
              Essayez un mot plus court, ou dépliez les catégories.
            </Text>
          }
          renderItem={({ item }) => {
            if (item.type === 'categorie') {
              const ouverte = deplies.has(item.cat.cle);
              return (
                <Pressable
                  style={s.categorie}
                  onPress={() => basculer(item.cat.cle)}
                  accessibilityRole="button"
                  aria-expanded={ouverte}
                  accessibilityLabel={`${item.cat.nom}, ${item.nb} métiers. ${ouverte ? 'Replier' : 'Déplier'}`}
                >
                  {ouverte
                    ? <ChevronDown size={15} color={C.accent} />
                    : <ChevronRight size={15} color={C.muted} />}
                  <Text style={s.categorieNom}>{item.cat.nom}</Text>
                  <Text style={s.categorieNb}>{item.nb}</Text>
                </Pressable>
              );
            }
            return (
              <LigneMetier
                metier={item.m}
                decale={item.decale}
                deja={choisis.includes(item.m.cle)}
                bloque={plein && !choisis.includes(item.m.cle)}
                onPress={() => choisir(item.m.cle)}
              />
            );
          }}
        />
      </View>
    </Modal>
  );
}

/**
 * Le champ qui OUVRE le sélecteur — « Métier [ 🔍 Rechercher... ] ».
 *
 * C'est lui qu'on pose dans un écran, pas le panneau : partout où Opus
 * demande un métier, on écrit la même ligne.
 */
export function ChampMetier({
  valeur, onChange, titre = 'Choisir un métier', avecTous = false,
  placeholder = 'Choisir un métier...', style,
}) {
  const [ouvert, setOuvert] = useState(false);
  const nom = valeur ? (MAP_METIERS[valeur] ? MAP_METIERS[valeur].nom : valeur) : '';

  return (
    <>
      <Pressable
        style={[s.declencheur, style]}
        onPress={() => setOuvert(true)}
        accessibilityRole="button"
        accessibilityLabel={nom ? `Métier : ${nom}. Changer` : placeholder}
      >
        <Search size={15} color={C.muted} />
        <Text style={[s.declencheurTexte, !nom && s.declencheurVide]} numberOfLines={1}>
          {nom || placeholder}
        </Text>
        <ChevronDown size={15} color={C.muted} />
      </Pressable>

      <SelecteurMetiers
        ouvert={ouvert}
        onFermer={() => setOuvert(false)}
        onChoisir={onChange}
        choisis={valeur ? [valeur] : []}
        titre={titre}
        avecTous={avecTous}
      />
    </>
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

  /* Un champ de saisie est de la STRUCTURE : angle vif. */
  barre: {
    flexDirection: 'row', alignItems: 'center', gap: S.sm,
    margin: S.lg, paddingHorizontal: S.md,
    backgroundColor: C.bg, borderWidth: 1, borderColor: C.line,
  },
  champ: {
    flex: 1, borderWidth: 0, backgroundColor: 'transparent',
    paddingVertical: S.md - 2, paddingHorizontal: 0,
    fontFamily: F.inter, fontSize: T.corps, color: C.ink,
  },

  plein: {
    fontFamily: F.inter, fontSize: T.petit, color: C.bad,
    lineHeight: interligne(T.petit),
    marginHorizontal: S.lg, marginBottom: S.md,
  },

  categorie: {
    flexDirection: 'row', alignItems: 'center', gap: S.sm,
    paddingHorizontal: S.lg, paddingVertical: S.md,
    borderBottomWidth: 1, borderBottomColor: C.line,
    backgroundColor: C.bg,
  },
  categorieNom: { flex: 1, fontFamily: F.oswald6, fontSize: T.courant + 0.5, color: C.ink },
  categorieNb: { fontFamily: F.inter, fontSize: T.micro, color: C.muted },

  ligne: {
    flexDirection: 'row', alignItems: 'center', gap: S.md,
    paddingHorizontal: S.lg, paddingVertical: S.md - 2,
    borderBottomWidth: 1, borderBottomColor: C.line,
  },
  /* Déplié depuis une catégorie : décalé, pour qu'on voie d'où ça sort. */
  ligneDecalee: { paddingLeft: S.lg + S.xl },
  ligneInactive: { opacity: 0.45 },
  ligneCorps: { flex: 1, minWidth: 0 },
  ligneNom: { fontFamily: F.inter6, fontSize: T.corps, color: C.ink },
  ligneNomInactive: { color: C.muted },
  ligneSpe: {
    fontFamily: F.inter, fontSize: T.micro, color: C.muted, marginTop: 2,
  },

  tous: {
    paddingHorizontal: S.lg, paddingVertical: S.md,
    borderBottomWidth: 1, borderBottomColor: C.line,
  },
  tousTexte: { fontFamily: F.oswald6, fontSize: T.corps, color: C.accent2 },

  vide: {
    fontFamily: F.inter, fontSize: T.corps, color: C.muted,
    lineHeight: interligne(T.corps), padding: S.lg,
  },

  /* Le déclencheur est un champ : angle vif, comme tous les champs. */
  declencheur: {
    flexDirection: 'row', alignItems: 'center', gap: S.sm,
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.line,
    paddingHorizontal: S.md, paddingVertical: S.md - 2,
  },
  declencheurTexte: { flex: 1, fontFamily: F.inter, fontSize: T.corps, color: C.ink },
  declencheurVide: { color: C.muted },
});

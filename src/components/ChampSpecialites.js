/**
 * Les spécialités d'un artisan — proposées d'abord, libres ensuite.
 *
 * POURQUOI CE CHAMP EXISTE EN PLUS DES MÉTIERS
 * --------------------------------------------
 * `metiers` est une liste fermée, et c'est ce qu'il faut pour trier,
 * filtrer et vérifier. Mais ce n'est pas ce qu'un particulier tape dans
 * une recherche : personne ne cherche « Maçon », on cherche « mur en
 * pierre », « enduit à la chaux », « douche à l'italienne ».
 *
 * LES DEUX FORMES, ET POURQUOI PAS UNE SEULE
 * ------------------------------------------
 * Décision du propriétaire, 30/09/2026 : **les deux**.
 *
 *   - **La liste du catalogue d'abord**, filtrée par les métiers choisis.
 *     Elle garantit que deux artisans qui font la même chose emploient le
 *     même mot — et c'est exactement ce qui fait marcher une recherche.
 *     Sans elle, l'un écrit « douche italienne », l'autre « douche à
 *     l'italienne », et un seul des deux est trouvé.
 *   - **Le texte libre ensuite**, parce qu'aucune liste ne prévoit tout,
 *     et que c'est souvent l'imprévu qui distingue un artisan.
 *
 * Un mot écrit à la main qui n'est pas au catalogue est enregistré **tout
 * de suite** sur la fiche — rien n'attend — et part en parallèle dans
 * `specialites_proposees`, pour que le référentiel s'enrichisse de
 * l'usage réel au lieu d'être deviné une fois pour toutes.
 *
 * CE QUI EST RANGÉ
 * ----------------
 * Une spécialité du catalogue est rangée par sa CLÉ (`mur-soutenement`),
 * une spécialité écrite à la main par son texte. On reconnaît la première
 * parce qu'elle existe au catalogue — et `nomSpecialite()` rend le nom
 * dans les deux cas, donc l'écran ne voit pas la différence.
 *
 * LES DEUX LIMITES, ET POURQUOI
 * -----------------------------
 * Douze spécialités, quarante caractères chacune. Au-delà de douze,
 * personne ne les lit et la liste devient un filet à ratisser toutes les
 * recherches ; au-delà de quarante caractères, ce n'est plus un mot-clé,
 * c'est une phrase — et une phrase ne se retrouve jamais.
 *
 * Les deux limites sont aussi tenues PAR LA BASE (déclencheur
 * `tient_le_profil_pro`, section 17 de schema.sql). Ici, elles ne servent
 * qu'à éviter à l'artisan de découvrir le refus après coup.
 */
import React, { useState, useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { C, F, T, S, R, interligne } from '../theme';
import { Field, BtnMini } from './ui';
import { X, Plus, Check } from './icons';
import {
  specialitesProposees, nomSpecialite, nomMetier, MAP_SPECIALITES,
} from '../lib/metiers';

export const MAX_SPECIALITES = 12;
export const LONGUEUR_MAX = 40;

/** Deux spécialités identiques à la casse près n'en font qu'une. */
const memeChose = (a, b) => String(a).trim().toLowerCase() === String(b).trim().toLowerCase();

/**
 * Cette valeur déjà rangée désigne-t-elle cette spécialité du catalogue ?
 *
 * LE DÉFAUT QUE CECI CORRIGE
 * --------------------------
 * Une fiche remplie AVANT le catalogue porte « Ouverture de mur porteur »
 * en toutes lettres ; le catalogue, lui, la connaît sous la clé
 * `ouverture-mur-porteur`. Comparer les deux directement donne « non ».
 * Résultat vu sur la capture du 01/10/2026 : la spécialité s'affichait à
 * la fois comme CHOISIE en haut et comme À AJOUTER en dessous — et
 * l'ajouter une seconde fois aurait fait un doublon que rien n'aurait
 * rapproché.
 *
 * On compare donc à la clé ET au nom.
 */
const estLaMeme = (valeur, spe) => memeChose(valeur, spe.cle) || memeChose(valeur, spe.nom);

export default function ChampSpecialites({
  valeurs = [], onChange, onErreur, metiers = [], onProposer,
}) {
  const [saisie, setSaisie] = useState('');
  const liste = valeurs.filter(Boolean);
  const plein = liste.length >= MAX_SPECIALITES;

  /* Les spécialités du catalogue pour CES métiers-là. Un couvreur ne se
     voit pas proposer « ouverture de mur porteur » : c'est le §9 de la
     demande, et c'est aussi ce qui rend la liste lisible. */
  const proposees = useMemo(() => specialitesProposees(metiers), [metiers]);

  /* Groupées par métier : au-delà d'un métier, une liste à plat ne dit
     plus d'où vient chaque mot. */
  const groupes = useMemo(() => {
    const paquets = [];
    proposees.forEach((spe) => {
      let paquet = paquets.find((p) => p.metier === spe.metier);
      if (!paquet) { paquet = { metier: spe.metier, items: [] }; paquets.push(paquet); }
      paquet.items.push(spe);
    });
    return paquets;
  }, [proposees]);

  const basculer = (spe) => {
    /* On retire la valeur SOUS LA FORME OÙ ELLE EST RANGÉE : la clé si
       elle vient du catalogue, le texte si elle a été écrite à la main
       avant lui. */
    if (liste.some((x) => estLaMeme(x, spe))) {
      onChange(liste.filter((x) => !estLaMeme(x, spe)));
      return;
    }
    if (plein) {
      onErreur && onErreur(`${MAX_SPECIALITES} spécialités au maximum.`);
      return;
    }
    onChange([...liste, spe.cle]);
  };

  const ajouterSaisie = () => {
    const mot = saisie.trim();
    if (!mot) return;
    if (mot.length > LONGUEUR_MAX) {
      onErreur && onErreur(`« ${mot.slice(0, 20)}… » fait plus de ${LONGUEUR_MAX} caractères : c'est une phrase, pas un mot-clé.`);
      return;
    }
    if (liste.some((x) => memeChose(x, mot) || memeChose(nomSpecialite(x), mot))) {
      setSaisie('');
      return;
    }
    if (plein) {
      onErreur && onErreur(`${MAX_SPECIALITES} spécialités au maximum.`);
      return;
    }

    /* Si le mot écrit correspond à une spécialité du catalogue, on range
       la CLÉ plutôt que le texte : deux artisans qui écrivent la même
       chose se retrouvent alors sous la même entrée. */
    const duCatalogue = proposees.find((spe) => memeChose(spe.nom, mot));
    onChange([...liste, duCatalogue ? duCatalogue.cle : mot]);
    setSaisie('');

    /* Sinon, il part dans la file — sans rien bloquer : la spécialité est
       DÉJÀ sur la fiche. */
    if (!duCatalogue && onProposer) onProposer(mot, metiers[0] || null);
  };

  const retirer = (x) => onChange(liste.filter((y) => y !== x));

  return (
    <View>
      {liste.length > 0 && (
        <View style={s.rang}>
          {liste.map((x) => (
            <View key={x} style={s.pastille}>
              <Text style={s.pastilleTexte}>{nomSpecialite(x)}</Text>
              <Pressable
                onPress={() => retirer(x)}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={`Retirer la spécialité ${nomSpecialite(x)}`}
              >
                <X size={12} color="#fff" />
              </Pressable>
            </View>
          ))}
        </View>
      )}

      {/* --- ce que le catalogue propose pour ses métiers --- */}
      {groupes.length > 0 && (
        <View style={s.bloc}>
          <Text style={s.blocTitre}>
            Les plus courantes dans {groupes.length > 1 ? 'vos métiers' : 'votre métier'}
          </Text>
          {groupes.map((g) => (
            <View key={g.metier} style={s.groupe}>
              {groupes.length > 1 && (
                <Text style={s.groupeTitre}>{nomMetier(g.metier)}</Text>
              )}
              <View style={s.rangPropose}>
                {g.items.map((spe) => {
                  const choisie = liste.some((x) => estLaMeme(x, spe));
                  return (
                    <Pressable
                      key={spe.cle}
                      style={[s.puce, choisie && s.puceChoisie,
                        !choisie && plein && s.puceEteinte]}
                      onPress={() => basculer(spe)}
                      disabled={!choisie && plein}
                      aria-disabled={!choisie && plein}
                      accessibilityRole="button"
                      accessibilityLabel={choisie
                        ? `Retirer la spécialité ${spe.nom}`
                        : `Ajouter la spécialité ${spe.nom}`}
                    >
                      {choisie
                        ? <Check size={11} color="#fff" />
                        : <Plus size={11} color={plein ? C.muted : C.accent2} />}
                      <Text style={[s.puceTexte, choisie && s.puceTexteChoisie,
                        !choisie && plein && s.puceTexteEteint]}>
                        {spe.nom}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ))}
        </View>
      )}

      {/* --- et ce qu'aucune liste n'avait prévu --- */}
      <Text style={s.sousTitre}>La vôtre, si elle n'y est pas</Text>
      <View style={s.ligneSaisie}>
        <View style={{ flex: 1 }}>
          <Field
            value={saisie}
            onChangeText={setSaisie}
            placeholder="Ex. : mur en pierre sèche"
            onSubmitEditing={ajouterSaisie}
            returnKeyType="done"
            maxLength={LONGUEUR_MAX}
            accessibilityLabel="Écrire une spécialité qui n'est pas dans la liste"
          />
        </View>
        <BtnMini
          label="Ajouter"
          onPress={ajouterSaisie}
          disabled={!saisie.trim() || plein}
        />
      </View>

      <Text style={s.aide}>
        {liste.length} sur {MAX_SPECIALITES}. Ce sont les mots que vos clients
        tapent dans la recherche — écrivez-les comme eux, pas comme un devis.
        Ce que vous ajoutez à la main nous est signalé : si plusieurs artisans
        écrivent la même chose, elle entre dans la liste.
      </Text>
    </View>
  );
}

/** Une spécialité vient-elle du catalogue ? Sert aux contrôles. */
export function vientDuCatalogue(x) {
  return !!MAP_SPECIALITES[x];
}

const s = StyleSheet.create({
  rang: { flexDirection: 'row', flexWrap: 'wrap', gap: S.sm - 2, marginBottom: S.sm },
  /* Une pastille FLOTTE au-dessus du fond et on appuie dessus (la croix) :
     elle est donc arrondie, comme les puces de filtre. */
  pastille: {
    flexDirection: 'row', alignItems: 'center', gap: S.sm - 2,
    backgroundColor: C.accent2, paddingVertical: 6, paddingHorizontal: S.md,
    borderRadius: R.gelule,
  },
  pastilleTexte: { fontFamily: F.oswald6, fontSize: T.petit + 0.5, color: '#fff' },

  /* Le bloc des propositions PORTE de l'information : angle vif. */
  bloc: {
    backgroundColor: C.bg, borderWidth: 1, borderColor: C.line,
    padding: S.md, marginBottom: S.md,
  },
  blocTitre: {
    fontFamily: F.inter6, fontSize: T.petit, color: C.muted,
    textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: S.sm,
  },
  groupe: { marginBottom: S.sm },
  groupeTitre: {
    fontFamily: F.oswald6, fontSize: T.petit + 0.5, color: C.ink, marginBottom: S.xs + 2,
  },
  rangPropose: { flexDirection: 'row', flexWrap: 'wrap', gap: S.sm - 2 },
  puce: {
    flexDirection: 'row', alignItems: 'center', gap: S.xs,
    borderWidth: 1, borderColor: C.accent2, borderRadius: R.gelule,
    paddingVertical: 5, paddingHorizontal: S.md - 2,
    backgroundColor: C.surface,
  },
  puceChoisie: { backgroundColor: C.accent2 },
  puceEteinte: { borderColor: C.line },
  puceTexte: { fontFamily: F.inter6, fontSize: T.petit, color: C.accent2 },
  puceTexteChoisie: { color: '#fff' },
  puceTexteEteint: { color: C.muted },

  sousTitre: {
    fontFamily: F.inter6, fontSize: T.petit, color: C.muted,
    textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: S.sm,
  },
  ligneSaisie: { flexDirection: 'row', alignItems: 'center', gap: S.sm },
  aide: {
    fontFamily: F.inter, fontSize: T.petit, color: C.muted,
    lineHeight: interligne(T.petit), marginTop: S.xs,
  },
});

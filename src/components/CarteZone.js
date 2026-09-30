/**
 * « Jusqu'où il se déplace » — vu, pas lu.
 *
 * CE QUE ÇA REMPLACE
 * ------------------
 * La fiche disait « Se déplace jusqu'à 30 km ». Juste, mais abstrait :
 * personne ne sait de tête ce que 30 km couvrent depuis chez lui. Un
 * cercle sur une carte se comprend d'un coup d'œil — c'est la demande du
 * propriétaire, et elle est bonne.
 *
 * CE QU'ON NE MONTRE PAS, ET POURQUOI
 * -----------------------------------
 * Beaucoup d'artisans déclarent l'adresse de leur MAISON. « Se déplace
 * jusqu'à 30 km » ne dit pas où ils habitent ; une carte qu'on peut
 * agrandir, si. Donc, et ce ne sont pas des réglages :
 *
 *   - le zoom est plafonné (`ZOOM_MAX`, `src/lib/tuiles.js`) : on voit les
 *     communes et les routes, jamais les rues nommées ;
 *   - la carte ne se déplace pas et ne se pince pas — c'est une image ;
 *   - **pas d'épingle.** Un simple point discret au centre. Une épingle
 *     désigne une adresse ; un point dit « c'est par là ».
 *
 * LE CENTRE
 * ---------
 * Il vient de `latitude`/`longitude`, que le champ de ville renseigne
 * depuis la Base Adresse Nationale. Un profil rempli avant cette
 * nouveauté n'en a pas : dans ce cas la carte ne s'affiche pas du tout,
 * plutôt qu'un cercle posé au hasard.
 */
import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import Slider from '@react-native-community/slider';
import { C, F, T, S, interligne } from '../theme';
import {
  grilleTuiles, zoomPour, diametrePx, metresParPixel, TAILLE_TUILE,
} from '../lib/tuiles';

const HAUTEUR = 168;

export default function CarteZone({
  latitude, longitude, rayonKm, ville, onChangeRayon, style,
}) {
  /* La largeur n'est connue qu'une fois le cadre posé : elle dépend de
     l'écran et des marges. Tant qu'on ne l'a pas, on ne demande aucune
     image — sinon on en demanderait une première série pour rien. */
  const [largeur, setLargeur] = useState(0);

  const modifiable = typeof onChangeRayon === 'function';
  const rayon = Number(rayonKm) || 0;
  const aUnCentre = Number.isFinite(latitude) && Number.isFinite(longitude)
    && !(latitude === 0 && longitude === 0);

  /* Les calculs ne se refont qu'au changement de rayon ou de largeur.
     Sans cela, chaque mouvement du curseur recalculerait neuf adresses
     d'images identiques — et `expo-image` les rechargerait. */
  const carte = useMemo(() => {
    if (!aUnCentre || !largeur || rayon <= 0) return null;
    /* Le plus petit côté : un cadre plus large que haut laisserait
       déborder le cercle en haut et en bas si on se fiait à la largeur. */
    const zoom = zoomPour(latitude, rayon, Math.min(largeur, HAUTEUR));
    return {
      zoom,
      tuiles: grilleTuiles({
        latitude, longitude, zoom, largeur, hauteur: HAUTEUR,
      }),
      diametre: diametrePx(latitude, rayon, zoom),
      echelleKm: (metresParPixel(latitude, zoom) * TAILLE_TUILE) / 1000,
    };
  }, [aUnCentre, largeur, latitude, longitude, rayon]);

  if (!aUnCentre) {
    /* Pas de coordonnées : on ne dessine rien plutôt qu'un cercle faux.
       Le propriétaire de la fiche, lui, doit savoir pourquoi. */
    if (!modifiable) return null;
    return (
      <View style={style}>
        <Text style={s.aide}>
          La carte a besoin de votre ville : choisissez-la dans la liste qui
          s'ouvre sous le champ « Ville », au lieu de la taper entièrement.
          C'est elle qui donne le point de départ.
        </Text>
      </View>
    );
  }

  const bornes = bornesDuCurseur(rayon);

  return (
    <View style={style}>
      <View
        style={s.cadre}
        onLayout={(e) => setLargeur(Math.round(e.nativeEvent.layout.width))}
        accessibilityRole="image"
        accessibilityLabel={
          `Carte : zone d'intervention de ${rayon} km autour de ${ville || 'votre commune'}.`
        }
      >
        {carte && carte.tuiles.map((t) => (
          <Image
            key={t.cle}
            source={{ uri: t.url }}
            style={[s.tuile, { left: t.left, top: t.top }]}
            contentFit="cover"
            transition={120}
            /* Les tuiles ne changent jamais : elles se gardent sur le
               disque, et la carte revient sans réseau la fois suivante. */
            cachePolicy="disk"
          />
        ))}

        {carte && (
          <View
            style={[s.cercle, {
              width: carte.diametre,
              height: carte.diametre,
              borderRadius: carte.diametre / 2,
              left: (largeur - carte.diametre) / 2,
              top: (HAUTEUR - carte.diametre) / 2,
            }]}
          />
        )}

        {/* Un point, pas une épingle : on dit « c'est par là », pas
            « il habite ici ». */}
        {carte && <View style={s.point} />}

        {/* Rien à dessiner tant qu'aucune distance n'est choisie : on le
            dit, plutôt que de laisser un cadre vide qui ressemble à une
            carte qui n'a pas chargé. */}
        {!carte && modifiable && rayon <= 0 && (
          <Text style={s.attente}>
            Faites glisser le curseur pour choisir votre rayon.
          </Text>
        )}

        {/* L'attribution est la condition d'usage des données de l'IGN.
            Elle reste discrète, mais elle reste. */}
        {!!carte && <Text style={s.credit}>© IGN — Géoplateforme</Text>}
      </View>

      {modifiable ? (
        <>
          <View style={s.ligneRayon}>
            <Text style={s.rayonLabel}>Rayon</Text>
            <Text style={s.rayonValeur}>{rayon} km</Text>
          </View>
          <Slider
            value={rayon}
            onValueChange={(v) => onChangeRayon(Math.round(v))}
            minimumValue={bornes.min}
            maximumValue={bornes.max}
            step={bornes.pas}
            minimumTrackTintColor={C.accent}
            maximumTrackTintColor={C.line}
            thumbTintColor={C.accent}
            accessibilityLabel={`Rayon d'intervention, ${rayon} kilomètres`}
          />
        </>
      ) : (
        <Text style={s.echelle}>
          Zone d'environ {rayon} km autour de {ville || 'sa commune'}.
        </Text>
      )}
    </View>
  );
}

/**
 * Les bornes du curseur.
 *
 * De 5 à 150 km couvre ce que fait un artisan. Mais la base accepte
 * jusqu'à 300 (`pro_zone_km_check`), et quelqu'un peut déjà avoir saisi
 * une valeur hors de ces bornes : le curseur s'élargit alors pour la
 * contenir, au lieu de la ramener en silence à 150 dès qu'on y touche.
 */
function bornesDuCurseur(rayon) {
  return {
    min: Math.min(5, rayon || 5),
    max: Math.max(150, rayon || 0),
    pas: 5,
  };
}

const s = StyleSheet.create({
  /* La carte PORTE une information : angle vif, comme toutes les cartes et
     tous les blocs. `overflow` découpe les tuiles qui dépassent. */
  cadre: {
    height: HAUTEUR,
    /* Une image, rien d'autre : elle ne doit capter aucun geste destiné au
       défilement de la page. Dans le style, et non en attribut : la forme
       `pointerEvents="none"` est dépréciée et le dit à chaque rendu. */
    pointerEvents: 'none',
    backgroundColor: C.bg,
    borderWidth: 1,
    borderColor: C.line,
    overflow: 'hidden',
    position: 'relative',
  },
  tuile: { position: 'absolute', width: TAILLE_TUILE, height: TAILLE_TUILE },

  cercle: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: C.accent,
    backgroundColor: 'rgba(232, 92, 31, 0.12)',
  },
  point: {
    position: 'absolute',
    left: '50%', top: '50%',
    width: 8, height: 8, borderRadius: 4,
    marginLeft: -4, marginTop: -4,
    backgroundColor: C.accent,
    borderWidth: 1.5, borderColor: '#fff',
  },

  attente: {
    position: 'absolute', left: S.lg, right: S.lg, top: HAUTEUR / 2 - 12,
    textAlign: 'center',
    fontFamily: F.inter, fontSize: T.courant, color: C.muted,
    lineHeight: interligne(T.courant),
  },

  credit: {
    position: 'absolute', right: 0, bottom: 0,
    fontFamily: F.inter, fontSize: 9, color: C.ink,
    backgroundColor: 'rgba(255, 255, 255, 0.78)',
    paddingHorizontal: 4, paddingVertical: 1,
  },

  ligneRayon: {
    flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between',
    marginTop: S.md,
  },
  rayonLabel: { fontFamily: F.inter, fontSize: T.courant, color: C.muted },
  rayonValeur: { fontFamily: F.oswald6, fontSize: T.sousTitre, color: C.ink },

  echelle: {
    fontFamily: F.inter, fontSize: T.petit, color: C.muted,
    lineHeight: interligne(T.petit), marginTop: S.xs + 2,
  },
  aide: {
    fontFamily: F.inter, fontSize: T.petit, color: C.muted,
    lineHeight: interligne(T.petit), marginTop: S.sm,
  },
});

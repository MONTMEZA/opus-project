/**
 * LE COMPTEUR D'IMAGES PERDUES — un instrument, pas une fonctionnalité.
 *
 * POURQUOI IL EXISTE (17/10/2026)
 * -------------------------------
 * Trois fois de suite, une correction du fil est partie sur l'iPhone et la
 * réponse a été la même : « ça accroche encore ». Le propriétaire n'a ni
 * Mac ni Instruments, et le Perf Monitor ne vit que dans le build de
 * développement — qui fait tourner le code plus lentement que la vraie
 * application. Une impression ne départage pas deux corrections ; un
 * chiffre, si.
 *
 * CE QU'IL MESURE
 * ---------------
 * Un rappel de Reanimated tourne à CHAQUE image, sur le fil principal —
 * exactement celui qui anime l'élan du défilement. Quand deux images sont
 * séparées de plus de 25 ms (l'écran de l'iPhone 16 en affiche une toutes
 * les 16,7 ms), c'est que le fil principal a été tenu : on compte combien
 * d'images ont sauté, et on retient le pire écart.
 *
 * Ce qu'il ne voit PAS : une image perdue par la puce graphique elle-même.
 * S'il affiche 0 pendant une saccade visible, la cause est ailleurs — et
 * c'est une information aussi.
 *
 * CE QU'IL NE FAIT SURTOUT PAS
 * ----------------------------
 * Se redessiner pendant qu'on fait défiler : chaque mise à jour d'un état
 * React serait un montage de plus sur le fil principal, et l'instrument
 * mesurerait son propre bruit. Le compte vit dans une valeur partagée, du
 * côté du fil principal, et ne s'affiche qu'au TOUCHER.
 *
 * Il n'existe que si `EXPO_PUBLIC_MESURE_FIL` vaut « 1 » — posé dans
 * `eas.json`, profil « preview » seulement, et retiré par un commit le jour
 * où le diagnostic est fini. `npm run verifier-fil` le tient.
 */
import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useFrameCallback, useSharedValue } from 'react-native-reanimated';
import { C, F, T, S, R } from '../theme';

export const MESURE_ACTIVE = process.env.EXPO_PUBLIC_MESURE_FIL === '1';

/** Au-delà, deux images ne se sont pas suivies : le fil principal a été tenu. */
const SEUIL_MS = 25;
const IMAGE_MS = 1000 / 60;

export default function CompteurImages() {
  const perdues = useSharedValue(0);
  const pire = useSharedValue(0);
  const [lu, setLu] = useState(null);

  useFrameCallback((image) => {
    'worklet';
    const ecart = image.timeSincePreviousFrame;
    if (ecart == null || ecart <= SEUIL_MS) return;
    perdues.value += Math.max(1, Math.round(ecart / IMAGE_MS) - 1);
    if (ecart > pire.value) pire.value = ecart;
  });

  /* `.get()` et `.set()` plutôt que `.value` côté JavaScript : c'est la
     forme que Reanimated 4 recommande hors d'un worklet, et celle que les
     règles du compilateur React acceptent. */
  const lire = () => setLu({ perdues: perdues.get(), pire: Math.round(pire.get()) });
  const remettre = () => {
    perdues.set(0);
    pire.set(0);
    setLu({ perdues: 0, pire: 0 });
  };

  const texte = lu
    ? `${lu.perdues} image${lu.perdues > 1 ? 's' : ''} perdue${lu.perdues > 1 ? 's' : ''}`
      + (lu.pire ? ` · pire ${lu.pire} ms` : '')
    : 'Mesure : touchez pour lire';

  return (
    <View style={s.ancrage} pointerEvents="box-none">
      <Pressable
        onPress={lire}
        onLongPress={remettre}
        style={({ pressed }) => [s.pastille, pressed && s.pressee]}
        accessibilityRole="button"
        accessibilityLabel={`${texte}. Touchez pour lire, appui long pour remettre à zéro.`}
      >
        <Text style={s.texte}>{texte}</Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  /* Posé dans le coin, au-dessus du fil : il FLOTTE, donc il est arrondi
     (la règle des bords). `box-none` : seule la pastille reçoit le doigt,
     le reste du fil défile dessous comme si elle n'était pas là. */
  ancrage: {
    position: 'absolute', top: S.sm, right: S.sm, zIndex: 30,
  },
  pastille: {
    backgroundColor: C.ink, borderRadius: R.gelule,
    paddingVertical: S.xs, paddingHorizontal: S.md,
  },
  pressee: { opacity: 0.7 },
  texte: { fontFamily: F.oswald6, fontSize: T.micro, color: C.surface },
});

/**
 * 4. Publier — format, média, destination, description, métier, ville.
 * (.create-types / .create-media / .create-textarea du prototype)
 *
 * Trois choix distincts, et c'est volontaire :
 *
 *   - le FORMAT dit ce qu'on montre (photo, vidéo, montage, avant/après…).
 *     C'est lui qui décide si la publication apparaît dans le fil des vidéos ;
 *   - le MÉDIA est le fichier lui-même : on ouvre l'appareil photo ou la
 *     galerie, et l'aperçu montre ce qui sera publié ;
 *   - la DESTINATION dit où elle va. Un artisan ne veut pas toujours publier :
 *     parfois il veut juste enrichir son portfolio.
 */
import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { C, F } from '../theme';
import { BtnMain, BtnMini, Chip, Field, TextArea } from '../components/ui';
import AmeliorerTexte from '../components/AmeliorerTexte';
import Media from '../components/Media';
import {
  Camera, VideoIcon, TypeIcon, Layers, Lightbulb, Grid, Send, Music, X, Plus,
  ChevronLeft, ChevronRight,
} from '../components/icons';
import { METIERS } from '../data/demo';
import {
  choisirImage, choisirPhotos, choisirVideo, choisirClips, choisirMusique,
  CLIPS_MAX, DUREE_CLIP_MAX, PHOTOS_MAX,
} from '../lib/media';

const TYPES = [
  ['photo', Camera, 'Photo'],
  ['video', VideoIcon, 'Vidéo'],
  ['montage', Layers, 'Montage'],
  ['avantapres', Grid, 'Avant/Après'],
  ['texte', TypeIcon, 'Texte'],
  ['conseil', Lightbulb, 'Conseil'],
];

/** Les formats qui produisent une image ou une vidéo, donc bons pour le portfolio. */
export const FORMATS_VISUELS = new Set(['photo', 'video', 'montage', 'avantapres']);

/** Ceux qui alimentent le fil « Vidéos ». */
export const FORMATS_VIDEO = new Set(['video', 'montage']);

/**
 * Combien de médias chaque format attend.
 *
 * `photo` en accepte désormais plusieurs : elles se font défiler au doigt
 * dans le fil (voir components/Carrousel.js). `avantapres` en garde
 * exactement deux — c'est la comparaison qui fait le format, une troisième
 * photo n'aurait pas de place où aller.
 */
const NB_MEDIAS = { photo: PHOTOS_MAX, video: 1, avantapres: 2, montage: CLIPS_MAX };

const DESTINATIONS = [
  ['fil', Send, 'Le fil', 'Visible par tous, avec likes et commentaires.'],
  ['portfolio', Grid, 'Mon portfolio', 'Rangé dans vos réalisations, rien dans le fil.'],
  ['deux', Layers, 'Les deux', 'Publié dans le fil ET ajouté à vos réalisations.'],
];

export default function CreerScreen({
  moi,
  createType, setCreateType, createText, setCreateText,
  createMetier, setCreateMetier, createVille, setCreateVille,
  createDestination, setCreateDestination,
  medias, setMedias, musique, setMusique,
  envoi, erreur, onPublish, onErreur,
}) {
  const [occupe, setOccupe] = useState(false);
  const aUnVisuel = FORMATS_VISUELS.has(createType);
  const destination = aUnVisuel ? createDestination : 'fil';
  const dansLeFil = destination !== 'portfolio';
  const maximum = NB_MEDIAS[createType] || 1;
  const estMontage = createType === 'montage';

  /* Changer de format vide la sélection : une photo n'est pas un clip, et
     garder l'ancienne sélection produirait des publications incohérentes. */
  const changerType = (key) => {
    if (key === createType) return;
    setCreateType(key);
    setMedias([]);
    setMusique(null);
  };

  const proteger = async (action) => {
    setOccupe(true);
    try { await action(); } catch (e) { onErreur(e.message || String(e)); }
    setOccupe(false);
  };

  const ajouterPhoto = (camera) => proteger(async () => {
    const uri = await choisirImage({ camera, usage: 'photo' });
    if (uri) setMedias((m) => [...m, uri].slice(0, maximum));
  });

  /* La galerie en sélection multiple, quand le format en accepte plusieurs.
     Choisir six photos une par une, en rouvrant la galerie à chaque fois,
     est exactement le genre de corvée qui fait renoncer à publier. */
  const ajouterPhotos = () => proteger(async () => {
    const uris = await choisirPhotos({ restants: maximum - medias.length });
    if (uris.length) setMedias((m) => [...m, ...uris].slice(0, maximum));
  });

  const ajouterVideo = (camera) => proteger(async () => {
    const asset = await choisirVideo({ camera, dureeMax: DUREE_CLIP_MAX });
    if (asset) setMedias((m) => [...m, asset.uri].slice(0, maximum));
  });

  const ajouterClips = () => proteger(async () => {
    const clips = await choisirClips({ restants: maximum - medias.length });
    if (clips.length) setMedias((m) => [...m, ...clips.map((c) => c.uri)].slice(0, maximum));
  });

  const ajouterMusique = () => proteger(async () => {
    const son = await choisirMusique();
    if (son) setMusique(son);
  });

  const retirer = (i) => setMedias((m) => m.filter((_, k) => k !== i));
  const deplacer = (i, pas) => setMedias((m) => {
    const cible = i + pas;
    if (cible < 0 || cible >= m.length) return m;
    const copie = [...m];
    [copie[i], copie[cible]] = [copie[cible], copie[i]];
    return copie;
  });

  const plein = medias.length >= maximum;
  const Icone = (TYPES.find(([k]) => k === createType) || TYPES[0])[1];

  /* Ce qui manque encore, dit ici plutôt que dans un bandeau fugace en haut
     de l'écran : on appuie sur « Publier » tout en bas, et un message qui
     apparaît à l'autre bout pendant trois secondes ne se voit pas. */
  const manques = [];
  if (aUnVisuel && medias.length === 0) {
    manques.push(estMontage ? 'Ajoutez au moins un clip.' : 'Choisissez une photo ou une vidéo.');
  }
  if (createType === 'avantapres' && medias.length === 1) {
    manques.push('Il manque la seconde photo (l\'après).');
  }
  if (dansLeFil && !createText.trim()) {
    manques.push('Écrivez une description : elle apparaît sous la publication.');
  }
  const pret = manques.length === 0 && !envoi;

  return (
    <ScrollView style={s.pad} keyboardShouldPersistTaps="handled">
      <Text style={s.label}>Format</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.types}>
        {TYPES.map(([key, Icon, label]) => {
          const on = createType === key;
          return (
            <Pressable key={key} style={[s.type, on && s.typeOn]} onPress={() => changerType(key)}>
              <Icon size={18} color={on ? '#fff' : C.muted} />
              <Text style={[s.typeText, on && { color: '#fff' }]}>{label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* --- médias --- */}
      {aUnVisuel && (
        <>
          {medias.length === 0 ? (
            <View style={s.vide}>
              <Icone size={26} color={C.muted} />
              <Text style={s.videTexte}>
                {estMontage
                  ? `Jusqu'à ${CLIPS_MAX} clips, ${DUREE_CLIP_MAX} secondes chacun`
                  : createType === 'avantapres'
                    ? 'Deux photos : avant, puis après'
                    : createType === 'photo'
                      ? `Jusqu'à ${PHOTOS_MAX} photos, qu'on fait défiler au doigt`
                      : 'Aucun média choisi'}
              </Text>
            </View>
          ) : (
            <View style={s.apercus}>
              {medias.map((uri, i) => (
                <View key={`${uri}-${i}`} style={s.apercu}>
                  <Media media={uri} style={s.vignette} />
                  <View style={s.rang}>
                    <Text style={s.rangTexte}>
                      {createType === 'avantapres' ? (i === 0 ? 'Avant' : 'Après') : i + 1}
                    </Text>
                  </View>
                  <Pressable style={s.retirer} onPress={() => retirer(i)} hitSlop={6}>
                    <X size={12} color="#fff" />
                  </Pressable>
                  {medias.length > 1 && (
                    <View style={s.ordre}>
                      <Pressable onPress={() => deplacer(i, -1)} hitSlop={6} disabled={i === 0}>
                        <ChevronLeft size={14} color={i === 0 ? 'rgba(255,255,255,0.3)' : '#fff'} />
                      </Pressable>
                      <Pressable
                        onPress={() => deplacer(i, 1)}
                        hitSlop={6}
                        disabled={i === medias.length - 1}
                      >
                        <ChevronRight
                          size={14}
                          color={i === medias.length - 1 ? 'rgba(255,255,255,0.3)' : '#fff'}
                        />
                      </Pressable>
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}

          <View style={s.boutonsMedia}>
            {(createType === 'photo' || createType === 'avantapres') && (
              <>
                <BtnMini label="Prendre une photo" onPress={() => ajouterPhoto(true)} disabled={plein || occupe} />
                <BtnMini
                  outline
                  label="Galerie"
                  onPress={() => (maximum > 1 ? ajouterPhotos() : ajouterPhoto(false))}
                  disabled={plein || occupe}
                />
              </>
            )}
            {createType === 'video' && (
              <>
                <BtnMini label="Filmer" onPress={() => ajouterVideo(true)} disabled={plein || occupe} />
                <BtnMini outline label="Galerie" onPress={() => ajouterVideo(false)} disabled={plein || occupe} />
              </>
            )}
            {estMontage && (
              <>
                <BtnMini label="Filmer un clip" onPress={() => ajouterVideo(true)} disabled={plein || occupe} />
                <BtnMini outline onPress={ajouterClips} disabled={plein || occupe}>
                  <Plus size={12} color={C.ink} />
                  <Text style={s.boutonTexte}>Ajouter des clips</Text>
                </BtnMini>
              </>
            )}
          </View>

          {plein && (
            <Text style={s.note}>
              {maximum === 1 ? 'Retirez le média pour en choisir un autre.'
                : `Maximum atteint (${maximum}). Retirez-en un pour en ajouter un autre.`}
            </Text>
          )}

          {/* --- musique du montage --- */}
          {estMontage && (
            <View style={s.musique}>
              <Music size={15} color={musique ? C.accent : C.muted} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={s.musiqueTitre} numberOfLines={1}>
                  {musique ? musique.nom : 'Son original des clips'}
                </Text>
                <Text style={s.musiqueDetail}>
                  {musique
                    ? 'Le son des clips est coupé pendant la musique.'
                    : "Ajoutez un morceau depuis votre téléphone si vous voulez une bande-son."}
                </Text>
              </View>
              {musique
                ? <BtnMini outline label="Retirer" onPress={() => setMusique(null)} />
                : <BtnMini outline label="Musique" onPress={ajouterMusique} disabled={occupe} />}
            </View>
          )}
        </>
      )}

      {/* --- destination --- */}
      {aUnVisuel && (
        <>
          <Text style={s.label}>Où l'envoyer ?</Text>
          <View style={s.destinations}>
            {DESTINATIONS.map(([key, Icon, titre, detail]) => {
              const on = destination === key;
              return (
                <Pressable
                  key={key}
                  style={[s.destination, on && s.destinationOn]}
                  onPress={() => setCreateDestination(key)}
                >
                  <Icon size={15} color={on ? C.accent : C.muted} />
                  <View style={s.destinationTextes}>
                    <Text style={[s.destinationTitre, on && { color: C.accent }]}>{titre}</Text>
                    <Text style={s.destinationDetail}>{detail}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </>
      )}

      <Text style={s.label}>{dansLeFil ? 'Description' : 'Description (facultative)'}</Text>
      <TextArea
        placeholder={dansLeFil
          ? 'Raconte ce que tu as fait, avec tes mots...'
          : 'Une légende, si tu veux...'}
        value={createText}
        onChangeText={setCreateText}
      />

      {/* L'artisan écrit comme il parle, puis fait relire. L'assistant part
          de SES mots : il corrige et range, il ne remplace pas. */}
      <AmeliorerTexte
        texte={createText}
        contexte="publication"
        profil={moi ? {
          entreprise: moi.entreprise, metiers: moi.metiers || [moi.metier],
          ville: moi.ville, exp: moi.exp,
        } : {}}
        onRemplacer={setCreateText}
      />

      <Text style={s.label}>Métier</Text>
      <View style={s.chipRow}>
        {METIERS.map((m) => (
          <Chip key={m} label={m} on={createMetier === m} onPress={() => setCreateMetier(m)} />
        ))}
      </View>

      <Field placeholder="Ville" value={createVille} onChangeText={setCreateVille} />

      {manques.length > 0 && (
        <View style={s.manques}>
          {manques.map((m) => (
            <Text key={m} style={s.manque}>• {m}</Text>
          ))}
        </View>
      )}

      {/* Un refus reste affiché jusqu'à la tentative suivante. Un bandeau de
          trois secondes en haut de l'écran ne se voit pas quand on vient
          d'appuyer sur un bouton tout en bas. */}
      {!!erreur && (
        <View style={s.erreur}>
          <Text style={s.erreurTitre}>La publication n'est pas partie</Text>
          <Text style={s.erreurTexte}>{erreur}</Text>
        </View>
      )}

      {/* Un envoi de vidéo prend du temps : sans jauge, l'écran a l'air figé
          et on appuie une deuxième fois. */}
      {!!envoi && (
        <View style={s.envoi}>
          <View style={s.jaugeFond}>
            <View style={[s.jaugeBarre, { width: `${Math.round((envoi.part || 0) * 100)}%` }]} />
          </View>
          <Text style={s.envoiTexte}>
            Envoi {envoi.index} / {envoi.total} — {Math.round((envoi.part || 0) * 100)} %
          </Text>
        </View>
      )}

      <BtnMain
        block
        disabled={!pret}
        label={envoi
          ? 'Envoi en cours...'
          : destination === 'portfolio' ? 'Ajouter à mon portfolio' : 'Publier'}
        onPress={onPublish}
        style={{ marginTop: 14, marginBottom: 30 }}
      />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  pad: { flex: 1, paddingTop: 12, paddingHorizontal: 16 },
  types: { gap: 6, paddingBottom: 6 },
  type: {
    alignItems: 'center', gap: 4, backgroundColor: C.surface,
    borderWidth: 1, borderColor: C.line, paddingVertical: 10, paddingHorizontal: 12,
  },
  typeOn: { backgroundColor: C.ink, borderColor: C.ink },
  typeText: { fontSize: 10.5, color: C.muted, fontFamily: F.oswald },
  label: { fontFamily: F.oswald6, fontSize: 12, color: C.ink, marginBottom: 6, marginTop: 6 },

  vide: {
    height: 120, marginVertical: 10, alignItems: 'center', justifyContent: 'center', gap: 7,
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, borderStyle: 'dashed',
  },
  videTexte: { fontSize: 11.5, color: C.muted, fontFamily: F.inter, textAlign: 'center', paddingHorizontal: 20 },

  apercus: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginVertical: 10 },
  apercu: { width: 96, height: 120 },
  vignette: { width: 96, height: 120, backgroundColor: C.line },
  rang: {
    position: 'absolute', left: 4, top: 4,
    backgroundColor: 'rgba(26,27,25,0.72)', paddingHorizontal: 5, paddingVertical: 2,
  },
  rangTexte: { fontFamily: F.oswald6, fontSize: 10, color: '#fff' },
  retirer: {
    position: 'absolute', right: 4, top: 4, width: 20, height: 20, borderRadius: 10,
    backgroundColor: 'rgba(26,27,25,0.72)', alignItems: 'center', justifyContent: 'center',
  },
  ordre: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 6, paddingVertical: 4,
    backgroundColor: 'rgba(26,27,25,0.55)',
  },

  boutonsMedia: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  boutonTexte: { fontFamily: F.oswald6, fontSize: 11, color: C.ink },
  note: { fontSize: 11, color: C.muted, fontFamily: F.inter, marginTop: 6 },

  musique: {
    flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 10,
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.line,
    paddingVertical: 9, paddingHorizontal: 11,
  },
  musiqueTitre: { fontFamily: F.oswald6, fontSize: 12, color: C.ink },
  musiqueDetail: { fontSize: 10.5, color: C.muted, fontFamily: F.inter, marginTop: 1 },

  destinations: { gap: 6, marginBottom: 12 },
  destination: {
    flexDirection: 'row', alignItems: 'center', gap: 9,
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.line,
    paddingVertical: 9, paddingHorizontal: 11,
  },
  destinationOn: { borderColor: C.accent, borderWidth: 2 },
  destinationTextes: { flex: 1, minWidth: 0 },
  destinationTitre: { fontFamily: F.oswald6, fontSize: 12.5, color: C.ink },
  destinationDetail: { fontSize: 10.5, color: C.muted, fontFamily: F.inter, marginTop: 1 },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },

  manques: {
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.line,
    borderLeftWidth: 4, borderLeftColor: C.accent, padding: 10, gap: 3, marginTop: 12,
  },
  manque: { fontSize: 11.5, color: C.muted, fontFamily: F.inter, lineHeight: 17 },

  erreur: {
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.line,
    borderLeftWidth: 4, borderLeftColor: C.bad, padding: 10, gap: 3, marginTop: 12,
  },
  erreurTitre: { fontFamily: F.oswald6, fontSize: 12.5, color: C.bad },
  erreurTexte: { fontSize: 11.5, color: C.muted, fontFamily: F.inter, lineHeight: 17 },

  envoi: { marginTop: 12, gap: 5 },
  jaugeFond: { height: 4, backgroundColor: C.line },
  jaugeBarre: { height: 4, backgroundColor: C.accent },
  envoiTexte: { fontSize: 11, color: C.muted, fontFamily: F.inter6 },
});

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
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import {
  C, F, T, viser, S, R, GOUTTIERE, interligne, APPUI, TOUCHE,
} from '../theme';
import { BtnMain, BtnMini, Field } from '../components/ui';
import ChampLocal from '../components/ChampLocal';
import AmeliorerTexte, { MINIMUM as MINIMUM_RELECTURE } from '../components/AmeliorerTexte';
import Media from '../components/Media';
import {
  Camera, VideoIcon, TypeIcon, Layers, Lightbulb, Grid, Send, Music, X, Plus,
  ChevronLeft, ChevronRight, Check,
} from '../components/icons';
import { ChampMetier } from '../components/SelecteurMetiers';
import {
  choisirImage, choisirPhotos, choisirVideo, choisirClips, choisirMusique,
  CLIPS_MAX, DUREE_CLIP_MAX, PHOTOS_MAX,
} from '../lib/media';
/* Les formats ne vivent plus dans cet écran : `OpusApp` et `PostCard`
   devaient importer un ÉCRAN pour savoir ce qu'est une photo. */
import { FORMATS_VISUELS } from '../lib/formats-publication';

/*
 * LE FORMAT DIT LE SUPPORT, PLUS JAMAIS L'INTENTION — 05/10/2026.
 *
 * « Conseil » était ici, sixième bouton, à côté de « Photo » et « Vidéo ».
 * Relevé sur la vraie base ce jour-là : **zéro** publication de ce type sur
 * seize, y compris de la part du propriétaire, qui est le seul vrai artisan
 * de cette base.
 *
 * La bonne question n'était donc pas « comment améliorer l'écriture d'un
 * conseil » — j'allais livrer un meilleur formulaire pour un bouton que
 * personne ne touche. C'était : pourquoi personne n'appuie dessus ? Et le
 * propriétaire a donné la réponse :
 *
 *   « Tu penses que les gens qui regardent ne préfèrent pas voir une image
 *     ou une vidéo avec une voix off qui explique, plutôt que juste du texte
 *     simple ? »
 *
 * Il a raison, et ses seize publications le prouvent : toutes visuelles.
 * Choisir « Conseil » obligeait à RENONCER à la photo ou à la vidéo —
 * c'est-à-dire à renoncer à ce qui fait regarder. Personne ne fait ce
 * marché.
 *
 * Le conseil est devenu une CASE À COCHER, disponible sur tous les formats
 * (section 34 de schema.sql). On filme comme d'habitude, et on coche.
 *
 * « Texte » reste, à la demande du propriétaire — « on garde le texte sans
 * image ». Il sert à ce qui n'a rien à montrer : une mise en garde, une
 * date de réglementation.
 */
const TYPES = [
  ['photo', Camera, 'Photo'],
  ['video', VideoIcon, 'Vidéo'],
  ['montage', Layers, 'Montage'],
  ['avantapres', Grid, 'Avant/Après'],
  ['texte', TypeIcon, 'Texte'],
];

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
  createType, setCreateType,
  createMetier, setCreateMetier, createVille, setCreateVille,
  createDestination, setCreateDestination,
  createConseil, setCreateConseil,
  mesChantiers = [], createChantier, setCreateChantier, onNouveauChantier,
  medias, setMedias, musique, setMusique,
  envoi, erreur, onPublish, onErreur,
}) {
  const [occupe, setOccupe] = useState(false);

  /* LA VILLE EST PRÉ-REMPLIE DEPUIS LA FICHE — 05/10/2026.
     Elle était vide par défaut, et c'est elle qui place la publication sur
     la carte : vide, le chantier n'apparaissait dans aucune recherche par
     secteur. Or personne ne retape sa ville à chaque photo.

     Une seule fois par ouverture de l'écran (`villePosee`) : sans ce
     verrou, effacer le champ volontairement le remplirait à nouveau au
     rendu suivant, et on ne pourrait plus publier sans ville. */
  const villePosee = useRef(false);
  useEffect(() => {
    if (villePosee.current || !moi || !moi.ville) return;
    villePosee.current = true;
    if (!createVille.trim()) setCreateVille(moi.ville);
  }, [moi, createVille, setCreateVille]);

  /* LA DESCRIPTION NE VIT PLUS DANS `OpusApp`.
     Elle y était, et chaque lettre redessinait donc toute l'application —
     203 ms par lettre au navigateur, processeur bridé six fois, soit le
     niveau de l'assistant IA du 29/09 dont le propriétaire avait dit
     « on ne peut pas écrire dedans ».
     Elle vit maintenant dans son champ. Cet écran n'apprend que deux
     choses : qu'elle est vide ou non (pour le bouton Publier), et qu'elle
     a dépassé la longueur minimale (pour la relecture). Deux ou trois fois
     dans une saisie, au lieu d'une fois par lettre. */
  const legende = useRef(null);
  const [etatLegende, setEtatLegende] = useState({ vide: true, long: false });
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
  if (dansLeFil && etatLegende.vide) {
    manques.push('Écrivez une description : elle apparaît sous la publication.');
  }
  const pret = manques.length === 0 && !envoi;

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={s.pad}
      keyboardShouldPersistTaps="handled"
    >
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
                  <Pressable
                    style={s.retirer}
                    onPress={() => retirer(i)}
                    hitSlop={viser(24)}
                    accessibilityRole="button"
                    accessibilityLabel={`Retirer le média ${i + 1}`}
                  >
                    <X size={12} color="#fff" />
                  </Pressable>
                  {medias.length > 1 && (
                    <View style={s.ordre}>
                      <Pressable
                        onPress={() => deplacer(i, -1)}
                        hitSlop={viser(24)}
                        disabled={i === 0}
                        accessibilityRole="button"
                        accessibilityLabel={`Déplacer le média ${i + 1} vers la gauche`}
                        aria-disabled={i === 0}
                      >
                        <ChevronLeft size={14} color={i === 0 ? 'rgba(255,255,255,0.3)' : '#fff'} />
                      </Pressable>
                      <Pressable
                        onPress={() => deplacer(i, 1)}
                        hitSlop={viser(24)}
                        disabled={i === medias.length - 1}
                        accessibilityRole="button"
                        accessibilityLabel={`Déplacer le média ${i + 1} vers la droite`}
                        aria-disabled={i === medias.length - 1}
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
                    <Text style={[s.destinationTitre, on && { color: C.accentTexte }]}>{titre}</Text>
                    <Text style={s.destinationDetail}>{detail}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </>
      )}

      <Text style={s.label}>{dansLeFil ? 'Description' : 'Description (facultative)'}</Text>
      <ChampLocal
        ref={legende}
        multiligne
        placeholder={dansLeFil
          ? 'Raconte ce que tu as fait, avec tes mots...'
          : 'Une légende, si tu veux...'}
        surSeuil={setEtatLegende}
        seuilLong={MINIMUM_RELECTURE}
      />

      {/* L'artisan écrit comme il parle, puis fait relire. L'assistant part
          de SES mots : il corrige et range, il ne remplace pas. */}
      <AmeliorerTexte
        lireTexte={() => (legende.current ? legende.current.lire() : '')}
        longueurAtteinte={etatLegende.long}
        contexte="publication"
        profil={moi ? {
          entreprise: moi.entreprise, metiers: moi.metiers || [moi.metier],
          ville: moi.ville, exp: moi.exp,
        } : {}}
        onRemplacer={(t) => legende.current && legende.current.ecrire(t)}
      />

      {/* « C'EST UN CONSEIL » — une étiquette, et pas un format.
          Section 34 de schema.sql, et la décision du propriétaire du
          05/10/2026 : « ok pour l'étiquette ».

          ELLE N'APPARAÎT PAS POUR LE PORTFOLIO, et c'est le piège de ce
          lot : une publication envoyée au seul portfolio ne crée AUCUNE
          ligne dans `posts`. La case se cocherait, l'écran dirait oui, et
          la colonne n'existerait nulle part. C'est exactement le « bouton
          §18 » — une commande qui a l'air de servir et ne touche rien. */}
      {dansLeFil && (
        <Pressable
          onPress={() => setCreateConseil(!createConseil)}
          accessibilityRole="checkbox"
          accessibilityLabel="C'est un conseil"
          aria-checked={!!createConseil}
          style={({ pressed }) => [
            s.conseil, createConseil && s.conseilOn, pressed && APPUI.discret,
          ]}
        >
          <View style={[s.boite, createConseil && s.boiteOn]}>
            {!!createConseil && <Check size={13} color={C.surAccent} />}
          </View>
          <Lightbulb size={16} color={createConseil ? C.accentTexte : C.muted} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={[s.conseilTitre, createConseil && { color: C.accentTexte }]}>
              C'est un conseil
            </Text>
            {/* POURQUOI cocher, et pas seulement quoi. Une case sans raison
                reste décochée. */}
            <Text style={s.conseilDetail}>
              Il sera rangé dans « Ses conseils » sur votre fiche, et repéré
              dans le fil. Une photo de chantier vaut sa journée ; un conseil
              vaut encore dans trois ans.
            </Text>
          </View>
        </Pressable>
      )}

      {/* LE CHANTIER (section 36). Il ne s'affiche que pour ce qui part
          dans le fil : une publication rangée au seul portfolio ne crée
          AUCUNE ligne dans `posts`, donc elle ne peut rejoindre aucun
          chantier. Même garde que la case « conseil » juste au-dessus —
          une commande qui a l'air de servir et ne touche rien, c'est le
          « bouton §18 ». */}
      {dansLeFil && (
        <>
          <Text style={s.label}>Chantier (facultatif)</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.types}>
            {/* « Aucun » EN PREMIER, et sélectionné par défaut. La plupart
                des publications n'appartiennent à rien, et la position de
                repos doit être celle qu'on choisit le plus souvent. */}
            <Pressable
              style={[s.chantier, !createChantier && s.chantierOn]}
              onPress={() => setCreateChantier(null)}
              accessibilityRole="button"
              accessibilityLabel="Aucun chantier"
              aria-selected={!createChantier}
            >
              <Text style={[s.chantierTexte, !createChantier && { color: '#fff' }]}>Aucun</Text>
            </Pressable>

            {/* ON NE RETAPE JAMAIS UN NOM. « Toiture Charleval » tapé deux
                fois à un espace près, ce sont deux chantiers — la base le
                refuse (index unique), mais c'est ici que ça se joue : on
                CHOISIT dans la liste. */}
            {mesChantiers.map((c) => {
              const on = createChantier === c.id;
              return (
                <Pressable
                  key={c.id}
                  style={[s.chantier, on && s.chantierOn]}
                  onPress={() => setCreateChantier(c.id)}
                  accessibilityRole="button"
                  accessibilityLabel={`Chantier ${c.titre}`}
                  aria-selected={on}
                >
                  <Text style={[s.chantierTexte, on && { color: '#fff' }]} numberOfLines={1}>
                    {c.titre}
                  </Text>
                </Pressable>
              );
            })}

            <Pressable
              style={[s.chantier, s.chantierNeuf]}
              onPress={onNouveauChantier}
              accessibilityRole="button"
              accessibilityLabel="Créer un chantier"
            >
              <Plus size={12} color={C.accentTexte} />
              <Text style={[s.chantierTexte, { color: C.accentTexte }]}>Nouveau</Text>
            </Pressable>
          </ScrollView>
          <Text style={s.aide}>
            Les publications d&apos;un même chantier se suivent : on les lit
            comme une histoire, de la première à la dernière.
          </Text>
        </>
      )}

      <Text style={s.label}>Métier</Text>
      <ChampMetier
        valeur={createMetier}
        onChange={setCreateMetier}
        titre="Métier de cette publication"
        placeholder="Choisir un métier..."
      />

      <Text style={s.label}>Ville du chantier</Text>
      <Field placeholder="Ville" value={createVille} onChangeText={setCreateVille} />
      <Text style={s.aide}>
        Elle place la publication sur la carte, pour qu'on la trouve en
        cherchant autour de cette commune. Pré-remplie avec la vôtre.
      </Text>

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
        /* Le texte EXACT, lu à l'instant où on appuie. Pas de différé :
           publier une demi-seconde après la dernière lettre enverrait une
           description amputée. */
        onPress={async () => {
          const parti = await onPublish(legende.current ? legende.current.lire() : '');
          /* L'écran vide SON champ : le texte ne vit plus dans `OpusApp`,
             qui ne peut donc plus le remettre à zéro. Et seulement si
             c'est parti — sinon on effacerait le travail de l'artisan
             parce qu'une photo manquait. */
          if (parti && legende.current) legende.current.vider();
        }}
        style={{ marginTop: 14, marginBottom: 30 }}
      />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  /* `contentContainerStyle`, pas `style` — voir GOUTTIERE dans theme.js. */
  pad: { paddingTop: S.md, paddingHorizontal: GOUTTIERE },
  types: { gap: 6, paddingBottom: 6 },
  type: {
    alignItems: 'center', gap: 4, backgroundColor: C.surface,
    borderWidth: 1, borderColor: C.line, paddingVertical: 10, paddingHorizontal: 12,
  },
  typeOn: { backgroundColor: C.ink, borderColor: C.ink },
  typeText: { fontSize: T.petit, color: C.muted, fontFamily: F.oswald },
  label: { fontFamily: F.oswald6, fontSize: T.courant, color: C.ink, marginBottom: 6, marginTop: 6 },
  /* Pourquoi on demande ce champ. Un champ sans raison reste vide — et
     celui-ci place la publication sur la carte. */
  aide: { fontFamily: F.inter, fontSize: T.petit, color: C.muted, marginTop: S.xs, lineHeight: interligne(T.petit) },

  vide: {
    height: 120, marginVertical: 10, alignItems: 'center', justifyContent: 'center', gap: 7,
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, borderStyle: 'dashed',
  },
  videTexte: { fontSize: T.courant, color: C.muted, fontFamily: F.inter, textAlign: 'center', paddingHorizontal: 20 },

  apercus: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginVertical: 10 },
  apercu: { width: 96, height: 120 },
  vignette: { width: 96, height: 120, backgroundColor: C.line },
  rang: {
    position: 'absolute', left: 4, top: 4,
    backgroundColor: 'rgba(26,27,25,0.72)', paddingHorizontal: 5, paddingVertical: 2,
  },
  rangTexte: { fontFamily: F.oswald6, fontSize: T.micro, color: '#fff' },
  retirer: {
    position: 'absolute', right: 4, top: 4, width: 20, height: 20, borderRadius: 10,
    backgroundColor: 'rgba(26,27,25,0.72)', alignItems: 'center', justifyContent: 'center',
  },
  ordre: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 6, paddingVertical: 4,
    backgroundColor: 'rgba(26,27,25,0.55)',
  },

  /* La case « C'est un conseil ». Angle VIF : c'est un bloc qui PORTE une
     information, pas une pastille qui flotte (voir « Les bords »). Toute la
     rangée est la cible — viser une boîte de 20 px au pouce, non. */
  conseil: {
    flexDirection: 'row', alignItems: 'center', gap: S.sm,
    minHeight: TOUCHE, paddingVertical: S.sm, paddingHorizontal: S.sm,
    marginTop: S.sm,
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.line,
  },
  conseilOn: { borderColor: C.accent },
  /* La boîte, elle, s'arrondit à peine : c'est la seule chose de ce bloc sur
     laquelle l'œil cherche une coche. */
  boite: {
    width: 20, height: 20, borderRadius: R.vif,
    borderWidth: 1.5, borderColor: C.bordChamp,
    alignItems: 'center', justifyContent: 'center',
  },
  boiteOn: { backgroundColor: C.accent, borderColor: C.accent },
  conseilTitre: { fontFamily: F.oswald6, fontSize: T.courant, color: C.ink },
  conseilDetail: {
    fontFamily: F.inter, fontSize: T.petit, color: C.muted,
    lineHeight: interligne(T.petit), marginTop: S.xs,
  },

  /* Les puces de chantier : elles FLOTTENT et on appuie dessus, donc
     elles s'arrondissent (voir « Les bords »). Les boutons de FORMAT
     au-dessus gardent l'angle vif : ils forment une barre d'outils. */
  chantier: {
    flexDirection: 'row', alignItems: 'center', gap: S.xs,
    maxWidth: 190, minHeight: TOUCHE,
    paddingVertical: S.sm, paddingHorizontal: S.md,
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.line,
    borderRadius: R.gelule,
  },
  chantierOn: { backgroundColor: C.ink, borderColor: C.ink },
  chantierNeuf: { borderColor: C.accent, borderStyle: 'dashed' },
  chantierTexte: { fontFamily: F.oswald6, fontSize: T.petit, color: C.muted },

  boutonsMedia: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  boutonTexte: { fontFamily: F.oswald6, fontSize: T.petit, color: C.ink },
  note: { fontSize: T.petit, color: C.muted, fontFamily: F.inter, marginTop: 6 },

  musique: {
    flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 10,
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.line,
    paddingVertical: 9, paddingHorizontal: 11,
  },
  musiqueTitre: { fontFamily: F.oswald6, fontSize: T.courant, color: C.ink },
  musiqueDetail: { fontSize: T.petit, color: C.muted, fontFamily: F.inter, marginTop: 1 },

  destinations: { gap: 6, marginBottom: 12 },
  destination: {
    flexDirection: 'row', alignItems: 'center', gap: 9,
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.line,
    paddingVertical: 9, paddingHorizontal: 11,
  },
  destinationOn: { borderColor: C.accent, borderWidth: 2 },
  destinationTextes: { flex: 1, minWidth: 0 },
  destinationTitre: { fontFamily: F.oswald6, fontSize: T.corps, color: C.ink },
  destinationDetail: { fontSize: T.petit, color: C.muted, fontFamily: F.inter, marginTop: 1 },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },

  manques: {
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.line,
    borderLeftWidth: 4, borderLeftColor: C.accent, padding: 10, gap: 3, marginTop: 12,
  },
  manque: { fontSize: T.courant, color: C.muted, fontFamily: F.inter, lineHeight: 17 },

  erreur: {
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.line,
    borderLeftWidth: 4, borderLeftColor: C.bad, padding: 10, gap: 3, marginTop: 12,
  },
  erreurTitre: { fontFamily: F.oswald6, fontSize: T.corps, color: C.bad },
  erreurTexte: { fontSize: T.courant, color: C.muted, fontFamily: F.inter, lineHeight: 17 },

  envoi: { marginTop: 12, gap: 5 },
  jaugeFond: { height: 4, backgroundColor: C.line },
  jaugeBarre: { height: 4, backgroundColor: C.accent },
  envoiTexte: { fontSize: T.petit, color: C.muted, fontFamily: F.inter6 },
});

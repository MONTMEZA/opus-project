/**
 * Modifier mon profil — pro ou particulier.
 *
 * Côté professionnel, l'écran contient aussi le miroir du bouton SOS :
 * c'est ici que l'artisan déclare qu'il répond aux urgences, dans quel
 * rayon et en combien de temps.
 *
 * SES TARIFS NE S'ÉCRIVENT PLUS ICI (lot T, section 47 de `schema.sql`). Il
 * n'y a qu'UNE liste, pour ses devis et pour le SOS, et une seule porte pour
 * l'écrire : « Mon entreprise ». Deux formulaires pour les mêmes chiffres
 * finiraient par dire deux choses différentes. Le réglage d'urgence les
 * MONTRE, dit en une phrase si l'artisan apparaît ou non dans les urgences
 * et pourquoi (`etatReglageSos`, la même phrase que dans « Mon
 * entreprise »), et RENVOIE à « Mon entreprise » pour les changer.
 */
import {
  pieceExistence, pieceAssurance, metiersFiges, envoiSuspendLeBadge, AVERTISSEMENT_SUSPENSION,
} from '../lib/verification';
import { enMilieuDePhrase } from '../lib/texte';
import React, { useState } from 'react';
import {
  View, Text, ScrollView, Switch, ActivityIndicator, StyleSheet, Pressable,
} from 'react-native';
import {
  C, F, T, S, R, APPUI, TOUCHE, interligne,
} from '../theme';
import {
  Avatar, BtnMain, BtnMini, Field, TextArea, ProfileBanner, SectionLabel,
} from '../components/ui';
import {
  Camera, AlertTriangle, FileText, Check, ShieldCheck, ShieldX, Sparkles, Building,
  ChevronRight,
} from '../components/icons';
import { resumeEntreprise } from '../lib/entreprise';
import ChampVille from '../components/ChampVille';
import ChoixMetiers from '../components/ChoixMetiers';
import ChampSpecialites from '../components/ChampSpecialites';
import ChampHoraires from '../components/ChampHoraires';
import CarteZone from '../components/CarteZone';
import AssistantPresentation from '../components/AssistantPresentation';
import AmeliorerTexte from '../components/AmeliorerTexte';
import { METIER_PAR_DEFAUT } from '../lib/metiers';
import {
  metierSosDeLaFiche, reglageInitialSos, etatReglageSos, reglageSosDepuisSaisie, lignesTarifs,
} from '../lib/tarifs';
import { choisirImage, choisirDocument } from '../lib/media';
import { CLAVIER } from '../lib/clavier';

export default function ProfilEditScreen({
  userType, profil, sos, onSave, onEnvoyerDocuments, onErreur,
  onDemanderMetiers, demandeMetiers, onProposerSpecialite, emailCompte = '',
  identiteEntreprise = null, entrepriseEtat = 'jamais', onOuvrirEntreprise,
  /* Lot T : MES tarifs (`mesTarifs` d'`OpusApp`, ou `{ echec: true }`), et
     si ma fiche a une position. `sos` vaut `{ lignes }` ou `{ echec: true }`. */
  tarifs = null, aDesCoordonnees = false,
}) {
  const estPro = userType === 'pro';

  const [avatarUrl, setAvatarUrl] = useState(profil.avatarUrl || null);
  const [bannerUrl, setBannerUrl] = useState(profil.bannerUrl || null);
  const [nom, setNom] = useState(profil.nom || '');
  const [telephone, setTelephone] = useState(profil.telephone || '');
  const [emailPro, setEmailPro] = useState(profil.emailPro || '');
  const [entreprise, setEntreprise] = useState(profil.entreprise || '');
  /* Les métiers déjà enregistrés ; un profil d'avant la nouveauté n'en a
     qu'un, on en fait une liste d'un seul élément. */
  const [metiers, setMetiers] = useState(
    profil.metiers && profil.metiers.length ? profil.metiers : [profil.metier || METIER_PAR_DEFAUT],
  );
  const [demandeOuverte, setDemandeOuverte] = useState(false);
  const [metiersVoulus, setMetiersVoulus] = useState(
    profil.metiers && profil.metiers.length ? profil.metiers : [profil.metier || METIER_PAR_DEFAUT],
  );
  const [motif, setMotif] = useState('');
  const [assistantOuvert, setAssistantOuvert] = useState(false);
  const [lieu, setLieu] = useState({
    affichage: profil.ville || '',
    codePostal: profil.codePostal || null,
    latitude: profil.latitude || null,
    longitude: profil.longitude || null,
  });
  const [bio, setBio] = useState(profil.bio || '');
  const [exp, setExp] = useState(String(profil.exp || ''));
  /* La zone d'intervention ordinaire, à ne pas confondre avec le rayon SOS
     plus bas : celle-ci vaut pour les chantiers normaux, et concerne TOUS
     les métiers. Vide veut dire « non renseigné », et rien ne s'affiche. */
  const [zoneKm, setZoneKm] = useState(profil.zoneKm ? String(profil.zoneKm) : '');
  const [specialites, setSpecialites] = useState(profil.specialites || []);
  const [horaires, setHoraires] = useState(profil.horaires || null);

  /* La certification RGE. Ce que l'artisan DÉCLARE ; le badge, lui, ne
     s'allume que lorsque l'attestation a été regardée par un humain. */
  const [rgeDeclare, setRgeDeclare] = useState(!!profil.rgeDeclare);
  const [rgeNumero, setRgeNumero] = useState(profil.rgeNumero || '');
  const [rgeExpire, setRgeExpire] = useState(profil.rgeExpire || '');
  const [rgeFichier, setRgeFichier] = useState(null);

  /* L'ÉTAT DE DÉPART DU RÉGLAGE D'URGENCE — et c'est le point qui aurait
     éteint le SOS de tout artisan qui enregistre son profil. `mesSos` est
     une LISTE de lignes depuis le lot T : lire `sos.actif` dessus rendrait
     `undefined`, donc un interrupteur éteint, et « Enregistrer » enverrait
     `actif: false` — se retirer des urgences en changeant sa présentation,
     sans un mot. `reglageInitialSos` choisit la ligne du métier d'urgence de
     la fiche, et `verifier-tarifs` la fait tourner. Les métiers de départ
     sont ceux du formulaire : une fiche d'avant les métiers multiples n'a
     que `metier`, et sans lui sa ligne active ne serait pas retrouvée — puis
     éteinte à l'enregistrement. */
  const metiersDeDepart = profil.metiers && profil.metiers.length
    ? profil.metiers : [profil.metier || METIER_PAR_DEFAUT];
  const depart = reglageInitialSos(sos, metiersDeDepart);
  const [sosActif, setSosActif] = useState(depart.actif);
  const [rayonKm, setRayonKm] = useState(depart.rayon);
  const [delaiMinutes, setDelaiMinutes] = useState(depart.delai);

  const [kbis, setKbis] = useState(null);
  const [assurance, setAssurance] = useState(null);
  const [envoiDocs, setEnvoiDocs] = useState(false);

  const sosMetier = metierSosDeLaFiche(metiers);
  /* UNE SEULE PHRASE pour dire si l'artisan apparaît dans les urgences, et
     pourquoi — écrite UNE fois, dans `tarifs.js`, et appelée aussi par « Mon
     entreprise ». La position : celle de la fiche, ou celle qu'on vient de
     choisir dans ce formulaire. */
  const etatSos = etatReglageSos({
    sos,
    sosMetier,
    /* Le métier d'urgence de la fiche TELLE QU'ENREGISTRÉE : s'il vient
       d'être retiré dans le formulaire, rien n'est encore fait, et la
       phrase le dit au futur — jamais « vous n'y apparaissez plus » tant
       que la fiche en base le porte. */
    sosMetierEnBase: metierSosDeLaFiche(metiersDeDepart),
    interrupteur: sosActif,
    enregistre: !!(depart.ligne && depart.ligne.actif && sosMetier && depart.ligne.metierKey === sosMetier.key),
    tarifs,
    aDesCoordonnees: aDesCoordonnees || (lieu.latitude != null && lieu.longitude != null),
  });
  const lectureSosEchouee = etatSos.cle === 'sos_echec';

  const prendre = async (usage, camera) => {
    try {
      const uri = await choisirImage({ camera, usage });
      if (!uri) return;
      if (usage === 'avatar') setAvatarUrl(uri);
      else setBannerUrl(uri);
    } catch (e) {
      onErreur(e.message || "L'image n'a pas pu être ouverte.");
    }
  };

  /* CE QUE L'ENREGISTREMENT FAIT DE MA DISPONIBILITÉ AUX URGENCES :
       - `null` (n'y touche pas) si la lecture a échoué — on ne réécrit pas ce
         qu'on n'a pas pu lire —, ou s'il n'y a ni métier d'urgence ni ligne
         active ;
       - sinon la ligne de mon métier d'urgence, et l'extinction des autres
         (`metierKey: null` les éteint toutes : la ligne orpheline). */
  const sosAEnvoyer = () => {
    if (!estPro || !depart.lisible || lectureSosEchouee) return { ok: true, valeurs: null };
    const actives = sos.lignes.filter((l) => l && l.actif === true);
    if (!sosMetier && actives.length === 0) return { ok: true, valeurs: null };
    const r = reglageSosDepuisSaisie({
      actif: sosMetier ? sosActif : false,
      rayon: rayonKm,
      delai: delaiMinutes,
      ligne: depart.ligne,
    });
    if (!r.ok) return r;
    return {
      ok: true,
      valeurs: {
        metierKey: sosMetier ? sosMetier.key : null,
        actif: sosMetier ? sosActif : false,
        rayonKm: r.valeurs.rayonKm,
        delaiMinutes: r.valeurs.delaiMinutes,
      },
    };
  };

  const enregistrer = () => {
    /* Un rayon ou un délai refusé n'enregistre RIEN : ni la fiche, ni la
       disponibilité. Et on ne le remplace jamais en silence par 20 ou 45. */
    const sosLu = sosAEnvoyer();
    if (!sosLu.ok) { onErreur(sosLu.message); return; }
    onSave({
      profil: estPro
        ? {
            avatarUrl, bannerUrl, entreprise, metiers, metier: metiers[0], bio,
            telephone, emailPro, specialites, horaires,
            zoneKm: Number(zoneKm) || null,
            ville: lieu.affichage,
            codePostal: lieu.codePostal,
            codeInsee: lieu.codeInsee,
            latitude: lieu.latitude,
            longitude: lieu.longitude,
            exp: Number(exp) || 0,
          }
        : {
            avatarUrl, nom, telephone,
            ville: lieu.affichage,
            codePostal: lieu.codePostal,
            latitude: lieu.latitude,
            longitude: lieu.longitude,
          },
      sos: sosLu.valeurs,
    });
  };

  /* Une rangée qui ouvre « Mon entreprise » sur la bonne section. */
  const versMesTarifs = (libelle, section) => (
    <Pressable
      onPress={() => { if (onOuvrirEntreprise) onOuvrirEntreprise(section); }}
      accessibilityRole="button"
      accessibilityLabel={`${libelle}, dans « Mon entreprise »`}
      style={({ pressed }) => [s.rangee, s.rangeeSos, pressed && APPUI.discret]}
    >
      <Text style={s.rangeeTexte}>{libelle}</Text>
      <ChevronRight size={15} color={C.muted} />
    </Pressable>
  );

  return (
    <ScrollView {...CLAVIER} style={{ flex: 1 }}>
      {/* --- bannière (professionnels seulement) ---
           L'aperçu montre exactement ce que verront les visiteurs : la
           bannière choisie si elle existe, sinon la première réalisation. */}
      {estPro && (
        <>
          <ProfileBanner
            uri={bannerUrl || (profil.portfolio && profil.portfolio[0]) || null}
            height={130}
          />
          <View style={s.banniereBarre}>
            <Text style={s.banniereNote}>
              {bannerUrl
                ? 'Bannière personnalisée'
                : 'Par défaut : votre première réalisation'}
            </Text>
            <View style={s.banniereBoutons}>
              {!!bannerUrl && (
                <BtnMini outline label="Retirer" onPress={() => setBannerUrl(null)} />
              )}
              <BtnMini outline onPress={() => prendre('banniere', false)}>
                <Camera size={12} color={C.ink} />
                <Text style={s.mediaBtnText}>
                  {bannerUrl ? 'Changer' : 'Choisir'}
                </Text>
              </BtnMini>
            </View>
          </View>
        </>
      )}

      {/* --- photo de profil --- */}
      <View style={s.avatarZone}>
        <Avatar seed={profil.id || 9} size={88} ring={4} uri={avatarUrl} nom={profil.entreprise || profil.nom} />
        <View style={{ gap: 6 }}>
          <BtnMini onPress={() => prendre('avatar', true)}>
            <Camera size={12} color={C.surAccent} />
            <Text style={s.mediaBtnTextOn}>Prendre une photo</Text>
          </BtnMini>
          <BtnMini outline onPress={() => prendre('avatar', false)}>
            <Text style={s.mediaBtnText}>Choisir dans la galerie</Text>
          </BtnMini>
        </View>
      </View>

      <View style={s.pad}>
        {estPro ? (
          <>
            <Text style={s.label}>Nom de l'entreprise</Text>
            <Field value={entreprise} onChangeText={setEntreprise} placeholder="Belaïd Maçonnerie" />

            <Text style={s.label}>Vos métiers</Text>
            <ChoixMetiers
              valeurs={metiers}
              onChange={setMetiers}
              /* Figés aussi PENDANT une suspension (lot S-a) : sans ça, un
                 artisan suspendu changeait de métier librement, et la
                 revalidation de sa pièce lui rendait le badge avec un métier
                 jamais contrôlé. La base le refuse de toute façon
                 (`tient_les_metiers`) ; l'écran ne doit pas proposer ce
                 qu'elle refusera. */
              verrouille={metiersFiges(profil)}
              suspendu={!profil.verifie && !!profil.badgeSuspenduLe}
              demandeEnCours={!!demandeMetiers}
              onDemanderModification={() => setDemandeOuverte(true)}
            />

            {/* Le profil est vérifié et l'artisan veut changer de métier :
                c'est un humain qui tranchera, mais la demande part d'ici et
                porte ce qu'il faut pour décider — les métiers voulus et la
                raison. */}
            {metiersFiges(profil) && demandeOuverte && !demandeMetiers && (
              <View style={s.demande}>
                <Text style={s.demandeTitre}>Demande de modification</Text>
                <Text style={s.demandeTexte}>
                  Choisissez les métiers souhaités et expliquez pourquoi. Votre
                  badge et vos métiers actuels restent en place tant que la
                  demande n'a pas été examinée.
                </Text>
                <ChoixMetiers valeurs={metiersVoulus} onChange={setMetiersVoulus} />
                <TextArea
                  value={motif}
                  onChangeText={setMotif}
                  placeholder="Ex. : certification carrelage obtenue en septembre, attestation jointe au Kbis."
                />
                <View style={s.demandeBtns}>
                  <BtnMini outline label="Annuler" onPress={() => setDemandeOuverte(false)} />
                  {/* Secondaire : l'action de CET écran, c'est « Enregistrer ».
                      Celle-ci n'appartient qu'à sa section. */}
                  <BtnMain
                    ton="sombre"
                    label="Envoyer la demande"
                    disabled={!motif.trim()}
                    onPress={() => {
                      onDemanderMetiers({ metiersVoulus, motif: motif.trim() });
                      setDemandeOuverte(false);
                    }}
                  />
                </View>
              </View>
            )}

            {/* Les spécialités viennent JUSTE APRÈS les métiers, et c'est
                leur place : elles en dépendent entièrement. Elles étaient
                posées après le SIRET et les années d'expérience — remarque
                du propriétaire le 01/10/2026 : « on choisit nos métiers
                mais les spécialités sont après le SIRET, pas très
                compréhensible ». C'était un rangement, pas un sens. */}
            <Text style={s.label}>Vos spécialités</Text>
            <ChampSpecialites
              valeurs={specialites}
              onChange={setSpecialites}
              metiers={metiers}
              onProposer={onProposerSpecialite}
              onErreur={onErreur}
            />

            <Text style={s.label}>Ville</Text>
            <ChampVille valeur={lieu.affichage} onChange={setLieu} />

            <View style={s.presentationTitre}>
              <Text style={[s.label, { marginBottom: 0 }]}>Présentation</Text>
              {/* Deux situations, deux aides. Page blanche : le questionnaire,
                  parce que personne n'aime parler de soi devant un champ vide.
                  Quelque chose d'écrit : la relecture, qui part de ses mots.
                  Proposer les deux en même temps serait un choix de plus à
                  faire, et c'est justement ce qu'on veut lui épargner. */}
              {!assistantOuvert && !bio.trim() && (
                <BtnMini outline onPress={() => setAssistantOuvert(true)}>
                  <Sparkles size={12} color={C.accent2} />
                  <Text style={s.aiderTexte}>M'aider à l'écrire</Text>
                </BtnMini>
              )}
            </View>
            <TextArea
              value={bio}
              onChangeText={setBio}
              placeholder="Décrivez votre activité, avec vos mots..."
            />

            {/* C'est la case qui décide un particulier qui hésite entre deux
                devis, et c'est celle qui reste vide le plus souvent. */}
            {!!bio.trim() && !assistantOuvert && (
              <AmeliorerTexte
                texte={bio}
                contexte="presentation"
                profil={{
                  entreprise, metiers, ville: lieu.affichage, exp: Number(exp) || 0,
                }}
                onRemplacer={setBio}
              />
            )}

            {!bio.trim() && !assistantOuvert && (
              <Text style={s.presentationAide}>
                Écrivez quelques lignes comme vous les diriez : le bouton
                « Améliorer avec l'IA » apparaîtra pour les relire.
              </Text>
            )}

            {assistantOuvert && (
              <AssistantPresentation
                profil={{ entreprise, metiers, ville: lieu.affichage }}
                onFermer={() => setAssistantOuvert(false)}
                onUtiliser={(texte) => { setBio(texte); setAssistantOuvert(false); }}
              />
            )}

            {/* MON ENTREPRISE — une rangée, et pas un champ. Le SIRET ne se
                TAPE plus ici : il se RATTACHE, après consultation du
                répertoire, par un geste immédiat qui n'attend pas
                « Enregistrer ». L'ancien champ était un texte libre, jamais
                contrôlé, avec un exemple inventé.

                Elle ouvre la fenêtre plein écran « Mon entreprise » (lot 0a
                du devis), la MÊME que depuis « Mon profil » : c'est
                `OpusApp` qui la monte, et qui lit l'entreprise au passage.
                L'ancienne feuille du bas a disparu — elle ne pouvait pas
                porter les informations de devis sans enfermer le clavier. */}
            <Text style={s.label}>Mon entreprise</Text>
            <Pressable
              onPress={() => { if (onOuvrirEntreprise) onOuvrirEntreprise(); }}
              accessibilityRole="button"
              accessibilityLabel="Mon entreprise : identité et informations de devis"
              style={({ pressed }) => [s.rangee, pressed && APPUI.discret]}
            >
              <Building size={16} color={C.accent2} />
              <Text style={s.rangeeTexte} numberOfLines={2}>
                {entrepriseEtat === 'pret' ? resumeEntreprise(identiteEntreprise)
                  : entrepriseEtat === 'echec' ? 'Entreprise illisible pour l’instant — touchez pour réessayer'
                    : 'Voir mon entreprise'}
              </Text>
              <ChevronRight size={15} color={C.muted} />
            </Pressable>

            <Text style={s.label}>Années d'expérience</Text>
            <Field value={exp} onChangeText={setExp} keyboardType="number-pad" placeholder="9" />

            {/* Le téléphone d'un artisan est PUBLIC, et c'est voulu : c'est
                le premier renseignement qu'un particulier cherche sur un
                annuaire professionnel. On le dit franchement plutôt que de
                laisser la surprise arriver après. */}
            <Text style={s.label}>Téléphone</Text>
            <Field
              value={telephone}
              onChangeText={setTelephone}
              placeholder="04 78 00 00 00"
              keyboardType="phone-pad"
            />
            <Text style={s.aide}>
              Il s'affiche sur votre fiche, et un client peut l'appeler d'un
              seul geste. Laissez-le vide si vous préférez n'être joint que
              par message.
            </Text>

            {/* L'adresse de CONTACT, et jamais celle du compte : celle-ci
                est déclarée pour être publique, comme le téléphone. */}
            <Text style={s.label}>E-mail professionnel</Text>
            <Field
              value={emailPro}
              onChangeText={setEmailPro}
              placeholder="contact@votre-entreprise.fr"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Text style={s.aide}>
              Pour recevoir un plan, un devis signé, une attestation — ce que
              la messagerie ne fait pas encore. Il s'affiche publiquement, au
              même titre que votre téléphone. Ce n'est pas l'adresse de votre
              compte Opus, qui elle reste invisible.
            </Text>
            {/* ===================================================
                UN APPUI PLUTÔT QU'UNE RECOPIE — 05/10/2026.

                Le propriétaire : « quand on crée un compte pro on
                renseigne une adresse e-mail, mais quand on veut
                modifier notre fiche ces informations ne sont pas
                mises automatiquement ».

                Il a raison sur la gêne, et on ne peut pourtant PAS
                recopier tout seul : `users.email` a été fermée à
                tout le monde le 29/09 parce qu'elle fuitait. La
                préremplir ici et laisser quelqu'un toucher
                « Enregistrer » sans y penser la rendrait publique
                par une autre porte — exactement ce que ce travail a
                fermé.

                D'où un bouton qui MONTRE l'adresse avant de la
                poser : il n'y a plus à la retaper, et on voit ce
                qu'on s'apprête à publier. Il disparaît dès que le
                champ est rempli : une proposition qui reste après
                coup n'est plus une aide, c'est du bruit. */}
            {!emailPro.trim() && !!emailCompte && (
              <Pressable
                onPress={() => setEmailPro(emailCompte)}
                accessibilityRole="button"
                accessibilityLabel={`Utiliser l'adresse de mon compte, ${emailCompte}`}
                style={({ pressed }) => [s.reprendre, pressed && APPUI.plein]}
              >
                <Text style={s.reprendreTexte} numberOfLines={2}>
                  Utiliser l'adresse de mon compte ({emailCompte})
                </Text>
              </Pressable>
            )}

            {/* À ne pas confondre avec le rayon SOS, plus bas : celui-ci
                ne concerne que les urgences, et seulement quatre métiers.

                Le champ de saisie a laissé la place au curseur : taper
                « 30 » ne dit rien tant qu'on n'a pas vu ce que 30 km
                couvrent depuis chez soi. Le cercle bouge sous le doigt,
                et la question se répond toute seule.

                Pourquoi pas en tirant le bord du cercle, comme demandé :
                sur un téléphone, viser un trait de 2 px pendant que la
                carte interprète le doigt comme un déplacement, c'est la
                bagarre — le même piège que le glissement du fil vidéo. Le
                curseur montre exactement la même chose, sans rater sa
                cible. */}
            <Text style={s.label}>Zone d'intervention</Text>
            <CarteZone
              latitude={lieu.latitude}
              longitude={lieu.longitude}
              rayonKm={Number(zoneKm) || 0}
              ville={lieu.affichage}
              onChangeRayon={(km) => setZoneKm(String(km))}
            />
            <Text style={s.aide}>
              Le cercle suit le curseur : c'est ce qu'un client verra sur
              votre fiche. La distance est à vol d'oiseau, pas en temps de
              route — une vallée de montagne et une autoroute ne se valent
              pas. Et la carte ne s'agrandit jamais jusqu'à la rue : elle
              montre votre zone, pas votre adresse.
            </Text>

            {/* « Ouvert jusqu'à 18 h » change le fait d'appeler ou non,
                maintenant. C'est le renseignement qu'on cherche au moment
                précis où on tient son téléphone. */}
            <Text style={s.label}>Horaires d'ouverture</Text>
            <ChampHoraires valeur={horaires} onChange={setHoraires} />
          </>
        ) : (
          <>
            <Text style={s.label}>Votre nom</Text>
            <Field value={nom} onChangeText={setNom} placeholder="Dylan M." />

            <Text style={s.label}>Ville</Text>
            <ChampVille valeur={lieu.affichage} onChange={setLieu} />

            {/* Renseigné ici une fois, le numéro pré-remplit ensuite toutes
                les demandes de devis et de rappel. */}
            <Text style={s.label}>Téléphone</Text>
            <Field
              value={telephone}
              onChangeText={setTelephone}
              placeholder="06 12 34 56 78"
              keyboardType="phone-pad"
            />
            <Text style={s.aide}>
              Il ne s'affiche nulle part. Il n'est transmis qu'aux artisans à
              qui vous demandez un devis ou un rappel.
            </Text>
          </>
        )}
      </View>

      {/* --- justificatifs --- */}
      {estPro && (
        <>
          <SectionLabel>Documents justificatifs</SectionLabel>
          <View style={s.pad}>
            <View style={s.docBloc}>
              <StatutVerification statut={profil.verificationStatut} note={profil.verificationNote} />

              <Text style={s.docIntro}>
                Ces documents ne sont visibles que par vous et par l'équipe Opus.
                Ils ne sont jamais affichés sur votre profil public : seul le
                badge vérifié l'est.
              </Text>

              <Text style={s.docIntro}>{pieceExistence().aide}</Text>
              <Text style={s.docIntro}>{pieceAssurance(profil).aide}</Text>

              {/* LES DEUX LIBELLÉS SUIVENT LE MÉTIER, et ce n'est pas
                  cosmétique : un micro-entrepreneur n'a pas de Kbis, et un
                  avocat ne peut pas avoir de décennale. Les deux
                  cherchaient un document qui n'existe pas, puis
                  renonçaient. Voir `src/data/pieces-justificatives.js`. */}
              <LigneDocument
                titre={pieceExistence().nom}
                detail="PDF ou photo, de moins de 3 mois"
                fichier={kbis}
                dejaEnvoye={!!profil.kbisPath}
                onChoisir={async () => {
                  try {
                    const doc = await choisirDocument();
                    if (doc) setKbis(doc);
                  } catch (e) { onErreur(e.message || "Le fichier n'a pas pu être ouvert."); }
                }}
              />

              <LigneDocument
                titre={`Attestation — ${enMilieuDePhrase(pieceAssurance(profil).nom)}`}
                detail="PDF ou photo, en cours de validité"
                fichier={assurance}
                dejaEnvoye={!!profil.assurancePath}
                onChoisir={async () => {
                  try {
                    const doc = await choisirDocument();
                    if (doc) setAssurance(doc);
                  } catch (e) { onErreur(e.message || "Le fichier n'a pas pu être ouvert."); }
                }}
              />

              {/* --- la certification RGE ---
                   Elle est ici, avec les deux autres justificatifs, parce
                   que c'est le même geste : « voici ce que je peux prouver ».
                   Et elle est SÉPARÉE du badge vérifié : un carreleur n'a
                   aucune raison d'être RGE, il serait absurde qu'il paraisse
                   moins sérieux pour autant. */}
              <View style={s.rgeLigne}>
                <View style={{ flex: 1 }}>
                  <Text style={s.docTitre}>Certification RGE</Text>
                  <Text style={s.docDetail}>
                    Reconnu Garant de l'Environnement — c'est elle qui ouvre
                    MaPrimeRénov' et les aides à vos clients.
                  </Text>
                </View>
                <Switch
                  value={rgeDeclare}
                  onValueChange={setRgeDeclare}
                  trackColor={{ false: C.line, true: C.ok }}
                  thumbColor="#fff"
                />
              </View>

              {rgeDeclare && (
                <View style={s.rgeBloc}>
                  <Text style={s.label}>Numéro de qualification</Text>
                  <Field
                    value={rgeNumero}
                    onChangeText={setRgeNumero}
                    placeholder="QB/12345 ou E-E123456"
                    autoCapitalize="characters"
                  />

                  <Text style={s.label}>Valable jusqu'au</Text>
                  <Field value={rgeExpire} onChangeText={setRgeExpire} placeholder="12/2027" />

                  <LigneDocument
                    titre="Attestation RGE"
                    detail="PDF ou photo, en cours de validité"
                    fichier={rgeFichier}
                    dejaEnvoye={!!profil.rgePath}
                    onChoisir={async () => {
                      try {
                        const doc = await choisirDocument();
                        if (doc) setRgeFichier(doc);
                      } catch (e) { onErreur(e.message || "Le fichier n'a pas pu être ouvert."); }
                    }}
                  />

                  <Text style={s.docDetail}>
                    {profil.rge
                      ? 'Certification vérifiée : le label s\'affiche sur votre fiche.'
                      : 'Le label « Certifié RGE » n\'apparaîtra sur votre fiche qu\'une fois l\'attestation contrôlée.'}
                  </Text>
                </View>
              )}

              {/* AVANT l'envoi, et pas après : un badge suspendu par
                  surprise ressemble à un badge retiré (lot S-a). Seulement
                  pour une pièce d'existence ou d'assurance — un envoi RGE
                  seul ne touche pas au badge. */}
              {envoiSuspendLeBadge(profil, { kbis: !!kbis, assurance: !!assurance }) && (
                <Text style={s.suspension} accessibilityLiveRegion="polite">
                  {AVERTISSEMENT_SUSPENSION}
                </Text>
              )}

              {/* Secondaire, comme la demande de métiers : l'action de
                  l'écran « Modifier mon profil », c'est « Enregistrer ». */}
              <BtnMain
                block
                ton="sombre"
                onPress={async () => {
                  /* On n'envoie que s'il y a vraiment quelque chose de
                     nouveau : un fichier, ou une déclaration RGE modifiée.
                     Sinon le profil repasserait en « en attente » pour
                     rien, et perdrait sa place dans la file. */
                  const rgeChange = rgeDeclare !== !!profil.rgeDeclare
                    || rgeNumero.trim() !== (profil.rgeNumero || '')
                    || rgeExpire.trim() !== (profil.rgeExpire || '');
                  if (!kbis && !assurance && !rgeFichier && !rgeChange) {
                    onErreur('Choisissez au moins un document avant de l\'envoyer.');
                    return;
                  }
                  setEnvoiDocs(true);
                  await onEnvoyerDocuments({
                    kbis,
                    assurance,
                    rgeFichier,
                    rge: {
                      declare: rgeDeclare,
                      numero: rgeNumero.trim(),
                      expire: rgeExpire.trim(),
                    },
                  });
                  setEnvoiDocs(false);
                }}
                disabled={envoiDocs}
              >
                {envoiDocs ? (
                  <>
                    <ActivityIndicator size="small" color="#fff" />
                    <Text style={s.btnText}>Envoi en cours...</Text>
                  </>
                ) : (
                  <Text style={s.btnText}>Envoyer pour vérification</Text>
                )}
              </BtnMain>
            </View>
          </View>
        </>
      )}

      {/* --- disponibilité SOS (professionnels des 4 métiers d'urgence) ---

          ELLE MONTRE, ELLE RENVOIE : aucun tarif ne s'écrit ici. La ligne
          d'état dit la vérité, quel que soit l'interrupteur — on peut
          l'allumer avant d'avoir affiché ses tarifs, et elle dit alors
          qu'on n'apparaît pas encore, et pourquoi. */}
      {estPro && (
        <>
          <SectionLabel>Interventions d'urgence</SectionLabel>
          <View style={s.pad}>
            <View style={s.sosBloc}>
              {sosMetier && (
                <View style={s.sosLigne}>
                  <Text style={[s.sosTitre, { flex: 1 }]}>Je réponds aux urgences</Text>
                  <Switch
                    value={sosActif}
                    onValueChange={setSosActif}
                    disabled={lectureSosEchouee}
                    trackColor={{ false: C.line, true: C.sos }}
                    thumbColor="#fff"
                    accessibilityLabel={`Je réponds aux urgences « ${sosMetier.label} »`}
                  />
                </View>
              )}

              <Text style={s.sosDetail}>{etatSos.phrase}</Text>

              {etatSos.cle === 'pret' && (
                <View style={s.sosTarifs}>
                  {lignesTarifs(tarifs).map((l) => (
                    <Text key={l.cle} style={s.sosTarif}>
                      {l.libelle ? `${l.libelle} : ${l.valeur}` : l.valeur}
                    </Text>
                  ))}
                </View>
              )}

              {!!etatSos.avertissement && <Text style={s.sosAEteindre}>{etatSos.avertissement}</Text>}

              {etatSos.cle === 'tarifs_echec' && versMesTarifs('Ouvrir mes tarifs', 'frais')}
              {etatSos.cle === 'non_affiches' && versMesTarifs('Afficher mes tarifs', 'affiche')}
              {etatSos.cle === 'incomplets' && versMesTarifs('Compléter mes tarifs', 'frais')}
              {etatSos.cle === 'pret' && versMesTarifs('Modifier mes tarifs', 'frais')}

              {/* Le rayon et le délai ne sont lus que si l'interrupteur est
                  allumé : un champ qu'on ne voit plus ne peut pas bloquer
                  l'enregistrement du profil. Des pavés numériques, donc sans
                  touche retour : l'annoncer serait mentir. */}
              {sosMetier && sosActif && !lectureSosEchouee && (
                <View style={s.sosChamps}>
                  <Text style={s.label}>Rayon d'intervention (km)</Text>
                  <Field
                    value={rayonKm}
                    onChangeText={setRayonKm}
                    keyboardType="number-pad"
                    placeholder="20"
                    accessibilityLabel="Rayon d'intervention, en kilomètres"
                  />

                  <Text style={s.label}>Délai d'arrivée habituel (minutes)</Text>
                  <Field
                    value={delaiMinutes}
                    onChangeText={setDelaiMinutes}
                    keyboardType="number-pad"
                    placeholder="45"
                    accessibilityLabel="Délai d'arrivée habituel, en minutes"
                  />

                  <View style={s.avert}>
                    <AlertTriangle size={14} color={C.sos} />
                    <Text style={s.avertText}>
                      Ces tarifs servent à calculer une estimation affichée au particulier avant
                      votre déplacement. Ce n’est pas un devis : après diagnostic, pour un
                      dépannage, une réparation ou un entretien, un devis écrit reste dû dès le
                      premier euro.
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        </>
      )}

      <View style={[s.pad, { paddingBottom: 34 }]}>
        <BtnMain block label="Enregistrer" onPress={enregistrer} />
      </View>
    </ScrollView>
  );
}

/** Où en est la vérification du profil. */
function StatutVerification({ statut, note }) {
  const etats = {
    non_soumis: { texte: 'Documents non envoyés', couleur: C.muted, Icone: FileText },
    en_attente: { texte: 'En attente de vérification', couleur: C.accent2, Icone: FileText },
    verifie: { texte: 'Profil vérifié', couleur: C.ok, Icone: ShieldCheck },
    refuse: { texte: 'Documents refusés', couleur: C.bad, Icone: ShieldX },
  };
  const e = etats[statut] || etats.non_soumis;
  return (
    <View style={[s.statut, { borderLeftColor: e.couleur }]}>
      <e.Icone size={15} color={e.couleur} />
      <View style={{ flex: 1 }}>
        <Text style={[s.statutTexte, { color: e.couleur }]}>{e.texte}</Text>
        {!!note && <Text style={s.statutNote}>{note}</Text>}
      </View>
    </View>
  );
}

/** Une ligne de justificatif : son état et le bouton pour le choisir. */
function LigneDocument({ titre, detail, fichier, dejaEnvoye, onChoisir }) {
  return (
    <View style={s.docLigne}>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={s.docTitre}>{titre}</Text>
        {fichier ? (
          <View style={s.docChoisi}>
            <Check size={11} color={C.ok} />
            <Text style={s.docChoisiTexte} numberOfLines={1}>{fichier.nom}</Text>
          </View>
        ) : (
          <Text style={s.docDetail}>
            {dejaEnvoye ? 'Déjà envoyé — choisissez un fichier pour le remplacer' : detail}
          </Text>
        )}
      </View>
      <BtnMini outline label={fichier ? 'Changer' : 'Choisir'} onPress={onChoisir} />
    </View>
  );
}

const s = StyleSheet.create({
  presentationTitre: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 6, marginTop: 12,
  },
  aiderTexte: { fontFamily: F.oswald6, fontSize: T.petit, color: C.accent2 },
  presentationAide: {
    fontFamily: F.inter, fontSize: T.petit, color: C.muted, lineHeight: 16, marginTop: 6,
  },
  demande: {
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.accent2,
    padding: 12, marginTop: 10, gap: 8,
  },
  demandeTitre: { fontFamily: F.oswald6, fontSize: T.corps, color: C.ink },
  demandeTexte: { fontFamily: F.inter, fontSize: T.courant, color: C.muted, lineHeight: 17 },
  demandeBtns: { flexDirection: 'row', gap: 8, justifyContent: 'flex-end' },

  pad: { paddingHorizontal: 16 },
  aide: { fontSize: T.petit, color: C.muted, fontFamily: F.inter, lineHeight: 16, marginTop: -4, marginBottom: 6 },

  /* Un bouton qui FLOTTE au-dessus du formulaire : il s'arrondit (règle des
     bords), et il fait 44 points de haut comme tout ce qu'on vise au doigt
     — c'est la mesure d'Apple, et un maçon en gants n'a pas un doigt de
     7 mm. L'orange de TEXTE, pas celui de remplissage : sur blanc, `accent`
     ne donne que 3,51 : 1 pour du texte, `accentTexte` 5,74. */
  /* La rangée « Mon entreprise » : la forme des réglages du compte, et
     44 points par sa boîte. */
  rangee: {
    flexDirection: 'row', alignItems: 'center', gap: S.md, minHeight: TOUCHE,
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.bordChamp,
    paddingVertical: S.sm, paddingHorizontal: S.md,
  },
  rangeeTexte: { flex: 1, minWidth: 0, fontFamily: F.inter5, fontSize: T.courant, color: C.ink },
  reprendre: {
    alignSelf: 'flex-start', justifyContent: 'center',
    minHeight: TOUCHE, borderRadius: R.gelule, borderWidth: 1,
    borderColor: C.accentTexte, paddingHorizontal: S.md,
    marginTop: 2, marginBottom: S.sm,
  },
  reprendreTexte: {
    fontFamily: F.inter6, fontSize: T.petit, color: C.accentTexte,
  },
  banniereBarre: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    gap: 10, paddingHorizontal: 16, paddingVertical: 10,
    backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.line,
  },
  banniereNote: { flex: 1, fontSize: T.petit, color: C.muted, fontFamily: F.inter },
  banniereBoutons: { flexDirection: 'row', gap: 6 },
  mediaBtnText: { fontFamily: F.oswald6, fontSize: T.petit, color: C.ink },
  mediaBtnTextOn: { fontFamily: F.oswald6, fontSize: T.petit, color: C.surAccent },

  avatarZone: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    paddingHorizontal: 16, paddingVertical: 16,
  },

  label: { fontFamily: F.oswald6, fontSize: T.courant, color: C.muted, marginTop: 12, marginBottom: 6 },

  sosBloc: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, padding: 12 },

  docBloc: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, padding: 12 },
  rgeLigne: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 10, borderTopWidth: 1, borderTopColor: C.line,
  },
  rgeBloc: { paddingBottom: 6 },
  docIntro: { fontSize: T.petit, color: C.muted, lineHeight: 16, marginBottom: 12, fontFamily: F.inter },
  docLigne: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 10, borderTopWidth: 1, borderTopColor: C.line,
  },
  docTitre: { fontFamily: F.inter6, fontSize: T.corps, color: C.ink },
  docDetail: { fontSize: T.petit, color: C.muted, marginTop: 2, fontFamily: F.inter },
  docChoisi: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  docChoisiTexte: { fontSize: T.petit, color: C.ok, flexShrink: 1, fontFamily: F.inter },
  suspension: {
    fontSize: T.petit, color: C.accentTexte, fontFamily: F.inter6,
    lineHeight: interligne(T.petit), marginTop: S.sm, marginBottom: S.sm,
  },

  statut: {
    flexDirection: 'row', gap: 8, alignItems: 'flex-start',
    backgroundColor: C.bg, borderLeftWidth: 3, padding: 10, marginBottom: 12,
  },
  statutTexte: { fontFamily: F.inter6, fontSize: T.courant },
  statutNote: { fontSize: T.petit, color: C.muted, marginTop: 3, lineHeight: 15, fontFamily: F.inter },

  btnText: { fontFamily: F.oswald6, fontSize: T.corps, color: '#fff' },
  sosLigne: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: S.sm },
  sosTarifs: { gap: S.xs, marginTop: S.sm },
  sosTarif: { fontFamily: F.inter6, fontSize: T.courant, color: C.ink },
  sosAEteindre: {
    fontFamily: F.inter, fontSize: T.petit, color: C.ink, lineHeight: interligne(T.petit),
    marginTop: S.sm, paddingLeft: S.sm, borderLeftWidth: S.xs, borderLeftColor: C.sos,
  },
  sosChamps: { marginTop: S.sm },
  rangeeSos: { marginTop: S.sm },
  sosTitre: { fontFamily: F.inter6, fontSize: T.corps, color: C.ink },
  sosDetail: { fontSize: T.courant, color: C.muted, marginTop: 3, lineHeight: 16, fontFamily: F.inter },

  avert: {
    flexDirection: 'row', gap: 8, marginTop: 14,
    backgroundColor: C.bg, borderLeftWidth: 3, borderLeftColor: C.sos, padding: 10,
  },
  avertText: { flex: 1, fontSize: T.petit, color: C.muted, lineHeight: 16, fontFamily: F.inter },
});

/**
 * Renseigner ses horaires — sept jours, sans y passer la matinée.
 *
 * CE QUE ÇA DOIT ÉVITER
 * ---------------------
 * Un formulaire de sept lignes × deux plages × deux heures, c'est
 * vingt-huit champs. Personne ne le remplit. Or des horaires à moitié
 * saisis sont pires que pas d'horaires : ils affichent « fermé » un jour
 * où l'artisan travaille.
 *
 * D'où l'ordre des choses ici :
 *   1. un bouton qui pose une semaine ORDINAIRE d'un coup — 8 h-12 h,
 *      14 h-18 h du lundi au vendredi, samedi matin. C'est le cas de la
 *      grande majorité, et il ne reste plus qu'à corriger ;
 *   2. chaque jour se ferme d'un interrupteur ;
 *   3. l'après-midi ne s'ajoute que si on en veut un : beaucoup de gens
 *      travaillent d'une traite.
 *
 * LES HEURES
 * ----------
 * Pas de sélecteur horaire natif : il impose un module en plus, donc un
 * development build, et le propriétaire teste dans Expo Go. Un champ
 * numérique à quatre chiffres avec mise en forme automatique — on tape
 * « 0800 », il devient « 08:00 » — fait le travail, et se corrige au
 * clavier sans viser une roulette.
 */
import React from 'react';
import { View, Text, Pressable, Switch, StyleSheet } from 'react-native';
import { C, F, T, S, R, interligne, viser } from '../theme';
import { Field, BtnMini } from './ui';
import { JOURS, minutes, heureTexte } from '../lib/horaires';

/** La semaine que font la plupart des artisans. */
export const SEMAINE_ORDINAIRE = {
  lun: [['08:00', '12:00'], ['14:00', '18:00']],
  mar: [['08:00', '12:00'], ['14:00', '18:00']],
  mer: [['08:00', '12:00'], ['14:00', '18:00']],
  jeu: [['08:00', '12:00'], ['14:00', '18:00']],
  ven: [['08:00', '12:00'], ['14:00', '18:00']],
  sam: [['09:00', '12:00']],
  dim: [],
};

/**
 * Pendant qu'on TAPE : on ne met les deux-points qu'au quatrième chiffre.
 *
 * LE DÉFAUT QUE CECI CORRIGE
 * --------------------------
 * La première version mettait en forme dès le troisième chiffre, en
 * supposant « H:MM ». Or trois chiffres sont ambigus tant que la frappe
 * n'est pas finie : quelqu'un qui tape « 0730 » passe forcément par
 * « 073 », et il obtenait « 00:73 » — une heure impossible, à la place de
 * la sienne. Vérifié au navigateur, touche par touche.
 *
 * On attend donc le quatrième chiffre. Et pour celui qui s'arrête à trois
 * (« 830 » pour 8 h 30), `completerSaisie` rattrape au moment où il quitte
 * le champ : là, la frappe est finie, il n'y a plus d'ambiguïté.
 */
function normaliserSaisie(texte) {
  const chiffres = String(texte || '').replace(/\D/g, '').slice(0, 4);
  if (chiffres.length < 4) return chiffres;
  return `${chiffres.slice(0, 2)}:${chiffres.slice(2)}`;
}

/** Quand on quitte le champ : « 830 » → « 08:30 », « 8 » → « 08:00 ». */
function completerSaisie(texte) {
  const chiffres = String(texte || '').replace(/\D/g, '');
  if (!chiffres) return '';
  if (chiffres.length === 4) return `${chiffres.slice(0, 2)}:${chiffres.slice(2)}`;
  if (chiffres.length === 3) return `0${chiffres[0]}:${chiffres.slice(1)}`;
  if (chiffres.length === 2) return `${chiffres}:00`;
  return `0${chiffres}:00`;
}

function ChampHeure({ valeur, onChange, etiquette }) {
  const juste = minutes(valeur) !== null;
  return (
    <Field
      value={valeur}
      onChangeText={(t) => onChange(normaliserSaisie(t))}
      onBlur={() => onChange(completerSaisie(valeur))}
      placeholder="08:00"
      keyboardType="number-pad"
      maxLength={5}
      accessibilityLabel={etiquette}
      /* Bord rouge dès que l'heure n'existe pas : on le voit avant
         d'enregistrer, au lieu de se faire refuser par la base. */
      style={[s.heure, !juste && !!valeur && s.heureFausse]}
    />
  );
}

export default function ChampHoraires({ valeur, onChange }) {
  const horaires = valeur && typeof valeur === 'object' ? valeur : {};

  const plagesDuJour = (cle) => (Array.isArray(horaires[cle]) ? horaires[cle] : []);
  const poser = (cle, plages) => onChange({ ...horaires, [cle]: plages });

  const basculerJour = (cle, ouvert) => {
    poser(cle, ouvert ? [['08:00', '18:00']] : []);
  };

  const changerHeure = (cle, iPlage, iBorne, texte) => {
    const plages = plagesDuJour(cle).map((p) => [...p]);
    if (!plages[iPlage]) return;
    plages[iPlage][iBorne] = texte;
    poser(cle, plages);
  };

  return (
    <View>
      <View style={s.entete}>
        <Text style={s.aide}>
          Une semaine ordinaire d'abord, puis vous corrigez ce qui diffère.
        </Text>
        <BtnMini
          outline
          label="Semaine type"
          onPress={() => onChange({ ...SEMAINE_ORDINAIRE })}
          accessibilityLabel="Remplir une semaine ordinaire : 8 h-12 h et 14 h-18 h du lundi au vendredi, samedi matin"
        />
      </View>

      {JOURS.map(({ cle, nom }) => {
        const plages = plagesDuJour(cle);
        const ouvert = plages.length > 0;
        return (
          <View key={cle} style={s.jour}>
            <View style={s.ligneJour}>
              <Text style={[s.nomJour, !ouvert && s.nomJourFerme]}>{nom}</Text>
              <Text style={s.etat}>{ouvert ? '' : 'Fermé'}</Text>
              <Switch
                value={ouvert}
                onValueChange={(v) => basculerJour(cle, v)}
                trackColor={{ false: C.line, true: C.ok }}
                thumbColor="#fff"
                accessibilityLabel={`${nom} : ${ouvert ? 'ouvert' : 'fermé'}`}
              />
            </View>

            {ouvert && plages.map((plage, i) => (
              <View key={i} style={s.lignePlage}>
                <ChampHeure
                  valeur={plage[0]}
                  onChange={(t) => changerHeure(cle, i, 0, t)}
                  etiquette={`${nom}, ouverture ${i === 0 ? 'du matin' : "de l'après-midi"}`}
                />
                <Text style={s.tiret}>–</Text>
                <ChampHeure
                  valeur={plage[1]}
                  onChange={(t) => changerHeure(cle, i, 1, t)}
                  etiquette={`${nom}, fermeture ${i === 0 ? 'du matin' : "de l'après-midi"}`}
                />
                {plages.length > 1 && (
                  <Pressable
                    onPress={() => poser(cle, plages.filter((_, k) => k !== i))}
                    hitSlop={viser(24)}
                    accessibilityRole="button"
                    accessibilityLabel={`${nom} : retirer cette plage`}
                  >
                    <Text style={s.retirer}>Retirer</Text>
                  </Pressable>
                )}
              </View>
            ))}

            {/* La coupure de midi ne s'ajoute que si on en veut une :
                beaucoup d'artisans travaillent d'une traite. */}
            {ouvert && plages.length === 1 && (
              <Pressable
                onPress={() => poser(cle, [...plages, ['14:00', '18:00']])}
                hitSlop={viser(24)}
                accessibilityRole="button"
                accessibilityLabel={`${nom} : ajouter une coupure de midi`}
              >
                <Text style={s.ajouter}>+ coupure de midi</Text>
              </Pressable>
            )}
          </View>
        );
      })}

      <Text style={s.note}>
        Laissé vide, rien ne s'affiche sur votre fiche — ce n'est pas la même
        chose que « fermé ».
      </Text>
    </View>
  );
}

export { normaliserSaisie, completerSaisie, heureTexte };

const s = StyleSheet.create({
  entete: {
    flexDirection: 'row', alignItems: 'center', gap: S.md,
    paddingBottom: S.md, borderBottomWidth: 1, borderBottomColor: C.line,
  },
  aide: {
    flex: 1, fontFamily: F.inter, fontSize: T.petit, color: C.muted,
    lineHeight: interligne(T.petit),
  },

  /* Angle vif : chaque jour est une ligne de tableau, donc de la structure. */
  jour: { paddingVertical: S.sm, borderBottomWidth: 1, borderBottomColor: C.line },
  ligneJour: { flexDirection: 'row', alignItems: 'center', gap: S.sm },
  nomJour: { flex: 1, fontFamily: F.inter6, fontSize: T.corps, color: C.ink },
  nomJourFerme: { color: C.muted },
  etat: { fontFamily: F.inter, fontSize: T.petit, color: C.muted },

  lignePlage: { flexDirection: 'row', alignItems: 'center', gap: S.sm, marginTop: S.sm },
  heure: { width: 78, textAlign: 'center', paddingVertical: 8 },
  heureFausse: { borderColor: C.bad },
  tiret: { fontFamily: F.inter, fontSize: T.corps, color: C.muted },
  retirer: { fontFamily: F.oswald6, fontSize: T.petit, color: C.muted },
  ajouter: {
    fontFamily: F.oswald6, fontSize: T.petit, color: C.accent2, marginTop: S.sm,
  },

  note: {
    fontFamily: F.inter, fontSize: T.petit, color: C.muted,
    lineHeight: interligne(T.petit), marginTop: S.md,
  },
});

/**
 * « C'est ouvert, là ? » — la seule question qui compte.
 *
 * POURQUOI CE SCRIPT EXISTE
 * -------------------------
 * Le calcul se fait sur l'heure courante. Sans paramètre de date, on ne
 * pourrait le vérifier qu'à l'heure où l'on passe le test — c'est-à-dire
 * presque jamais aux moments intéressants : la coupure de midi, le samedi
 * soir, le dimanche.
 *
 * Trois pièges y sont piégés :
 *
 * 1. `Date.getDay()` met le DIMANCHE à zéro. Une semaine qui commence le
 *    lundi doit donc décaler, et c'est l'erreur qu'on ne voit qu'un jour
 *    sur sept.
 * 2. La coupure de midi : à 12 h 30, il faut dire « rouvre à 14 h », pas
 *    « ouvre demain ». Sinon on perd un appel.
 * 3. Le samedi soir après la fermeture : le prochain jour ouvert peut être
 *    dans deux jours, ou dans six.
 *
 * node scripts/verifier-horaires.mjs
 */
import {
  etatMaintenant, semaineGroupee, heureTexte, minutes, horairesRenseignes,
} from '../src/lib/horaires.js';

let echecs = 0;
const verifier = (nom, ok, detail = '') => {
  if (ok) { console.log(`  ✔ ${nom}`); return; }
  echecs += 1;
  console.error(`  ✘ ${nom}${detail ? `\n      ${detail}` : ''}`);
};

/** Un mardi 30 septembre 2026, à l'heure qu'on veut. */
const mardi = (h, min = 0) => new Date(2026, 8, 29, h, min);
/** Un samedi. */
const samedi = (h, min = 0) => new Date(2026, 9, 3, h, min);
/** Un dimanche — le jour que `getDay()` met à zéro. */
const dimanche = (h, min = 0) => new Date(2026, 9, 4, h, min);

const SEMAINE = {
  lun: [['08:00', '12:00'], ['14:00', '18:00']],
  mar: [['08:00', '12:00'], ['14:00', '18:00']],
  mer: [['08:00', '12:00'], ['14:00', '18:00']],
  jeu: [['08:00', '12:00'], ['14:00', '18:00']],
  ven: [['08:00', '12:00'], ['14:00', '17:00']],
  sam: [['09:00', '12:00']],
  dim: [],
};

console.log('\nLe bon jour — le piège du dimanche à zéro');
{
  verifier('mardi 10 h → ouvert',
    etatMaintenant(SEMAINE, mardi(10)).ouvert === true);
  verifier('samedi 10 h → ouvert (une seule plage ce jour-là)',
    etatMaintenant(SEMAINE, samedi(10)).ouvert === true);
  verifier('dimanche 10 h → fermé',
    etatMaintenant(SEMAINE, dimanche(10)).ouvert === false);
  verifier('dimanche renvoie bien au LUNDI, pas au mardi',
    etatMaintenant(SEMAINE, dimanche(10)).texte === 'Fermé · ouvre demain à 8 h',
    etatMaintenant(SEMAINE, dimanche(10)).texte);
}

console.log('\nLa coupure de midi');
{
  const e = etatMaintenant(SEMAINE, mardi(12, 30));
  verifier('mardi 12 h 30 → fermé', e.ouvert === false);
  verifier('… et il ROUVRE à 14 h, il n’ouvre pas demain',
    e.texte === 'Fermé · rouvre à 14 h', e.texte);
  verifier('mardi 14 h pile → ouvert',
    etatMaintenant(SEMAINE, mardi(14)).ouvert === true);
  verifier('mardi 12 h pile → fermé (la fin est exclue)',
    etatMaintenant(SEMAINE, mardi(12)).ouvert === false);
}

console.log('\nL’heure de fermeture est celle de la plage en cours');
{
  verifier('le matin, il ferme à 12 h',
    etatMaintenant(SEMAINE, mardi(9)).texte === 'Ouvert · ferme à 12 h',
    etatMaintenant(SEMAINE, mardi(9)).texte);
  verifier('l’après-midi, il ferme à 18 h',
    etatMaintenant(SEMAINE, mardi(16)).texte === 'Ouvert · ferme à 18 h',
    etatMaintenant(SEMAINE, mardi(16)).texte);
}

console.log('\nAprès la fermeture, et le samedi soir');
{
  verifier('mardi 19 h → ouvre demain à 8 h',
    etatMaintenant(SEMAINE, mardi(19)).texte === 'Fermé · ouvre demain à 8 h',
    etatMaintenant(SEMAINE, mardi(19)).texte);
  verifier('samedi 19 h → saute le dimanche, ouvre LUNDI',
    etatMaintenant(SEMAINE, samedi(19)).texte === 'Fermé · ouvre lundi à 8 h',
    etatMaintenant(SEMAINE, samedi(19)).texte);
  verifier('samedi 8 h → ouvre à 9 h le jour même',
    etatMaintenant(SEMAINE, samedi(8)).texte === 'Fermé · rouvre à 9 h',
    etatMaintenant(SEMAINE, samedi(8)).texte);
}

console.log('\nCe qui n’est pas renseigné ne s’affiche pas');
{
  verifier('null → rien', etatMaintenant(null, mardi(10)) === null);
  verifier('objet vide → rien', etatMaintenant({}, mardi(10)) === null);
  verifier('undefined → rien', etatMaintenant(undefined, mardi(10)) === null);
  verifier('« non renseigné » n’est PAS « fermé »',
    horairesRenseignes({}) === false && horairesRenseignes({ dim: [] }) === true);
  verifier('tout fermé → « Fermé », sans promesse de réouverture',
    etatMaintenant({ lun: [], mar: [], mer: [], jeu: [], ven: [], sam: [], dim: [] },
      mardi(10)).texte === 'Fermé');
}

console.log('\nL’heure écrite à la française');
{
  verifier('08:00 → « 8 h »', heureTexte('08:00') === '8 h');
  verifier('14:30 → « 14 h 30 »', heureTexte('14:30') === '14 h 30');
  verifier('00:00 → « 0 h »', heureTexte('00:00') === '0 h');
  verifier('pas de « 8h00 » collé', !heureTexte('08:00').includes('h0'));
  verifier('une heure absurde ne rend rien', heureTexte('25:00') === '');
  verifier('minutes(« 08:30 ») = 510', minutes('08:30') === 510);
  verifier('minutes d’une heure absurde = null', minutes('25:00') === null);
}

console.log('\nLa semaine regroupée — « Lundi au jeudi », pas quatre lignes');
{
  const lignes = semaineGroupee(SEMAINE);
  verifier('quatre lignes au lieu de sept', lignes.length === 4,
    JSON.stringify(lignes.map((l) => l.jours)));
  verifier('les quatre premiers jours sont groupés',
    lignes[0].jours === 'Lundi au jeudi', lignes[0].jours);
  verifier('le vendredi est à part (il ferme à 17 h)',
    lignes[1].jours === 'Vendredi' && lignes[1].texte.includes('17 h'));
  verifier('le dimanche dit « Fermé »',
    lignes[3].jours === 'Dimanche' && lignes[3].texte === 'Fermé');
  verifier('les deux plages sont écrites',
    lignes[0].texte === '8 h - 12 h, 14 h - 18 h', lignes[0].texte);
}

console.log('\nLa frappe — le piège des trois chiffres');
{
  /* On ne peut pas importer le composant (il tire React Native), donc on
     rejoue ici EXACTEMENT les deux fonctions. Si elles changent là-bas
     sans changer ici, ce contrôle ne sert plus à rien — c'est le prix
     d'un test qui ne monte pas d'écran. */
  const enTapant = (t) => {
    const c = String(t || '').replace(/\D/g, '').slice(0, 4);
    return c.length < 4 ? c : `${c.slice(0, 2)}:${c.slice(2)}`;
  };
  const enQuittant = (t) => {
    const c = String(t || '').replace(/\D/g, '');
    if (!c) return '';
    if (c.length === 4) return `${c.slice(0, 2)}:${c.slice(2)}`;
    if (c.length === 3) return `0${c[0]}:${c.slice(1)}`;
    if (c.length === 2) return `${c}:00`;
    return `0${c}:00`;
  };

  /* Taper « 0730 » passe forcément par « 073 ». La première version en
     faisait « 00:73 » — une heure impossible, à la place de la sienne. */
  const etapes = ['0', '07', '073', '0730'].map(enTapant);
  verifier('taper 0730 ne fabrique jamais d’heure absurde',
    etapes.every((e) => e === '' || minutes(e) !== null || !e.includes(':')),
    etapes.join(' → '));
  verifier('… et donne 07:30 au bout', etapes[3] === '07:30', etapes[3]);
  verifier('on ne met les deux-points qu’au 4e chiffre',
    enTapant('073') === '073', enTapant('073'));

  verifier('en quittant, « 830 » devient 08:30', enQuittant('830') === '08:30');
  verifier('en quittant, « 8 » devient 08:00', enQuittant('8') === '08:00');
  verifier('en quittant, « 14 » devient 14:00', enQuittant('14') === '14:00');
  verifier('en quittant, un champ vide reste vide', enQuittant('') === '');
}

console.log('');
if (echecs) {
  console.error(`✘ ${echecs} vérification(s) en échec.\n`);
  process.exit(1);
}
console.log('✔ On sait si c’est ouvert.\n');

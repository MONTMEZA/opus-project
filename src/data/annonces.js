/**
 * La Place des pros : les types d'annonces, et comment on les nomme.
 *
 * Un seul fichier pour les libellés, les couleurs et les règles d'affichage.
 * Les mêmes valeurs sont contrôlées par la base (`annonces_pro_type_check`
 * dans supabase/schema.sql) : `npm run verifier-annonces` compare les deux,
 * parce qu'une liste qui diverge de sa contrainte a déjà coûté plusieurs
 * jours sur ce projet.
 */
import { C } from '../theme';

export const TYPES_ANNONCE = [
  {
    cle: 'sous_traitance_cherche',
    label: 'Je cherche',
    long: 'Sous-traitance — je cherche',
    couleur: C.accent,
    avecMetier: true,
    avecDates: true,
    avecPrix: false,
    aide: "Un chantier à confier. Les dates comptent plus que tout : c'est ce qui permet à un artisan disponible de vous trouver.",
  },
  {
    cle: 'sous_traitance_offre',
    label: 'Je suis dispo',
    long: 'Sous-traitance — je suis disponible',
    couleur: C.accent2,
    avecMetier: true,
    avecDates: true,
    avecPrix: false,
    aide: 'Un creux dans votre planning. Dites sur quelle période et pour quel travail.',
  },
  {
    cle: 'materiel_vente',
    label: 'À vendre',
    long: 'Matériel à vendre',
    couleur: '#5B7A3A',
    avecMetier: false,
    avecDates: false,
    avecPrix: true,
    aide: "Le surplus de chantier. Ce qui part aujourd'hui à la benne ou sur Leboncoin.",
  },
  {
    cle: 'materiel_location',
    label: 'À louer',
    long: 'Matériel à louer',
    couleur: '#7A5B3A',
    avecMetier: false,
    avecDates: false,
    avecPrix: true,
    avecUnite: true,
    aide: 'Nacelle, échafaudage, bétonnière. Précisez si le prix est par jour, par semaine ou par mois.',
  },
  {
    cle: 'entraide',
    label: 'Coup de main',
    long: 'Entraide',
    couleur: '#6B4B7A',
    avecMetier: false,
    avecDates: true,
    avecPrix: false,
    aide: "Une heure à deux pour monter une poutre, une adresse de fournisseur. Ce qui ne vaut pas un devis mais qui dépanne.",
  },
];

export const UNITES = [
  { cle: 'total', label: 'au total' },
  { cle: 'jour', label: 'par jour' },
  { cle: 'semaine', label: 'par semaine' },
  { cle: 'mois', label: 'par mois' },
];

export function typeAnnonce(cle) {
  return TYPES_ANNONCE.find((t) => t.cle === cle) || TYPES_ANNONCE[0];
}

/* ------------------------------------------------------------------ */
/*  Côté particulier : le budget et l'urgence                          */
/* ------------------------------------------------------------------ */

/**
 * Une fourchette, jamais un prix. Sans budget, l'artisan se déplace pour un
 * chantier hors de portée et le particulier reçoit des devis qui le sidèrent.
 * « À chiffrer » existe parce que beaucoup de gens n'en ont sincèrement
 * aucune idée — et les forcer à choisir produirait des chiffres faux.
 */
export const BUDGETS = [
  { cle: 'moins_500', label: 'Moins de 500 €' },
  { cle: '500_2000', label: '500 à 2 000 €' },
  { cle: '2000_5000', label: '2 000 à 5 000 €' },
  { cle: '5000_15000', label: '5 000 à 15 000 €' },
  { cle: 'plus_15000', label: 'Plus de 15 000 €' },
  { cle: 'a_chiffrer', label: 'Je ne sais pas' },
];

export const URGENCES = [
  { cle: 'quand_possible', label: 'Pas pressé', couleur: C.muted },
  { cle: 'ce_mois', label: 'Ce mois-ci', couleur: C.accent2 },
  { cle: 'urgent', label: 'Urgent', couleur: C.accent },
];

export function libelleBudget(cle) {
  const b = BUDGETS.find((x) => x.cle === cle);
  return b ? b.label : null;
}

export function urgenceDe(cle) {
  return URGENCES.find((u) => u.cle === cle) || URGENCES[0];
}

/* La mise en forme (dates, prix) vit dans src/lib/formats.js : ce fichier-ci
   importe le thème, donc React Native, et ne se testerait pas avec node. */
export { libelleDates, libellePrix } from '../lib/formats';

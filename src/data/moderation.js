/**
 * Signaler et bloquer : les motifs, les cibles, et ce qu'on promet.
 *
 * POURQUOI C'EST OBLIGATOIRE
 * --------------------------
 * Apple et Google refusent toute application où les utilisateurs publient
 * du contenu si elle n'offre pas, au minimum : un moyen de SIGNALER un
 * contenu, un moyen de BLOQUER une personne, et un délai d'examen annoncé
 * et tenu. Ce n'est pas une recommandation, c'est un motif de refus.
 *
 * POURQUOI LES MOTIFS COMPTENT
 * ----------------------------
 * Un signalement sans motif est inexploitable : celui qui modère ne sait
 * pas quoi regarder, et tout finit dans la même pile. Une liste courte,
 * écrite dans les mots du métier, se choisit en trois secondes sur un
 * chantier.
 *
 * D'où deux motifs qu'on ne trouve nulle part ailleurs, et qui sont les
 * vrais problèmes de ce milieu :
 *   - le TRAVAIL DISSIMULÉ : pas d'assurance, pas de facture, pas de
 *     numéro SIRET. C'est ce qui ruine la réputation des artisans sérieux ;
 *   - la CONTREFAÇON : des photos de chantier prises chez un confrère et
 *     présentées comme les siennes. Sur un réseau où la photo EST la
 *     preuve du travail, c'est du vol pur et simple.
 *
 * Ces valeurs sont contrôlées par la base (`signalements_motif_check` dans
 * supabase/schema.sql). `npm run verifier-moderation` compare les deux :
 * une liste qui diverge de sa contrainte fait refuser l'enregistrement sans
 * que rien ne le montre en mode démo.
 */

export const MOTIFS = [
  {
    cle: 'travail_dissimule',
    label: 'Travail dissimulé',
    aide: "Pas d'assurance, pas de facture, pas de SIRET. Dites ce qui vous le fait penser.",
  },
  {
    cle: 'contrefacon',
    label: 'Photos volées',
    aide: "Ces photos de chantier sont celles de quelqu'un d'autre. Si vous savez de qui, dites-le.",
  },
  {
    cle: 'arnaque',
    label: 'Arnaque',
    aide: 'Acompte demandé puis disparition, faux devis, fausse entreprise.',
  },
  {
    cle: 'faux_profil',
    label: 'Faux profil',
    aide: "Se fait passer pour une entreprise ou une personne qui n'est pas lui.",
  },
  {
    cle: 'spam',
    label: 'Spam',
    aide: 'Publicité répétée, contenu sans rapport avec le bâtiment.',
  },
  {
    cle: 'haine',
    label: 'Injures ou harcèlement',
    aide: 'Insultes, propos racistes, acharnement sur quelqu’un.',
  },
  {
    cle: 'violence',
    label: 'Menaces',
    aide: 'Intimidation, menaces physiques.',
  },
  {
    cle: 'nudite',
    label: 'Contenu sexuel',
    aide: "Rien de tout cela n'a sa place ici.",
  },
  {
    cle: 'autre',
    label: 'Autre',
    aide: 'Expliquez en quelques mots : c’est ce texte qui sera lu en premier.',
  },
];

/** Les types de contenu qu'on peut signaler. Contrôlés eux aussi par la base. */
export const CIBLES = [
  { cle: 'publication', label: 'cette publication' },
  { cle: 'commentaire', label: 'ce commentaire' },
  { cle: 'message',     label: 'ce message' },
  { cle: 'profil',      label: 'ce profil' },
  { cle: 'demande',     label: 'cette demande' },
  { cle: 'annonce',     label: 'cette annonce' },
];

/**
 * Le délai d'examen ANNONCÉ.
 *
 * Il est écrit ici parce qu'il apparaît à l'écran, et qu'un délai promis
 * doit être tenu : c'est ce que contrôlent les magasins d'applications. 48
 * heures est le maximum courant ; en annoncer moins sans pouvoir le tenir
 * serait pire que ne rien annoncer.
 */
export const DELAI_EXAMEN_HEURES = 48;

export function motifDe(cle) {
  return MOTIFS.find((m) => m.cle === cle) || MOTIFS[MOTIFS.length - 1];
}

export function cibleDe(cle) {
  return CIBLES.find((c) => c.cle === cle) || CIBLES[0];
}

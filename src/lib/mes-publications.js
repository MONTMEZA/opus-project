/**
 * « MES PUBLICATIONS » — l'état de la liste, page après page (lot S-c,
 * 30/10/2026).
 *
 * La liste se lit dans la base. Ce qui ne doit JAMAIS arriver, et que la
 * relecture du 30/10 a remis à la main au vert : un échec de lecture qui
 * vide la liste et la dit « prête » — l'écran annoncerait alors « Vous
 * n'avez encore rien publié » à quelqu'un dont les publications n'ont
 * simplement pas pu être lues.
 *
 * Ce fichier n'importe rien : `verifier-remontee` le FAIT TOURNER.
 */

/** Une page reçue : ajoutée à la suite (sans doublon), ou à la place. */
export function apresPage(m, { page, fin, suite }) {
  const deja = suite ? (m.liste || []) : [];
  const vus = new Set(deja.map((p) => String(p.id)));
  return {
    ...m,
    liste: [...deja, ...(page || []).filter((p) => !vus.has(String(p.id)))],
    fin: !!fin,
    etat: 'pret',
  };
}

/** Un échec : la liste déjà lue RESTE, et l'état dit lequel — le début ou
 *  la suite. */
export function apresEchec(m, suite) {
  return { ...m, etat: 'echec', echecDe: suite ? 'suite' : 'debut' };
}

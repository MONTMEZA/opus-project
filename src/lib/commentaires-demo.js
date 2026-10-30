/**
 * LES COMMENTAIRES DE LA DÉMONSTRATION, tels qu'ils sont EN SÉANCE (lot S-c,
 * relecture du 30/10/2026).
 *
 * `addComment` valait `noop` sans fichier `.env` : un commentaire écrit dans
 * le fil était absent de « Mes publications » et de la page qu'on ouvre de
 * là, qui relisent la démonstration — le fil disait 4, la page 3. La
 * mémoire (`{ ajouts, retires, textes }`) vit dans `api.js` ; ce qui en
 * fait l'arbre affiché vit ici, dans un fichier qui n'importe rien, pour
 * que `verifier-demo` le FASSE TOURNER.
 */

/** Une mémoire vide : ce qui a été écrit, retiré et corrigé en séance. */
export function memoireCommentaires() {
  return { ajouts: [], retires: new Set(), textes: new Map() };
}

/**
 * L'arbre des commentaires d'une publication : ceux du fichier, plus ceux
 * de la séance (une réponse sous sa racine), moins ceux qu'on a retirés,
 * avec leur texte corrigé.
 */
export function commentairesEnSeance(p, m) {
  const cle = String(p.id);
  const copie = (c) => ({ ...c, reponses: (c.reponses || []).map((r) => ({ ...r })) });
  const racines = (p.comments || []).map(copie);
  m.ajouts.filter((a) => a.postId === cle).forEach((a) => {
    if (a.parentId == null) { racines.push(copie(a.commentaire)); return; }
    const parent = racines.find((c) => String(c.id) === String(a.parentId));
    if (parent) parent.reponses.push({ ...a.commentaire });
  });
  const corrige = (c) => (m.textes.has(String(c.id))
    ? { ...c, texte: m.textes.get(String(c.id)), modifie: true }
    : c);
  return racines
    .filter((c) => !m.retires.has(String(c.id)))
    .map((c) => ({
      ...corrige(c),
      reponses: c.reponses.filter((r) => !m.retires.has(String(r.id))).map(corrige),
    }));
}

/** Retenir un commentaire écrit en séance — l'objet que l'écran affiche. */
export function retenirCommentaire(m, { postId, texte, parentId = null, local = null }) {
  m.ajouts.push({
    postId: String(postId),
    parentId: parentId == null ? null : parentId,
    commentaire: local || {
      id: `demo-com-${m.ajouts.length + 1}`, texte, time: "À l'instant", reponses: [],
    },
  });
}

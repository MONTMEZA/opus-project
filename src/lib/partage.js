/**
 * Partage d'une publication vers les autres applications du téléphone.
 *
 * `Share` fait partie de React Native : il ouvre la feuille de partage du
 * système — messages, WhatsApp, courriel, presse-papiers. C'est ce que veut
 * dire « partager en privé » : l'utilisateur choisit lui-même à qui, dans
 * l'application qu'il utilise déjà.
 *
 * Sur le web, cette feuille n'existe pas : on copie alors le lien.
 */
import { Platform, Share } from 'react-native';

/** Ce qu'on envoie : une phrase, et l'adresse du média. */
function messageDe(post, pro) {
  const auteur = pro && pro.entreprise ? pro.entreprise : 'Un professionnel';
  const texte = (post.texte || '').trim();
  const debut = texte ? `« ${texte} »` : 'une réalisation';
  return `${auteur} sur Opus-Project : ${debut}`;
}

/** L'adresse partageable : le montage assemblé si on en a un, sinon le média. */
export function lienDe(post) {
  return post.montageUrl || post.media || null;
}

/**
 * Ouvre la feuille de partage. Renvoie un message à afficher, ou null quand
 * l'utilisateur a simplement refermé sans choisir.
 */
export async function partagerPost(post, pro) {
  const lien = lienDe(post);
  const message = messageDe(post, pro);

  if (Platform.OS === 'web') {
    if (navigator.share) {
      try {
        await navigator.share({ text: message, url: lien || undefined });
        return null;
      } catch (e) { /* refusé ou non pris en charge : on copie */ }
    }
    if (lien && navigator.clipboard) {
      await navigator.clipboard.writeText(lien);
      return 'Lien copié.';
    }
    return 'Le partage n\'est pas disponible ici.';
  }

  const resultat = await Share.share(
    lien ? { message: `${message}\n${lien}`, url: lien } : { message },
  );
  return resultat.action === Share.sharedAction ? 'Publication partagée.' : null;
}

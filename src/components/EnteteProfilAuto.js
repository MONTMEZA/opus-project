/**
 * Choisit l'en-tête de profil selon le style retenu dans src/theme.js.
 *
 * À défaut de bannière envoyée par le professionnel, on prend sa première
 * réalisation : son meilleur chantier devient sa vitrine, sans qu'il ait
 * la moindre image à préparer.
 */
import React from 'react';
import { STYLE_ENTETE } from '../theme';
import EnteteProfil from './EnteteProfil';
import EnteteProfilImmersif from './EnteteProfilImmersif';

export default function EnteteProfilAuto({
  seed, bannerUrl, avatarUrl, portfolio, titre, sousTitre, verifie,
}) {
  const banniere = bannerUrl || (portfolio && portfolio[0]) || null;

  if (STYLE_ENTETE === 'immersif') {
    return (
      <EnteteProfilImmersif
        seed={seed}
        bannerUrl={banniere}
        avatarUrl={avatarUrl}
        titre={titre}
        sousTitre={sousTitre}
        verifie={verifie}
      />
    );
  }

  return <EnteteProfil seed={seed} bannerUrl={banniere} avatarUrl={avatarUrl} />;
}

/** Vrai quand le nom est déjà affiché dans l'en-tête, et ne doit pas être répété. */
export const NOM_DANS_ENTETE = STYLE_ENTETE === 'immersif';

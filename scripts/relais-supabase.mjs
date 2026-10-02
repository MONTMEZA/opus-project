/**
 * FAIRE PARLER LE NAVIGATEUR D'ESSAI À LA VRAIE BASE.
 *
 * LE PROBLÈME
 * -----------
 * Le conteneur où je travaille n'a aucun accès direct à Internet : tout
 * passe par un mandataire qui n'accepte que des tunnels HTTPS. `curl` sait
 * s'en servir ; le navigateur, non — et on ne peut pas le lancer AVEC le
 * mandataire, parce qu'il perd alors le serveur Expo en local (son option
 * de contournement pour `localhost` est ignorée).
 *
 * Conséquence, jusqu'au 01/10/2026 : je ne pouvais essayer l'application
 * qu'en MODE DÉMO, avec des données en mémoire. Je ne voyais donc jamais
 * ce que le propriétaire voit — ni un vrai compte, ni une vraie fiche, ni
 * un enregistrement réellement refusé par la base.
 *
 * LA SOLUTION
 * -----------
 * Playwright sait intercepter une requête avant qu'elle parte
 * (`page.route`). On attrape donc TOUT ce qui va vers Supabase, on le
 * rejoue avec `curl` — qui, lui, a le droit de sortir —, et on rend la
 * réponse au navigateur. Il ne voit aucune différence.
 *
 * CE QUE ÇA NE COUVRE PAS, ET IL FAUT LE SAVOIR
 * ---------------------------------------------
 * Le **temps réel** (la messagerie instantanée) passe par un WebSocket,
 * qui ne s'intercepte pas de cette façon. Les messages s'envoient et se
 * lisent au rechargement, mais ils n'arrivent pas tout seuls. Tout le
 * reste — comptes, profils, fil, commentaires, demandes, envoi de
 * fichiers — passe par là.
 *
 * ET LA PRUDENCE QUI VA AVEC
 * --------------------------
 * C'est la VRAIE base. Tout compte créé ici existe pour de bon, toute
 * publication est visible du propriétaire. D'où `prefixeEssai` : les
 * comptes d'essai portent une adresse reconnaissable, et le script qui
 * s'en sert doit les supprimer à la fin. On ne laisse rien derrière.
 */
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { writeFileSync, unlinkSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const execFileP = promisify(execFile);

/** Les en-têtes qu'on ne recopie pas : curl les refait lui-même. */
const A_IGNORER = new Set([
  'host', 'content-length', 'accept-encoding', 'connection',
  'origin', 'referer', 'sec-fetch-mode', 'sec-fetch-site', 'sec-fetch-dest',
]);

/* Le navigateur refuse une réponse venue d'un autre domaine si elle ne
   l'autorise pas explicitement. Comme c'est nous qui fabriquons la
   réponse, c'est à nous de le dire. */
const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': '*',
  'access-control-allow-methods': 'GET, POST, PATCH, PUT, DELETE, OPTIONS',
  'access-control-expose-headers': '*',
};

/**
 * Pose le relais sur une page Playwright.
 *
 * `onAppel` reçoit `{ methode, chemin, statut }` à chaque passage : de quoi
 * voir ce que l'application demande vraiment, ce qui est précieux quand un
 * écran ne montre rien et qu'on ne sait pas si c'est lui ou la base.
 */
export async function poserRelais(page, { hote, onAppel, essais = 3 } = {}) {
  const dossier = mkdtempSync(join(tmpdir(), 'relais-'));

  await page.route(`**${hote}**`, async (route) => {
    const requete = route.request();
    const url = requete.url();
    const methode = requete.method();

    /* Le navigateur demande d'abord « ai-je le droit ? ». On répond oui
       sans déranger Supabase : c'est une question qu'il nous pose à nous. */
    if (methode === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: CORS, body: '' });
      return;
    }

    const enTetes = requete.headers();
    const args = ['-s', '-i', '--max-time', '40', '-X', methode, url];
    Object.entries(enTetes).forEach(([k, v]) => {
      if (!A_IGNORER.has(k.toLowerCase())) args.push('-H', `${k}: ${v}`);
    });

    const corps = requete.postDataBuffer();
    let fichierCorps = null;
    if (corps && corps.length) {
      fichierCorps = join(dossier, `corps-${Date.now()}-${Math.random()}`);
      writeFileSync(fichierCorps, corps);
      args.push('--data-binary', `@${fichierCorps}`);
    }

    for (let essai = 1; essai <= essais; essai += 1) {
      try {
        const { stdout } = await execFileP('curl', args, {
          encoding: 'buffer', maxBuffer: 64 * 1024 * 1024,
        });
        const { statut, entetes, corpsReponse } = decouper(stdout);
        if (onAppel) onAppel({ methode, chemin: cheminDe(url), statut });
        await route.fulfill({
          status: statut,
          headers: { ...entetes, ...CORS },
          body: corpsReponse,
        });
        if (fichierCorps) unlinkSync(fichierCorps);
        return;
      } catch (e) {
        /* Le mandataire coupe environ une connexion sur cinq : on retente
           avant d'abandonner. Vérifié le 30/09 sur les tuiles de l'IGN. */
        if (essai === essais) {
          if (onAppel) onAppel({ methode, chemin: cheminDe(url), statut: 'échec' });
          await route.abort();
          if (fichierCorps) unlinkSync(fichierCorps);
          return;
        }
      }
    }
  });
}

function cheminDe(url) {
  try { return new URL(url).pathname; } catch (e) { return url; }
}

/**
 * `curl -i` colle les en-têtes devant le corps. On coupe à la première
 * ligne vide — en travaillant sur des OCTETS, pas sur du texte : une image
 * ou un PDF ne survivrait pas à une conversion en chaîne.
 *
 * LE PIÈGE, ET IL M'A EU
 * ----------------------
 * Il n'y a pas UN bloc d'en-têtes, mais souvent plusieurs à la suite :
 * le mandataire répond d'abord « HTTP/1.1 200 Connection established »
 * pour le tunnel, et la vraie réponse vient derrière. Un découpage qui
 * s'arrête au premier bloc rend donc un corps qui commence par
 * « HTTP/2 200 » — et le navigateur, à qui on avait pourtant annoncé du
 * JSON, répond « Unexpected token 'H' ».
 *
 * On avance donc tant que ce qui reste COMMENCE par une ligne de statut.
 * Ça couvre le tunnel, le « 100 Continue » et les redirections, sans
 * avoir à les énumérer.
 */
function decouper(tampon) {
  let debut = 0;
  let statut = 0;
  let entetes = {};

  while (tampon.slice(debut, debut + 5).toString('latin1') === 'HTTP/') {
    const coupure = tampon.indexOf(Buffer.from('\r\n\r\n'), debut);
    if (coupure === -1) break;
    const lignes = tampon.slice(debut, coupure).toString('latin1')
      .split('\r\n').filter(Boolean);
    const premiere = lignes.shift() || '';
    statut = Number((premiere.split(' ')[1] || '').trim()) || statut;
    entetes = {};
    lignes.forEach((l) => {
      const i = l.indexOf(':');
      if (i === -1) return;
      const nom = l.slice(0, i).trim().toLowerCase();
      /* On laisse tomber ce qui décrirait un encodage ou une longueur que
         curl a déjà défaits : sinon le navigateur essaie de décompresser
         du clair, ou tronque. */
      if (['content-encoding', 'transfer-encoding', 'content-length'].includes(nom)) return;
      entetes[nom] = l.slice(i + 1).trim();
    });
    debut = coupure + 4;
  }

  return { statut: statut || 502, entetes, corpsReponse: tampon.slice(debut) };
}

/** Une adresse d'essai reconnaissable, pour pouvoir tout effacer après. */
export function adresseEssai(quoi = 'essai') {
  return `opus-essai-${quoi}-${Date.now()}@exemple-opus.test`;
}

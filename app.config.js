/**
 * DEUX APPLICATIONS SUR LE MÊME IPHONE — « Opus » et « Opus Dev ».
 *
 * `app.json` reste LA configuration d'Opus. Ce fichier ne fait qu'une
 * chose : quand la construction est lancée avec le profil `development`
 * d'`eas.json`, il change l'IDENTITÉ de l'application — son nom, son
 * identifiant, son icône, son lien. Pour tout le reste, et pour toute
 * autre construction, il rend `app.json` tel quel.
 *
 * POURQUOI : iOS reconnaît une application à son identifiant
 * (`com.opusproject.app`). Deux constructions qui portent le même
 * s'écrasent : installer la « preview » du 17/10 avait remplacé le build
 * de développement, sans prévenir (constaté le 19/10). Avec un
 * identifiant à elle (`com.opusproject.app.dev`), l'application de test
 * vit À CÔTÉ de la vraie, et l'icône noire « DEV » dit laquelle on ouvre.
 *
 * QUI POSE `APP_VARIANT` : `eas.json`, profil `development`, champ `env`.
 * EAS la pose deux fois — sur l'ordinateur, quand il lit ce fichier pour
 * préparer les identifiants Apple, et sur le serveur qui construit.
 * Sans elle (`npx expo start`, `npx expo export`, la vérification de
 * GitHub, le profil `preview`), c'est l'identité d'Opus.
 *
 * À NE PAS FAIRE :
 *   - changer le `slug`. Il relie le projet à EAS (`extra.eas.projectId`)
 *     et fabrique le lien des codes QR (`exp+opus-project`). Les deux
 *     applications le partagent, exprès ;
 *   - ajouter `expo-dev-client` à `plugins` dans `app.json` : il est posé
 *     ici, avec son réglage, et un second exemplaire écrit en premier
 *     l'emporterait sans un mot.
 */
const DEV = process.env.APP_VARIANT === 'development';

const ID = 'com.opusproject.app';
const ID_DEV = 'com.opusproject.app.dev';

/* Un lien qui rouvre l'application doit mener à UNE application. Si
   `app.json` déclare un `scheme`, Opus Dev en reçoit un à elle : son
   identifiant quand le lien d'Opus est l'identifiant d'Opus, sinon le
   même suivi de « -dev ». Une redirection de Supabase vers Opus ne doit
   jamais ouvrir Opus Dev, ni l'inverse. */
const lienDev = (s) => (s === ID ? ID_DEV : `${s}-dev`);
const liensDev = (schema) => {
  if (Array.isArray(schema)) return schema.map(lienDev);
  return schema ? lienDev(schema) : schema;
};

module.exports = ({ config }) => {
  const plugins = [
    ...(config.plugins || []),
    /* Le lien `exp+opus-project://` des codes QR de `npx expo start`
       n'est déclaré QUE par l'application de test. Déclaré aussi par une
       construction « preview », il ferait ouvrir au code QR, au hasard
       d'iOS, une application qui ne sait pas s'en servir. C'est le
       réglage que recommande Expo pour des variantes côte à côte. */
    ['expo-dev-client', { addGeneratedScheme: DEV }],
  ];

  if (!DEV) return { ...config, plugins };

  return {
    ...config,
    name: 'Opus Dev',
    icon: './assets/icon-dev.png',
    scheme: liensDev(config.scheme),
    plugins,
    ios: {
      ...config.ios,
      bundleIdentifier: ID_DEV,
      /* Le texte qu'iOS affiche quand Opus Dev demande le réseau local
         (il y cherche le serveur de développement du PC). Posé ICI, pour
         Opus Dev seulement : Opus n'en a pas besoin, et le lanceur de
         développement ne retire des constructions « preview » que son
         propre texte anglais, pas un texte écrit par nous. */
      infoPlist: {
        ...config.ios.infoPlist,
        NSLocalNetworkUsageDescription:
          'Opus Dev cherche sur votre réseau Wi-Fi l’ordinateur où tourne le serveur de développement, pour y charger Opus.',
      },
    },
    android: {
      ...config.android,
      package: ID_DEV,
      adaptiveIcon: {
        ...config.android.adaptiveIcon,
        backgroundColor: '#1A1B19',
        foregroundImage: './assets/android-icon-foreground-dev.png',
        backgroundImage: './assets/android-icon-background-dev.png',
      },
    },
  };
};

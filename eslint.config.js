/**
 * LE LINTER — et pourquoi il est réglé AUSSI SERRÉ.
 *
 * Ajouté le 02/10/2026, lot 8. Avant lui, le projet comptait 86 fichiers de
 * JavaScript et aucun outil pour relire ce que l'œil ne voit pas. Un relevé
 * à la main a trouvé **une vingtaine d'imports jamais employés** — des
 * composants retirés d'un écran dont la ligne d'import était restée.
 *
 * Ce n'est pas qu'une question de propreté : un import mort fait croire
 * qu'un écran se sert encore d'une brique. On la modifie « sans risque »,
 * et on casse ailleurs.
 *
 * CE QU'IL SURVEILLE, ET RIEN D'AUTRE
 * -----------------------------------
 * Un linter qui crie trois cents fois ne se lit plus, et on finit par le
 * couper. Celui-ci ne garde donc que les deux familles d'erreurs qui
 * CASSENT quelque chose :
 *
 *   - `no-undef` : un nom employé sans exister. C'est l'écran blanc.
 *   - `no-unused-vars` : un import ou une variable morte. C'est le piège
 *     ci-dessus.
 *
 * Tout ce qui relève du style d'écriture — guillemets, points-virgules,
 * longueur de ligne — est laissé de côté, exprès. Le projet a déjà
 * vingt-deux contrôles qui tiennent des règles qui lui sont propres ; un
 * désaccord de virgule n'en fait pas partie.
 *
 * `reference/` contient le prototype web d'origine, qui FAIT FOI et qu'on
 * ne corrige pas : il est là pour être comparé, pas pour tourner.
 */
const expo = require('eslint-config-expo/flat');

module.exports = [
  ...expo,
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      '.expo/**',
      'captures/**',
      /* Le prototype d'origine : une archive, pas du code vivant. */
      'reference/**',
    ],
  },
  {
    rules: {
      /* Les deux qui cassent quelque chose. */
      'no-undef': 'error',
      'no-unused-vars': ['error', {
        /* Un argument qu'on reçoit sans s'en servir est souvent imposé par
           une signature (un `catch (e)` qu'on laisse vide exprès, par
           exemple). On ne le signale que s'il est suivi d'un argument
           utilisé — sinon c'est juste la fin de la liste. */
        args: 'after-used',
        /* `catch (e) { }` est une forme VOULUE dans ce projet : un vibreur
           absent n'est pas une panne, et `retour.js` en dépend. */
        caughtErrors: 'none',
        ignoreRestSiblings: true,
      }],

      /* Le reste est laissé au jugement : voir l'en-tête. */
      'no-console': 'off',
      'import/no-unresolved': 'off',

      /* L'APOSTROPHE FRANÇAISE N'EST PAS UNE ERREUR. Cette règle vient
         d'un monde anglophone où l'apostrophe est rare ; ici elle est dans
         un mot sur cinq (« l'artisan », « d'urgence », « n'est »). Elle a
         produit à elle seule la moitié des 194 premières alertes, et un
         linter qui crie cent fois ne se lit plus. */
      'react/no-unescaped-entities': 'off',
    },
  },

  {
    /* LES SCRIPTS D'ATELIER tournent sur Node, pas dans l'application :
       `Buffer`, `process` et compagnie y sont des globaux ordinaires. */
    files: ['scripts/**/*.mjs', 'eslint.config.js'],
    languageOptions: {
      globals: { Buffer: 'readonly', process: 'readonly', console: 'readonly',
        module: 'writable', require: 'readonly', __dirname: 'readonly' },
    },
  },

  {
    /* LES FONCTIONS EDGE TOURNENT SUR DENO, PAS SUR NODE. `Deno` y est un
       objet global fourni par la plateforme : le signaler comme inconnu
       serait une erreur du linter, pas du code. */
    files: ['supabase/functions/**/*.ts'],
    languageOptions: { globals: { Deno: 'readonly' } },
  },
];

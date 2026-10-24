/**
 * LA CLE DE RAPPROCHEMENT -- reconnaitre UNE meme phrase ecrite de plusieurs
 * facons (lot P du module devis : la base de postes).
 *
 * CE FICHIER EST ECRIT SANS AUCUN ACCENT, commentaires compris, et ce n'est
 * pas un oubli : voir plus bas, "Pourquoi de l'ASCII pur".
 *
 * POURQUOI CE FICHIER EXISTE (23/10/2026)
 * ---------------------------------------
 * Le proprietaire, mot pour mot : "il faudrait arriver a reconnaitre les
 * phrases, parce que l'artisan pour le meme travail a par exemple rajoute
 * un s ; il ne faut pas qu'il y ait trop de propositions, ca pourrait nous
 * perdre." Sans IA, Opus reconnait donc comme UNE meme phrase celles qui ne
 * different que par les majuscules, les accents, les espaces en trop, la
 * ponctuation et un s ou un x de pluriel. "Chape seche", "CHAPES SECHES."
 * et la meme phrase copiee d'un PDF donnent la meme CLE.
 *
 * La phrase, elle, reste rangee MOT POUR MOT, dans la ligne comme dans le
 * poste : c'est elle que le client lira. LA CLE NE S'AFFICHE NULLE PART.
 * Elle ne sert qu'a RAPPROCHER : une proposition par phrase pendant la
 * frappe, "ce poste existe deja", la reference d'une ligne.
 *
 *   aPlat(phrase)               sans casse, sans accents, sans ponctuation,
 *                               blancs reduits -- pour la recherche
 *   cleDeRapprochement(phrase)  aPlat, puis un s ou un x de pluriel retire
 *                               des mots de trois lettres et plus (sauf
 *                               "bas" : "plancher bas" n'est pas "plancher
 *                               BA", le beton arme, et leurs prix different)
 *
 * Les deux rendent null pour null, et null pour une phrase de plus de
 * LONGUEUR_MAX points de code (la borne de toute phrase rangee : au-dela,
 * on ne calcule rien, et le cout reste borne pour tout le monde).
 *
 * UNE SOURCE, DEUX ECRITURES
 * --------------------------
 * La base calcule la MEME cle, par la fonction SQL
 * public.cle_de_rapprochement (section 50 de supabase/schema.sql), pour
 * refuser un doublon. Cette fonction n'est jamais ecrite a la main : elle
 * est ENGENDREE depuis la table de ce fichier par
 *
 *   npm run generer-rapprochement
 *
 * exactement comme le SQL du catalogue des metiers est engendre depuis son
 * fichier JavaScript (npm run generer-catalogue). Deux ecritures tenues a
 * la main finissent toujours par diverger, et ici une divergence ne
 * leverait aucune erreur : le telephone dirait "nouveau poste" et la base
 * refuserait, ou l'inverse.
 * npm run verifier-postes prouve qu'elles disent la meme chose : 175 cas
 * ecrits a la main (supabase/cas-rapprochement.json), 22 paires qui doivent
 * rester distinctes, la table SQL evaluee et comparee a celle-ci, et une
 * EMPREINTE sur chaque point de code d'Unicode.
 *
 * POURQUOI NI normalize, NI toLowerCase, NI Intl
 * ---------------------------------------------
 * Les tables Unicode et les regles de casse ne sont pas les memes dans
 * Hermes (le moteur de l'iPhone) et dans PostgreSQL, et elles changent avec
 * leurs versions et leur langue : le I turc ne devient pas le meme i selon
 * la collation. La regle n'est donc faite QUE d'une table explicite (chaque
 * caractere nomme), de classes ASCII et d'une exception ecrite. Elle donne
 * le meme resultat partout, et on peut le prouver.
 *
 * POURQUOI DE L'ASCII PUR
 * -----------------------
 * La table s'ecrit en sequences "barre oblique inverse, u, quatre chiffres
 * hexadecimaux". Or l'outil d'ecriture des sessions de travail change ces
 * sequences en caracteres sans le dire -- et un caractere invisible (une
 * espace insecable, un U+200B) ne se voit pas a l'oeil. D'ou trois regles :
 *
 *   - ce fichier ne contient AUCUN caractere hors de l'ASCII ;
 *   - toute modification de la table passe par un SCRIPT qui produit la
 *     barre oblique inverse par chr(92), jamais par un outil d'edition ;
 *   - apres toute ecriture d'une barre oblique inverse, on relit les
 *     OCTETS (od -c), et le compte des sequences (942 aujourd'hui).
 *
 * L'expression du pluriel est un LITTERAL, et elle n'est PAS exportee : le
 * compilateur Hermes valide un litteral, et une expression /g exportee
 * garde son lastIndex d'un appel a l'autre (test() repondrait juste une
 * fois sur deux). Le controle lit PLURIEL_SOURCE.
 *
 * CE FICHIER N'IMPORTE RIEN : node doit pouvoir le faire tourner sans React
 * Native, sinon un controle qui plante ne verifie rien. Et aucun ECRAN ne
 * l'importe : devis.js et postes.js le font pour eux.
 *
 * CHANGER LA REGLE UN JOUR
 * ------------------------
 * Une fonction SQL remplacee ne recalcule pas une colonne deja rangee. Dans
 * le MEME lot, il faut donc : la table d'ici (par script), puis
 * npm run generer-rapprochement ; les cas et les deux empreintes de
 * supabase/cas-rapprochement.json ; une migration qui cherche d'abord les
 * postes que la nouvelle regle rendrait doublons et les fait trancher,
 * PUIS reecrit la table base_postes. La table a ete posee une fois depuis la
 * decomposition canonique d'Unicode ; elle est FIGEE ici.
 */
export const LONGUEUR_MAX = 2000;
const DE = [
  'ABCDEFGHIJKLMNOP',
  'QRSTUVWXYZ\u00c0\u00c1\u00c2\u00c3\u00c4\u00c5',
  '\u00c7\u00c8\u00c9\u00ca\u00cb\u00cc\u00cd\u00ce\u00cf\u00d0\u00d1\u00d2\u00d3\u00d4\u00d5\u00d6',
  '\u00d8\u00d9\u00da\u00db\u00dc\u00dd\u00e0\u00e1\u00e2\u00e3\u00e4\u00e5\u00e7\u00e8\u00e9\u00ea',
  '\u00eb\u00ec\u00ed\u00ee\u00ef\u00f0\u00f1\u00f2\u00f3\u00f4\u00f5\u00f6\u00f8\u00f9\u00fa\u00fb',
  '\u00fc\u00fd\u00ff\u0100\u0101\u0102\u0103\u0104\u0105\u0106\u0107\u0108\u0109\u010a\u010b\u010c',
  '\u010d\u010e\u010f\u0110\u0111\u0112\u0113\u0114\u0115\u0116\u0117\u0118\u0119\u011a\u011b\u011c',
  '\u011d\u011e\u011f\u0120\u0121\u0122\u0123\u0124\u0125\u0126\u0127\u0128\u0129\u012a\u012b\u012c',
  '\u012d\u012e\u012f\u0130\u0131\u0134\u0135\u0136\u0137\u0139\u013a\u013b\u013c\u013d\u013e\u013f',
  '\u0140\u0141\u0142\u0143\u0144\u0145\u0146\u0147\u0148\u014c\u014d\u014e\u014f\u0150\u0151\u0154',
  '\u0155\u0156\u0157\u0158\u0159\u015a\u015b\u015c\u015d\u015e\u015f\u0160\u0161\u0162\u0163\u0164',
  '\u0165\u0166\u0167\u0168\u0169\u016a\u016b\u016c\u016d\u016e\u016f\u0170\u0171\u0172\u0173\u0174',
  '\u0175\u0176\u0177\u0178\u0179\u017a\u017b\u017c\u017d\u017e\u017f\u01a0\u01a1\u01af\u01b0\u01cd',
  '\u01ce\u01cf\u01d0\u01d1\u01d2\u01d3\u01d4\u01d5\u01d6\u01d7\u01d8\u01d9\u01da\u01db\u01dc\u01de',
  '\u01df\u01e0\u01e1\u01e6\u01e7\u01e8\u01e9\u01ea\u01eb\u01ec\u01ed\u01f0\u01f4\u01f5\u01f8\u01f9',
  '\u01fa\u01fb\u0200\u0201\u0202\u0203\u0204\u0205\u0206\u0207\u0208\u0209\u020a\u020b\u020c\u020d',
  '\u020e\u020f\u0210\u0211\u0212\u0213\u0214\u0215\u0216\u0217\u0218\u0219\u021a\u021b\u021e\u021f',
  '\u0226\u0227\u0228\u0229\u022a\u022b\u022c\u022d\u022e\u022f\u0230\u0231\u0232\u0233\u1e00\u1e01',
  '\u1e02\u1e03\u1e04\u1e05\u1e06\u1e07\u1e08\u1e09\u1e0a\u1e0b\u1e0c\u1e0d\u1e0e\u1e0f\u1e10\u1e11',
  '\u1e12\u1e13\u1e14\u1e15\u1e16\u1e17\u1e18\u1e19\u1e1a\u1e1b\u1e1c\u1e1d\u1e1e\u1e1f\u1e20\u1e21',
  '\u1e22\u1e23\u1e24\u1e25\u1e26\u1e27\u1e28\u1e29\u1e2a\u1e2b\u1e2c\u1e2d\u1e2e\u1e2f\u1e30\u1e31',
  '\u1e32\u1e33\u1e34\u1e35\u1e36\u1e37\u1e38\u1e39\u1e3a\u1e3b\u1e3c\u1e3d\u1e3e\u1e3f\u1e40\u1e41',
  '\u1e42\u1e43\u1e44\u1e45\u1e46\u1e47\u1e48\u1e49\u1e4a\u1e4b\u1e4c\u1e4d\u1e4e\u1e4f\u1e50\u1e51',
  '\u1e52\u1e53\u1e54\u1e55\u1e56\u1e57\u1e58\u1e59\u1e5a\u1e5b\u1e5c\u1e5d\u1e5e\u1e5f\u1e60\u1e61',
  '\u1e62\u1e63\u1e64\u1e65\u1e66\u1e67\u1e68\u1e69\u1e6a\u1e6b\u1e6c\u1e6d\u1e6e\u1e6f\u1e70\u1e71',
  '\u1e72\u1e73\u1e74\u1e75\u1e76\u1e77\u1e78\u1e79\u1e7a\u1e7b\u1e7c\u1e7d\u1e7e\u1e7f\u1e80\u1e81',
  '\u1e82\u1e83\u1e84\u1e85\u1e86\u1e87\u1e88\u1e89\u1e8a\u1e8b\u1e8c\u1e8d\u1e8e\u1e8f\u1e90\u1e91',
  '\u1e92\u1e93\u1e94\u1e95\u1e96\u1e97\u1e98\u1e99\u1ea0\u1ea1\u1ea2\u1ea3\u1ea4\u1ea5\u1ea6\u1ea7',
  '\u1ea8\u1ea9\u1eaa\u1eab\u1eac\u1ead\u1eae\u1eaf\u1eb0\u1eb1\u1eb2\u1eb3\u1eb4\u1eb5\u1eb6\u1eb7',
  '\u1eb8\u1eb9\u1eba\u1ebb\u1ebc\u1ebd\u1ebe\u1ebf\u1ec0\u1ec1\u1ec2\u1ec3\u1ec4\u1ec5\u1ec6\u1ec7',
  '\u1ec8\u1ec9\u1eca\u1ecb\u1ecc\u1ecd\u1ece\u1ecf\u1ed0\u1ed1\u1ed2\u1ed3\u1ed4\u1ed5\u1ed6\u1ed7',
  '\u1ed8\u1ed9\u1eda\u1edb\u1edc\u1edd\u1ede\u1edf\u1ee0\u1ee1\u1ee2\u1ee3\u1ee4\u1ee5\u1ee6\u1ee7',
  '\u1ee8\u1ee9\u1eea\u1eeb\u1eec\u1eed\u1eee\u1eef\u1ef0\u1ef1\u1ef2\u1ef3\u1ef4\u1ef5\u1ef6\u1ef7',
  '\u1ef8\u1ef9\u00b2\u00b3\u00b9\u2070\u2074\u2075\u2076\u2077\u2078\u2079\u2080\u2081\u2082\u2083',
  '\u2084\u2085\u2086\u2087\u2088\u2089\u0001\u0002\u0003\u0004\u0005\u0006\u0007\u0008\u0009\u000a',
  '\u000b\u000c\u000d\u000e\u000f\u0010\u0011\u0012\u0013\u0014\u0015\u0016\u0017\u0018\u0019\u001a',
  '\u001b\u001c\u001d\u001e\u001f!"#$\u0027()*,-.',
  '/:;=?@[\u005c]^_`{|}~',
  '\u007f\u0080\u0081\u0082\u0083\u0084\u0085\u0086\u0087\u0088\u0089\u008a\u008b\u008c\u008d\u008e',
  '\u008f\u0090\u0091\u0092\u0093\u0094\u0095\u0096\u0097\u0098\u0099\u009a\u009b\u009c\u009d\u009e',
  '\u009f\u00a0\u00a1\u00a2\u00a3\u00a4\u00a5\u00a6\u00a7\u00a8\u00a9\u00aa\u00ab\u00ac\u00ae\u00af',
  '\u00b0\u00b1\u00b4\u00b6\u00b7\u00b8\u00ba\u00bb\u00bf\u00f7\u02b9\u02ba\u02bb\u02bc\u02bd\u1680',
  '\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u2010\u2011\u2012\u2013\u2014',
  '\u2015\u2016\u2017\u2018\u2019\u201a\u201b\u201c\u201d\u201e\u201f\u2020\u2021\u2022\u2023\u2024',
  '\u2025\u2026\u2027\u2028\u2029\u202f\u2031\u2032\u2033\u2034\u2035\u2036\u2037\u2038\u2039\u203a',
  '\u203b\u203c\u203d\u203e\u203f\u2040\u2041\u2042\u2043\u2044\u2045\u2046\u2047\u2048\u2049\u204a',
  '\u204b\u204c\u204d\u204e\u204f\u2050\u2051\u2052\u2053\u2054\u2055\u2056\u2057\u2058\u2059\u205a',
  '\u205b\u205c\u205d\u205e\u205f\u2065\u20a0\u20a1\u20a2\u20a3\u20a4\u20a5\u20a6\u20a7\u20a8\u20a9',
  '\u20aa\u20ab\u20ad\u20ae\u20af\u20b0\u20b1\u20b2\u20b3\u20b4\u20b5\u20b6\u20b7\u20b8\u20b9\u20ba',
  '\u20bb\u20bc\u20bd\u20be\u20bf\u20c0\u20c1\u20c2\u20c3\u20c4\u20c5\u20c6\u20c7\u20c8\u20c9\u20ca',
  '\u20cb\u20cc\u20cd\u20ce\u20cf\u2212\u2215\u3000\u00ad\u0300\u0301\u0302\u0303\u0304\u0305\u0306',
  '\u0307\u0308\u0309\u030a\u030b\u030c\u030d\u030e\u030f\u0310\u0311\u0312\u0313\u0314\u0315\u0316',
  '\u0317\u0318\u0319\u031a\u031b\u031c\u031d\u031e\u031f\u0320\u0321\u0322\u0323\u0324\u0325\u0326',
  '\u0327\u0328\u0329\u032a\u032b\u032c\u032d\u032e\u032f\u0330\u0331\u0332\u0333\u0334\u0335\u0336',
  '\u0337\u0338\u0339\u033a\u033b\u033c\u033d\u033e\u033f\u0340\u0341\u0342\u0343\u0344\u0345\u0346',
  '\u0347\u0348\u0349\u034a\u034b\u034c\u034d\u034e\u034f\u0350\u0351\u0352\u0353\u0354\u0355\u0356',
  '\u0357\u0358\u0359\u035a\u035b\u035c\u035d\u035e\u035f\u0360\u0361\u0362\u0363\u0364\u0365\u0366',
  '\u0367\u0368\u0369\u036a\u036b\u036c\u036d\u036e\u036f\u115f\u1160\u180e\u200b\u200c\u200d\u200e',
  '\u200f\u202a\u202b\u202c\u202d\u202e\u2060\u2061\u2062\u2063\u2064\u2066\u2067\u2068\u2069\u206a',
  '\u206b\u206c\u206d\u206e\u206f\u3164\ufe00\ufe01\ufe02\ufe03\ufe04\ufe05\ufe06\ufe07\ufe08\ufe09',
  '\ufe0a\ufe0b\ufe0c\ufe0d\ufe0e\ufe0f\ufeff\uffa0',
].join('');
const VERS = 'abcdefghijklmnopqrstuvwxyzaaaaaaceeeeiiiidnoooooouuuuyaaaaaaceeeeiiiidnoooooouuuuyyaaaaaaccccccccddddeeeeeeeeeegggggggghhhhiiiiiiiiiijjkkllllllllllnnnnnnoooooorrrrrrssssssssttttttuuuuuuuuuuuuwwyyyzzzzzzsoouuaaiioouuuuuuuuuuaaaaggkkoooojggnnaaaaaaeeeeiiiioooorrrruuuusstthhaaeeooooooooyyaabbbbbbccddddddddddeeeeeeeeeeffgghhhhhhhhhhiiiikkkkkkllllllllmmmmmmnnnnnnnnoooooooopppprrrrrrrrssssssssssttttttttuuuuuuuuuuvvvvwwwwwwwwwwxxxxyyzzzzzzhtwyaaaaaaaaaaaaaaaaaaaaaaaaeeeeeeeeeeeeeeeeiiiioooooooooooooooooooooooouuuuuuuuuuuuuuyyyyyyyy23104567890123456789                                                                                                                                                                                                                                                                  ';
const MULTIPLES = [
  ['%', ' pourcent '],
  ['&', ' et '],
  ['+', ' plus '],
  ['<', ' inf '],
  ['>', ' sup '],
  ['\u00bc', '1 4'],
  ['\u00bd', '1 2'],
  ['\u00be', '3 4'],
  ['\u00c6', 'ae'],
  ['\u00d7', 'x'],
  ['\u00de', 'th'],
  ['\u00df', 'ss'],
  ['\u00e6', 'ae'],
  ['\u00fe', 'th'],
  ['\u0132', 'ij'],
  ['\u0133', 'ij'],
  ['\u0152', 'oe'],
  ['\u0153', 'oe'],
  ['\u1e9e', 'ss'],
  ['\u2030', ' pourmille '],
  ['\u20ac', ' euro '],
  ['\u2264', ' inf '],
  ['\u2265', ' sup '],
  ['\ufb00', 'ff'],
  ['\ufb01', 'fi'],
  ['\ufb02', 'fl'],
  ['\ufb03', 'ffi'],
  ['\ufb04', 'ffl'],
  ['\ufb05', 'st'],
  ['\ufb06', 'st'],
];
export const EXCEPTIONS_PLURIEL = ['bas'];
/* Un litteral : le compilateur Hermes le valide. NON exporte (son lastIndex survit d'un appel a l'autre). */
const PLURIEL = /(^| )(?!(?:bas)(?: |$))([a-z]{2,})[sx](?= |$)/g;
export const PLURIEL_SOURCE = PLURIEL.source;
const TABLE = new Map();
{
  const de = [...DE];
  const vers = [...VERS];
  de.forEach((c, i) => TABLE.set(c, i < vers.length ? vers[i] : ''));
  for (const [c, v] of MULTIPLES) TABLE.set(c, v);
}
export const TABLE_DE = DE;
export const TABLE_VERS = VERS;
export const TABLE_MULTIPLES = MULTIPLES;
/* Plus de LONGUEUR_MAX points de code : pas de cle (la meme garde que la fonction SQL). */
function tropLongue(s) {
  if (s.length <= LONGUEUR_MAX) return false;
  return s.length > 2 * LONGUEUR_MAX || [...s].length > LONGUEUR_MAX;
}
export function aPlat(phrase) {
  if (phrase === null || phrase === undefined) return null;
  const brut = String(phrase);
  if (tropLongue(brut)) return null;
  let s = '';
  for (const c of brut) {
    const r = TABLE.get(c);
    s += r === undefined ? c : r;
  }
  return s.replace(/ +/g, ' ').replace(/^ /, '').replace(/ $/, '');
}
export function cleDeRapprochement(phrase) {
  const s = aPlat(phrase);
  return s === null ? null : s.replace(PLURIEL, '$1$2');
}

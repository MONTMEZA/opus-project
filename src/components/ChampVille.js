/**
 * Champ ville ou adresse, avec suggestions officielles.
 *
 * Dès trois lettres, il propose des communes (ou des adresses complètes) issues
 * de la Base Adresse Nationale. Choisir une suggestion remplit d'un coup le
 * code postal et les coordonnées GPS, qui servent aux distances du SOS.
 *
 * On peut toujours taper à la main : une suggestion qui n'arrive pas ne doit
 * jamais bloquer quelqu'un.
 *
 * TROIS MODES, ET LE TROISIÈME EST NÉ LE 11/10/2026, à la demande du
 * propriétaire :
 *
 *   « j'aimerais que quand on rentre l'adresse du client ça propose comme
 *     les autres endroits de l'application »
 *
 *   - `municipality` — des communes. Sept usages sur huit dans le projet ;
 *   - `address` — tout ce qui SITUE un lieu, commune comprise. Un seul
 *     usage, et il explique le troisième mode : l'écran **SOS**, qui
 *     envoie les coordonnées de la suggestion directement à la recherche
 *     d'artisans disponibles. Lui retirer les communes aurait laissé
 *     quelqu'un taper sa ville sans aucune suggestion, donc sans
 *     coordonnées, donc sans artisan — à minuit, une fuite d'eau ;
 *   - `rue` — une LIGNE D'ADRESSE POSTALE : un numéro ou une rue, rien
 *     d'autre. C'est le mode du carnet de clients, parce qu'une facture
 *     porte une rue, un code postal et une ville dans trois cases
 *     séparées.
 *
 * Il a donc fallu un mode de PLUS, et non détourner celui qui existait.
 * Les deux se ressemblent et ne répondent pas à la même question.
 *
 * ET CE QU'ON AFFICHE DANS LE CHAMP N'EST PAS CE QU'ON AFFICHE DANS LA
 * LISTE. La liste montre l'adresse ENTIÈRE (« 4 Rue des Acacias 13350
 * Charleval ») : c'est ce qui permet de voir que la suggestion n'est pas
 * ce qu'on a tapé — la Base Adresse ne dit jamais « introuvable », elle
 * rend une autre adresse. Le CHAMP, lui, ne garde que la rue : le code
 * postal et la ville ont leurs propres cases, et les y laisser en double
 * les imprimerait deux fois sur une facture.
 *
 * `forwardRef` : c'est par là que « Suivant » sur le clavier atteint ce
 * champ depuis le précédent.
 */
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import {
  C, F, T,
} from '../theme';
import { Field } from './ui';
import { MapPin, Check } from './icons';
import { chercher } from '../lib/adresse';

const ChampVille = React.forwardRef(function ChampVille({
  valeur, onChange, placeholder = 'Commencez à taper votre ville...',
  type = 'municipality', style, maxLength,
}, ref) {
  /* Un mode d'adresse affiche le libellé ENTIER dans la liste, parce que
     c'est le seul moyen de voir que la suggestion n'est pas ce qu'on a
     tapé. Deux modes le font, et il n'y a qu'un endroit qui le décide. */
  const modeAdresse = type === 'address' || type === 'rue';
  const [texte, setTexte] = useState(valeur || '');
  const [suggestions, setSuggestions] = useState([]);
  const [cherche, setCherche] = useState(false);
  const [choisi, setChoisi] = useState(!!valeur);
  const minuteur = useRef(null);

  // Le champ suit la valeur venue du parent (chargement du profil, par exemple).
  useEffect(() => {
    setTexte(valeur || '');
    setChoisi(!!valeur);
  }, [valeur]);

  const saisir = (t) => {
    setTexte(t);
    setChoisi(false);
    onChange({ affichage: t });          // la saisie libre reste valable

    if (minuteur.current) clearTimeout(minuteur.current);
    if (t.trim().length < 3) { setSuggestions([]); return; }

    // On attend 350 ms de silence avant d'interroger l'API : inutile de la
    // solliciter à chaque lettre tapée.
    setCherche(true);
    minuteur.current = setTimeout(async () => {
      const resultats = await chercher(t, { type });
      setSuggestions(resultats);
      setCherche(false);
    }, 350);
  };

  useEffect(() => () => { if (minuteur.current) clearTimeout(minuteur.current); }, []);

  const selectionner = (lieu) => {
    /* En mode adresse, le champ garde la RUE — « 4 Rue des Acacias » — et
       pas le libellé entier. Sinon l'adresse enregistrée contiendrait le
       code postal et la ville, qui ont leurs propres champs juste en
       dessous. `lieu.rue` est `null` sur tout ce qui n'est pas un numéro
       ou une rue ; `chercher()` les écarte déjà en mode adresse, donc le
       repli ne devrait jamais servir — il est là parce qu'un repli qui ne
       secourt rien est pire que pas de repli. */
    const affichage = modeAdresse ? (lieu.rue || lieu.label) : lieu.affichage;
    setTexte(affichage);
    setChoisi(true);
    setSuggestions([]);
    onChange({ ...lieu, affichage });
  };

  return (
    <View style={style}>
      <View>
        {/* `maxLength` VOYAGE : sans lui, l'adresse d'un client pourrait
            dépasser les 200 caractères que `validerClient()` REFUSE — et
            un refus pour une longueur qu'aucun compteur n'annonçait est le
            genre de message devant lequel on abandonne. */}
        <Field
          ref={ref}
          value={texte}
          onChangeText={saisir}
          placeholder={placeholder}
          maxLength={maxLength}
        />
        {cherche && <ActivityIndicator size="small" color={C.muted} style={s.spinner} />}
        {choisi && !cherche && <Check size={14} color={C.ok} style={s.coche} />}
      </View>

      {suggestions.length > 0 && (
        <View style={s.liste}>
          {suggestions.map((lieu) => (
            <Pressable key={lieu.id} style={s.ligne} onPress={() => selectionner(lieu)}>
              <MapPin size={13} color={C.muted} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={s.nom} numberOfLines={1}>
                  {modeAdresse ? lieu.label : lieu.ville}
                </Text>
                <Text style={s.detail} numberOfLines={1}>
                  {lieu.codePostal}{lieu.departement ? ` · ${lieu.departement}` : ''}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
});

export default ChampVille;

const s = StyleSheet.create({
  spinner: { position: 'absolute', right: 10, top: 11 },
  coche: { position: 'absolute', right: 10, top: 11 },
  liste: {
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, borderTopWidth: 0,
    shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  ligne: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 9, paddingHorizontal: 10,
    borderBottomWidth: 1, borderBottomColor: C.line,
  },
  nom: { fontFamily: F.inter6, fontSize: T.corps, color: C.ink },
  detail: { fontSize: T.petit, color: C.muted, marginTop: 1, fontFamily: F.inter },
});

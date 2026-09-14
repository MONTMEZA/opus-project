/**
 * Champ ville ou adresse, avec suggestions officielles.
 *
 * Dès trois lettres, il propose des communes (ou des adresses complètes) issues
 * de la Base Adresse Nationale. Choisir une suggestion remplit d'un coup le
 * code postal et les coordonnées GPS, qui servent aux distances du SOS.
 *
 * On peut toujours taper à la main : une suggestion qui n'arrive pas ne doit
 * jamais bloquer quelqu'un.
 */
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { C, F } from '../theme';
import { Field } from './ui';
import { MapPin, Check } from './icons';
import { chercher } from '../lib/adresse';

export default function ChampVille({
  valeur, onChange, placeholder = 'Commencez à taper votre ville...',
  type = 'municipality', style,
}) {
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
    const affichage = type === 'address' ? lieu.label : lieu.affichage;
    setTexte(affichage);
    setChoisi(true);
    setSuggestions([]);
    onChange({ ...lieu, affichage });
  };

  return (
    <View style={style}>
      <View>
        <Field value={texte} onChangeText={saisir} placeholder={placeholder} />
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
                  {type === 'address' ? lieu.label : lieu.ville}
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
}

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
  nom: { fontFamily: F.inter6, fontSize: 12.5, color: C.ink },
  detail: { fontSize: 11, color: C.muted, marginTop: 1, fontFamily: F.inter },
});

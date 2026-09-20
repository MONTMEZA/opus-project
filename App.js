/**
 * Point d'entrée de l'application Opus-Project.
 * On charge d'abord les polices Oswald (titres) et Inter (texte courant),
 * puis on affiche l'app.
 */
import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { Oswald_500Medium, Oswald_600SemiBold, Oswald_700Bold } from '@expo-google-fonts/oswald';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from '@expo-google-fonts/inter';
import OpusApp from './src/OpusApp';
import { C } from './src/theme';

export default function App() {
  const [fontsLoaded] = useFonts({
    Oswald_500Medium, Oswald_600SemiBold, Oswald_700Bold,
    Inter_400Regular, Inter_500Medium, Inter_600SemiBold,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={C.accent} />
      </View>
    );
  }

  /* GestureHandlerRootView doit envelopper toute l'application : c'est elle
     qui reçoit les touches AVANT les vues natives (le lecteur vidéo, les
     listes qui défilent) et qui décide ensuite qui gagne. Sans elle, aucun
     glissement ne fonctionne au-dessus d'une vidéo. */
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <OpusApp />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

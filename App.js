/**
 * Point d'entrée de l'application Opus-Project.
 *
 * On charge d'abord les polices Oswald (titres) et Inter (texte courant),
 * puis on affiche l'app.
 *
 * ET ON NE MONTRE PLUS UNE ROUE QUI TOURNE PENDANT CE TEMPS-LÀ.
 * -------------------------------------------------------------
 * Mesuré le 02/10/2026 au navigateur, processeur bridé six fois : il s'écoule
 * **1,24 seconde** entre la page servie et le premier écran. C'est le temps
 * des polices et de la session — un temps réel, qu'on ne peut pas supprimer.
 *
 * Jusqu'ici il était occupé par un `ActivityIndicator`. Il l'est maintenant
 * par deux barrières de chantier qui s'écartent (`Ouverture`). La durée ne
 * change pas : c'est ce qu'on en fait qui change.
 *
 * L'ordre compte : l'application est montée DERRIÈRE l'ouverture dès que les
 * polices sont là, donc elle finit de se préparer pendant que les barrières
 * s'écartent. Si on attendait la fin de l'animation pour la monter, on
 * aurait ajouté une seconde au lieu d'en occuper une.
 */
import React from 'react';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { Oswald_500Medium, Oswald_600SemiBold, Oswald_700Bold } from '@expo-google-fonts/oswald';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from '@expo-google-fonts/inter';
import OpusApp from './src/OpusApp';
import Ouverture from './src/components/Ouverture';
import { useMouvementReduit } from './src/lib/retour';
import { C } from './src/theme';

/* L'ÉCRAN DE DÉMARRAGE DU TÉLÉPHONE ATTEND L'OUVERTURE — étape 2c-0.
   ------------------------------------------------------------------
   Le logo sur fond orange que l'iPhone affiche en touchant l'icône est
   dessiné par le TÉLÉPHONE (`expo-splash-screen`, réglé dans `app.json`),
   avant même que JavaScript ne tourne. Laissé à lui-même, il disparaît
   d'un coup dès que React affiche quelque chose — ici, les barrières :
   le logo s'éteindrait en une image, et c'est un saut.

   On lui dit donc d'attendre (`preventAutoHideAsync`). C'est l'OUVERTURE
   qui le retire, au moment où elle affiche sa copie exacte du logo :
   rien ne change à l'écran, puis le logo se fond dans les barrières.

   Ici, au niveau du fichier, et sans `await` : c'est ce que demande
   Expo. Appelé dans un composant, l'ordre arriverait trop tard — l'écran
   du téléphone serait déjà retiré. */
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function App() {
  const [fontsLoaded] = useFonts({
    Oswald_500Medium, Oswald_600SemiBold, Oswald_700Bold,
    Inter_400Regular, Inter_500Medium, Inter_600SemiBold,
  });
  const [ouvert, setOuvert] = React.useState(false);
  const sansMouvement = useMouvementReduit();

  /* SE DÉCONNECTER, C'EST REPARTIR DE ZÉRO — 17/10/2026.
     Trouvé par le propriétaire en changeant de compte sur son iPhone :
     « Administration » avait disparu de son profil. L'application ne
     demande « suis-je administrateur ? » qu'une fois, et elle avait posé
     la question pour le compte d'AVANT. En cherchant, pire : le carnet de
     clients, les demandes reçues, un brouillon de publication restaient en
     mémoire, et le compte suivant pouvait les voir à l'écran. La base ne
     laissait rien passer ; l'écran, si.

     La déconnexion vidait une liste de vingt-cinq états à la main, et il y
     en a quatre-vingt-dix. Une liste écrite à la main oublie toujours le
     prochain. D'où l'inverse : `generation` change à chaque sortie, et
     React démonte puis remonte OpusApp ENTIER — chaque état, chaque
     référence, chaque abonnement. Exactement comme une application qu'on
     relance, sans l'animation d'ouverture (elle ne vit qu'ici).

     `messageSortie` porte le seul mot qui doit survivre au passage :
     « Votre compte a été supprimé ». */
  const [generation, setGeneration] = React.useState(0);
  const [messageSortie, setMessageSortie] = React.useState(null);
  const sortir = React.useCallback((message = null) => {
    setMessageSortie(message);
    setGeneration((g) => g + 1);
  }, []);

  /* GestureHandlerRootView doit envelopper toute l'application : c'est elle
     qui reçoit les touches AVANT les vues natives (le lecteur vidéo, les
     listes qui défilent) et qui décide ensuite qui gagne. Sans elle, aucun
     glissement ne fonctionne au-dessus d'une vidéo. */
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: C.ink }}>
      <SafeAreaProvider>
        {/* L'application n'est montée qu'une fois les polices là — sinon
            chaque texte s'afficherait d'abord dans la police du système,
            puis sauterait. Mais elle est montée AVANT la fin de
            l'ouverture : les barrières couvrent son premier rendu. */}
        {fontsLoaded
          ? <OpusApp key={generation} onSortie={sortir} messageInitial={messageSortie} />
          : <View style={{ flex: 1, backgroundColor: C.ink }} />}
        {!ouvert && (
          <Ouverture
            pret={fontsLoaded}
            sansMouvement={sansMouvement}
            onFini={() => setOuvert(true)}
          />
        )}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

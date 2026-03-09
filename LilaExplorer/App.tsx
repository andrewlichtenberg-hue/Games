import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';

import { SplashScreen } from './src/screens/SplashScreen';
import { CharacterCreationScreen } from './src/screens/CharacterCreationScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { WorldMapScreen } from './src/screens/WorldMapScreen';
import { ExplorationScreen } from './src/screens/ExplorationScreen';
import { JournalScreen } from './src/screens/JournalScreen';
import { WardrobeScreen } from './src/screens/WardrobeScreen';
import { RoomScreen } from './src/screens/RoomScreen';
import { StickerBookScreen } from './src/screens/StickerBookScreen';

export type RootStackParamList = {
  Splash: undefined;
  CharacterCreation: undefined;
  Home: undefined;
  WorldMap: undefined;
  Exploration: { locationId: string };
  Journal: undefined;
  Wardrobe: undefined;
  Room: undefined;
  StickerBook: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer>
          <StatusBar style="auto" />
          <Stack.Navigator
            initialRouteName="Splash"
            screenOptions={{
              headerShown: false,
              gestureEnabled: true,
              cardStyleInterpolator: ({ current, layouts }) => ({
                cardStyle: {
                  opacity: current.progress,
                  transform: [
                    {
                      translateX: current.progress.interpolate({
                        inputRange: [0, 1],
                        outputRange: [layouts.screen.width * 0.12, 0],
                      }),
                    },
                  ],
                },
              }),
            }}
          >
            <Stack.Screen name="Splash" component={SplashScreen} />
            <Stack.Screen name="CharacterCreation" component={CharacterCreationScreen} />
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="WorldMap" component={WorldMapScreen} />
            <Stack.Screen name="Exploration" component={ExplorationScreen} />
            <Stack.Screen name="Journal" component={JournalScreen} />
            <Stack.Screen name="Wardrobe" component={WardrobeScreen} />
            <Stack.Screen name="Room" component={RoomScreen} />
            <Stack.Screen name="StickerBook" component={StickerBookScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

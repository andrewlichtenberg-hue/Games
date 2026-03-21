import 'react-native-gesture-handler';
import React from 'react';
import { Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';

import { SplashScreen } from './src/screens/SplashScreen';
import { WorldMapScreen } from './src/screens/WorldMapScreen';
import { LevelSelectScreen } from './src/screens/LevelSelectScreen';
import { PuzzleScreen } from './src/screens/PuzzleScreen';
import { JournalScreen } from './src/screens/JournalScreen';

export type RootStackParamList = {
  Splash: undefined;
  WorldMap: undefined;
  LevelSelect: { worldIndex: number };
  Puzzle: { worldIndex: number; levelIndex: number };
  Journal: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer>
          <StatusBar style="light" />
          <Stack.Navigator
            initialRouteName="Splash"
            screenOptions={{
              headerShown: false,
              gestureEnabled: Platform.OS === 'ios',
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
            <Stack.Screen name="WorldMap" component={WorldMapScreen} />
            <Stack.Screen name="LevelSelect" component={LevelSelectScreen} />
            <Stack.Screen name="Puzzle" component={PuzzleScreen} />
            <Stack.Screen name="Journal" component={JournalScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeStackParamList } from './types';
import { PanoramaScreen } from '../screens/home/PanoramaScreen';
import { colors } from '../theme';

const Stack = createNativeStackNavigator<HomeStackParamList>();

export function HomeNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.light.surface,
        },
        headerTintColor: colors.light.text,
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="Panorama"
        component={PanoramaScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

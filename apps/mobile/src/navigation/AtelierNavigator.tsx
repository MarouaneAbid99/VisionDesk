import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AtelierStackParamList } from './types';
import { AtelierJobsScreen } from '../screens/atelier/AtelierJobsScreen';
import { colors } from '../theme';

const Stack = createNativeStackNavigator<AtelierStackParamList>();

export function AtelierNavigator() {
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
        name="AtelierJobs"
        component={AtelierJobsScreen}
        options={{ title: 'Atelier' }}
      />
    </Stack.Navigator>
  );
}

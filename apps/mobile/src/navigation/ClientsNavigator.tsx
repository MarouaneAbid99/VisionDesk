import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ClientsStackParamList } from './types';
import { ClientsListScreen } from '../screens/clients/ClientsListScreen';
import { ClientDetailScreen } from '../screens/clients/ClientDetailScreen';
import { colors } from '../theme';

const Stack = createNativeStackNavigator<ClientsStackParamList>();

export function ClientsNavigator() {
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
        name="ClientsList"
        component={ClientsListScreen}
        options={{ title: 'Clients' }}
      />
      <Stack.Screen
        name="ClientDetail"
        component={ClientDetailScreen}
        options={{ title: 'Détails client' }}
      />
    </Stack.Navigator>
  );
}

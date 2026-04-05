import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AppointmentsScreen } from '../screens/appointments/AppointmentsScreen';
import { colors } from '../theme';

export type AppointmentsStackParamList = {
  AppointmentsList: undefined;
  AppointmentDetail: { id: string };
};

const Stack = createNativeStackNavigator<AppointmentsStackParamList>();

export function AppointmentsNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.light.surface },
        headerTintColor: colors.light.text,
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <Stack.Screen
        name="AppointmentsList"
        component={AppointmentsScreen}
        options={{ title: 'Rendez-vous' }}
      />
    </Stack.Navigator>
  );
}

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MainStackParamList } from './types';
import { PanoramaScreen } from '../screens/home/PanoramaScreen';
import { DeskScreen } from '../screens/desk/DeskScreen';
import { ClientsListScreen } from '../screens/clients/ClientsListScreen';
import { ClientDetailScreen } from '../screens/clients/ClientDetailScreen';
import { ClientQuickCreateScreen } from '../screens/clients/ClientQuickCreateScreen';
import { PrescriptionFormScreen } from '../screens/clients/PrescriptionFormScreen';
import { AtelierJobsScreen } from '../screens/atelier/AtelierJobsScreen';
import { StockTabs } from './StockNavigator';
import { FrameFormScreen } from '../screens/stock/FrameFormScreen';
import { LensFormScreen } from '../screens/stock/LensFormScreen';
import { OrdersListScreen } from '../screens/orders/OrdersListScreen';
import { OrderDetailScreen } from '../screens/orders/OrderDetailScreen';
import { OrderQuickCreateScreen } from '../screens/orders/OrderQuickCreateScreen';
import { AppointmentsScreen } from '../screens/appointments/AppointmentsScreen';
import { AppointmentQuickCreateScreen } from '../screens/appointments/AppointmentQuickCreateScreen';
import { ProfileScreen } from '../screens/profile';
import { NotificationsScreen } from '../screens/notifications';
import { SuppliersScreen } from '../screens/suppliers/SuppliersScreen';
import { SupplierDetailScreen } from '../screens/suppliers/SupplierDetailScreen';
import { SupplierStockScreen } from '../screens/suppliers/SupplierStockScreen';
import { colors, typography } from '../theme';

const Stack = createNativeStackNavigator<MainStackParamList>();

export function MainNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Panorama"
      screenOptions={{
        headerStyle: { backgroundColor: colors.light.surface },
        headerTintColor: colors.light.text,
        headerShadowVisible: false,
        // Native stack only allows a narrow header title style (font + optional string color).
        headerTitleStyle: {
          fontSize: typography.h4.fontSize,
          fontWeight: '600',
        },
        animation: 'slide_from_right',
        animationDuration: 200,
      }}
    >
      <Stack.Screen
        name="Panorama"
        component={PanoramaScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Desk"
        component={DeskScreen}
        options={{ title: 'Tableau de bord' }}
      />
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'Mon Profil', headerShown: false }}
      />
      <Stack.Screen
        name="Clients"
        component={ClientsListScreen}
        options={{ title: 'Clients' }}
      />
      <Stack.Screen
        name="ClientDetail"
        component={ClientDetailScreen}
        options={{ title: 'Client' }}
      />
      <Stack.Screen
        name="Atelier"
        component={AtelierJobsScreen}
        options={{ title: 'Atelier' }}
      />
      <Stack.Screen
        name="Stock"
        component={StockTabs}
        options={{ title: 'Stock' }}
      />
      <Stack.Screen
        name="FrameForm"
        component={FrameFormScreen}
        options={{ title: 'Monture', presentation: 'modal' }}
      />
      <Stack.Screen
        name="LensForm"
        component={LensFormScreen}
        options={{ title: 'Verre', presentation: 'modal' }}
      />
      <Stack.Screen
        name="Orders"
        component={OrdersListScreen}
        options={{ title: 'Commandes' }}
      />
      <Stack.Screen
        name="OrderDetail"
        component={OrderDetailScreen}
        options={{ title: 'Commande' }}
      />
      <Stack.Screen
        name="OrderQuickCreate"
        component={OrderQuickCreateScreen}
        options={{ title: 'Nouvelle commande', presentation: 'modal' }}
      />
      <Stack.Screen
        name="Appointments"
        component={AppointmentsScreen}
        options={{ title: 'Rendez-vous' }}
      />
      <Stack.Screen
        name="ClientQuickCreate"
        component={ClientQuickCreateScreen}
        options={{ title: 'Nouveau client', presentation: 'modal' }}
      />
      <Stack.Screen
        name="AppointmentQuickCreate"
        component={AppointmentQuickCreateScreen}
        options={{ title: 'Nouveau RDV', presentation: 'modal' }}
      />
      <Stack.Screen
        name="PrescriptionForm"
        component={PrescriptionFormScreen}
        options={{ title: 'Nouvelle ordonnance', presentation: 'modal' }}
      />
      <Stack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ title: 'Notifications' }}
      />
      <Stack.Screen
        name="Suppliers"
        component={SuppliersScreen}
        options={{ title: 'Fournisseurs' }}
      />
      <Stack.Screen
        name="SupplierDetail"
        component={SupplierDetailScreen}
        options={{ title: 'Détail fournisseur' }}
      />
      <Stack.Screen
        name="SupplierStock"
        component={SupplierStockScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

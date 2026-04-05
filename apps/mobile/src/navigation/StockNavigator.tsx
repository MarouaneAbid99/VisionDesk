import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useRoute, RouteProp } from '@react-navigation/native';
import { StockStackParamList, MainStackParamList } from './types';
import { FramesListScreen } from '../screens/stock/FramesListScreen';
import { LensesListScreen } from '../screens/stock/LensesListScreen';
import { LowStockScreen } from '../screens/stock/LowStockScreen';
import { colors } from '../theme';

const Stack = createNativeStackNavigator<StockStackParamList>();
const Tab = createMaterialTopTabNavigator();

export function StockTabs() {
  const route = useRoute<RouteProp<MainStackParamList, 'Stock'>>();
  const initialTab = route.params?.initialTab;
  
  // Map initialTab param to tab screen name
  const getInitialRouteName = () => {
    switch (initialTab) {
      case 'frames': return 'Montures';
      case 'lenses': return 'Verres';
      case 'alerts': return 'Alertes';
      default: return 'Montures';
    }
  };

  return (
    <Tab.Navigator
      initialRouteName={getInitialRouteName()}
      screenOptions={{
        tabBarStyle: {
          backgroundColor: colors.light.surface,
        },
        tabBarIndicatorStyle: {
          backgroundColor: colors.light.primary,
        },
        tabBarLabelStyle: {
          fontWeight: '600',
          textTransform: 'none',
        },
        tabBarActiveTintColor: colors.light.primary,
        tabBarInactiveTintColor: colors.light.textSecondary,
      }}
    >
      <Tab.Screen name="Montures" component={FramesListScreen} />
      <Tab.Screen name="Verres" component={LensesListScreen} />
      <Tab.Screen name="Alertes" component={LowStockScreen} />
    </Tab.Navigator>
  );
}

export function StockNavigator() {
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
        name="StockTabs"
        component={StockTabs}
        options={{ title: 'Stock' }}
      />
    </Stack.Navigator>
  );
}

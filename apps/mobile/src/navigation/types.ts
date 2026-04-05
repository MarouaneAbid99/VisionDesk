import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  Login: undefined;
};

export type HomeStackParamList = {
  Panorama: undefined;
};

export type ClientsStackParamList = {
  ClientsList: undefined;
  ClientDetail: { id: string };
};

export type OrdersStackParamList = {
  OrdersList: undefined;
  OrderDetail: { id: string };
};

export type AtelierStackParamList = {
  AtelierJobs: undefined;
  AtelierJobDetail: { id: string };
};

export type StockStackParamList = {
  StockTabs: undefined;
  FrameDetail: { id: string };
  LensDetail: { id: string };
};

export type MainStackParamList = {
  Panorama: undefined;
  Desk: undefined;
  Profile: undefined;
  Clients: undefined;
  ClientDetail: { id: string };
  ClientQuickCreate: undefined;
  PrescriptionForm: { clientId: string };
  Atelier: undefined;
  Stock: { initialTab?: 'frames' | 'lenses' | 'alerts' };
  FrameForm: { frameId?: string };
  LensForm: { lensId?: string };
  Orders: { statusFilter?: string };
  OrderDetail: { id: string };
  OrderQuickCreate: { clientId?: string };
  Appointments: undefined;
  AppointmentDetail: { id: string };
  AppointmentQuickCreate: { clientId?: string };
  Notifications: undefined;
  Suppliers: undefined;
  SupplierDetail: { id: string };
  SupplierStock: { supplierId: string; supplierName: string };
};

/** Use this for `useNavigation` in Main stack screens so `navigate('Screen')` resolves correctly. */
export type MainStackNavigationProp = NativeStackNavigationProp<
  MainStackParamList,
  keyof MainStackParamList
>;

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainStackParamList>;
};

export type AuthStackScreenProps<T extends keyof AuthStackParamList> = NativeStackScreenProps<
  AuthStackParamList,
  T
>;

export type MainStackScreenProps<T extends keyof MainStackParamList> = NativeStackScreenProps<
  MainStackParamList,
  T
>;

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}

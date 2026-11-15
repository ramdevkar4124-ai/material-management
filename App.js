import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Text } from 'react-native';

import { StoreProvider, useStore } from './src/store';
import { palette } from './src/theme';
import SitesScreen from './src/screens/SitesScreen';
import SiteScreen from './src/screens/SiteScreen';
import SuppliersScreen from './src/screens/SuppliersScreen';
import LabourScreen from './src/screens/LabourScreen';
import SettingsScreen from './src/screens/SettingsScreen';

const Tabs = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function Root() {
  const { theme, systemScheme } = useStore();
  const p = palette(theme, systemScheme);
  const navTheme = {
    ...(p.dark ? DarkTheme : DefaultTheme),
    colors: {
      ...(p.dark ? DarkTheme : DefaultTheme).colors,
      background: p.bg,
      card: p.header,
      text: p.fg,
      border: p.line,
      primary: p.accent,
    },
  };

  return (
    <NavigationContainer theme={navTheme}>
      <StatusBar style={p.dark ? 'light' : 'dark'} />
      <Stack.Navigator>
        <Stack.Screen name="Tabs" options={{ headerShown: false }}>
          {() => (
            <Tabs.Navigator
              screenOptions={({ route }) => ({
                headerStyle: { backgroundColor: p.header },
                headerTintColor: p.headerFg,
                tabBarActiveTintColor: p.accent,
                tabBarInactiveTintColor: p.muted,
                tabBarStyle: { backgroundColor: p.surface, borderTopColor: p.line },
                tabBarIcon: ({ color }) => {
                  const icons = { Sites: '🏠', Suppliers: '🧾', Labour: '👷', Settings: '⚙️' };
                  return <Text style={{ color, fontSize: 18 }}>{icons[route.name]}</Text>;
                },
              })}
            >
              <Tabs.Screen name="Sites" component={SitesScreen} />
              <Tabs.Screen name="Suppliers" component={SuppliersScreen} />
              <Tabs.Screen name="Labour" component={LabourScreen} />
              <Tabs.Screen name="Settings" component={SettingsScreen} />
            </Tabs.Navigator>
          )}
        </Stack.Screen>
        <Stack.Screen name="Site" component={SiteScreen} options={{ title: 'Site' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StoreProvider>
        <Root />
      </StoreProvider>
    </SafeAreaProvider>
  );
}

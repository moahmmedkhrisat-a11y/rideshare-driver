import React, { useState, createContext, useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from './screens/LoginScreen';
import DashboardScreen from './screens/DashboardScreen';
import translations from './i18n';

export const LangContext = createContext();

const Stack = createStackNavigator();

export default function App() {
  const [authData, setAuthData] = useState(null);
  const [lang, setLang] = useState('ar');
  const t = translations[lang];

  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      <NavigationContainer>
        <Stack.Navigator>
          {authData == null ? (
            <Stack.Screen
              name="Login"
              component={LoginScreen}
              options={{ headerShown: false }}
              initialParams={{ setAuthData }}
            />
          ) : (
            <Stack.Screen
              name="Dashboard"
              component={DashboardScreen}
              options={{
                title: t.driverTitle,
                headerLeft: () => null,
              }}
              initialParams={{ authData }}
            />
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </LangContext.Provider>
  );
}

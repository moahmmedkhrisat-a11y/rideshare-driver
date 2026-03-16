import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from './screens/LoginScreen';
import DashboardScreen from './screens/DashboardScreen';

const Stack = createStackNavigator();

export default function App() {
  const [authData, setAuthData] = useState(null);

  return (
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
                title: `Driver Dashboard (${authData.user.phone})`,
                headerLeft: null 
            }} 
            initialParams={{ authData }}
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

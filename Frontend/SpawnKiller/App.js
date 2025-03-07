import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Home from './src/home';
import map from './src/map';
import detection from "./src/detection";
import account from './src/account'
import about from './src/about'

const Stack = createNativeStackNavigator();

export default function App() {
    return (
        <NavigationContainer>
            <Stack.Navigator
                id="AppStack" // Add this id attribute
                initialRouteName="home"
            >
                <Stack.Screen
                    name="home"
                    component={Home}
                    options={{
                        headerShown: false,
                        animation: 'none'
                    }}
                />
                <Stack.Screen
                    name="map"
                    component={map}
                    options={{
                        headerShown: false,
                        animation: 'none'
                    }}
                />
                <Stack.Screen
                    name="detection"
                    component={detection}
                    options={{
                        headerShown: false,
                        animation: 'none'
                    }}
                />
                <Stack.Screen
                    name="about"
                    component={about}
                    options={{
                        headerShown: false,
                        animation: 'none'
                    }}
                />
                <Stack.Screen
                    name="account"
                    component={account}
                    options={{
                        headerShown: false,
                        animation: 'none'
                    }}
                />
            </Stack.Navigator>
        </NavigationContainer>
    );
}
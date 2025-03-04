import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  Platform,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons'; // Changed to FontAwesome5 from Ionicons
import { LinearGradient } from 'expo-linear-gradient';

// colors
const COLORS = {
  navyBlue: '#1A2A56',
  lightPurple: '#A5A6F6',
  white: '#FFFFFF',
  lightGray: '#F7F9FC',
  textDark: '#333333',
  textLight: '#777777',
  borderColor: '#E5E8EC',
  errorRed: '#FF3B30',
  accentOrange: '#FF9500',
  accentGreen: '#34C759',
  accentBlue: '#5AC8FA',
};

// store name and email
let globalUserData = {
  username: 'admin',
  email: 'admin@code2ah.com'
};

const Account = ({ navigation }) => {
  // local states
  const [localUsername, setLocalUsername] = useState(globalUserData.username);
  const [localEmail, setLocalEmail] = useState(globalUserData.email);
  const [emailError, setEmailError] = useState('');
  const [isFormValid, setIsFormValid] = useState(true);

  // verify email
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // change email
  const handleEmailChange = (text) => {
    setLocalEmail(text);

    if (text.trim() === '') {
      setEmailError('Email Required');
      setIsFormValid(false);
    } else if (!validateEmail(text)) {
      setEmailError('Enter Valid Email Address');
      setIsFormValid(false);
    } else {
      setEmailError('');
      setIsFormValid(true);
    }
  };

  // save function
  const handleSave = () => {
    if (!isFormValid) {
      Alert.alert('Error', 'Fix Errors');
      return;
    }

    // update name/email
    globalUserData = {
      ...globalUserData,
      username: localUsername,
      email: localEmail
    };

    Alert.alert('Success', 'Updated');

    console.log('Updated user data:', globalUserData);
  };

  return (
    <View style={styles.rootContainer}>
      <LinearGradient
        colors={[COLORS.lightPurple, COLORS.white]}
        locations={[0.2, 0.8]}
        style={styles.container}
      >
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.lightPurple} />

        {/* header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <FontAwesome5 name="arrow-left" size={20} color={COLORS.navyBlue} solid />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Account</Text>
          <View style={styles.headerRight} />
        </View>

        {/* account stuff */}
        <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Profile Information</Text>

            <View style={styles.inputContainer}>
              <View style={styles.inputLabelContainer}>
                <FontAwesome5 name="user" size={14} color={COLORS.textDark} solid style={styles.inputIcon} />
                <Text style={styles.inputLabel}>Username</Text>
              </View>
              <TextInput
                style={styles.textInput}
                value={localUsername}
                onChangeText={setLocalUsername}
                placeholder="Enter your username"
              />
              <View style={styles.inputUnderline} />
            </View>

            <View style={styles.inputContainer}>
              <View style={styles.inputLabelContainer}>
                <FontAwesome5 name="envelope" size={14} color={COLORS.textDark} solid style={styles.inputIcon} />
                <Text style={styles.inputLabel}>Email</Text>
              </View>
              <TextInput
                style={[styles.textInput, emailError ? styles.inputError : null]}
                value={localEmail}
                onChangeText={handleEmailChange}
                placeholder="Enter your email"
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <View style={[styles.inputUnderline, emailError ? styles.errorUnderline : null]} />
              {emailError ? (
                <View style={styles.errorContainer}>
                  <FontAwesome5 name="exclamation-circle" size={12} color={COLORS.errorRed} solid />
                  <Text style={styles.errorText}>{emailError}</Text>
                </View>
              ) : null}
            </View>

            <TouchableOpacity
              style={[styles.saveButton, !isFormValid && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={!isFormValid}
            >
              <FontAwesome5 name="save" size={16} color={COLORS.white} solid style={styles.buttonIcon} />
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* bottom nav */}
        <View style={styles.bottomNav}>
  <TouchableOpacity
    style={styles.navItem}
    onPress={() => navigation.navigate('home')}
  >
    <View style={styles.navIconContainer}>
      <FontAwesome5 name="home" size={20} color={COLORS.textLight} solid />
    </View>
    <Text style={styles.navText}>Home</Text>
  </TouchableOpacity>

  <TouchableOpacity
    style={styles.navItem}
    onPress={() => navigation.navigate('map')}
  >
    <View style={styles.navIconContainer}>
      <FontAwesome5 name="search-location" size={20} color={COLORS.textLight} solid />
    </View>
    <Text style={styles.navText}>Map</Text>
  </TouchableOpacity>
</View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingBottom: 16,
  },
  backButton: {
    padding: 10,
    backgroundColor: COLORS.white,
    borderRadius: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.navyBlue,
  },
  headerRight: {
    width: 40,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 80,
  },
  section: {
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.navyBlue,
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  inputIcon: {
    marginRight: 6,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textDark,
  },
  textInput: {
    paddingHorizontal: 0,
    paddingVertical: 8,
    fontSize: 16,
    color: COLORS.textDark,
    backgroundColor: 'transparent',
  },
  inputError: {
    color: COLORS.errorRed,
  },
  inputUnderline: {
    height: 1,
    backgroundColor: COLORS.borderColor,
    marginTop: 4,
  },
  errorUnderline: {
    backgroundColor: COLORS.errorRed,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  errorText: {
    color: COLORS.errorRed,
    fontSize: 12,
    marginLeft: 4,
  },
  saveButton: {
    backgroundColor: COLORS.navyBlue,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  buttonIcon: {
    marginRight: 8,
  },
  saveButtonDisabled: {
    backgroundColor: COLORS.textLight,
    opacity: 0.7,
  },
  saveButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '500',
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightPurple,
    paddingVertical: 12,
    position: 'absolute',
    bottom: 15,
    left: 0,
    right: 0,
  },
  navIconContainer: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
  },
  navText: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 4,
  },
});

export default Account;
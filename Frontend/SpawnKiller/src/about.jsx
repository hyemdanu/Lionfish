import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Platform,
  Image,
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
  accentOrange: '#FF9500',
  accentGreen: '#34C759',
  accentBlue: '#5AC8FA',
};

const About = ({ navigation }) => {
  return (
    <View style={styles.rootContainer}>
      <LinearGradient
        colors={[COLORS.lightPurple, COLORS.white]}
        locations={[0.2, 0.8]}
        style={styles.container}
      >
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.lightPurple} />

        {/* top header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <FontAwesome5 name="arrow-left" size={20} color={COLORS.navyBlue} solid />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>About</Text>
          <View style={styles.headerRight} />
        </View>

        {/* about */}
        <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              <FontAwesome5 name="users" size={16} color={COLORS.navyBlue} solid style={styles.sectionIcon} /> Who Are We
            </Text>
            <Text style={styles.sectionContent}>
              broke cs majors building funny stuff
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.section}>
            <Text style={styles.sectionContent}>
              Minh Nguyen | Sean Bombay | Daniel Ming
            </Text>
            <Text style={styles.sectionContent}>
              Matthew Anselmi | Edison Ho
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              <FontAwesome5 name="envelope" size={16} color={COLORS.navyBlue} solid style={styles.sectionIcon} /> Contact
            </Text>
            <Text style={styles.sectionContent}>
              We need money pls
            </Text>
          </View>

          {/* group image */}
          <View style={styles.imageSection}>
            <Image
              source={require('../assets/group.jpg')}
              style={styles.image}
              resizeMode="cover"
            />
            <View style={styles.imageOverlay}>
              <FontAwesome5 name="camera" size={20} color={COLORS.white} solid />
              <Text style={styles.imageText}>Team Photo</Text>
            </View>
          </View>

          <Text style={styles.copyRight}>
            <FontAwesome5 name="copyright" size={14} color={COLORS.textLight} solid /> C0DE2AH
          </Text>
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
  iconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.borderColor,
    marginVertical: 16,
  },
  section: {
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.navyBlue,
    marginBottom: 12,
    textAlign: "center",
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionIcon: {
    marginRight: 8,
  },
  sectionContent: {
    fontSize: 16,
    lineHeight: 24,
    color: COLORS.textDark,
    textAlign: "center"
  },
  imageSection: {
    marginTop: 20,
    marginBottom: 0,
    alignItems: 'center',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 400,
    borderRadius: 20,
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 15,
    right: 15,
    backgroundColor: 'rgba(26, 42, 86, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  imageText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 5,
  },
  copyRight: {
    fontSize: 14,
    color: COLORS.textLight,
    textAlign: 'center',
    marginTop: 24,
    marginBottom: 32,
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

export default About;
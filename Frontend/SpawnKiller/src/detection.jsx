import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Platform,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// colors
const COLORS = {
  navyBlue: '#1A2A56',
  lightPurple: '#A5A6F6',
  white: '#FFFFFF',
  lightGray: '#F7F9FC',
  textDark: '#333333',
  textLight: '#777777',
  accentOrange: '#FF9500',
  accentGreen: '#34C759',
  accentBlue: '#5AC8FA',
};

// change when needed
const SERVER_URL = 'http://192.168.50.42:5000';

const DetectionDetail = ({ route, navigation }) => {
  const { detection } = route.params;
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[COLORS.lightPurple, COLORS.white]}
        locations={[0.2, 0.8]}
        style={styles.gradient}
      >
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.lightPurple} />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <FontAwesome5 name="arrow-left" size={18} color={COLORS.navyBlue} solid />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Lionfish Detection</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.content}>
          {/* image */}
          <View style={styles.imageContainer}>
            {loading && !imageError && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.navyBlue} />
                <Text style={styles.loadingText}>Loading image...</Text>
              </View>
            )}

            {imageError ? (
              <View style={styles.errorContainer}>
                <FontAwesome5 name="exclamation-circle" size={48} color={COLORS.textLight} solid />
                <Text style={styles.errorText}>Image not available</Text>
              </View>
            ) : (
              <Image
                source={{ uri: `${SERVER_URL}/detection_image/${detection.image_id}` }}
                style={styles.image}
                onLoad={() => setLoading(false)}
                onError={() => {
                  setLoading(false);
                  setImageError(true);
                }}
              />
            )}
          </View>

          {/* details */}
          <View style={styles.detailsContainer}>
            <Text style={styles.detailsTitle}>Detection Details</Text>

            <View style={styles.detailItem}>
              <View style={styles.detailIconContainer}>
                <FontAwesome5 name="calendar-alt" size={16} color={COLORS.navyBlue} solid />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Timestamp</Text>
                <Text style={styles.detailValue}>{formatTimestamp(detection.timestamp)}</Text>
              </View>
            </View>

            <View style={styles.detailItem}>
              <View style={styles.detailIconContainer}>
                <FontAwesome5 name="map-marker-alt" size={16} color={COLORS.navyBlue} solid />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Location</Text>
                <Text style={styles.detailValue}>{detection.location}</Text>
              </View>
            </View>

            <View style={styles.detailItem}>
              <View style={styles.detailIconContainer}>
                <FontAwesome5 name="percentage" size={16} color={COLORS.navyBlue} solid />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Confidence</Text>
                <Text style={styles.detailValue}>{detection.confidence}%</Text>
              </View>
            </View>

            {/* Confidence Bar */}
            <View style={styles.confidenceBarContainer}>
              <View style={styles.confidenceBarBg}>
                <View
                  style={[
                    styles.confidenceBarFill,
                    {
                      width: `${detection.confidence}%`,
                      backgroundColor: detection.confidence > 80
                        ? COLORS.accentGreen
                        : detection.confidence > 60
                          ? COLORS.accentOrange
                          : COLORS.accentBlue
                    }
                  ]}
                />
              </View>
            </View>

            {/* info on lionfish */}
            <View style={styles.infoCard}>
              <View style={styles.infoHeader}>
                <FontAwesome5 name="info-circle" size={18} color={COLORS.navyBlue} solid />
                <Text style={styles.infoTitle}>Lionfish Information</Text>
              </View>
              <Text style={styles.infoText}>
                The lionfish (Pterois species) is a venomous, predatory fish native to the Indo-Pacific but is now an invasive species in the Atlantic Ocean, particularly in the Caribbean and along the U.S. East Coast. Recognizable by its red, white, and brown striped body with long, venomous spines, the lionfish has no natural predators in these non-native waters.
                Its invasion is a major ecological threat because it rapidly reproduces, consumes large quantities of native fish and crustaceans, and disrupts marine ecosystems by reducing biodiversity. Without natural controls, lionfish populations grow unchecked, outcompeting native species and damaging coral reef health. Efforts to control them include organized hunting, spearfishing, and culinary use to mitigate their impact.
              </Text>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingBottom: 10,
  },
  backButton: {
    padding: 10,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.navyBlue,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  imageContainer: {
    height: 250,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    overflow: 'hidden',
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
  },
  loadingText: {
    marginTop: 10,
    color: COLORS.textDark,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
  },
  errorText: {
    marginTop: 10,
    color: COLORS.textDark,
    fontSize: 16,
  },
  detailsContainer: {
    marginTop: 24,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 24,
  },
  detailsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textDark,
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'center',
  },
  detailIconContainer: {
    width: 36,
    height: 36,
    backgroundColor: COLORS.lightGray,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailContent: {
    marginLeft: 16,
    flex: 1,
  },
  detailLabel: {
    fontSize: 14,
    color: COLORS.textLight,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.textDark,
    marginTop: 2,
  },
  confidenceBarContainer: {
    marginTop: 8,
    marginBottom: 24,
  },
  confidenceBarBg: {
    height: 8,
    backgroundColor: COLORS.lightGray,
    borderRadius: 4,
    overflow: 'hidden',
  },
  confidenceBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  infoCard: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textDark,
    marginLeft: 8,
  },
  infoText: {
    fontSize: 14,
    color: COLORS.textDark,
    lineHeight: 20,
  },
});

export default DetectionDetail;
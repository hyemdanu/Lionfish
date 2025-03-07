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

// replace with your server IP and port
// ------------------------------------------------ When at home/somewhere else
// ------------------------------------------------
// const SERVER_URL = 'http://192.168.50.42:5000';
// ------------------------------------------------
// ------------------------------------------------ When at school
const SERVER_URL = 'http://10.117.235.226:5000';
// ------------------------------------------------
// ------------------------------------------------

const DetectionDetail = ({ route, navigation }) => {
  const { detection } = route.params;
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [lionfishFact, setLionfishFact] = useState('');
  const [loadingFact, setLoadingFact] = useState(true);

  useEffect(() => {
    fetchRandomLionfishFact();
  }, []);

  const fetchRandomLionfishFact = async () => {
    setLoadingFact(true);
    try {
      const response = await fetch(`${SERVER_URL}/random_lionfish_fact`);
      if (response.ok) {
        const data = await response.json();
        setLionfishFact(data.fact);
      } else {
        // Fallback if fetch fails
        setLionfishFact("Lionfish have distinctive red and white stripes and venomous spines.");
      }
    } catch (error) {
      console.error('Error fetching lionfish fact:', error);
      // Fallback if fetch fails
      setLionfishFact("Lionfish have distinctive red and white stripes and venomous spines.");
    } finally {
      setLoadingFact(false);
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  // format the coordinates nicely
  const formatCoordinates = (location) => {
    if (!location || !location.includes(',')) {
      return 'Location not available';
    }

    const [lat, lng] = location.split(',').map(coord => parseFloat(coord));

    // format latitude (N/S)
    const latDirection = lat >= 0 ? 'N' : 'S';
    const latFormatted = `${Math.abs(lat).toFixed(6)}° ${latDirection}`;

    // format longitude (E/W)
    const lngDirection = lng >= 0 ? 'E' : 'W';
    const lngFormatted = `${Math.abs(lng).toFixed(6)}° ${lngDirection}`;

    return `${latFormatted}, ${lngFormatted}`;
  };

  // get region name if available
  const getRegionName = () => {
    return detection.region ? detection.region : 'Unknown Area';
  };

  // determine whether location is from GPS
  const isGpsLocation = () => {
    return detection.location_source === 'GPS';
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
              <View style={[
                styles.detailIconContainer,
                isGpsLocation() && styles.gpsIconContainer
              ]}>
                <FontAwesome5
                  name={isGpsLocation() ? "satellite-dish" : "map-marker-alt"}
                  size={16}
                  color={isGpsLocation() ? COLORS.white : COLORS.navyBlue}
                  solid
                />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>
                  Coordinates {isGpsLocation() && <Text style={styles.gpsTag}>(GPS)</Text>}
                </Text>
                <Text style={styles.detailValue}>{formatCoordinates(detection.location)}</Text>
              </View>
            </View>

            <View style={styles.detailItem}>
              <View style={styles.detailIconContainer}>
                <FontAwesome5 name="water" size={16} color={COLORS.navyBlue} solid />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Region</Text>
                <Text style={styles.detailValue}>{getRegionName()}</Text>
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

            {/* confidence bar */}
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

            {/* Location Source */}
            <View style={styles.locationSourceContainer}>
              <View style={[
                styles.locationSourceBadge,
                {
                  backgroundColor: isGpsLocation() ? COLORS.accentGreen : COLORS.lightPurple
                }
              ]}>
                <FontAwesome5
                  name={isGpsLocation() ? "satellite-dish" : "map"}
                  size={14}
                  color={COLORS.white}
                  solid
                />
                <Text style={styles.locationSourceText}>
                  {isGpsLocation() ? 'GPS Location' : 'Approximate Location'}
                </Text>
              </View>
              <Text style={styles.locationAccuracyText}>
                Location captured by the GPS.
              </Text>
            </View>

            {/* random lionfish facts */}
            <View style={styles.infoCard}>
              <View style={styles.infoHeader}>
                <FontAwesome5 name="fish" size={18} color={COLORS.navyBlue} solid />
                <Text style={styles.infoTitle}>Lionfish Fact</Text>
                <TouchableOpacity
                  style={styles.refreshButton}
                  onPress={fetchRandomLionfishFact}
                  disabled={loadingFact}
                >
                  <FontAwesome5
                    name="sync"
                    size={14}
                    color={COLORS.white}
                    solid
                  />
                </TouchableOpacity>
              </View>

              {loadingFact ? (
                <View style={styles.factLoadingContainer}>
                  <ActivityIndicator size="small" color={COLORS.navyBlue} />
                  <Text style={styles.loadingFactText}>Loading fact...</Text>
                </View>
              ) : (
                <Text style={styles.infoText}>
                  {lionfishFact}
                </Text>
              )}
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
  gpsIconContainer: {
    backgroundColor: COLORS.accentGreen,
  },
  detailContent: {
    marginLeft: 16,
    flex: 1,
  },
  detailLabel: {
    fontSize: 14,
    color: COLORS.textLight,
  },
  gpsTag: {
    color: COLORS.accentGreen,
    fontWeight: 'bold',
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
  locationSourceContainer: {
    marginBottom: 24,
  },
  locationSourceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 8,
  },
  locationSourceText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 8,
  },
  locationAccuracyText: {
    fontSize: 14,
    color: COLORS.textLight,
    fontStyle: 'italic',
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
    flex: 1,
  },
  infoText: {
    fontSize: 14,
    color: COLORS.textDark,
    lineHeight: 20,
  },
  refreshButton: {
    backgroundColor: COLORS.navyBlue,
    borderRadius: 14,
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  factLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  loadingFactText: {
    marginLeft: 8,
    fontSize: 14,
    color: COLORS.textLight,
    fontStyle: 'italic',
  },
});

export default DetectionDetail;
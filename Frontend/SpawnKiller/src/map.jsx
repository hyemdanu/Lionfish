import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  Platform,
  Dimensions,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import MapView, { Marker, Callout, PROVIDER_DEFAULT } from 'react-native-maps';
import * as Location from 'expo-location';

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

const fishColorMap = {};

const getConsistentColor = (id) => {
  if (fishColorMap[id]) {
    return fishColorMap[id];
  }

  const colorOptions = [
    COLORS.accentOrange,
    COLORS.accentGreen,
    COLORS.accentBlue,
    COLORS.lightPurple,
    COLORS.navyBlue
  ];

  const newColor = colorOptions[Object.keys(fishColorMap).length % colorOptions.length];
  fishColorMap[id] = newColor;
  return newColor;
};

// Format coordinates in a more readable way
const formatCoordinates = (location) => {
  if (!location || !location.includes(',')) {
    return 'Unknown Location';
  }

  const [lat, lng] = location.split(',').map(coord => parseFloat(coord));

  // Format latitude (N/S)
  const latDirection = lat >= 0 ? 'N' : 'S';
  const latFormatted = `${Math.abs(lat).toFixed(4)}° ${latDirection}`;

  // Format longitude (E/W)
  const lngDirection = lng >= 0 ? 'E' : 'W';
  const lngFormatted = `${Math.abs(lng).toFixed(4)}° ${lngDirection}`;

  return `${latFormatted}, ${lngFormatted}`;
};

const Map = ({ navigation }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [detectionLocations, setDetectionLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [region, setRegion] = useState({
    latitude: 25.7617, // Default to a general location (Miami)
    longitude: -80.1918,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  const mapRef = useRef(null);

  // Get user location and permission
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Permission to access location was denied');
        setIsLoading(false);
        return;
      }

      try {
        let location = await Location.getCurrentPositionAsync({});
        setUserLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });

        // update region
        setRegion({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        });
      } catch (error) {
        console.log('Error getting location:', error);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // Fetch detection data
  useEffect(() => {
    const fetchDetectionData = async () => {
      try {
        const response = await fetch(`${SERVER_URL}/all_detections`);
        const data = await response.json();

        if (data && data.detections) {
          const formattedLocations = data.detections.map(detection => {
            const [lat, lng] = detection.location.split(',').map(Number);

            // Calculate time display for consistency
            const date = new Date(detection.timestamp);
            const now = new Date();
            const diffMinutes = Math.floor((now - date) / 60000);

            let timeDisplay;
            if (diffMinutes < 1) {
              timeDisplay = 'Just now';
            } else if (diffMinutes < 60) {
              timeDisplay = `${diffMinutes} min ago`;
            } else {
              const hours = Math.floor(diffMinutes / 60);
              timeDisplay = `${hours} hour${hours > 1 ? 's' : ''} ago`;
            }

            return {
              id: detection.id || Date.now() + Math.random(),
              title: 'Lionfish Detected',
              location: `${lat},${lng}`,
              latitude: lat,
              longitude: lng,
              time: timeDisplay,
              confidence: detection.confidence,
              timestamp: detection.timestamp,
              color: getConsistentColor(detection.image_id),
              image_id: detection.image_id,
              region: detection.region || 'Unknown Area',
              location_source: detection.location_source || 'Unknown',
              coordinates: formatCoordinates(`${lat},${lng}`),
            };
          });

          setDetectionLocations(formattedLocations);
        }
      } catch (error) {
        console.error('Error fetching detection locations:', error);
      }
    };

    fetchDetectionData();
    const interval = setInterval(fetchDetectionData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Handle marker press
  const handleMarkerPress = (location) => {
    setSelectedLocation(location);
  };

  // Handle view details
  const handleViewDetails = () => {
    if (selectedLocation) {
      navigation.navigate('detection', { detection: selectedLocation });
    }
  };

  // Center map on user location
  const centerOnUserLocation = () => {
    if (userLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 1000);
    }
  };

  return (
    <View style={styles.rootContainer}>
      <LinearGradient
        colors={[COLORS.lightPurple, COLORS.white]}
        locations={[0.2, 0.8]}
        style={styles.container}
      >
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.lightPurple} />

        {/* top icons */}
        <View style={styles.topIconsContainer}>
          <View style={styles.leftIcons}>
            <TouchableOpacity
              style={styles.iconButtonBubble}
              onPress={() => navigation.navigate('about')}
            >
              <FontAwesome5 name="info-circle" size={24} color={COLORS.navyBlue} solid />
            </TouchableOpacity>
          </View>

          <Text style={styles.pageTitle}>Fishy Map</Text>

          <View style={styles.rightIcons}>
            <TouchableOpacity
              style={styles.iconButtonBubble}
              onPress={() => navigation.navigate('account')}
            >
              <FontAwesome5 name="cog" size={24} color={COLORS.navyBlue} solid />
            </TouchableOpacity>
          </View>
        </View>

        {/* Map container */}
        <View style={styles.mapContainer}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.navyBlue} />
              <Text style={styles.loadingText}>Loading map...</Text>
            </View>
          ) : (
            <View style={styles.mapWrapper}>
              <MapView
                ref={mapRef}
                style={styles.map}
                provider={PROVIDER_DEFAULT}
                initialRegion={region}
                showsUserLocation={true}
                showsMyLocationButton={false}
                showsCompass={true}
                customMapStyle={mapStyle}
              >
                {detectionLocations.map((location) => (
                  <Marker
                    key={location.id}
                    coordinate={{
                      latitude: location.latitude,
                      longitude: location.longitude,
                    }}
                    onPress={() => handleMarkerPress(location)}
                  >
                    <View style={[
                      styles.markerContainer,
                      {
                        backgroundColor: location.color,
                        borderColor: location.location_source === 'GPS' ? COLORS.accentGreen : COLORS.white,
                        borderWidth: location.location_source === 'GPS' ? 3 : 2,
                      }
                    ]}>
                      <FontAwesome5 name="fish" size={16} color={COLORS.white} solid />
                    </View>
                  </Marker>
                ))}
              </MapView>

              {/* My location button */}
              <TouchableOpacity
                style={styles.myLocationButton}
                onPress={centerOnUserLocation}
              >
                <FontAwesome5 name="location-arrow" size={18} color={COLORS.navyBlue} solid />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Selected location info card */}
        {selectedLocation && (
          <View style={styles.selectedLocationCard}>
            <View style={styles.cardHeader}>
              <View style={[styles.locationIcon, { backgroundColor: selectedLocation.color }]}>
                <FontAwesome5 name="fish" size={20} color={COLORS.white} solid />
                {selectedLocation.location_source === 'GPS' && (
                  <View style={styles.gpsIndicatorBadge}>
                    <FontAwesome5 name="satellite-dish" size={10} color={COLORS.white} solid />
                  </View>
                )}
              </View>
              <View style={styles.locationInfo}>
                <Text style={styles.locationTitle}>{selectedLocation.title}</Text>
                <Text style={styles.locationTime}>
                  {selectedLocation.time} • {selectedLocation.confidence}% confidence
                </Text>
                <Text style={styles.locationDetails}>
                  📍 {selectedLocation.region || 'Unknown Area'}
                </Text>
                <Text style={styles.locationCoordinates}>
                  {selectedLocation.coordinates}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.viewDetailsButton}
              onPress={handleViewDetails}
            >
              <Text style={styles.viewDetailsText}>View Details</Text>
              <FontAwesome5 name="arrow-right" size={16} color={COLORS.white} solid />
            </TouchableOpacity>
          </View>
        )}

        {/* Recent detections section */}
        <View style={styles.recentDetectionsSection}>
          <Text style={styles.sectionTitle}>Fishy Finding </Text>
          {detectionLocations.length > 0 ? (
            <ScrollView
              style={styles.recentList}
              horizontal={true}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.recentListContent}
            >
              {detectionLocations.slice(0, 10).reverse().map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.recentItem}
                  onPress={() => {
                    setSelectedLocation(item);
                    if (mapRef.current) {
                      mapRef.current.animateToRegion({
                        latitude: item.latitude,
                        longitude: item.longitude,
                        latitudeDelta: 0.01,
                        longitudeDelta: 0.01,
                      }, 1000);
                    }
                  }}
                >
                  <View style={[
                    styles.recentIcon,
                    {
                      backgroundColor: item.color,
                      borderColor: item.location_source === 'GPS' ? COLORS.accentGreen : 'transparent',
                      borderWidth: item.location_source === 'GPS' ? 2 : 0,
                    }
                  ]}>
                    <FontAwesome5 name="fish" size={22} color={COLORS.white} solid />
                  </View>
                  <Text style={styles.recentTime}>{item.time}</Text>
                  <Text style={styles.recentLocation}>{item.coordinates}</Text>
                  <Text style={styles.recentConfidence}>{item.confidence}% confidence</Text>
                  {item.location_source === 'GPS' && (
                    <View style={styles.gpsBadge}>
                      <Text style={styles.gpsBadgeText}>GPS</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.emptyRecentContainer}>
              <Text style={styles.emptyRecentText}>No recent detections</Text>
            </View>
          )}
        </View>

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

          <TouchableOpacity style={styles.navItem}>
            <View style={styles.navIconContainer}>
              <View style={styles.navIconActive}>
                <FontAwesome5 name="search-location" size={20} color={COLORS.white} solid />
              </View>
            </View>
            <Text style={[styles.navText, styles.activeNavText]}>Map</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );
};

// Google Maps custom style (dark blue theme matching app)
const mapStyle = [
  {
    "featureType": "water",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#3e8fda"
      }
    ]
  },
  {
    "featureType": "landscape",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#f3f4f6"
      }
    ]
  },
  {
    "featureType": "poi",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#d7e1ee"
      }
    ]
  },
  {
    "featureType": "road",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#ffffff"
      }
    ]
  },
  {
    "featureType": "transit",
    "stylers": [
      {
        "visibility": "off"
      }
    ]
  }
];

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  topIconsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingBottom: 10,
  },
  leftIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rightIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.navyBlue,
  },
  iconButtonBubble: {
    padding: 12,
    marginRight: 5,
    backgroundColor: COLORS.white,
    borderRadius: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  mapContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    margin: 16,
    marginTop: 5,
    height: 350,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    overflow: 'hidden',
  },
  mapWrapper: {
    flex: 1,
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
  },
  loadingText: {
    marginTop: 10,
    color: COLORS.textDark,
    fontSize: 16,
  },
  markerContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.accentOrange,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  gpsIndicatorBadge: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    backgroundColor: COLORS.accentGreen,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.white,
  },
  myLocationButton: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  selectedLocationCard: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    margin: 16,
    marginTop: 0,
    marginBottom: 10,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  locationIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  locationInfo: {
    flex: 1,
    marginLeft: 14,
  },
  locationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textDark,
  },
  locationTime: {
    fontSize: 13,
    color: COLORS.textLight,
    marginTop: 3,
  },
  locationDetails: {
    fontSize: 13,
    color: COLORS.textLight,
    marginTop: 3,
  },
  locationCoordinates: {
    fontSize: 13,
    color: COLORS.navyBlue,
    fontWeight: '500',
    marginTop: 2,
  },
  viewDetailsButton: {
    backgroundColor: COLORS.navyBlue,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewDetailsText: {
    color: COLORS.white,
    fontWeight: '600',
    marginRight: 8,
  },
  recentDetectionsSection: {
    marginHorizontal: 16,
    marginBottom: 100,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: COLORS.textDark,
  },
  recentList: {
    flexDirection: 'row',
  },
  recentListContent: {
    paddingRight: 16,
    paddingBottom: 8,
    paddingLeft: 4,
  },
  recentItem: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 14,
    marginRight: 12,
    width: 140,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    minHeight: 190,
    position: 'relative',
  },
  recentIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  recentTime: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    color: COLORS.textDark,
    marginBottom: 4,
  },
  recentLocation: {
    fontSize: 11,
    textAlign: 'center',
    color: COLORS.navyBlue,
    marginBottom: 4,
    fontWeight: '500',
  },
  recentConfidence: {
    fontSize: 11,
    textAlign: 'center',
    color: COLORS.textLight,
    paddingHorizontal: 2,
  },
  gpsBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: COLORS.accentGreen,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  gpsBadgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
  emptyRecentContainer: {
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyRecentText: {
    fontSize: 14,
    color: COLORS.textLight,
    fontStyle: 'italic',
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
  navIconActive: {
    backgroundColor: COLORS.navyBlue,
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navText: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 4,
    fontWeight: '500',
  },
  activeNavText: {
    color: COLORS.navyBlue,
    fontWeight: '600',
  },
});

export default Map;
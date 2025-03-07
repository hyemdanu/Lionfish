import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Platform,
  Animated,
  Image,
  ActivityIndicator,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons'; // Using FontAwesome5 with solid variants
import { LinearGradient } from 'expo-linear-gradient';
import { WebView } from 'react-native-webview';

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

// Color map to ensure consistent colors for each fish
const fishColorMap = {};

// Function to get a consistent color for a specific detection
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

const Home = ({ navigation }) => {
  const [activeCamera, setActiveCamera] = useState('front');
  const [isStreaming, setIsStreaming] = useState(true);
  const [isLoading, setIsLoading] = useState(true); // Explicit loading state
  const [detectionHistory, setDetectionHistory] = useState([]);

  // Add a timeout effect to force-hide the loading screen
  useEffect(() => {
    if (isStreaming && isLoading) {
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 2000); // Hide loading after 2 seconds

      return () => clearTimeout(timer);
    }
  }, [isStreaming, isLoading]);

  // toggle streaming
  const toggleStreaming = () => {
    if (!isStreaming) {
      setIsLoading(true);
    }
    setIsStreaming(!isStreaming);
  };

  // get detection log
  useEffect(() => {
    let interval;
    if (isStreaming) {
      // First load all existing detections when component mounts
      const loadAllDetections = async () => {
        try {
          const response = await fetch(`${SERVER_URL}/all_detections`);
          const data = await response.json();

          if (data && data.detections && data.detections.length > 0) {
            // Format the existing detections for display
            const formattedDetections = data.detections.map(detection => {
              // Calculate time display
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
                location: detection.location,
                region: detection.region || 'Unknown Area',
                time: timeDisplay,
                confidence: detection.confidence,
                timestamp: detection.timestamp,
                image_id: detection.image_id,
              };
            });

            // Keep most recent 15
            setDetectionHistory(formattedDetections.slice(0, 15));
          }
        } catch (error) {
          console.error('Error loading all detections:', error);
        }
      };

      // Load existing detections when component mounts
      loadAllDetections();

      // Set up polling for new detections
      interval = setInterval(async () => {
        try {
          const response = await fetch(`${SERVER_URL}/detection_data`);
          const data = await response.json();

          if (data.detected) {
            // Check if new detection
            const alreadyExists = detectionHistory.some(
              item => item.timestamp === data.timestamp
            );

            if (!alreadyExists) {
              // Calculate time diff
              const date = new Date(data.timestamp);
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

              // Get realistic location from server instead of using "Main Camera"
              const locResponse = await fetch(`${SERVER_URL}/all_detections?single=true`);
              const locData = await locResponse.json();
              let location = "Unknown";
              let region = "Unknown Area";

              if (locData && locData.detections && locData.detections.length > 0) {
                location = locData.detections[0].location;
                region = locData.detections[0].region || "Unknown Area";
              }

              const newDetection = {
                id: Date.now(),
                title: 'Lionfish Detected',
                location: location,
                region: region,
                time: timeDisplay,
                confidence: data.confidence,
                timestamp: data.timestamp,
                image_id: data.image_id,
              };

              // Keep up to 15 most recent detections
              setDetectionHistory(prev => [newDetection, ...prev.slice(0, 14)]);
            }
          }
        } catch (error) {
          console.error('Error fetching detection data:', error);
        }
      }, 8000); // Check every 8 seconds
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isStreaming, detectionHistory]);

  // Handle detection item press - navigate to detail view
  const handleDetectionPress = (detection) => {
    navigation.navigate('detection', { detection });
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

          <View style={styles.rightIcons}>
            <TouchableOpacity
              style={styles.iconButtonBubble}
              onPress={() => navigation.navigate('account')}
            >
              <FontAwesome5 name="cog" size={24} color={COLORS.navyBlue} solid />
            </TouchableOpacity>
          </View>
        </View>

        {/* camera view */}
        <View style={styles.mainCameraContainer}>
          <View style={styles.cameraView}>
            {isStreaming ? (
              <View style={styles.webViewContainer}>
                <WebView
                  style={styles.webView}
                  source={{ uri: `${SERVER_URL}/video_feed` }}
                  startInLoadingState={false}
                  javaScriptEnabled={true}
                  domStorageEnabled={true}
                  cacheEnabled={false}
                  originWhitelist={['*']}
                  onError={(error) => {
                    console.error("WebView error:", error);
                    setIsStreaming(false);
                  }}
                />

                {/* loading overlay*/}
                {isLoading && (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.navyBlue} />
                    <Text style={styles.loadingText}>Connecting to camera...</Text>
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.cameraPlaceholder}>
                <View style={styles.cameraIconContainer}>
                  <FontAwesome5 name="video" size={34} color={COLORS.navyBlue} solid />
                </View>
                <Text style={styles.cameraPlaceholderText}>
                  Camera Stream Unavailable
                </Text>
              </View>
            )}

            {/* camera controls */}
            <View style={styles.cameraControls}>
              <TouchableOpacity style={styles.cameraControlButton} onPress={toggleStreaming}>
                <FontAwesome5
                  name={isStreaming ? "pause" : "play"}
                  size={16}
                  color={COLORS.white}
                  solid
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.activitySection}>
          <Text style={styles.sectionTitle}>Fishy Logs</Text>
          {detectionHistory.length > 0 ? (
            <ScrollView
                style={styles.activityList}
                contentContainerStyle={styles.activityListContent}
                showsVerticalScrollIndicator={false}
            >
              {detectionHistory.reverse().map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.activityItem}
                  onPress={() => handleDetectionPress(item)}
                >
                  <View style={[styles.activityIcon, {backgroundColor: getConsistentColor(item.image_id)}]}>
                    <FontAwesome5 name="fish" size={20} color={COLORS.white} solid />
                  </View>
                  <View style={styles.activityContent}>
                    <Text style={styles.activityTitle}>{item.title}</Text>
                    <Text style={styles.activityTime}>
                      {item.region} • {item.time}
                    </Text>
                    <Text style={styles.activityConfidence}>
                      {item.confidence}% confidence
                    </Text>
                  </View>
                  <FontAwesome5 name="chevron-circle-right" size={22} color={COLORS.textLight} solid />
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.emptyActivityContainer}>
              <Text style={styles.emptyActivityText}>No lionfish detections yet</Text>
            </View>
          )}
        </View>

        {/* bottom nav */}
        <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.navItem}>
            <View style={styles.navIconContainer}>
              <View style={styles.navIconActive}>
                <FontAwesome5 name="home" size={20} color={COLORS.white} solid />
              </View>
            </View>
            <Text style={[styles.navText, styles.activeNavText]}>Home</Text>
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
  mainCameraContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    margin: 16,
    marginTop: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    overflow: 'hidden',
  },
  cameraView: {
    height: 300,
    backgroundColor: COLORS.lightGray,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  webViewContainer: {
    flex: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  webView: {
    flex: 1,
    backgroundColor: 'black',
  },
  cameraPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  cameraPlaceholderText: {
    fontSize: 18,
    color: COLORS.textDark,
    fontWeight: '600',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(247, 249, 252, 0.8)',
  },
  loadingText: {
    marginTop: 10,
    color: COLORS.textDark,
    fontSize: 16,
  },
  cameraControls: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  cameraControlButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.navyBlue,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  cameraLabel: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  activitySection: {
    flex: 1,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
    color: COLORS.textDark,
  },
  activityList: {
    flex: 1,
  },
  activityListContent: {
    paddingBottom: 90,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 18,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  activityIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityContent: {
    flex: 1,
    marginLeft: 14,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textDark,
  },
  activityTime: {
    fontSize: 13,
    color: COLORS.textLight,
    marginTop: 3,
  },
  activityConfidence: {
    fontSize: 13,
    color: COLORS.textLight,
    marginTop: 2,
  },
  emptyActivityContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyActivityText: {
    fontSize: 16,
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

export default Home;
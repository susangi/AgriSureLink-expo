import React, { useState, useEffect } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  RefreshControl,
} from "react-native";
import {
  Card,
  Title,
  Paragraph,
  Button,
  Chip,
  ActivityIndicator,
  Text,
  Divider,
} from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Layout from "../components/Layout";
import NetInfo from "@react-native-community/netinfo";
import * as Location from "expo-location";

const ALERTS_STORAGE_KEY = `weather_alerts`;
const ALERTS_HISTORY_KEY = `alerts_history`;

export default function AlertsScreen({ navigation }) {
  const [alerts, setAlerts] = useState([]);
  const [alertHistory, setAlertHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [offlineData, setOfflineData] = useState(false);
  const [location, setLocation] = useState(null);
  const [apiError, setApiError] = useState(false);

  // Check network status
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(state.isConnected);
    });
    return () => unsubscribe();
  }, []);

  // Load offline alerts and history
  const loadOfflineAlerts = async () => {
    try {
      const [storedAlerts, storedHistory] = await Promise.all([
        AsyncStorage.getItem(ALERTS_STORAGE_KEY),
        AsyncStorage.getItem(ALERTS_HISTORY_KEY),
      ]);

      if (storedAlerts) {
        const parsedAlerts = JSON.parse(storedAlerts);
        setAlerts(parsedAlerts);
      }

      if (storedHistory) {
        const parsedHistory = JSON.parse(storedHistory);
        // Sort by date, most recent first
        const sortedHistory = parsedHistory.sort(
          (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
        );
        setAlertHistory(sortedHistory);
      }

      setOfflineData(true);
    } catch (error) {
      console.error("Error loading offline alerts:", error);
    }
  };

  // Save alerts to storage
  const saveAlertsToStorage = async (alertsData) => {
    try {
      await AsyncStorage.setItem(
        ALERTS_STORAGE_KEY,
        JSON.stringify(alertsData)
      );
    } catch (error) {
      console.error("Error saving alerts to storage:", error);
    }
  };

  // Save to alert history
  const saveToAlertHistory = async (newAlerts) => {
    try {
      const existingHistory = await AsyncStorage.getItem(ALERTS_HISTORY_KEY);
      let history = existingHistory ? JSON.parse(existingHistory) : [];

      // Add new alerts to history with timestamp
      const timestampedAlerts = newAlerts.map((alert) => ({
        ...alert,
        timestamp: new Date().toISOString(),
        id: `${alert.type}_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`,
      }));

      // Combine and limit history to last 100 alerts
      const updatedHistory = [...timestampedAlerts, ...history].slice(0, 100);

      await AsyncStorage.setItem(
        ALERTS_HISTORY_KEY,
        JSON.stringify(updatedHistory)
      );
      setAlertHistory(updatedHistory);
    } catch (error) {
      console.error("Error saving to alert history:", error);
    }
  };

  // Get user location
  const getLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.log("Location permission denied");
        return null;
      }

      let location = await Location.getCurrentPositionAsync({});
      return location.coords;
    } catch (error) {
      console.error("Error getting location:", error);
      return null;
    }
  };

  // Process weather data into alerts - FIXED with better error handling
  const processWeatherData = (weatherData) => {
    const alerts = [];

    // Check if weatherData is valid
    if (!weatherData || !weatherData.weather || !weatherData.weather[0]) {
      console.log("Invalid weather data received:", weatherData);
      return getMockAlerts();
    }

    // Check for severe weather conditions
    if (weatherData.weather[0].main === "Thunderstorm") {
      alerts.push({
        type: "severe",
        title: "⚡ Thunderstorm Warning",
        message:
          "Thunderstorms detected in your area. Secure loose items and avoid open fields.",
        severity: "high",
        category: "weather",
        area: "Your location",
        validUntil: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
      });
    }

    // Check wind speed safely
    if (weatherData.wind && weatherData.wind.speed > 8) {
      alerts.push({
        type: "wind",
        title: "💨 High Wind Alert",
        message: `Strong winds (${Math.round(
          weatherData.wind.speed * 3.6
        )} km/h) expected. Protect sensitive crops.`,
        severity: "moderate",
        category: "weather",
        area: "Your location",
        validUntil: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
      });
    }

    // Check temperature safely
    if (weatherData.main && weatherData.main.temp < 5) {
      alerts.push({
        type: "cold",
        title: "❄️ Frost Warning",
        message: "Low temperatures expected. Protect crops from frost damage.",
        severity: "moderate",
        category: "temperature",
        area: "Your location",
        validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      });
    }

    if (weatherData.main && weatherData.main.temp > 35) {
      alerts.push({
        type: "heat",
        title: "🌡️ Heat Wave Alert",
        message: "Extreme heat expected. Ensure proper irrigation for crops.",
        severity: "moderate",
        category: "temperature",
        area: "Your location",
        validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      });
    }

    // Check rain safely
    if (weatherData.rain && weatherData.rain["1h"] > 10) {
      alerts.push({
        type: "rain",
        title: "🌧️ Heavy Rain Alert",
        message: "Heavy rainfall expected. Check drainage systems.",
        severity: "moderate",
        category: "weather",
        area: "Your location",
        validUntil: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
      });
    }

    // If no specific alerts, provide general weather info
    if (alerts.length === 0) {
      const temp = weatherData.main ? Math.round(weatherData.main.temp) : "N/A";
      const description = weatherData.weather[0].description || "clear";

      alerts.push({
        type: "info",
        title: "✅ Weather Conditions Normal",
        message: `Current weather: ${description}. Temperature: ${temp}°C. Good farming conditions.`,
        severity: "low",
        category: "weather",
        area: "Your location",
        validUntil: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
      });
    }

    return alerts;
  };

  // Mock alerts for demo/fallback
  const getMockAlerts = (location = null) => {
    const area = location ? "Your farm area" : "Regional";
    const currentMonth = new Date().getMonth();
    const isWinter = currentMonth >= 10 || currentMonth <= 2; // Nov-Feb
    const isSummer = currentMonth >= 5 && currentMonth <= 8; // Jun-Aug

    const baseAlerts = [
      {
        type: "wind",
        title: "💨 High Wind Alert",
        message:
          "Strong winds expected in the next 24 hours. Secure farm equipment and protect sensitive crops.",
        severity: "moderate",
        category: "weather",
        area: area,
        validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      },
    ];

    // Seasonal alerts
    if (isWinter) {
      baseAlerts.push({
        type: "cold",
        title: "❄️ Winter Advisory",
        message:
          "Cold temperatures expected. Protect crops from frost and check irrigation systems.",
        severity: "moderate",
        category: "temperature",
        area: area,
        validUntil: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      });
    }

    if (isSummer) {
      baseAlerts.push({
        type: "heat",
        title: "🌡️ Summer Heat Alert",
        message:
          "High temperatures expected. Ensure proper irrigation and monitor crop hydration.",
        severity: "moderate",
        category: "temperature",
        area: area,
        validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      });
    }

    // Random pest alert (30% chance)
    if (Math.random() > 0.7) {
      baseAlerts.push({
        type: "pest",
        title: "🐛 Pest Monitoring",
        message:
          "Increased pest activity reported in your region. Monitor crops closely.",
        severity: "low",
        category: "pest",
        area: "Regional",
        validUntil: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
      });
    }

    return baseAlerts;
  };

  // Fetch weather alerts - IMPROVED with better error handling
  const fetchWeatherAlerts = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setApiError(false);

    try {
      if (isOnline) {
        // Get location for accurate alerts
        const userLocation = await getLocation();
        setLocation(userLocation);

        let alertsData = [];
        let apiSuccess = false;

        // Try to fetch from weather API
        if (userLocation) {
          try {
            // Using a free weather API (OpenWeatherMap alternative)
            // You can get a free API key from: https://openweathermap.org/api
            const API_KEY = "91acab86fb9cf5fc98b300303ba64f40"; // Replace with your actual API key
            const { latitude, longitude } = userLocation;

            console.log(
              "Fetching weather data for location:",
              latitude,
              longitude
            );

            const weatherResponse = await fetch(
              `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${API_KEY}&units=metric`
            );

            if (!weatherResponse.ok) {
              throw new Error(
                `Weather API responded with status: ${weatherResponse.status}`
              );
            }

            const weatherData = await weatherResponse.json();
            console.log("Weather API response:", weatherData);

            // Process weather data into alerts
            alertsData = processWeatherData(weatherData);
            apiSuccess = true;
          } catch (apiError) {
            console.error("Weather API error:", apiError);
            setApiError(true);
            // Fallback to mock data
            alertsData = getMockAlerts(userLocation);
          }
        } else {
          // No location available, use mock data
          alertsData = getMockAlerts();
        }

        setAlerts(alertsData);
        saveAlertsToStorage(alertsData);
        saveToAlertHistory(alertsData);
        setOfflineData(false);

        if (!apiSuccess) {
          // Show info about using demo data
          Alert.alert(
            "Demo Mode",
            "Using demo weather data. To get real weather alerts, add your OpenWeatherMap API key.",
            [{ text: "OK" }]
          );
        }
      } else {
        // Offline mode
        await loadOfflineAlerts();
      }
    } catch (error) {
      console.error("Error fetching alerts:", error);
      setApiError(true);
      // Use mock data as final fallback
      setAlerts(getMockAlerts(location));
      await loadOfflineAlerts();
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchWeatherAlerts();
  }, [isOnline]);

  const handleRefresh = () => {
    if (isOnline) {
      fetchWeatherAlerts(true);
    } else {
      setRefreshing(false);
      Alert.alert("Offline", "Cannot refresh while offline");
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case "high":
        return "#f44336";
      case "moderate":
        return "#ff9800";
      case "low":
        return "#4CAF50";
      default:
        return "#757575";
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case "weather":
        return "#2196F3";
      case "temperature":
        return "#FF5722";
      case "pest":
        return "#8BC34A";
      case "disease":
        return "#9C27B0";
      default:
        return "#607D8B";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Unknown";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isAlertActive = (validUntil) => {
    if (!validUntil) return true;
    return new Date(validUntil) > new Date();
  };

  const markAlertAsRead = async (alertId) => {
    try {
      const updatedHistory = alertHistory.map((alert) =>
        alert.id === alertId ? { ...alert, read: true } : alert
      );
      setAlertHistory(updatedHistory);
      await AsyncStorage.setItem(
        ALERTS_HISTORY_KEY,
        JSON.stringify(updatedHistory)
      );
    } catch (error) {
      console.error("Error marking alert as read:", error);
    }
  };

  const clearAlertHistory = async () => {
    Alert.alert(
      "Clear History",
      "Are you sure you want to clear all alert history?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: async () => {
            await AsyncStorage.removeItem(ALERTS_HISTORY_KEY);
            setAlertHistory([]);
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <Layout navigation={navigation}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#388E3C" />
          <Text style={styles.loadingText}>Loading alerts...</Text>
        </View>
      </Layout>
    );
  }

  return (
    <Layout navigation={navigation}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            enabled={isOnline}
            colors={["#388E3C"]}
          />
        }
      >
        {/* Status Header */}
        <View style={styles.header}>
          <Title style={styles.title}>Weather & Farm Alerts</Title>
          <View style={styles.statusContainer}>
            {apiError && (
              <Chip
                icon="alert-circle"
                mode="outlined"
                style={styles.errorChip}
              >
                Demo Data
              </Chip>
            )}
            {!isOnline && (
              <Chip icon="wifi-off" mode="outlined" style={styles.offlineChip}>
                Offline
              </Chip>
            )}
            {offlineData && (
              <Chip
                icon="cloud-off"
                mode="outlined"
                style={styles.offlineDataChip}
              >
                Cached
              </Chip>
            )}
          </View>
        </View>

        {/* API Key Notice */}
        {apiError && (
          <Card style={styles.demoNoticeCard}>
            <Card.Content>
              <Text style={styles.demoNoticeTitle}>Using Demo Data</Text>
              <Text style={styles.demoNoticeText}>
                To get real weather alerts, add your OpenWeatherMap API key in
                the code.
              </Text>
              <Button
                mode="outlined"
                onPress={() =>
                  Linking.openURL("https://openweathermap.org/api")
                }
                style={styles.apiButton}
              >
                Get API Key
              </Button>
            </Card.Content>
          </Card>
        )}

        {/* Current Alerts Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Current Alerts</Text>
            <Chip mode="outlined" style={styles.alertCountChip}>
              {alerts.length} Active
            </Chip>
          </View>

          {alerts.length === 0 ? (
            <Card style={styles.noAlertsCard}>
              <Card.Content style={styles.noAlertsContent}>
                <Text style={styles.noAlertsText}>No active alerts</Text>
                <Text style={styles.noAlertsSubtext}>
                  Weather conditions are normal for your area.
                </Text>
              </Card.Content>
            </Card>
          ) : (
            alerts.map((alert, index) => (
              <Card
                key={index}
                style={[
                  styles.alertCard,
                  { borderLeftColor: getSeverityColor(alert.severity) },
                ]}
              >
                <Card.Content>
                  <View style={styles.alertHeader}>
                    <Text style={styles.alertTitle}>{alert.title}</Text>
                    <Chip
                      mode="outlined"
                      style={[
                        styles.severityChip,
                        {
                          backgroundColor:
                            getSeverityColor(alert.severity) + "20",
                        },
                      ]}
                      textStyle={{
                        color: getSeverityColor(alert.severity),
                        fontSize: 10,
                      }}
                    >
                      {alert.severity.toUpperCase()}
                    </Chip>
                  </View>

                  <Paragraph style={styles.alertMessage}>
                    {alert.message}
                  </Paragraph>

                  <View style={styles.alertMeta}>
                    <Chip
                      mode="flat"
                      style={styles.categoryChip}
                      textStyle={{ fontSize: 10 }}
                    >
                      {alert.category}
                    </Chip>
                    <Text style={styles.alertArea}>{alert.area}</Text>
                    {alert.validUntil && (
                      <Text style={styles.validUntil}>
                        Valid until: {formatDate(alert.validUntil)}
                      </Text>
                    )}
                  </View>
                </Card.Content>
              </Card>
            ))
          )}
        </View>

        {/* Alert History Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Alert History</Text>
            {alertHistory.length > 0 && (
              <Button
                mode="text"
                onPress={clearAlertHistory}
                textColor="#f44336"
                compact
              >
                Clear
              </Button>
            )}
          </View>

          {alertHistory.length === 0 ? (
            <Card style={styles.noHistoryCard}>
              <Card.Content style={styles.noHistoryContent}>
                <Text style={styles.noHistoryText}>No alert history</Text>
                <Text style={styles.noHistorySubtext}>
                  Your past alerts will appear here
                </Text>
              </Card.Content>
            </Card>
          ) : (
            alertHistory.slice(0, 20).map((alert) => (
              <Card
                key={alert.id}
                style={[
                  styles.historyCard,
                  alert.read && styles.readHistoryCard,
                ]}
                onPress={() => markAlertAsRead(alert.id)}
              >
                <Card.Content>
                  <View style={styles.historyHeader}>
                    <Text style={styles.historyTitle}>{alert.title}</Text>
                    {!alert.read && <View style={styles.unreadDot} />}
                  </View>
                  <Paragraph style={styles.historyMessage}>
                    {alert.message}
                  </Paragraph>
                  <Text style={styles.historyTimestamp}>
                    {formatDate(alert.timestamp)}
                  </Text>
                </Card.Content>
              </Card>
            ))
          )}
        </View>
      </ScrollView>
    </Layout>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    flexGrow: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    flex: 1,
    color: "#388E3C",
    fontSize: 24,
    fontWeight: "bold",
  },
  statusContainer: {
    flexDirection: "row",
    gap: 8,
  },
  errorChip: {
    backgroundColor: "#FFF3E0",
    borderColor: "#FF9800",
  },
  offlineChip: {
    backgroundColor: "#FFE0E0",
  },
  offlineDataChip: {
    backgroundColor: "#FFF3E0",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#388E3C",
  },
  demoNoticeCard: {
    backgroundColor: "#FFF3E0",
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#FF9800",
  },
  demoNoticeTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#E65100",
    marginBottom: 8,
  },
  demoNoticeText: {
    fontSize: 14,
    color: "#555",
    marginBottom: 12,
    lineHeight: 20,
  },
  apiButton: {
    borderColor: "#FF9800",
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  alertCountChip: {
    backgroundColor: "#E8F5E8",
  },
  // Current Alerts
  noAlertsCard: {
    backgroundColor: "#E8F5E8",
    borderLeftWidth: 4,
    borderLeftColor: "#4CAF50",
  },
  noAlertsContent: {
    alignItems: "center",
    paddingVertical: 20,
  },
  noAlertsText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#388E3C",
    marginBottom: 4,
  },
  noAlertsSubtext: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  alertCard: {
    marginBottom: 12,
    borderLeftWidth: 4,
    elevation: 2,
  },
  alertHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: "bold",
    flex: 1,
    marginRight: 8,
  },
  severityChip: {
    borderWidth: 0,
  },
  alertMessage: {
    fontSize: 14,
    lineHeight: 20,
    color: "#555",
    marginBottom: 12,
  },
  alertMeta: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  categoryChip: {
    backgroundColor: "#F5F5F5",
  },
  alertArea: {
    fontSize: 12,
    color: "#666",
  },
  validUntil: {
    fontSize: 10,
    color: "#999",
    marginLeft: "auto",
  },
  // Alert History
  noHistoryCard: {
    backgroundColor: "#F5F5F5",
  },
  noHistoryContent: {
    alignItems: "center",
    paddingVertical: 20,
  },
  noHistoryText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  noHistorySubtext: {
    fontSize: 12,
    color: "#999",
  },
  historyCard: {
    marginBottom: 8,
    backgroundColor: "#FAFAFA",
  },
  readHistoryCard: {
    opacity: 0.7,
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: "bold",
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#388E3C",
  },
  historyMessage: {
    fontSize: 12,
    color: "#666",
    lineHeight: 16,
    marginBottom: 8,
  },
  historyTimestamp: {
    fontSize: 10,
    color: "#999",
  },
});

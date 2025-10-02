import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { AntDesign, MaterialCommunityIcons } from "@expo/vector-icons";
import Layout from "../components/Layout";
import CustomAlert from "../components/Alert";
import { useAlert } from "../context/AlertContext";
import * as Location from "expo-location";

export default function DashboardScreen({ navigation }) {
  const { alert } = useAlert();
  const [weatherAlerts, setWeatherAlerts] = useState([]);
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [riskLevel, setRiskLevel] = useState("Low");

  // Get user location
  useEffect(() => {
    getLocation();
  }, []);

  // Fetch weather data when location is available
  useEffect(() => {
    if (location) {
      fetchWeatherAlerts();
    }
  }, [location]);

  const getLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission denied",
          "Location permission is required for weather alerts"
        );
        setLoading(false);
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setLocation(location.coords);
    } catch (error) {
      console.error("Error getting location:", error);
      setLoading(false);
    }
  };

  const fetchWeatherAlerts = async () => {
    try {
      if (!location) return;

      // Using OpenWeatherMap API (free tier)
      const API_KEY = "91acab86fb9cf5fc98b300303ba64f40"; // Get free API key from openweathermap.org
      const { latitude, longitude } = location;

      // Current weather data
      const weatherResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${API_KEY}&units=metric`
      );
      const weatherData = await weatherResponse.json();
      console.log(weatherData);
      // Weather alerts (if available)
      const oneCallResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/onecall?lat=${latitude}&lon=${longitude}&exclude=minutely,hourly&appid=${API_KEY}&units=metric`
      );
      const oneCallData = await oneCallResponse.json();

      processWeatherData(weatherData, oneCallData);
    } catch (error) {
      console.error("Error fetching weather data:", error);
      // Fallback to mock data if API fails
      useMockWeatherData();
    } finally {
      setLoading(false);
    }
  };

  const processWeatherData = (weatherData, oneCallData) => {
    console.log(weatherData);
    const alerts = [];
    let risk = "Low";

    // Check for severe weather conditions
    if (weatherData.weather[0].main === "Thunderstorm") {
      alerts.push({
        type: "severe",
        title: "⚡ Thunderstorm Warning",
        message:
          "Thunderstorms detected in your area. Secure loose items and avoid open fields.",
        severity: "high",
      });
      risk = "High";
    }

    if (weatherData.wind.speed > 8) {
      // > 30 km/h
      alerts.push({
        type: "wind",
        title: "💨 High Wind Alert",
        message: `Strong winds (${Math.round(
          weatherData.wind.speed * 3.6
        )} km/h) expected. Protect sensitive crops.`,
        severity: "moderate",
      });
      risk = risk === "Low" ? "Moderate" : risk;
    }

    if (weatherData.main.temp < 5) {
      alerts.push({
        type: "cold",
        title: "❄️ Frost Warning",
        message: "Low temperatures expected. Protect crops from frost damage.",
        severity: "moderate",
      });
      risk = risk === "Low" ? "Moderate" : risk;
    }

    if (weatherData.main.temp > 35) {
      alerts.push({
        type: "heat",
        title: "🌡️ Heat Wave Alert",
        message: "Extreme heat expected. Ensure proper irrigation for crops.",
        severity: "moderate",
      });
      risk = risk === "Low" ? "Moderate" : risk;
    }

    if (weatherData.rain && weatherData.rain["1h"] > 10) {
      alerts.push({
        type: "rain",
        title: "🌧️ Heavy Rain Alert",
        message: "Heavy rainfall expected. Check drainage systems.",
        severity: "moderate",
      });
      risk = risk === "Low" ? "Moderate" : risk;
    }

    // Check for alerts from onecall API
    if (oneCallData.alerts) {
      oneCallData.alerts.forEach((alert) => {
        alerts.push({
          type: "official",
          title: `⚠️ ${alert.event}`,
          message: alert.description,
          severity: "high",
        });
        risk = "High";
      });
    }

    // If no specific alerts, provide general weather info
    if (alerts.length === 0) {
      alerts.push({
        type: "info",
        title: "✅ Weather Conditions",
        message: `Current weather: ${
          weatherData.weather[0].description
        }. Temperature: ${Math.round(weatherData.main.temp)}°C`,
        severity: "low",
      });
    }

    setWeatherAlerts(alerts);
    setRiskLevel(risk);
  };

  const useMockWeatherData = () => {
    // Mock data for demonstration
    const mockAlerts = [
      {
        type: "wind",
        title: "💨 High Wind Alert",
        message:
          "Strong winds expected tomorrow. Secure farm equipment and protect sensitive crops.",
        severity: "moderate",
      },
      {
        type: "rain",
        title: "🌧️ Rainfall Expected",
        message:
          "Moderate rainfall forecasted for the next 2 days. Good for irrigation.",
        severity: "low",
      },
    ];

    setWeatherAlerts(mockAlerts);
    setRiskLevel("Moderate");
  };

  const getRiskColor = (level) => {
    switch (level) {
      case "High":
        return "#f44336";
      case "Moderate":
        return "#ff9800";
      case "Low":
        return "#4CAF50";
      default:
        return "#4CAF50";
    }
  };

  const getAlertGradient = (severity) => {
    switch (severity) {
      case "high":
        return ["#ff5252", "#f44336"];
      case "moderate":
        return ["#ff9800", "#ff5722"];
      case "low":
        return ["#4CAF50", "#388E3C"];
      default:
        return ["#2196F3", "#1976D2"];
    }
  };

  const getAlertIcon = (type) => {
    switch (type) {
      case "thunderstorm":
        return "⚡";
      case "wind":
        return "💨";
      case "cold":
        return "❄️";
      case "heat":
        return "🌡️";
      case "rain":
        return "🌧️";
      case "official":
        return "⚠️";
      default:
        return "✅";
    }
  };

  return (
    <Layout navigation={navigation}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* ---------- RISK METER ---------- */}
        <View style={styles.card}>
          <MaterialCommunityIcons
            name="speedometer"
            size={60}
            color={getRiskColor(riskLevel)}
          />
          <Text style={styles.cardTitle}>Farm Risk Level</Text>
          <Text style={[styles.riskValue, { color: getRiskColor(riskLevel) }]}>
            {riskLevel}
          </Text>
          <Text style={styles.cardValue}>
            Based on current weather conditions
          </Text>
        </View>

        {/* ---------- WEATHER ALERTS ---------- */}
        {weatherAlerts.length > 0 ? (
          weatherAlerts.map((alert, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => {
                Alert.alert(alert.title, alert.message, [{ text: "OK" }]);
              }}
            >
              <LinearGradient
                colors={getAlertGradient(alert.severity)}
                style={[styles.card, styles.alertCard]}
              >
                <Text style={styles.alertIcon}>{getAlertIcon(alert.type)}</Text>
                <View style={styles.alertContent}>
                  <Text style={styles.alertTitle}>{alert.title}</Text>
                  <Text style={styles.alertText}>{alert.message}</Text>
                </View>
                <AntDesign name="right" size={16} color="white" />
              </LinearGradient>
            </TouchableOpacity>
          ))
        ) : (
          <LinearGradient
            colors={["#2196F3", "#1976D2"]}
            style={[styles.card, styles.alertCard]}
          >
            <Text style={styles.alertTitle}>🌤️ Loading Weather Data</Text>
            <Text style={styles.alertText}>
              Fetching current weather conditions and alerts...
            </Text>
          </LinearGradient>
        )}

        {/* ---------- WEATHER SUMMARY ---------- */}
        {location && (
          <View style={[styles.card, styles.weatherCard]}>
            <Text style={styles.weatherTitle}>📍 Current Location</Text>
            <Text style={styles.weatherText}>
              Latitude: {location.latitude.toFixed(4)}
            </Text>
            <Text style={styles.weatherText}>
              Longitude: {location.longitude.toFixed(4)}
            </Text>
            <TouchableOpacity
              style={styles.refreshButton}
              onPress={fetchWeatherAlerts}
              disabled={loading}
            >
              <Text style={styles.refreshText}>
                {loading ? "Refreshing..." : "Refresh Alerts"}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ---------- SUBMIT CLAIM ---------- */}
        <TouchableOpacity
          style={[styles.card, styles.claimCard]}
          onPress={() => navigation.navigate("claimCreate")}
        >
          <AntDesign name="form" size={40} color="white" />
          <Text style={[styles.cardTitle, { color: "white" }]}>
            Submit Claim
          </Text>
          <Text style={[styles.cardValue, { color: "white" }]}>
            Report crop or farm damages
          </Text>
        </TouchableOpacity>

        {/* ---------- QUICK ACTIONS ---------- */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: "#E3F2FD" }]}
            onPress={() => navigation.navigate("ClaimHistory")}
          >
            <MaterialCommunityIcons name="history" size={30} color="#1976D2" />
            <Text style={styles.actionText}>Claim History</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: "#E8F5E8" }]}
            onPress={() => navigation.navigate("TrackClaims")}
          >
            <MaterialCommunityIcons
              name="progress-clock"
              size={30}
              color="#388E3C"
            />
            <Text style={styles.actionText}>Track Claims</Text>
          </TouchableOpacity>
        </View>

        {alert && (
          <CustomAlert
            type={alert.type}
            title={alert.title}
            message={alert.message}
          />
        )}
      </ScrollView>
    </Layout>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  card: {
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 10,
    color: "#333",
    textAlign: "center",
  },
  cardValue: {
    fontSize: 14,
    marginTop: 5,
    color: "#555",
    textAlign: "center",
  },
  riskValue: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 5,
  },
  claimCard: {
    backgroundColor: "#388E3C",
  },
  weatherCard: {
    alignItems: "flex-start",
    backgroundColor: "#E3F2FD",
  },
  weatherTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1976D2",
    marginBottom: 8,
  },
  weatherText: {
    fontSize: 14,
    color: "#333",
    marginBottom: 4,
  },
  alertCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  alertIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "white",
    marginBottom: 4,
  },
  alertText: {
    fontSize: 14,
    color: "white",
    lineHeight: 18,
  },
  refreshButton: {
    marginTop: 12,
    padding: 8,
    backgroundColor: "#1976D2",
    borderRadius: 6,
  },
  refreshText: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  actionCard: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginHorizontal: 4,
    elevation: 2,
  },
  actionText: {
    fontSize: 12,
    fontWeight: "bold",
    marginTop: 8,
    textAlign: "center",
  },
});

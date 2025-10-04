import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  RefreshControl,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  AntDesign,
  MaterialCommunityIcons,
  Ionicons,
} from "@expo/vector-icons";
import NetInfo from "@react-native-community/netinfo";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useUser } from "../context/UserContext";
import { useAlert } from "../context/AlertContext";
import { signOut } from "firebase/auth";
import { auth } from "../services/firebase/config";

// Storage key for offline profile data
const PROFILE_STORAGE_KEY = "user_profile_data";

export default function ProfileScreen({ navigation }) {
  const { user, setUser } = useUser();
  const { showAlert } = useAlert();

  // User profile state
  const [userProfile, setUserProfile] = useState({
    name: "Loading...",
    email: user?.email || "Loading...",
    memberSince: "2025",
    totalClaims: 0,
    approvedClaims: 0,
    pendingClaims: 0,
    riskLevel: "Low",
  });

  // App state
  const [isOnline, setIsOnline] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [offlineData, setOfflineData] = useState(false);

  // Check network connection on component mount
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(state.isConnected);
      if (!state.isConnected) {
        loadOfflineProfileData();
      }
    });

    // Load initial profile data
    loadProfileData();

    return () => {
      if (typeof unsubscribe === "function") {
        unsubscribe();
      }
    };
  }, []);

  // Update profile when user data changes
  useEffect(() => {
    if (user) {
      setUserProfile((prev) => ({
        ...prev,
        email: user.email,
        name: user.displayName || user.email?.split("@")[0] || "User",
      }));
    }
  }, [user]);

  // Load profile data - simulates API call with user data
  const loadProfileData = async () => {
    try {
      // In a real app, this would be an API call
      // Simulating network delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const freshProfileData = {
        name: user?.displayName || user?.email?.split("@")[0] || "User",
        email: user?.email || "No email",
        memberSince: "2025", // This could come from user metadata
        totalClaims: 12,
        approvedClaims: 8,
        pendingClaims: 2,
        riskLevel: "Low",
        lastUpdated: new Date().toISOString(),
      };

      setUserProfile(freshProfileData);
      await saveProfileToStorage(freshProfileData);
      setOfflineData(false);
    } catch (error) {
      console.log("Error loading profile data:", error);
      // If online loading fails, try loading offline data
      await loadOfflineProfileData();
    }
  };

  // Load profile data from local storage
  const loadOfflineProfileData = async () => {
    try {
      const storedData = await AsyncStorage.getItem(PROFILE_STORAGE_KEY);
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        setUserProfile(parsedData);
        setOfflineData(true);
      }
    } catch (error) {
      console.log("Error loading offline profile data:", error);
    }
  };

  // Save profile data to local storage
  const saveProfileToStorage = async (profileData) => {
    try {
      await AsyncStorage.setItem(
        PROFILE_STORAGE_KEY,
        JSON.stringify(profileData)
      );
    } catch (error) {
      console.log("Error saving profile data:", error);
    }
  };

  // Handle logout functionality - using your Layout component's method
  const handleLogout = async () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          try {
            await signOut(auth);
            setUser(null);
            showAlert(
              "success",
              "Logout",
              "You have been logged out successfully."
            );
            navigation.replace("SignIn");
          } catch (error) {
            console.error("Logout error:", error);
            showAlert("error", "Logout Failed", "Something went wrong.");
          }
        },
      },
    ]);
  };

  // Handle pull-to-refresh
  const handleRefresh = () => {
    if (isOnline) {
      setRefreshing(true);
      loadProfileData().finally(() => setRefreshing(false));
    } else {
      Alert.alert(
        "Offline Mode",
        "Cannot refresh while offline. Please check your internet connection."
      );
      setRefreshing(false);
    }
  };

  // Calculate claim success rate
  const calculateSuccessRate = () => {
    if (userProfile.totalClaims === 0) return 0;
    return Math.round(
      (userProfile.approvedClaims / userProfile.totalClaims) * 100
    );
  };

  // Get risk level color
  const getRiskColor = (riskLevel) => {
    switch (riskLevel?.toLowerCase()) {
      case "low":
        return "#4CAF50"; // Green
      case "medium":
        return "#FF9800"; // Orange
      case "high":
        return "#F44336"; // Red
      default:
        return "#757575"; // Gray
    }
  };

  // Format date for display
  const formatLastUpdated = (dateString) => {
    if (!dateString) return "Never";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!userProfile.name || userProfile.name === "Loading...") return "U";
    return userProfile.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#fff", "#fff", "#fff"]}
        style={styles.gradientBackground}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={["#388E3C"]}
              tintColor="#388E3C"
            />
          }
        >
          {/* Header with network status */}
          <View style={styles.header}>
            <Text style={styles.title}>My Profile</Text>
            <View style={styles.networkStatus}>
              {!isOnline && (
                <View style={styles.offlineIndicator}>
                  <Ionicons name="cloud-offline" size={16} color="#FFF" />
                  <Text style={styles.offlineText}>Offline</Text>
                </View>
              )}
              {offlineData && (
                <View style={styles.cachedIndicator}>
                  <Ionicons name="time" size={16} color="#FFF" />
                  <Text style={styles.cachedText}>Cached Data</Text>
                </View>
              )}
            </View>
          </View>

          {/* User Profile Card */}
          <View style={styles.profileCard}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{getUserInitials()}</Text>
              </View>
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={20} color="#388E3C" />
              </View>
            </View>

            <Text style={styles.userName}>{userProfile.name}</Text>
            <Text style={styles.userEmail}>{userProfile.email}</Text>

            <View style={styles.memberSince}>
              <Ionicons name="calendar" size={16} color="#666" />
              <Text style={styles.memberSinceText}>
                Member since {userProfile.memberSince}
              </Text>
            </View>
          </View>

          {/* Additional Features */}
          <View style={styles.featuresContainer}>
            <TouchableOpacity style={styles.featureItem}>
              <MaterialCommunityIcons name="cog" size={24} color="#388E3C" />
              <Text style={styles.featureText}>Settings</Text>
              <AntDesign name="right" size={16} color="#999" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.featureItem}>
              <MaterialCommunityIcons
                name="help-circle"
                size={24}
                color="#388E3C"
              />
              <Text style={styles.featureText}>Help & Support</Text>
              <AntDesign name="right" size={16} color="#999" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.featureItem} onPress={handleLogout}>
              <MaterialCommunityIcons name="logout" size={24} color="#F44336" />
              <Text style={[styles.featureText, { color: "#F44336" }]}>
                Sign Out
              </Text>
              <AntDesign name="right" size={16} color="#999" />
            </TouchableOpacity>
          </View>

          {/* Last Updated Info */}
          {offlineData && (
            <View style={styles.offlineInfo}>
              <Ionicons name="information-circle" size={16} color="#666" />
              <Text style={styles.offlineInfoText}>
                Last updated: {formatLastUpdated(userProfile.lastUpdated)}
              </Text>
            </View>
          )}

          {/* Bottom spacing */}
          <View style={styles.bottomSpacing} />
        </ScrollView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientBackground: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    alignItems: "center",
  },
  header: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 30,
    marginTop: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFF",
  },
  networkStatus: {
    flexDirection: "row",
    gap: 8,
  },
  offlineIndicator: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(244, 67, 54, 0.8)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  offlineText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "500",
  },
  cachedIndicator: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 152, 0, 0.8)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  cachedText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "500",
  },
  profileCard: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    width: "100%",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#388E3C",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#FFF",
    fontSize: 24,
    fontWeight: "bold",
  },
  verifiedBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#FFF",
    borderRadius: 10,
    padding: 2,
  },
  userName: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: "#666",
    marginBottom: 12,
  },
  memberSince: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  memberSinceText: {
    fontSize: 14,
    color: "#666",
  },
  actionsContainer: {
    flexDirection: "row",
    width: "100%",
    gap: 12,
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  actionGradient: {
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  actionText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600",
  },
  statsContainer: {
    flexDirection: "row",
    width: "100%",
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },
  successCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 20,
    width: "100%",
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  successHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  successTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  successRate: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#388E3C",
    marginBottom: 4,
  },
  successSubtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  riskCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 20,
    width: "100%",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  riskHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  riskTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  riskLevelContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  riskLevel: {
    fontSize: 18,
    fontWeight: "bold",
  },
  riskMeter: {
    width: 60,
    height: 6,
    borderRadius: 3,
  },
  riskDescription: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  featuresContainer: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    width: "100%",
    overflow: "hidden",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
    gap: 12,
  },
  featureText: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  offlineInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
  },
  offlineInfoText: {
    fontSize: 12,
    color: "#FFF",
    opacity: 0.8,
  },
  bottomSpacing: {
    height: 20,
  },
});

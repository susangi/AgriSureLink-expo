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
} from "react-native-paper";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  getDocs,
} from "firebase/firestore";
import { db, auth } from "../services/firebase/config";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Layout from "../components/Layout";
import NetInfo from "@react-native-community/netinfo";

const CLAIMS_STORAGE_KEY = `user_claims_${auth.currentUser?.uid}`;

export default function ClaimHistoryScreen({ navigation }) {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [offlineData, setOfflineData] = useState(false);

  // Check network status
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(state.isConnected);
    });
    return () => unsubscribe();
  }, []);

  const loadOfflineClaims = async () => {
    try {
      const storedClaims = await AsyncStorage.getItem(CLAIMS_STORAGE_KEY);
      if (storedClaims) {
        const parsedClaims = JSON.parse(storedClaims);
        // Sort by date when loading from storage
        const sortedClaims = parsedClaims.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
        setClaims(sortedClaims);
        setOfflineData(true);
      }
    } catch (error) {
      console.error("Error loading offline claims:", error);
    }
  };

  const saveClaimsToStorage = async (claimsData) => {
    try {
      await AsyncStorage.setItem(
        CLAIMS_STORAGE_KEY,
        JSON.stringify(claimsData)
      );
    } catch (error) {
      console.error("Error saving claims to storage:", error);
    }
  };

  // Fetch claims from Firestore
  const fetchClaims = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      if (!auth.currentUser) {
        Alert.alert("Error", "Please sign in to view claim history");
        return;
      }

      // Use simple query without ordering to avoid index issues
      const claimsQuery = query(
        collection(db, "claims"),
        where("userId", "==", auth.currentUser.uid)
      );

      if (isOnline) {
        const unsubscribe = onSnapshot(
          claimsQuery,
          (querySnapshot) => {
            const claimsData = [];
            querySnapshot.forEach((doc) => {
              claimsData.push({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate?.() || new Date(),
              });
            });

            // Sort locally instead of using Firestore ordering
            const sortedClaims = claimsData.sort(
              (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
            );

            setClaims(sortedClaims);
            saveClaimsToStorage(sortedClaims);
            setOfflineData(false);
            setLoading(false);
            setRefreshing(false);
          },
          (error) => {
            console.error("Error fetching claims:", error);

            // If it's an index error, try alternative approach
            if (error.code === "failed-precondition") {
              Alert.alert(
                "Index Building",
                "Database index is being created. This may take a few minutes. Using offline data for now.",
                [{ text: "OK" }]
              );
            }

            loadOfflineClaims();
            setLoading(false);
            setRefreshing(false);
          }
        );

        return unsubscribe;
      } else {
        await loadOfflineClaims();
        setLoading(false);
        setRefreshing(false);
      }
    } catch (error) {
      console.error("Error in fetchClaims:", error);
      await loadOfflineClaims();
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const unsubscribe = fetchClaims();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [isOnline]);

  // Alternative: Use getDocs instead of onSnapshot (less real-time but more stable)
  const fetchClaimsAlternative = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      if (!auth.currentUser) {
        Alert.alert("Error", "Please sign in to view claim history");
        return;
      }

      const claimsQuery = query(
        collection(db, "claims"),
        where("userId", "==", auth.currentUser.uid)
      );

      const querySnapshot = await getDocs(claimsQuery);
      const claimsData = [];

      querySnapshot.forEach((doc) => {
        claimsData.push({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.() || new Date(),
        });
      });

      // Sort locally
      const sortedClaims = claimsData.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );

      setClaims(sortedClaims);
      saveClaimsToStorage(sortedClaims);
      setOfflineData(false);
    } catch (error) {
      console.error("Error fetching claims:", error);
      await loadOfflineClaims();
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    if (isOnline) {
      // Use alternative method during index creation
      fetchClaimsAlternative(true);
    } else {
      setRefreshing(false);
      Alert.alert("Offline", "Cannot refresh while offline");
    }
  };

  // Test offline functionality
  const testOfflineFunctionality = async () => {
    console.log("Testing offline functionality");

    // Test 1: Check AsyncStorage
    const storedData = await AsyncStorage.getItem(CLAIMS_STORAGE_KEY);
    console.log(
      "Storage check:",
      storedData ? `${JSON.parse(storedData).length} claims stored` : "No data"
    );

    // Test 2: Simulate offline data
    const testOfflineData = [
      {
        id: "test-offline-1",
        packageName: "Test Offline Claim",
        reason: "Testing offline functionality",
        claimAmount: 100,
        status: "Submitted",
        createdAt: new Date().toISOString(),
        userId: auth.currentUser?.uid,
      },
    ];

    await AsyncStorage.setItem(
      CLAIMS_STORAGE_KEY,
      JSON.stringify(testOfflineData)
    );
    console.log("Test data saved to storage");

    // Test 3: Load offline data
    await loadOfflineClaims();
    console.log("Offline data loaded, claims count:", claims.length);

    Alert.alert(
      "Offline Test Complete",
      `Storage: ${storedData ? "Has data" : "Empty"}\nClaims loaded: ${
        claims.length
      }`
    );
  };

  const simulateOfflineScenario = async () => {
    // First, ensure we have some data online
    if (isOnline) {
      await fetchClaims();
      Alert.alert(
        "Offline Simulation Ready",
        "Now enable airplane mode and reopen this screen to test offline functionality."
      );
    } else {
      Alert.alert("Already offline", "Offline mode is active.");
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "approved":
        return "#4CAF50";
      case "rejected":
        return "#F44336";
      case "pending":
        return "#FF9800";
      case "submitted":
        return "#2196F3";
      default:
        return "#757575";
    }
  };

  const formatDate = (date) => {
    if (!date) return "Unknown date";

    const dateObj = date instanceof Date ? date : new Date(date);
    return dateObj.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatAmount = (amount) => {
    return `$${parseFloat(amount).toFixed(2)}`;
  };

  if (loading) {
    return (
      <Layout navigation={navigation}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
          <Text style={styles.loadingText}>Loading claims...</Text>
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
          />
        }
      >
        {/* Debug Information Panel */}
        <Card style={styles.debugCard}>
          <Card.Content>
            <Title style={styles.debugTitle}>Debug Information</Title>
            <View style={styles.debugGrid}>
              <View style={styles.debugItem}>
                <Text style={styles.debugLabel}>Network Status:</Text>
                <Chip
                  mode={isOnline ? "contained" : "outlined"}
                  style={isOnline ? styles.onlineChip : styles.offlineChip}
                >
                  {isOnline ? "Online" : "Offline"}
                </Chip>
              </View>
              <View style={styles.debugItem}>
                <Text style={styles.debugLabel}>Data Source:</Text>
                <Chip
                  mode={offlineData ? "outlined" : "contained"}
                  style={offlineData ? styles.cachedChip : styles.liveChip}
                >
                  {offlineData ? "Cached" : "Live"}
                </Chip>
              </View>
              <View style={styles.debugItem}>
                <Text style={styles.debugLabel}>Claims Count:</Text>
                <Text style={styles.debugValue}>{claims.length}</Text>
              </View>
              <View style={styles.debugItem}>
                <Text style={styles.debugLabel}>User ID:</Text>
                <Text style={styles.debugValue}>
                  {auth.currentUser?.uid
                    ? auth.currentUser.uid.substring(0, 8) + "..."
                    : "Not signed in"}
                </Text>
              </View>
            </View>

            {/* Test Buttons */}
            <View style={styles.testButtons}>
              <Button
                mode="outlined"
                onPress={async () => {
                  const stored = await AsyncStorage.getItem(CLAIMS_STORAGE_KEY);
                  Alert.alert(
                    "Storage Contents",
                    stored
                      ? `Found ${JSON.parse(stored).length} claims in storage`
                      : "No data in storage"
                  );
                }}
                style={styles.testButton}
              >
                Check Storage
              </Button>
              <Button
                mode="outlined"
                onPress={async () => {
                  await AsyncStorage.removeItem(CLAIMS_STORAGE_KEY);
                  Alert.alert(
                    "Storage Cleared",
                    "Offline cache has been cleared"
                  );
                  setClaims([]);
                }}
                style={styles.testButton}
              >
                Clear Cache
              </Button>
            </View>
          </Card.Content>
        </Card>

        <View style={styles.header}>
          <Title style={styles.title}>Claim History</Title>
          <View style={styles.statusContainer}>
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
                Cached Data
              </Chip>
            )}
          </View>
        </View>

        {claims.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No claims found</Text>
            <Paragraph style={styles.emptySubtext}>
              {offlineData
                ? "No cached claims available. Go online to sync your data."
                : "You haven't submitted any claims yet."}
            </Paragraph>
            <Button
              mode="contained"
              onPress={() => navigation.navigate("claimCreate")}
              style={styles.submitButton}
            >
              Submit Your First Claim
            </Button>
          </View>
        ) : (
          <>
            {offlineData && (
              <Card style={styles.offlineBanner}>
                <Card.Content style={styles.offlineBannerContent}>
                  <Paragraph style={styles.offlineBannerText}>
                    Showing cached data. Some information may not be up to date.
                  </Paragraph>
                </Card.Content>
              </Card>
            )}

            {claims.map((claim) => (
              <Card key={claim.id} style={styles.claimCard}>
                <Card.Content>
                  <View style={styles.cardHeader}>
                    <Title style={styles.claimTitle}>{claim.packageName}</Title>
                    <Chip
                      mode="outlined"
                      style={[
                        styles.statusChip,
                        {
                          backgroundColor: getStatusColor(claim.status) + "20",
                        },
                      ]}
                      textStyle={{ color: getStatusColor(claim.status) }}
                    >
                      {claim.status || "Unknown"}
                    </Chip>
                  </View>

                  <Paragraph style={styles.amount}>
                    {formatAmount(claim.claimAmount)}
                  </Paragraph>

                  <Paragraph style={styles.reason}>
                    <Text style={styles.label}>Reason: </Text>
                    {claim.reason}
                  </Paragraph>

                  {claim.details && (
                    <Paragraph style={styles.details}>
                      <Text style={styles.label}>Details: </Text>
                      {claim.details}
                    </Paragraph>
                  )}

                  <View style={styles.metaContainer}>
                    <Paragraph style={styles.date}>
                      {formatDate(claim.createdAt)}
                    </Paragraph>

                    {claim.images && claim.images.length > 0 && (
                      <Chip
                        icon="image"
                        mode="outlined"
                        compact
                        style={styles.imageChip}
                      >
                        {claim.images.length} image
                        {claim.images.length > 1 ? "s" : ""}
                      </Chip>
                    )}
                  </View>
                </Card.Content>

                <Card.Actions>
                  <Button
                    onPress={() =>
                      navigation.navigate("ClaimDetails", { claimId: claim.id })
                    }
                  >
                    View Details
                  </Button>
                  {claim.status === "Submitted" && (
                    <Button
                      onPress={() =>
                        navigation.navigate("TrackClaims", {
                          claimId: claim.id,
                        })
                      }
                    >
                      Track
                    </Button>
                  )}
                </Card.Actions>
              </Card>
            ))}
          </>
        )}
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
  },
  statusContainer: {
    flexDirection: "row",
    gap: 8,
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
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  emptySubtext: {
    textAlign: "center",
    marginBottom: 20,
    color: "#666",
  },
  submitButton: {
    marginTop: 10,
  },
  offlineBanner: {
    backgroundColor: "#FFF3E0",
    marginBottom: 16,
  },
  offlineBannerContent: {
    paddingVertical: 8,
  },
  offlineBannerText: {
    color: "#E65100",
    textAlign: "center",
    fontSize: 12,
  },
  claimCard: {
    marginBottom: 16,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  claimTitle: {
    flex: 1,
    marginRight: 8,
    fontSize: 18,
  },
  statusChip: {
    borderWidth: 0,
  },
  amount: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2E7D32",
    marginBottom: 8,
  },
  reason: {
    marginBottom: 4,
  },
  details: {
    marginBottom: 8,
    color: "#666",
  },
  label: {
    fontWeight: "bold",
    color: "#333",
  },
  metaContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  date: {
    fontSize: 12,
    color: "#888",
  },
  imageChip: {
    height: 24,
  },
  // Debug styles
  debugCard: {
    backgroundColor: "#f5f5f5",
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#2196F3",
  },
  debugTitle: {
    fontSize: 16,
    marginBottom: 12,
  },
  debugGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 12,
  },
  debugItem: {
    minWidth: "45%",
  },
  debugLabel: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 4,
    color: "#666",
  },
  debugValue: {
    fontSize: 12,
    color: "#333",
  },
  testButtons: {
    flexDirection: "row",
    gap: 8,
  },
  testButton: {
    flex: 1,
  },
  onlineChip: {
    backgroundColor: "#4CAF50",
  },
  cachedChip: {
    backgroundColor: "#FFF3E0",
  },
  liveChip: {
    backgroundColor: "#E3F2FD",
  },
});

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
  IconButton,
} from "react-native-paper";
import { collection, query, where, getDocs } from "firebase/firestore";
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

  const fetchClaims = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      if (!auth.currentUser) {
        Alert.alert("Error", "Please sign in to view claim history");
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const claimsQuery = query(
        collection(db, "claims"),
        where("userId", "==", auth.currentUser.uid)
      );

      if (isOnline) {
        const querySnapshot = await getDocs(claimsQuery);
        const claimsData = [];

        querySnapshot.forEach((doc) => {
          claimsData.push({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate?.() || new Date(),
          });
        });

        const sortedClaims = claimsData.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );

        setClaims(sortedClaims);
        saveClaimsToStorage(sortedClaims);
        setOfflineData(false);
      } else {
        await loadOfflineClaims();
      }
    } catch (error) {
      console.error("Error fetching claims:", error);
      if (error.code === "failed-precondition") {
        Alert.alert(
          "Index Building",
          "Database index is being created. This may take a few minutes. Using offline data for now.",
          [{ text: "OK" }]
        );
      }
      await loadOfflineClaims();
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchClaims();
  }, [isOnline]);

  const handleRefresh = () => {
    if (isOnline) {
      fetchClaims(true);
    } else {
      setRefreshing(false);
      Alert.alert("Offline", "Cannot refresh while offline");
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

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case "approved":
        return "check-circle";
      case "rejected":
        return "close-circle";
      case "pending":
        return "clock";
      case "submitted":
        return "send";
      default:
        return "help-circle";
    }
  };

  const formatDate = (date) => {
    if (!date) return "Unknown date";
    const dateObj = date instanceof Date ? date : new Date(date);
    return dateObj.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatAmount = (amount) => {
    return `$${parseFloat(amount).toFixed(2)}`;
  };

  if (loading) {
    return (
      <Layout navigation={navigation}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#388E3C" />
          <Text style={styles.loadingText}>Loading your claims...</Text>
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
            tintColor="#388E3C"
          />
        }
      >
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.titleRow}>
              <IconButton
                icon="history"
                size={28}
                iconColor="#FFFFFF"
                style={styles.titleIcon}
              />
              <View>
                <Title style={styles.title}>Claim History</Title>
                <Text style={styles.subtitle}>
                  {claims.length} claim{claims.length !== 1 ? "s" : ""} total
                </Text>
              </View>
            </View>
            <Button
              mode="contained"
              onPress={() => navigation.navigate("claimCreate")}
              style={styles.newClaimButton}
              labelStyle={styles.newClaimButtonLabel}
              icon="plus-circle"
            >
              New Claim
            </Button>
          </View>

          {/* Status Badges */}
          <View style={styles.statusBadges}>
            {!isOnline && (
              <Chip
                icon="wifi-off"
                mode="outlined"
                style={styles.offlineChip}
                textStyle={styles.offlineChipText}
              >
                Offline Mode
              </Chip>
            )}
            {offlineData && (
              <Chip
                icon="cloud-download"
                mode="outlined"
                style={styles.cachedChip}
                textStyle={styles.cachedChipText}
              >
                Cached Data
              </Chip>
            )}
          </View>
        </View>

        {claims.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIllustration}>
              <IconButton
                icon="file-document-outline"
                size={80}
                iconColor="#388E3C"
                style={styles.emptyIcon}
              />
            </View>
            <Text style={styles.emptyTitle}>No Claims Found</Text>
            <Paragraph style={styles.emptySubtext}>
              {offlineData
                ? "No cached claims available. Connect to the internet to sync your data."
                : "You haven't submitted any claims yet. Start by creating your first claim!"}
            </Paragraph>
            <Button
              mode="contained"
              onPress={() => navigation.navigate("claimCreate")}
              style={styles.submitButton}
              labelStyle={styles.submitButtonLabel}
              icon="rocket-launch"
            >
              Submit Your First Claim
            </Button>
          </View>
        ) : (
          <>
            {offlineData && (
              <Card style={styles.offlineBanner}>
                <Card.Content style={styles.offlineBannerContent}>
                  <View style={styles.offlineBannerIcon}>
                    <IconButton
                      icon="cloud-alert"
                      size={20}
                      iconColor="#E65100"
                    />
                  </View>
                  <Paragraph style={styles.offlineBannerText}>
                    Showing cached data. Connect to internet for latest updates.
                  </Paragraph>
                </Card.Content>
              </Card>
            )}

            {/* Claims Summary */}
            <View style={styles.summaryCards}>
              <Card style={styles.summaryCard}>
                <Card.Content style={styles.summaryCardContent}>
                  <IconButton
                    icon="clock-outline"
                    size={24}
                    iconColor="#FF9800"
                    style={styles.summaryIcon}
                  />
                  <Text style={styles.summaryCount}>
                    {
                      claims.filter(
                        (c) => c.status?.toLowerCase() === "pending"
                      ).length
                    }
                  </Text>
                  <Text style={styles.summaryLabel}>Pending</Text>
                </Card.Content>
              </Card>
              <Card style={styles.summaryCard}>
                <Card.Content style={styles.summaryCardContent}>
                  <IconButton
                    icon="check-circle-outline"
                    size={24}
                    iconColor="#4CAF50"
                    style={styles.summaryIcon}
                  />
                  <Text style={styles.summaryCount}>
                    {
                      claims.filter(
                        (c) => c.status?.toLowerCase() === "approved"
                      ).length
                    }
                  </Text>
                  <Text style={styles.summaryLabel}>Approved</Text>
                </Card.Content>
              </Card>
              <Card style={styles.summaryCard}>
                <Card.Content style={styles.summaryCardContent}>
                  <IconButton
                    icon="cash"
                    size={24}
                    iconColor="#388E3C"
                    style={styles.summaryIcon}
                  />
                  <Text style={styles.summaryCount}>
                    $
                    {claims
                      .filter((c) => c.status?.toLowerCase() === "approved")
                      .reduce(
                        (sum, claim) =>
                          sum + parseFloat(claim.claimAmount || 0),
                        0
                      )
                      .toFixed(2)}
                  </Text>
                  <Text style={styles.summaryLabel}>Total Paid</Text>
                </Card.Content>
              </Card>
            </View>

            {/* Claims List */}
            <View style={styles.claimsList}>
              <Text style={styles.sectionTitle}>Recent Claims</Text>
              {claims.map((claim) => (
                <Card key={claim.id} style={styles.claimCard}>
                  <Card.Content>
                    <View style={styles.cardHeader}>
                      <View style={styles.claimInfo}>
                        <View style={styles.claimTitleRow}>
                          <IconButton
                            icon="package-variant"
                            size={20}
                            iconColor="#388E3C"
                            style={styles.claimIcon}
                          />
                          <Title style={styles.claimTitle} numberOfLines={1}>
                            {claim.packageName}
                          </Title>
                        </View>
                        <View style={styles.claimMeta}>
                          <Text style={styles.claimDate}>
                            {formatDate(claim.createdAt)}
                          </Text>
                          <Text style={styles.claimId}>
                            ID: {claim.id.substring(0, 8)}...
                          </Text>
                        </View>
                      </View>
                      <Chip
                        mode="outlined"
                        icon={getStatusIcon(claim.status)}
                        style={[
                          styles.statusChip,
                          {
                            borderColor: getStatusColor(claim.status),
                            backgroundColor:
                              getStatusColor(claim.status) + "15",
                          },
                        ]}
                        textStyle={[
                          styles.statusChipText,
                          { color: getStatusColor(claim.status) },
                        ]}
                      >
                        {claim.status || "Unknown"}
                      </Chip>
                    </View>

                    <View style={styles.claimDetails}>
                      <View style={styles.amountContainer}>
                        <Text style={styles.amountLabel}>Claim Amount</Text>
                        <Text style={styles.amount}>
                          {formatAmount(claim.claimAmount)}
                        </Text>
                      </View>

                      <View style={styles.reasonContainer}>
                        <Text style={styles.detailLabel}>Reason</Text>
                        <Paragraph style={styles.reason} numberOfLines={2}>
                          {claim.reason}
                        </Paragraph>
                      </View>

                      {claim.details && (
                        <View style={styles.detailsContainer}>
                          <Text style={styles.detailLabel}>Details</Text>
                          <Paragraph style={styles.details} numberOfLines={2}>
                            {claim.details}
                          </Paragraph>
                        </View>
                      )}

                      {claim.images && claim.images.length > 0 && (
                        <View style={styles.imagesContainer}>
                          <IconButton
                            icon="image-multiple"
                            size={16}
                            iconColor="#666"
                          />
                          <Text style={styles.imagesText}>
                            {claim.images.length} attachment
                            {claim.images.length > 1 ? "s" : ""}
                          </Text>
                        </View>
                      )}
                    </View>
                  </Card.Content>

                  <Card.Actions style={styles.cardActions}>
                    <Button
                      mode="outlined"
                      onPress={() =>
                        navigation.navigate("ClaimDetails", {
                          claimId: claim.id,
                        })
                      }
                      style={styles.actionButton}
                      labelStyle={styles.actionButtonLabel}
                      icon="eye-outline"
                    >
                      View Details
                    </Button>
                    {claim.status === "Submitted" && (
                      <Button
                        mode="contained"
                        onPress={() =>
                          navigation.navigate("TrackClaims", {
                            claimId: claim.id,
                          })
                        }
                        style={styles.trackButton}
                        labelStyle={styles.trackButtonLabel}
                        icon="map-marker-path"
                      >
                        Track
                      </Button>
                    )}
                  </Card.Actions>
                </Card>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </Layout>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#F8F9FA",
  },
  header: {
    backgroundColor: "#388E3C",
    padding: 24,
    paddingTop: 40,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    marginBottom: 16,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  titleIcon: {
    marginRight: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
  },
  newClaimButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  newClaimButtonLabel: {
    color: "#388E3C",
    fontWeight: "bold",
    fontSize: 12,
  },
  statusBadges: {
    flexDirection: "row",
    gap: 8,
  },
  offlineChip: {
    backgroundColor: "rgba(255,255,255,0.9)",
    borderColor: "#FF6B6B",
  },
  offlineChipText: {
    color: "#FF6B6B",
    fontSize: 12,
    fontWeight: "600",
  },
  cachedChip: {
    backgroundColor: "rgba(255,255,255,0.9)",
    borderColor: "#FFA726",
  },
  cachedChipText: {
    color: "#FFA726",
    fontSize: 12,
    fontWeight: "600",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
    fontWeight: "500",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyIllustration: {
    marginBottom: 24,
  },
  emptyIcon: {
    backgroundColor: "rgba(56, 142, 60, 0.1)",
    borderRadius: 50,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#388E3C",
    marginBottom: 12,
    textAlign: "center",
  },
  emptySubtext: {
    textAlign: "center",
    marginBottom: 32,
    color: "#666",
    lineHeight: 20,
    fontSize: 14,
  },
  submitButton: {
    backgroundColor: "#388E3C",
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 8,
    elevation: 4,
    shadowColor: "#388E3C",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  submitButtonLabel: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 14,
  },
  offlineBanner: {
    backgroundColor: "#FFF3E0",
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#FFA726",
  },
  offlineBannerContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  offlineBannerIcon: {
    marginRight: 8,
  },
  offlineBannerText: {
    color: "#E65100",
    fontSize: 12,
    fontWeight: "500",
    flex: 1,
  },
  summaryCards: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginBottom: 24,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  summaryCardContent: {
    alignItems: "center",
    paddingVertical: 16,
  },
  summaryIcon: {
    margin: 0,
    marginBottom: 8,
  },
  summaryCount: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#388E3C",
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
  claimsList: {
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
  },
  claimCard: {
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    marginBottom: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  claimInfo: {
    flex: 1,
    marginRight: 12,
  },
  claimTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  claimIcon: {
    margin: 0,
    marginRight: 8,
    backgroundColor: "rgba(56, 142, 60, 0.1)",
  },
  claimTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
  },
  claimMeta: {
    flexDirection: "row",
    gap: 12,
  },
  claimDate: {
    fontSize: 12,
    color: "#666",
  },
  claimId: {
    fontSize: 12,
    color: "#999",
  },
  statusChip: {
    height: 32,
    borderWidth: 1.5,
  },
  statusChipText: {
    fontSize: 12,
    fontWeight: "600",
  },
  claimDetails: {
    gap: 12,
  },
  amountContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(56, 142, 60, 0.05)",
    padding: 12,
    borderRadius: 8,
  },
  amountLabel: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  amount: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#388E3C",
  },
  reasonContainer: {
    marginBottom: 4,
  },
  detailsContainer: {
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  reason: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  details: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  imagesContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  imagesText: {
    fontSize: 12,
    color: "#666",
    marginLeft: -8,
  },
  cardActions: {
    justifyContent: "flex-end",
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  actionButton: {
    borderColor: "#388E3C",
    borderRadius: 8,
  },
  actionButtonLabel: {
    color: "#388E3C",
    fontSize: 12,
    fontWeight: "600",
  },
  trackButton: {
    backgroundColor: "#388E3C",
    borderRadius: 8,
  },
  trackButtonLabel: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
});

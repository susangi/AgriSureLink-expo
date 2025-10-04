import React, { useState, useEffect } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  RefreshControl,
  Share,
  Linking,
} from "react-native";
import {
  Card,
  Title,
  Paragraph,
  Button,
  Chip,
  ActivityIndicator,
  Text,
  ProgressBar,
} from "react-native-paper";
import { collection, doc, getDoc, onSnapshot } from "firebase/firestore";
import { db, auth } from "../services/firebase/config";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Layout from "../components/Layout";
import NetInfo from "@react-native-community/netinfo";

const TRACKING_STORAGE_KEY = `tracking_claims_${auth.currentUser?.uid}`;

export default function TrackClaimsScreen({ navigation, route }) {
  const [trackingClaims, setTrackingClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [offlineData, setOfflineData] = useState(false);

  const claimId = route.params?.claimId;

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(state.isConnected);
    });
    return () => {
      if (typeof unsubscribe === "function") {
        unsubscribe();
      }
    };
  }, []);

  const loadOfflineTrackingData = async () => {
    try {
      const storedData = await AsyncStorage.getItem(TRACKING_STORAGE_KEY);
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        setTrackingClaims(parsedData);
        setOfflineData(true);
      }
    } catch (error) {
      console.error("Error loading offline tracking data:", error);
    }
  };

  const saveTrackingDataToStorage = async (trackingData) => {
    try {
      await AsyncStorage.setItem(
        TRACKING_STORAGE_KEY,
        JSON.stringify(trackingData)
      );
    } catch (error) {
      console.error("Error saving tracking data to storage:", error);
    }
  };

  const shareClaimStatus = async (claim) => {
    try {
      const statusText = getStatusText(claim.status);
      const progress = Math.round(getClaimProgress(claim.status) * 100);

      const shareMessage = `📋 Insurance Claim Status Update

Claim: ${claim.packageName}
Amount: $${parseFloat(claim.claimAmount).toFixed(2)}
Status: ${statusText}
Progress: ${progress}% complete
Current Stage: ${getCurrentStage(claim.status)}

${getStatusDescription(claim.status)}

Submitted: ${formatDate(claim.createdAt)}
Claim ID: ${claim.id.substring(0, 8).toUpperCase()}

You can check the status anytime through the app.`;

      const shareOptions = {
        message: shareMessage,
        title: "Claim Status Update",
      };

      try {
        const result = await Share.share(shareOptions);
        if (result.action === Share.sharedAction) {
          console.log("Share was successful");
        } else if (result.action === Share.dismissedAction) {
          console.log("Share was dismissed");
        }
      } catch (shareError) {
        console.error("Error sharing:", shareError);
        Alert.alert("Error", "Failed to share claim status");
      }
    } catch (error) {
      console.error("Error in shareClaimStatus:", error);
      Alert.alert("Error", "Failed to prepare share content");
    }
  };

  const shareViaWhatsApp = async (claim) => {
    try {
      const statusText = getStatusText(claim.status);
      const progress = Math.round(getClaimProgress(claim.status) * 100);

      const message = `Insurance Claim Status Update%0A%0AClaim: ${
        claim.packageName
      }%0AAmount: $${parseFloat(claim.claimAmount).toFixed(
        2
      )}%0AStatus: ${statusText}%0AProgress: ${progress}% complete%0A%0A${getStatusDescription(
        claim.status
      )}%0A%0ASubmitted: ${formatDate(claim.createdAt)}`;

      const url = `whatsapp://send?text=${message}`;

      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert(
          "WhatsApp Not Installed",
          "Please install WhatsApp to share via this method.",
          [{ text: "OK" }]
        );
      }
    } catch (error) {
      console.error("Error sharing via WhatsApp:", error);
      Alert.alert("Error", "Failed to share via WhatsApp");
    }
  };

  const shareViaSMS = async (claim) => {
    try {
      const statusText = getStatusText(claim.status);
      const progress = Math.round(getClaimProgress(claim.status) * 100);

      const message = `Insurance Claim Status Update\n\nClaim: ${
        claim.packageName
      }\nAmount: $${parseFloat(claim.claimAmount).toFixed(
        2
      )}\nStatus: ${statusText}\nProgress: ${progress}% complete\n\n${getStatusDescription(
        claim.status
      )}\n\nSubmitted: ${formatDate(claim.createdAt)}`;

      const url = `sms:&body=${encodeURIComponent(message)}`;

      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert("Error", "Unable to open SMS app");
      }
    } catch (error) {
      console.error("Error sharing via SMS:", error);
      Alert.alert("Error", "Failed to share via SMS");
    }
  };

  const shareViaEmail = async (claim) => {
    try {
      const statusText = getStatusText(claim.status);
      const progress = Math.round(getClaimProgress(claim.status) * 100);

      const subject = `Insurance Claim Status Update - ${claim.packageName}`;
      const body = `Insurance Claim Status Update\n\nClaim: ${
        claim.packageName
      }\nAmount: $${parseFloat(claim.claimAmount).toFixed(
        2
      )}\nStatus: ${statusText}\nProgress: ${progress}% complete\n\n${getStatusDescription(
        claim.status
      )}\n\nSubmitted: ${formatDate(claim.createdAt)}\nClaim ID: ${claim.id
        .substring(0, 8)
        .toUpperCase()}`;

      const url = `mailto:?subject=${encodeURIComponent(
        subject
      )}&body=${encodeURIComponent(body)}`;

      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert("Error", "No email app configured");
      }
    } catch (error) {
      console.error("Error sharing via Email:", error);
      Alert.alert("Error", "Failed to share via Email");
    }
  };

  const showShareOptions = (claim) => {
    Alert.alert(
      "Share Claim Status",
      "Choose how you want to share the claim status:",
      [
        {
          text: "System Share",
          onPress: () => shareClaimStatus(claim),
        },
        {
          text: "WhatsApp",
          onPress: () => shareViaWhatsApp(claim),
        },
        {
          text: "SMS",
          onPress: () => shareViaSMS(claim),
        },
        {
          text: "Email",
          onPress: () => shareViaEmail(claim),
        },
        {
          text: "Cancel",
          style: "cancel",
        },
      ]
    );
  };

  const getStatusText = (status) => {
    switch (status?.toLowerCase()) {
      case "approved":
        return "Approved ✅";
      case "rejected":
        return "Rejected ❌";
      case "pending":
        return "Pending ⏳";
      case "under_review":
        return "Under Review 🔍";
      case "documents_requested":
        return "Documents Requested 📄";
      case "processing":
        return "Processing ⚙️";
      case "submitted":
        return "Submitted 📤";
      default:
        return "Unknown Status";
    }
  };

  const getCurrentStage = (status) => {
    switch (status?.toLowerCase()) {
      case "submitted":
        return "Initial Submission";
      case "under_review":
        return "Review Phase";
      case "documents_requested":
        return "Document Collection";
      case "processing":
        return "Final Processing";
      case "approved":
        return "Approval Complete";
      case "rejected":
        return "Review Complete";
      default:
        return "Initial Stage";
    }
  };

  const getClaimProgress = (status) => {
    switch (status?.toLowerCase()) {
      case "submitted":
        return 0.2;
      case "under_review":
        return 0.4;
      case "documents_requested":
        return 0.6;
      case "processing":
        return 0.8;
      case "approved":
      case "rejected":
        return 1.0;
      default:
        return 0.2;
    }
  };

  const getStatusSteps = (status) => {
    const steps = [
      { name: "Submitted", completed: true },
      { name: "Under Review", completed: false },
      { name: "Documents Requested", completed: false },
      { name: "Processing", completed: false },
      { name: "Completed", completed: false },
    ];

    switch (status?.toLowerCase()) {
      case "submitted":
        steps[0].completed = true;
        break;
      case "under_review":
        steps[0].completed = true;
        steps[1].completed = true;
        break;
      case "documents_requested":
        steps[0].completed = true;
        steps[1].completed = true;
        steps[2].completed = true;
        break;
      case "processing":
        steps[0].completed = true;
        steps[1].completed = true;
        steps[2].completed = true;
        steps[3].completed = true;
        break;
      case "approved":
      case "rejected":
        steps.forEach((step) => (step.completed = true));
        steps[4].name = status === "approved" ? "Approved" : "Rejected";
        break;
    }

    return steps;
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "approved":
        return "#388E3C";
      case "rejected":
        return "#F44336";
      case "pending":
        return "#FF9800";
      case "under_review":
        return "#2196F3";
      case "documents_requested":
        return "#FF9800";
      case "processing":
        return "#9C27B0";
      case "submitted":
        return "#388E3C";
      default:
        return "#757575";
    }
  };

  const getStatusDescription = (status) => {
    switch (status?.toLowerCase()) {
      case "submitted":
        return "Your claim has been submitted and is awaiting initial review.";
      case "under_review":
        return "Your claim is currently being reviewed by our team.";
      case "documents_requested":
        return "Additional documents are required to process your claim.";
      case "processing":
        return "Your claim is being processed for approval.";
      case "approved":
        return "Your claim has been approved! Payment will be processed shortly.";
      case "rejected":
        return "Your claim has been rejected. Please contact support for details.";
      default:
        return "Your claim status is being updated.";
    }
  };

  const getEstimatedTime = (status) => {
    switch (status?.toLowerCase()) {
      case "submitted":
        return "2-3 business days";
      case "under_review":
        return "3-5 business days";
      case "documents_requested":
        return "1-2 business days after document submission";
      case "processing":
        return "2-4 business days";
      case "approved":
        return "Payment in 5-7 business days";
      case "rejected":
        return "Immediate";
      default:
        return "Varies based on complexity";
    }
  };

  const fetchTrackingClaims = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      if (!auth.currentUser) {
        Alert.alert("Error", "Please sign in to track claims");
        setLoading(false);
        setRefreshing(false);
        return;
      }

      if (isOnline) {
        if (claimId) {
          const claimDoc = doc(db, "claims", claimId);
          const unsubscribe = onSnapshot(claimDoc, (docSnapshot) => {
            if (docSnapshot.exists()) {
              const claimData = {
                id: docSnapshot.id,
                ...docSnapshot.data(),
                createdAt:
                  docSnapshot.data().createdAt?.toDate?.() || new Date(),
              };

              if (claimData.userId === auth.currentUser.uid) {
                setTrackingClaims([claimData]);
                saveTrackingDataToStorage([claimData]);
                setOfflineData(false);
              } else {
                Alert.alert(
                  "Error",
                  "You don't have permission to view this claim"
                );
                setTrackingClaims([]);
              }
            } else {
              Alert.alert("Error", "Claim not found");
              setTrackingClaims([]);
            }
            setLoading(false);
            setRefreshing(false);
          });

          return () => {
            if (typeof unsubscribe === "function") {
              unsubscribe();
            }
          };
        } else {
          const claimsQuery = collection(db, "claims");
          const unsubscribe = onSnapshot(claimsQuery, (querySnapshot) => {
            const claimsData = [];
            querySnapshot.forEach((doc) => {
              const claim = {
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate?.() || new Date(),
              };

              if (
                claim.userId === auth.currentUser.uid &&
                [
                  "submitted",
                  "under_review",
                  "documents_requested",
                  "processing",
                ].includes(claim.status?.toLowerCase())
              ) {
                claimsData.push(claim);
              }
            });

            const sortedClaims = claimsData.sort(
              (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
            );

            setTrackingClaims(sortedClaims);
            saveTrackingDataToStorage(sortedClaims);
            setOfflineData(false);
            setLoading(false);
            setRefreshing(false);
          });

          if (typeof unsubscribe === "function") {
            console.log("Subscribed to real-time updates for claims");
            unsubscribe();
          }
        }
      } else {
        await loadOfflineTrackingData();
        setLoading(false);
        setRefreshing(false);
      }
    } catch (error) {
      console.error("Error fetching tracking claims:", error);
      await loadOfflineTrackingData();
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const unsubscribe = fetchTrackingClaims();
    return () => {
      if (typeof unsubscribe === "function") {
        unsubscribe();
      }
    };
  }, [isOnline, claimId]);

  const handleRefresh = () => {
    if (isOnline) {
      fetchTrackingClaims(true);
    } else {
      setRefreshing(false);
      Alert.alert("Offline", "Cannot refresh while offline");
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
            colors={["#388E3C"]}
          />
        }
      >
        <View style={styles.header}>
          <Title style={styles.title}>Track Claims</Title>
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

        {trackingClaims.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No active claims to track</Text>
            <Paragraph style={styles.emptySubtext}>
              {offlineData
                ? "No cached tracking data available. Go online to sync your data."
                : claimId
                ? "This claim is not active or you don't have permission to view it."
                : "You don't have any claims in progress. Submitted claims will appear here for tracking."}
            </Paragraph>
            {!claimId && (
              <Button
                mode="contained"
                onPress={() => navigation.navigate("claimCreate")}
                style={styles.submitButton}
                buttonColor="#388E3C"
              >
                Submit New Claim
              </Button>
            )}
            <Button
              mode="outlined"
              onPress={() => navigation.navigate("ClaimHistory")}
              style={styles.historyButton}
              textColor="#388E3C"
            >
              View Claim History
            </Button>
          </View>
        ) : (
          <>
            {offlineData && (
              <Card style={styles.offlineBanner}>
                <Card.Content style={styles.offlineBannerContent}>
                  <Paragraph style={styles.offlineBannerText}>
                    Showing cached data. Connect to internet for latest updates.
                  </Paragraph>
                </Card.Content>
              </Card>
            )}

            {trackingClaims.map((claim) => {
              const progress = getClaimProgress(claim.status);
              const statusSteps = getStatusSteps(claim.status);

              return (
                <Card key={claim.id} style={styles.trackingCard}>
                  <Card.Content>
                    <View style={styles.cardHeader}>
                      <Title style={styles.claimTitle}>
                        {claim.packageName}
                      </Title>
                      <Chip
                        mode="outlined"
                        style={[
                          styles.statusChip,
                          {
                            backgroundColor:
                              getStatusColor(claim.status) + "20",
                            borderColor: getStatusColor(claim.status),
                          },
                        ]}
                        textStyle={{
                          color: getStatusColor(claim.status),
                          fontWeight: "bold",
                        }}
                      >
                        {claim.status
                          ? claim.status.replace(/_/g, " ").toUpperCase()
                          : "UNKNOWN"}
                      </Chip>
                    </View>

                    <Paragraph style={styles.amount}>
                      {formatAmount(claim.claimAmount)}
                    </Paragraph>

                    <Paragraph style={styles.reason}>
                      <Text style={styles.label}>Reason: </Text>
                      {claim.reason}
                    </Paragraph>

                    <View style={styles.progressSection}>
                      <View style={styles.progressHeader}>
                        <Text style={styles.progressLabel}>Claim Progress</Text>
                        <Text style={styles.progressPercentage}>
                          {Math.round(progress * 100)}%
                        </Text>
                      </View>
                      <ProgressBar
                        progress={progress}
                        color="#388E3C"
                        style={styles.progressBar}
                      />
                    </View>

                    <View style={styles.stepsContainer}>
                      {statusSteps.map((step, index) => (
                        <View key={index} style={styles.stepItem}>
                          <View
                            style={[
                              styles.stepDot,
                              step.completed && styles.stepDotCompleted,
                            ]}
                          />
                          <Text
                            style={[
                              styles.stepText,
                              step.completed && styles.stepTextCompleted,
                            ]}
                          >
                            {step.name}
                          </Text>
                          {index < statusSteps.length - 1 && (
                            <View
                              style={[
                                styles.stepLine,
                                step.completed && styles.stepLineCompleted,
                              ]}
                            />
                          )}
                        </View>
                      ))}
                    </View>

                    <Card style={styles.infoCard}>
                      <Card.Content>
                        <Title style={styles.infoTitle}>Current Status</Title>
                        <Paragraph style={styles.statusDescription}>
                          {getStatusDescription(claim.status)}
                        </Paragraph>
                        <View style={styles.metaInfo}>
                          <Text style={styles.metaLabel}>
                            Estimated completion:
                          </Text>
                          <Text style={styles.metaValue}>
                            {getEstimatedTime(claim.status)}
                          </Text>
                        </View>
                        <View style={styles.metaInfo}>
                          <Text style={styles.metaLabel}>Submitted on:</Text>
                          <Text style={styles.metaValue}>
                            {formatDate(claim.createdAt)}
                          </Text>
                        </View>
                        {claim.updatedAt && (
                          <View style={styles.metaInfo}>
                            <Text style={styles.metaLabel}>Last updated:</Text>
                            <Text style={styles.metaValue}>
                              {formatDate(claim.updatedAt)}
                            </Text>
                          </View>
                        )}
                      </Card.Content>
                    </Card>

                    {claim.status?.toLowerCase() === "documents_requested" && (
                      <Button
                        mode="contained"
                        onPress={() =>
                          navigation.navigate("UploadDocuments", {
                            claimId: claim.id,
                          })
                        }
                        style={styles.documentsButton}
                        buttonColor="#388E3C"
                        icon="file-upload"
                      >
                        Upload Required Documents
                      </Button>
                    )}
                  </Card.Content>

                  <Card.Actions>
                    <Button
                      mode="contained"
                      onPress={() => navigation.goBack()}
                      style={styles.backButton}
                      buttonColor="#388E3C"
                    >
                      Back
                    </Button>
                    <Button
                      mode="outlined" // Add this
                      onPress={() => showShareOptions(claim)}
                      style={styles.shareButton}
                      labelStyle={styles.shareButtonLabel} // Add this
                      icon="share-variant"
                    >
                      Share Status
                    </Button>
                  </Card.Actions>
                </Card>
              );
            })}
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
  backButton: {
    alignSelf: "flex-start",
    marginBottom: 16,
  },
  shareButton: {
    alignSelf: "flex-start",
    marginBottom: 16,
    backgroundColor: "#fff",
  },
  shareButtonLabel: {
    color: "#388E3C", // Set the text color
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
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
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#388E3C",
  },
  emptySubtext: {
    textAlign: "center",
    marginBottom: 24,
    color: "#666",
    lineHeight: 20,
  },
  submitButton: {
    marginTop: 8,
    marginBottom: 12,
  },
  historyButton: {
    borderColor: "#388E3C",
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
  trackingCard: {
    marginBottom: 24,
    elevation: 4,
    borderRadius: 12,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  claimTitle: {
    flex: 1,
    marginRight: 12,
    fontSize: 20,
    color: "#388E3C",
  },
  statusChip: {
    borderWidth: 1,
  },
  amount: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#388E3C",
    marginBottom: 8,
  },
  reason: {
    marginBottom: 16,
    fontSize: 14,
  },
  label: {
    fontWeight: "bold",
    color: "#333",
  },
  progressSection: {
    marginBottom: 20,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#388E3C",
  },
  progressPercentage: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#388E3C",
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "#E0E0E0",
  },
  stepsContainer: {
    marginBottom: 20,
  },
  stepItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  stepDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#E0E0E0",
    marginRight: 8,
  },
  stepDotCompleted: {
    backgroundColor: "#388E3C",
  },
  stepText: {
    fontSize: 12,
    color: "#9E9E9E",
    flex: 1,
  },
  stepTextCompleted: {
    color: "#388E3C",
    fontWeight: "bold",
  },
  stepLine: {
    position: "absolute",
    left: 6,
    top: 12,
    width: 1,
    height: 20,
    backgroundColor: "#E0E0E0",
  },
  stepLineCompleted: {
    backgroundColor: "#388E3C",
  },
  infoCard: {
    backgroundColor: "#F1F8E9",
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#388E3C",
  },
  infoTitle: {
    fontSize: 16,
    color: "#388E3C",
    marginBottom: 8,
  },
  statusDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: "#555",
    marginBottom: 12,
  },
  metaInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  metaLabel: {
    fontSize: 12,
    color: "#666",
    fontWeight: "bold",
  },
  metaValue: {
    fontSize: 12,
    color: "#333",
  },
  documentsButton: {
    marginTop: 8,
    marginBottom: 8,
  },
});

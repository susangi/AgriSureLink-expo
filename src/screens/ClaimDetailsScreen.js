import React, { useEffect, useState } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Image,
  Alert,
  Linking,
} from "react-native";
import {
  Card,
  Title,
  Paragraph,
  Chip,
  ActivityIndicator,
  Text,
  Button,
  Divider,
} from "react-native-paper";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../services/firebase/config";
import Layout from "../components/Layout";

export default function ClaimDetailsScreen({ route, navigation }) {
  const { claimId } = route.params;
  const [claim, setClaim] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClaim = async () => {
      try {
        const docRef = doc(db, "claims", claimId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const claimData = docSnap.data();

          // Process date fields properly
          const processedClaim = {
            id: docSnap.id,
            ...claimData,
            // Handle different date formats
            createdAt:
              claimData.createdAt?.toDate?.() ||
              new Date(claimData.createdAt) ||
              new Date(),
            submittedAt:
              claimData.submittedAt?.toDate?.() ||
              new Date(claimData.submittedAt),
            incidentDate:
              claimData.incidentDate?.toDate?.() ||
              new Date(claimData.incidentDate) ||
              new Date(claimData.createdAt),
            incidentTimestamp: claimData.incidentTimestamp
              ? new Date(claimData.incidentTimestamp)
              : null,
          };

          // Process location timestamp if exists
          if (claimData.location) {
            processedClaim.location = {
              ...claimData.location,
              capturedAt:
                claimData.location.capturedAt?.toDate?.() ||
                new Date(claimData.location.capturedAt),
              locationTimestamp:
                claimData.location.locationTimestamp?.toDate?.() ||
                new Date(claimData.location.locationTimestamp),
            };
          }

          setClaim(processedClaim);
        } else {
          Alert.alert("Not Found", "Claim does not exist.");
          navigation.goBack();
        }
      } catch (error) {
        console.error("Error fetching claim:", error);
        Alert.alert("Error", "Failed to fetch claim details.");
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    };

    fetchClaim();
  }, [claimId]);

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "approved":
        return "#388E3C";
      case "rejected":
        return "#F44336";
      case "pending":
        return "#FF9800";
      case "submitted":
        return "#2196F3";
      case "under_review":
        return "#FF9800";
      case "processing":
        return "#9C27B0";
      case "documents_requested":
        return "#FF5722";
      default:
        return "#757575";
    }
  };

  const formatDateTime = (date) => {
    if (!date) return "Not available";
    try {
      const dateObj = date instanceof Date ? date : new Date(date);
      if (isNaN(dateObj.getTime())) return "Invalid date";

      return dateObj.toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      return "Invalid date";
    }
  };

  const formatDate = (date) => {
    if (!date) return "Not available";
    try {
      const dateObj = date instanceof Date ? date : new Date(date);
      if (isNaN(dateObj.getTime())) return "Invalid date";

      return dateObj.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch (error) {
      return "Invalid date";
    }
  };

  const openGoogleMaps = (latitude, longitude) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
    Linking.openURL(url).catch(() => {
      Alert.alert("Error", "Could not open Google Maps.");
    });
  };

  if (loading) {
    return (
      <Layout navigation={navigation}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#388E3C" />
          <Text style={{ marginTop: 12 }}>Loading claim details...</Text>
        </View>
      </Layout>
    );
  }

  if (!claim) {
    return (
      <Layout navigation={navigation}>
        <View style={styles.centerContainer}>
          <Text>Claim not found</Text>
          <Button
            mode="contained"
            onPress={() => navigation.goBack()}
            style={styles.primaryButton}
          >
            Go Back
          </Button>
        </View>
      </Layout>
    );
  }

  return (
    <Layout navigation={navigation}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Back Button */}
        <Button
          mode="outlined"
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          icon="arrow-left"
          textColor="#388E3C"
        >
          Back
        </Button>

        {/* Main Claim Card */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.header}>
              <Title style={styles.title}>{claim.packageName}</Title>
              <Chip
                style={[
                  styles.statusChip,
                  { backgroundColor: getStatusColor(claim.status) + "20" },
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
              Claim Amount: Rs. {parseFloat(claim.claimAmount || 0).toFixed(2)}
            </Paragraph>
          </Card.Content>
        </Card>

        {/* Incident Details Card */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Incident Details</Title>

            <View style={styles.detailRow}>
              <Text style={styles.label}>Reason:</Text>
              <Text style={styles.value}>{claim.reason || "Not provided"}</Text>
            </View>

            {claim.details && (
              <View style={styles.detailRow}>
                <Text style={styles.label}>Details:</Text>
                <Text style={styles.value}>{claim.details}</Text>
              </View>
            )}

            <Divider style={styles.divider} />

            <View style={styles.detailRow}>
              <Text style={styles.label}>Incident Date & Time:</Text>
              <Text style={styles.value}>
                {formatDateTime(claim.incidentDate)}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.label}>Claim Submitted:</Text>
              <Text style={styles.value}>
                {formatDateTime(claim.createdAt)}
              </Text>
            </View>
          </Card.Content>
        </Card>

        {/* Location Details Card */}
        {claim.location && (
          <Card style={styles.card}>
            <Card.Content>
              <Title style={styles.sectionTitle}>Location Details</Title>

              <View style={styles.detailRow}>
                <Text style={styles.label}>Coordinates:</Text>
                <Text style={styles.coordinates}>
                  {claim.location.latitude?.toFixed(6)},{" "}
                  {claim.location.longitude?.toFixed(6)}
                </Text>
              </View>

              {claim.location.address && (
                <View style={styles.detailRow}>
                  <Text style={styles.label}>Address:</Text>
                  <Text style={styles.value}>{claim.location.address}</Text>
                </View>
              )}

              {claim.location.accuracy && (
                <View style={styles.detailRow}>
                  <Text style={styles.label}>Accuracy:</Text>
                  <Text style={styles.value}>
                    ±{Math.round(claim.location.accuracy)} meters
                  </Text>
                </View>
              )}

              {claim.location.capturedAt && (
                <View style={styles.detailRow}>
                  <Text style={styles.label}>Location Captured:</Text>
                  <Text style={styles.value}>
                    {formatDateTime(claim.location.capturedAt)}
                  </Text>
                </View>
              )}

              <View style={styles.locationActions}>
                <Button
                  mode="outlined"
                  onPress={() =>
                    openGoogleMaps(
                      claim.location.latitude,
                      claim.location.longitude
                    )
                  }
                  style={styles.mapButton}
                  icon="google-maps"
                  textColor="#388E3C"
                >
                  Google Maps
                </Button>
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Evidence Photos Card */}
        {claim.images && claim.images.length > 0 && (
          <Card style={styles.card}>
            <Card.Content>
              <Title style={styles.sectionTitle}>Evidence Photos</Title>
              <View style={styles.imageContainer}>
                {claim.images.map((uri, idx) => (
                  <Image
                    key={idx}
                    source={{ uri }}
                    style={styles.image}
                    resizeMode="cover"
                  />
                ))}
              </View>
              <Text style={styles.imageCount}>
                {claim.images.length} photo
                {claim.images.length !== 1 ? "s" : ""} attached
              </Text>
            </Card.Content>
          </Card>
        )}

        {/* Metadata Card */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Claim Information</Title>

            <View style={styles.detailRow}>
              <Text style={styles.label}>Claim ID:</Text>
              <Text style={styles.value}>{claim.id}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.label}>User ID:</Text>
              <Text style={styles.value}>
                {claim.userId?.substring(0, 8)}...
              </Text>
            </View>

            {claim.metadata && (
              <>
                <View style={styles.detailRow}>
                  <Text style={styles.label}>Has Location:</Text>
                  <Text style={styles.value}>
                    {claim.metadata.hasLocation ? "Yes" : "No"}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.label}>Images Attached:</Text>
                  <Text style={styles.value}>
                    {claim.metadata.imageCount || 0}
                  </Text>
                </View>

                {claim.metadata.locationAccuracy && (
                  <View style={styles.detailRow}>
                    <Text style={styles.label}>Location Accuracy:</Text>
                    <Text style={styles.value}>
                      ±{Math.round(claim.metadata.locationAccuracy)} meters
                    </Text>
                  </View>
                )}
              </>
            )}
          </Card.Content>
        </Card>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          {claim.status === "Submitted" && (
            <Button
              mode="contained"
              onPress={() =>
                navigation.navigate("TrackClaims", { claimId: claim.id })
              }
              style={styles.primaryButton}
            >
              Track Claim
            </Button>
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
  backButton: {
    alignSelf: "flex-start",
    marginBottom: 16,
    borderColor: "#388E3C",
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    flex: 1,
    marginRight: 12,
  },
  statusChip: {
    borderWidth: 0,
  },
  amount: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#388E3C",
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#333",
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  label: {
    fontWeight: "bold",
    color: "#666",
    flex: 1,
  },
  value: {
    flex: 2,
    textAlign: "right",
    color: "#333",
  },
  coordinates: {
    flex: 2,
    textAlign: "right",
    color: "#333",
    fontFamily: "monospace",
    fontSize: 12,
  },
  divider: {
    marginVertical: 12,
  },
  imageContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 8,
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  imageCount: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
    fontStyle: "italic",
  },
  locationActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
    gap: 8,
  },
  mapButton: {
    flex: 1,
    borderColor: "#388E3C",
  },
  actionsContainer: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: "#388E3C",
  },
  secondaryButton: {
    flex: 1,
    borderColor: "#388E3C",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
});

import React, { useEffect, useState } from "react";
import { View, ScrollView, StyleSheet, Image, Alert } from "react-native";
import {
  Card,
  Title,
  Paragraph,
  Chip,
  ActivityIndicator,
  Text,
  Button,
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
          setClaim({
            id: docSnap.id,
            ...docSnap.data(),
            createdAt: docSnap.data().createdAt?.toDate?.() || new Date(),
          });
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

  if (loading) {
    return (
      <Layout navigation={navigation}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={{ marginTop: 12 }}>Loading claim details...</Text>
        </View>
      </Layout>
    );
  }

  return (
    <Layout navigation={navigation}>
      <ScrollView contentContainerStyle={styles.container}>
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.header}>
              <Title style={styles.title}>{claim.packageName}</Title>
              <Chip
                style={[
                  styles.statusChip,
                  { backgroundColor: getStatusColor(claim.status) + "20" },
                ]}
                textStyle={{ color: getStatusColor(claim.status) }}
              >
                {claim.status}
              </Chip>
            </View>

            <Paragraph style={styles.amount}>
              Amount: Rs. {claim.claimAmount}
            </Paragraph>

            <Paragraph style={styles.detailText}>
              <Text style={styles.label}>Reason: </Text>
              {claim.reason}
            </Paragraph>

            {claim.details && (
              <Paragraph style={styles.detailText}>
                <Text style={styles.label}>Details: </Text>
                {claim.details}
              </Paragraph>
            )}

            <Paragraph style={styles.date}>
              <Text style={styles.label}>Submitted At: </Text>
              {formatDate(claim.createdAt)}
            </Paragraph>

            {claim.images && claim.images.length > 0 && (
              <View style={styles.imageContainer}>
                {claim.images.map((uri, idx) => (
                  <Image key={idx} source={{ uri }} style={styles.image} />
                ))}
              </View>
            )}
          </Card.Content>

          <Card.Actions>
            <Button mode="contained" onPress={() => navigation.goBack()}>
              Back
            </Button>
          </Card.Actions>
        </Card>
      </ScrollView>
    </Layout>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    flexGrow: 1,
  },
  card: {
    marginBottom: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    flex: 1,
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
  detailText: {
    marginBottom: 8,
  },
  label: {
    fontWeight: "bold",
  },
  date: {
    fontSize: 12,
    color: "#888",
    marginBottom: 12,
  },
  imageContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  image: {
    width: 100,
    height: 100,
    marginRight: 8,
    marginBottom: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

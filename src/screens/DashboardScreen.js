import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { AntDesign, MaterialCommunityIcons } from "@expo/vector-icons";
import Layout from "../components/Layout";
import CustomAlert from "../components/Alert";
import { useAlert } from "../context/AlertContext";

export default function DashboardScreen({ navigation }) {
  const { alert } = useAlert();

  return (
    <Layout navigation={navigation}>
      {/* ---------- RISK METER ---------- */}
      <View style={styles.card}>
        <MaterialCommunityIcons name="speedometer" size={60} color="#388E3C" />
        <Text style={styles.cardTitle}>Risk Level</Text>
        <Text style={styles.cardValue}>Moderate</Text>
      </View>

      {/* ---------- ALERT BOX ---------- */}
      <LinearGradient
        colors={["#ff9800", "#f44336"]}
        style={[styles.card, styles.alertCard]}
      >
        <Text style={styles.alertTitle}>⚠ Latest Alert</Text>
        <Text style={styles.alertText}>
          Storm Warning: High winds expected tomorrow.
        </Text>
      </LinearGradient>

      {/* ---------- SUBMIT CLAIM ---------- */}
      <TouchableOpacity
        style={[styles.card, styles.claimCard]}
        onPress={() => navigation.navigate("claim-create")}
      >
        <AntDesign name="form" size={40} color="white" />
        <Text style={[styles.cardTitle, { color: "white" }]}>Submit Claim</Text>
        <Text style={[styles.cardValue, { color: "white" }]}>
          Report crop or farm damages
        </Text>
      </TouchableOpacity>

      {alert && (
        <CustomAlert
          type={alert.type}
          title={alert.title}
          message={alert.message}
        />
      )}
    </Layout>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  cardTitle: { fontSize: 18, fontWeight: "bold", marginTop: 10, color: "#333" },
  cardValue: { fontSize: 16, marginTop: 5, color: "#555" },
  claimCard: { backgroundColor: "#388E3C" },
  alertCard: { alignItems: "flex-start" },
  alertTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "white",
    marginBottom: 5,
  },
  alertText: { fontSize: 14, color: "white" },
});

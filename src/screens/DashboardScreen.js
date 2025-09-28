import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  AntDesign,
  MaterialCommunityIcons,
  Ionicons,
} from "@expo/vector-icons";
import { useUser } from "../context/UserContext";
import CustomAlert from "../components/Alert";
import { useAlert } from "../context/AlertContext";

export default function DashboardScreen({ navigation }) {
  const { user } = useUser();
  const { showAlert, alert } = useAlert();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => alert("Menu clicked!")}>
          <Ionicons name="menu" size={28} color="#388E3C" />
        </TouchableOpacity>

        <Image source={require("../../assets/logo.png")} style={styles.logo} />

        <View style={styles.headerIcons}>
          <Text style={styles.userName}>{user?.name || "Guest"}</Text>
          <TouchableOpacity onPress={() => navigation.replace("SignIn")}>
            <Ionicons name="log-out-outline" size={28} color="#d32f2f" />
          </TouchableOpacity>
        </View>
      </View>
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
        onPress={() => navigation.navigate("Claims")}
      >
        <AntDesign name="form" size={40} color="white" />
        <Text style={[styles.cardTitle, { color: "white" }]}>Submit Claim</Text>
        <Text style={[styles.cardValue, { color: "white" }]}>
          Report crop or farm damages
        </Text>
      </TouchableOpacity>

      {alert && <CustomAlert type={alert.type} message={alert.message} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff", // Main background color white
    padding: 20,
  },
  /* HEADER */
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
    position: "relative", // allows absolute centering
  },

  logo: {
    width: 40,
    height: 40,
    resizeMode: "contain",
    position: "absolute",
    left: "50%",
    transform: [{ translateX: -20 }], // half of logo width to truly center
  },

  headerIcons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  userName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginRight: 5,
  },

  /* CARDS */
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
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 10,
    color: "#333",
  },
  cardValue: {
    fontSize: 16,
    marginTop: 5,
    color: "#555",
  },

  /* CLAIM CARD */
  claimCard: {
    backgroundColor: "#388E3C", // Agri Green
  },

  /* ALERT CARD */
  alertCard: {
    alignItems: "flex-start",
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "white",
    marginBottom: 5,
  },
  alertText: {
    fontSize: 14,
    color: "white",
  },
});

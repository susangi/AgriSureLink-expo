import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { AntDesign, MaterialCommunityIcons } from "@expo/vector-icons";

export default function AlertsScreen({ navigation }) {
  return (
    <LinearGradient
      colors={["#3FA34D", "#00BFFF"]} // Agri Green to Sky Blue
      style={styles.container}
    ></LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    alignItems: "center",
    justifyContent: "flex-start",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginTop: 50,
  },
  subtitle: {
    fontSize: 16,
    color: "#f0f0f0",
    marginBottom: 30,
    textAlign: "center",
  },
  riskMeter: {
    alignItems: "center",
    marginBottom: 40,
  },
  riskText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginTop: 10,
  },
  claimButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#388E3C",
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 12,
    marginBottom: 30,
  },
  claimButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 10,
  },
  alertBox: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    padding: 15,
    borderRadius: 10,
    width: "100%",
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 5,
  },
  alertText: {
    fontSize: 14,
    color: "#fff",
  },
});

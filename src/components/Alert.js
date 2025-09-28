import React from "react";
import { Modal, View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { AntDesign, MaterialIcons } from "@expo/vector-icons";

export default function CustomAlert({
  visible,
  type = "info",
  title,
  message,
  onClose,
}) {
  const alertStyles = {
    success: { bg: "#4CAF50", icon: "check-circle", color: "white" },
    error: { bg: "#F44336", icon: "close-circle", color: "white" },
    warning: { bg: "#FFC107", icon: "exclamation-circle", color: "black" },
    info: { bg: "#2196F3", icon: "info-circle", color: "white" },
  };

  const { bg, icon, color } = alertStyles[type] || alertStyles.info;

  return (
    <Modal transparent={true} animationType="fade" visible={visible}>
      <View style={styles.overlay}>
        <View style={[styles.alertBox, { backgroundColor: bg }]}>
          <AntDesign
            name={icon}
            size={40}
            color={color}
            style={{ marginBottom: 5 }}
          />
          <Text style={[styles.title, { color }]}>{title}</Text>
          <Text style={[styles.message, { color }]}>{message}</Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  alertBox: {
    width: "80%",
    borderRadius: 16,
    padding: 10,
    alignItems: "center",
    elevation: 5,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 2,
  },
  message: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 5,
  },
  button: {
    borderWidth: 2,
    paddingVertical: 8,
    paddingHorizontal: 30,
    borderRadius: 10,
  },
  buttonText: {
    fontSize: 10,
    fontWeight: "bold",
  },
});

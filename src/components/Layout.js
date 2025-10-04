import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useUser } from "../context/UserContext";
import { useAlert } from "../context/AlertContext";
import { signOut } from "firebase/auth";
import { auth } from "../services/firebase/config";

export default function Layout({ navigation, children }) {
  const { user, setUser } = useUser();
  const { showAlert } = useAlert();
  const [userMenuVisible, setUserMenuVisible] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      showAlert("success", "Logout", "You have been logged out successfully.");
      navigation.replace("SignIn");
      setUserMenuVisible(false);
    } catch (error) {
      showAlert("error", "Logout Failed", "Something went wrong.");
    }
  };

  return (
    <View style={styles.container}>
      {/* -------- HEADER -------- */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Image
            source={require("../../assets/logo.png")}
            style={styles.logo}
          />
          <Text style={styles.appName}>AgriSureLink</Text>
        </View>

        <TouchableOpacity
          style={styles.userIconContainer}
          onPress={() => setUserMenuVisible(true)}
        >
          <Ionicons name="person-circle-outline" size={36} color="#388E3C" />
        </TouchableOpacity>
      </View>

      {/* -------- USER MENU MODAL -------- */}
      <Modal
        transparent
        visible={userMenuVisible}
        animationType="fade"
        onRequestClose={() => setUserMenuVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPressOut={() => setUserMenuVisible(false)}
        >
          <View style={styles.userMenu}>
            <Text style={styles.userEmail}>
              {user?.email || "guest@example.com"}
            </Text>
            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
              <Text style={styles.logoutText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* -------- BODY -------- */}
      <View style={styles.body}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    backgroundColor: "#fff",
    marginTop: 30,
  },

  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  logo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    resizeMode: "contain",
  },

  appName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#388E3C",
  },

  userIconContainer: {
    alignItems: "center",
    justifyContent: "center",
  },

  body: { flex: 1, padding: 20 },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.2)",
    justifyContent: "flex-start",
    alignItems: "flex-end",
  },

  userMenu: {
    width: 180,
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 15,
    marginTop: 80,
    marginRight: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },

  userEmail: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 10,
    color: "#333",
  },

  logoutBtn: {
    backgroundColor: "#d32f2f",
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: "center",
  },

  logoutText: {
    color: "#fff",
    fontWeight: "bold",
  },
});

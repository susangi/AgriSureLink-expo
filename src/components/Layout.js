import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useUser } from "../context/UserContext";
import { useAlert } from "../context/AlertContext";
import { signOut } from "firebase/auth";
import { auth } from "../services/firebase/config";

export default function Layout({ navigation, children }) {
  const { user, setUser } = useUser();
  const { showAlert } = useAlert();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      showAlert("success", "Logout", "You have been logged out successfully.");
      navigation.replace("SignIn");
    } catch (error) {
      showAlert("error", "Logout Failed", "Something went wrong.");
    }
  };

  return (
    <View style={styles.container}>
      {/* -------- TOP HEADER -------- */}
      <View style={styles.header}>
        {/* <TouchableOpacity onPress={() => alert("Menu clicked!")}>
          <Ionicons name="menu" size={28} color="#388E3C" />
        </TouchableOpacity> */}

        <Image source={require("../../assets/logo.png")} style={styles.logo} />

        <View style={styles.headerIcons}>
          <Text style={styles.userName}>{user?.name || "Guest"}</Text>
          <TouchableOpacity onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={28} color="#d32f2f" />
          </TouchableOpacity>
        </View>
      </View>

      {/* -------- MAIN BODY -------- */}
      <View style={styles.body}>{children}</View>

      {/* -------- BOTTOM FOOTER -------- */}
      {/* <View style={styles.footer}>
        <Text style={styles.footerText}>© 2025 AgriSureLink</Text>
      </View> */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", marginTop: 10 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    position: "relative",
  },
  logo: {
    width: 40,
    height: 40,
    resizeMode: "contain",
    position: "absolute",
    left: "50%",
    top: 0, // optional, if you want it from top
    borderRadius: 20, // half of width/height for a perfect circle
    transform: [{ translateX: -20 }], // centers it horizontally
  },
  headerIcons: { flexDirection: "row", alignItems: "center", gap: 8 },
  userName: { fontSize: 16, fontWeight: "600", color: "#333", marginRight: 5 },
  body: { flex: 1, padding: 20 },
  footer: {
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  footerText: { fontSize: 12, color: "#777" },
});

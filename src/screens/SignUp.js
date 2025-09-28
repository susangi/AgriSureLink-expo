import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
} from "react-native";
import { auth } from "../services/firebase/config";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { LinearGradient } from "expo-linear-gradient";
import CustomAlert from "../components/Alert";
import { useAlert } from "../context/AlertContext";

export default function SignUpScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const { showAlert, alert } = useAlert();
  

  const handleSignUp = async () => {
    if (!email.trim() || !password.trim() || !confirmPassword.trim()) {
      showAlert(
        "warning",
        "Missing Fields",
        "Please enter both email, password and confirm password."
      );
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("error", "Passwords do not match");
      return;
    }
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      showAlert("success", "Success", "Account created successfully!");
      navigation.replace("Main"); // Go to Dashboard after signup
    } catch (error) {
      showAlert("error", "Error", "Invalid Credentials.");
    }
  };

  return (
    <LinearGradient
      colors={["#3FA34D", "#00BFFF"]} // Agri Green → Sky Blue
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      {/* Logo */}
      <Image source={require("../../assets/logo.png")} style={styles.logo} />
      <Text style={styles.title}>Create Account</Text>
      <Text style={styles.subtitle}>Join AgriSureLink today!</Text>

      {/* Inputs */}
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        placeholderTextColor="#555"
      />
      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
        placeholderTextColor="#555"
      />
      <TextInput
        placeholder="Confirm Password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
        style={styles.input}
        placeholderTextColor="#555"
      />

      {/* Sign Up Button */}
      <TouchableOpacity style={styles.signupBtn} onPress={handleSignUp}>
        <Text style={styles.signupText}>Sign Up</Text>
      </TouchableOpacity>

      {/* Redirect to Sign In */}
      <TouchableOpacity onPress={() => navigation.navigate("SignIn")}>
        <Text style={styles.signinLink}>
          Already have an account?{" "}
          <Text style={{ fontWeight: "bold" }}>Login</Text>
        </Text>
      </TouchableOpacity>

      {alert && (
        <CustomAlert
          type={alert.type} // success, error, warning
          title={alert.title} // added
          message={alert.message}
        />
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 25,
  },
  logo: {
    width: 110,
    height: 110,
    marginBottom: 10,
    resizeMode: "contain",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "white",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: "white",
    marginBottom: 30,
    textAlign: "center",
  },
  input: {
    width: "100%",
    backgroundColor: "rgba(255,255,255,0.9)",
    padding: 14,
    borderRadius: 12,
    marginBottom: 15,
    fontSize: 16,
    color: "#212121",
  },
  signupBtn: {
    width: "100%",
    backgroundColor: "#0288D1", // Sky Blue
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 20,
    elevation: 3,
  },
  signupText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  signinLink: {
    color: "white",
    fontSize: 14,
    marginTop: 15,
  },
});

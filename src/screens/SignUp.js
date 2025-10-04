import React, { useState } from "react";
import {
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
} from "react-native";
import { auth } from "../services/firebase/config";
import { createUserWithEmailAndPassword } from "firebase/auth";
import CustomAlert from "../components/Alert";
import { useAlert } from "../context/AlertContext";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import NetInfo from "@react-native-community/netinfo";

export default function SignUpScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const { showAlert, alert } = useAlert();

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email.toLowerCase());
  };

  const handleSignUp = async () => {
    const netState = await NetInfo.fetch();
    if (!netState.isConnected) {
      Alert.alert("No Internet", "Please check your connection and try again.");
      return;
    }

    if (!email.trim() || !password.trim() || !confirmPassword.trim()) {
      showAlert("warning", "Missing Fields", "Please fill all fields.");
      return;
    }

    if (!validateEmail(email)) {
      showAlert("error", "Invalid Email", "Enter a valid email address.");
      return;
    }

    if (password.length < 6) {
      showAlert("error", "Weak Password", "Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      showAlert("error", "Password Mismatch", "Passwords do not match.");
      return;
    }

    try {
      await createUserWithEmailAndPassword(auth, email, password);
      showAlert("success", "Success", "Account created successfully!");
      navigation.replace("Main");
    } catch (error) {
      showAlert("error", "Signup Failed", error.message || "Try again later.");
    }
  };

  return (
    <KeyboardAwareScrollView
      contentContainerStyle={styles.container}
      enableOnAndroid={true}
      extraScrollHeight={20}
    >
      <Image source={require("../../assets/logo.png")} style={styles.logo} />
      <Text style={styles.title}>Create Account</Text>
      <Text style={styles.subtitle}>Join AgriSureLink today!</Text>

      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        placeholderTextColor="#777"
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
        placeholderTextColor="#777"
      />
      <TextInput
        placeholder="Confirm Password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
        style={styles.input}
        placeholderTextColor="#777"
      />

      <TouchableOpacity style={styles.signupBtn} onPress={handleSignUp}>
        <Text style={styles.signupText}>Sign Up</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate("SignIn")}>
        <Text style={styles.signinLink}>
          Already have an account? <Text style={{ fontWeight: "bold" }}>Login</Text>
        </Text>
      </TouchableOpacity>

      {alert && (
        <CustomAlert
          type={alert.type}
          title={alert.title}
          message={alert.message}
        />
      )}
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 25,
    backgroundColor: "#fff",
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 15,
    borderRadius: 60,
    backgroundColor: "#fff",
    padding: 10,
    resizeMode: "contain",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#388E3C",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: "#555",
    marginBottom: 30,
    textAlign: "center",
  },
  input: {
    width: "100%",
    backgroundColor: "#f5f5f5",
    padding: 14,
    borderRadius: 12,
    marginBottom: 15,
    fontSize: 16,
    color: "#212121",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  signupBtn: {
    width: "100%",
    backgroundColor: "#388E3C",
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
    color: "#388E3C",
    fontSize: 14,
    marginTop: 15,
  },
});

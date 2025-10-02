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
import { signInWithEmailAndPassword } from "firebase/auth";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import { AntDesign } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import CustomAlert from "../components/Alert";
import { useAlert } from "../context/AlertContext";
import { useUser } from "../context/UserContext";

WebBrowser.maybeCompleteAuthSession();

export default function SignInScreen({ navigation }) {
  const { setUser } = useUser(); // 👈 from context
  const { showAlert, alert } = useAlert();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com",
  });

  React.useEffect(() => {
    if (response?.type === "success") {
      const { id_token } = response.params;
      showAlert("success", "Google Sign-In Success", "Token received.");
    }
  }, [response]);

  const handleLogin = async () => {
    try {
      if (!email.trim() || !password.trim()) {
        showAlert(
          "warning",
          "Missing Fields",
          "Please enter both email and password."
        );
        return;
      }
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const firebaseUser = userCredential.user;
      // Save in context
      setUser({
        name: firebaseUser.displayName || "Farmer",
        email: firebaseUser.email,
        uid: firebaseUser.uid,
      });
      showAlert("success", "Success", "Welcome back to AgriSureLink!");
      navigation.replace("Main");
    } catch (error) {
      showAlert("error", "Error", "Invalid Credentials.");
    }
  };

  return (
    <LinearGradient
      colors={["#fff", "#fff"]} // Agri Green to Sky Blue
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      {/* <View style={styles.container}> */}
      {/* App Logo */}
      <Image
        source={require("../../assets/logo.png")} // put your logo in assets folder
        style={styles.logoImage}
      />
      {/* <Text style={styles.logo}>AgriSureLink</Text> */}
      <Text style={styles.subtitle}>
        Secure your farm, grow with confidence
      </Text>

      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        placeholderTextColor="#777"
      />
      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
        placeholderTextColor="#777"
      />

      <TouchableOpacity style={styles.loginBtn} onPress={handleLogin}>
        <Text style={styles.loginText}>Login</Text>
      </TouchableOpacity>

      <Text style={styles.orText}>── OR ──</Text>

      <TouchableOpacity
        style={styles.googleBtn}
        disabled={!request}
        onPress={() => promptAsync()}
      >
        <AntDesign name="google" size={20} color="white" />
        <Text style={styles.googleText}>Sign in with Google</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate("SignUp")}>
        <Text style={styles.signupLink}>Don’t have an account? Sign Up</Text>
      </TouchableOpacity>
      {/* </View> */}

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
    padding: 20,
  },
  logoImage: {
    width: 100,
    height: 100,
    marginBottom: 10,
    resizeMode: "contain",
  },
  logo: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#388E3C", // Agri Green
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: "#0288D1", // Sky Blue
    marginBottom: 30,
    textAlign: "center",
  },
  input: {
    width: "100%",
    backgroundColor: "#F5F5F5",
    padding: 12,
    borderRadius: 10,
    marginBottom: 15,
    fontSize: 16,
    color: "#212121",
  },
  loginBtn: {
    width: "100%",
    backgroundColor: "#388E3C", // Agri Green
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 15,
  },
  loginText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  orText: {
    marginVertical: 10,
    fontSize: 14,
    color: "#555",
  },
  googleBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    backgroundColor: "#0288D1", // Sky Blue
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  googleText: {
    color: "white",
    fontSize: 16,
    marginLeft: 10,
    fontWeight: "bold",
  },
  signupLink: {
    color: "#0288D1",
    fontSize: 14,
    marginTop: 15,
  },
});

import React, { useState, useEffect } from "react";
import {
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
} from "react-native";
import { auth } from "../services/firebase/config";
import { signInWithEmailAndPassword } from "firebase/auth";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import { LinearGradient } from "expo-linear-gradient";
import CustomAlert from "../components/Alert";
import { useAlert } from "../context/AlertContext";
import { useUser } from "../context/UserContext";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import NetInfo from "@react-native-community/netinfo";

WebBrowser.maybeCompleteAuthSession();

export default function SignInScreen({ navigation }) {
  const { setUser } = useUser();
  const { showAlert, alert } = useAlert();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com",
  });

  useEffect(() => {
    if (response?.type === "success") {
      const { id_token } = response.params;
      showAlert("success", "Google Sign-In Success", "Token received.");
    }
  }, [response]);

  const handleLogin = async () => {
    const netState = await NetInfo.fetch();
    if (!netState.isConnected) {
      Alert.alert("No Internet", "Please check your connection and try again.");
      return;
    }

    try {
      if (!email.trim() || !password.trim()) {
        showAlert("warning", "Missing Fields", "Please enter both email and password.");
        return;
      }
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

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
      colors={["#fff", "#fff"]}
      style={{ flex: 1 }}
    >
      <KeyboardAwareScrollView
        contentContainerStyle={styles.container}
        enableOnAndroid={true}
        extraScrollHeight={20}
      >
        {/* Circular Logo */}
        <Image
          source={require("../../assets/logo.png")}
          style={styles.logoImage}
        />

        <Text style={styles.subtitle}>
          Secure your farm, grow with confidence
        </Text>

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

        <TouchableOpacity style={styles.loginBtn} onPress={handleLogin}>
          <Text style={styles.loginText}>Login</Text>
        </TouchableOpacity>

        <Text style={styles.orText}>── OR ──</Text>

        <TouchableOpacity onPress={() => navigation.navigate("SignUp")}>
          <Text style={styles.signupLink}>Don’t have an account? Sign Up</Text>
        </TouchableOpacity>

        {alert && (
          <CustomAlert
            type={alert.type}
            title={alert.title}
            message={alert.message}
          />
        )}
      </KeyboardAwareScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  logoImage: {
    width: 110,
    height: 110,
    marginBottom: 15,
    borderRadius: 55, // makes it circular
    resizeMode: "cover",
  },
  subtitle: {
    fontSize: 14,
    color: "#388E3C", // changed to green
    marginBottom: 30,
    textAlign: "center",
  },
  input: {
    width: "100%",
    backgroundColor: "#F5F5F5",
    padding: 14,
    borderRadius: 10,
    marginBottom: 15,
    fontSize: 16,
    color: "#212121",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  loginBtn: {
    width: "100%",
    backgroundColor: "#388E3C", // Agri Green
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 15,
    elevation: 2,
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
  signupLink: {
    color: "#388E3C", // green instead of blue
    fontSize: 14,
    marginTop: 15,
  },
});

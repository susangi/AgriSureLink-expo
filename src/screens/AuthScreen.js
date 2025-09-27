import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Image } from "react-native";
import { auth } from "../services/firebase/config"; 
import { signInWithEmailAndPassword } from "firebase/auth";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import { AntDesign } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

WebBrowser.maybeCompleteAuthSession();

export default function SignInScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com",
  });

  React.useEffect(() => {
    if (response?.type === "success") {
      const { id_token } = response.params;
      Alert.alert("Google Sign-In Success", "Token received.");
    }
  }, [response]);

  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      Alert.alert("Login Success", "Welcome back!");
      navigation.replace("Dashboard");
    } catch (error) {
      Alert.alert("Login Error", error.message);
    }
  };

  return (
    <LinearGradient
      colors={["#3FA34D", "#00BFFF"]} // Agri Green to Sky Blue
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
      <Text style={styles.subtitle}>Secure your farm, grow with confidence</Text>

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


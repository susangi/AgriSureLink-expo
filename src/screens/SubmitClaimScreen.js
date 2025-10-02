import React, { useState } from "react";
import { View, StyleSheet, Alert, Image, ScrollView } from "react-native";
import { TextInput, Button, Title } from "react-native-paper";
import { db, auth } from "../services/firebase/config";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import Layout from "../components/Layout";

export default function SubmitClaimScreen({ navigation }) {
  const [packageName, setPackageName] = useState("");
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [claimAmount, setClaimAmount] = useState("");
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);

  // Request permissions and pick image
  const pickImage = async () => {
    console.log("Picking image...");

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission required", "Please allow access to your photos.");
      return;
    }

    // Launch image picker with updated mediaTypes
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images", "videos"],
      quality: 1,
    });

    console.log("Image picker result:", result);

    if (!result.canceled && result.assets) {
      const newImages = result.assets.map((asset) => asset.uri);
      setImages((prevImages) => [...prevImages, ...newImages]);
    }
  };

  // Remove image from selection
  const removeImage = (index) => {
    setImages((prevImages) => prevImages.filter((_, i) => i !== index));
  };

  // Upload a single image using blob approach
  const uploadImage = async (uri) => {
    try {
      console.log("Uploading image:", uri);

      // Generate unique filename
      const filename = `claims/${
        auth.currentUser?.uid || "guest"
      }/${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;

      // Using fetch and blob (recommended)
      const response = await fetch(uri);
      const blob = await response.blob();

      // Upload to Firebase Storage
      const storage = getStorage();
      const storageRef = ref(storage, filename);
      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);

      console.log("Image uploaded:", downloadURL);
      return downloadURL;
    } catch (error) {
      console.error("Upload error:", error);
      throw error;
    }
  };

  // Upload all images
  const uploadAllImages = async () => {
    const urls = [];
    for (const imageUri of images) {
      try {
        const url = await uploadImage(imageUri);
        urls.push(url);
      } catch (error) {
        console.error(`Failed to upload image: ${imageUri}`, error);
        throw error;
      }
    }
    return urls;
  };

  // Handle claim submit
  const handleSubmit = async () => {
    if (!packageName || !reason || !details || !claimAmount) {
      Alert.alert("Error", "Please fill all fields.");
      return;
    }

    // Validate claim amount
    const amount = parseFloat(claimAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert("Error", "Please enter a valid claim amount.");
      return;
    }

    setUploading(true);
    try {
      console.log("Submitting claim for user:", auth.currentUser?.uid);

      let imageUrls = [];
      if (images.length > 0) {
        console.log(`Uploading ${images.length} images...`);
        imageUrls = await uploadAllImages();
        console.log(`Successfully uploaded ${imageUrls.length} images`);
      }

      // Submit claim to Firestore
      await addDoc(collection(db, "claims"), {
        userId: auth.currentUser?.uid || "anonymous",
        packageName,
        reason,
        details,
        claimAmount: amount,
        images: imageUrls,
        status: "Submitted",
        createdAt: Timestamp.now(),
      });

      Alert.alert("Success", "Claim submitted successfully!");

      // Reset form
      setPackageName("");
      setReason("");
      setDetails("");
      setClaimAmount("");
      setImages([]);

      navigation.goBack();
    } catch (error) {
      console.log("Firestore error:", error);
      Alert.alert("Error", "Failed to submit claim: " + error.message);
    }
    setUploading(false);
  };

  // Handle back button press
  const handleBack = () => {
    if (packageName || reason || details || claimAmount || images.length > 0) {
      // Show confirmation if there's unsaved data
      Alert.alert(
        "Discard Changes?",
        "You have unsaved changes. Are you sure you want to go back?",
        [
          {
            text: "Stay",
            style: "cancel",
          },
          {
            text: "Discard",
            onPress: () => navigation.goBack(),
            style: "destructive",
          },
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  return (
    <Layout navigation={navigation}>
      <ScrollView contentContainerStyle={styles.container}>
        <Button
          mode="outlined"
          onPress={handleBack}
          style={styles.simpleBackButton}
          icon="arrow-left"
        >
          Back
        </Button>

        <Title style={styles.title}>Submit a Claim</Title>

        {/* Package Name */}
        <TextInput
          label="Package Name"
          value={packageName}
          onChangeText={setPackageName}
          style={styles.input}
          mode="outlined"
        />

        {/* Claim Amount */}
        <TextInput
          label="Claim Amount"
          value={claimAmount}
          onChangeText={setClaimAmount}
          style={styles.input}
          mode="outlined"
          keyboardType="numeric"
        />

        {/* Reason */}
        <TextInput
          label="Reason"
          value={reason}
          onChangeText={setReason}
          style={styles.input}
          mode="outlined"
        />

        {/* Details */}
        <TextInput
          label="Details"
          value={details}
          onChangeText={setDetails}
          style={styles.input}
          mode="outlined"
          multiline
          numberOfLines={4}
        />

        {/* Image Picker */}
        <Button
          icon="camera"
          mode="outlined"
          onPress={pickImage}
          style={styles.input}
          disabled={uploading}
        >
          {images.length > 0
            ? `Add More Images (${images.length}/5)`
            : "Add Images"}
        </Button>

        {/* Image Preview */}
        {images.length > 0 && (
          <View style={styles.imagePreviewContainer}>
            {images.map((uri, idx) => (
              <View key={idx} style={styles.imageWrapper}>
                <Image
                  source={{ uri }}
                  style={styles.imagePreview}
                  resizeMode="cover"
                />
                <Button
                  mode="contained"
                  style={styles.removeButton}
                  onPress={() => removeImage(idx)}
                  compact
                >
                  ×
                </Button>
              </View>
            ))}
          </View>
        )}

        <Button
          mode="contained"
          onPress={handleSubmit}
          loading={uploading}
          disabled={uploading}
          style={styles.button}
        >
          Submit Claim
        </Button>
      </ScrollView>
    </Layout>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    flexGrow: 1,
  },
  title: {
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
    paddingVertical: 8,
  },
  imagePreviewContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 16,
    justifyContent: "flex-start",
  },
  imageWrapper: {
    position: "relative",
    marginRight: 8,
    marginBottom: 8,
  },
  imagePreview: {
    width: 80,
    height: 80,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  removeButton: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "red",
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    padding: 0,
    margin: 0,
  },
  simpleBackButton: {
    alignSelf: "flex-start",
    marginBottom: 10,
  },
});

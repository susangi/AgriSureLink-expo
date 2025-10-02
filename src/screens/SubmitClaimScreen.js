import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Alert,
  Image,
  ScrollView,
  Platform,
} from "react-native";
import { TextInput, Button, Title, Chip, Text } from "react-native-paper";
import { db, auth } from "../services/firebase/config";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import Layout from "../components/Layout";
import * as Location from "expo-location";

export default function SubmitClaimScreen({ navigation }) {
  const [packageName, setPackageName] = useState("");
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [claimAmount, setClaimAmount] = useState("");
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);

  // New state variables
  const [incidentDate, setIncidentDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [location, setLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationAddress, setLocationAddress] = useState("");

  // Request camera and location permissions on component mount
  useEffect(() => {
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    try {
      // Request camera permissions
      const cameraPermission =
        await ImagePicker.requestCameraPermissionsAsync();
      const libraryPermission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      // Request location permissions
      const locationPermission =
        await Location.requestForegroundPermissionsAsync();

      if (
        cameraPermission.status !== "granted" ||
        libraryPermission.status !== "granted"
      ) {
        Alert.alert(
          "Permission Required",
          "Camera and photo library access is needed to capture and upload images for your claim."
        );
      }

      if (locationPermission.status !== "granted") {
        Alert.alert(
          "Location Permission",
          "Location access helps us verify the incident location for your claim."
        );
      }
    } catch (error) {
      console.error("Error requesting permissions:", error);
    }
  };

  // Get current location
  const getCurrentLocation = async () => {
    setLocationLoading(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission denied",
          "Location permission is required to get your current location."
        );
        setLocationLoading(false);
        return;
      }

      let location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setLocation(location.coords);

      // Get address from coordinates
      try {
        let address = await Location.reverseGeocodeAsync(location.coords);
        if (address.length > 0) {
          const addr = address[0];
          const addressString = [
            addr.name,
            addr.street,
            addr.city,
            addr.region,
            addr.country,
          ]
            .filter(Boolean)
            .join(", ");
          setLocationAddress(addressString);
        }
      } catch (geocodeError) {
        console.error("Geocoding error:", geocodeError);
        setLocationAddress("Location captured (address not available)");
      }

      Alert.alert("Success", "Location captured successfully!");
    } catch (error) {
      console.error("Error getting location:", error);
      Alert.alert("Error", "Failed to get location. Please try again.");
    }
    setLocationLoading(false);
  };

  // Simple date selection without DateTimePicker
  const showDateSelection = () => {
    Alert.alert("Select Incident Date", "Choose an option:", [
      {
        text: "Today",
        onPress: () => setIncidentDate(new Date()),
      },
      {
        text: "Yesterday",
        onPress: () => {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          setIncidentDate(yesterday);
        },
      },
      {
        text: "Custom Date",
        onPress: () => showCustomDateInput(),
      },
      {
        text: "Cancel",
        style: "cancel",
      },
    ]);
  };

  const showCustomDateInput = () => {
    Alert.prompt(
      "Enter Date",
      "Enter date as YYYY-MM-DD (e.g., 2024-01-15):",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "OK",
          onPress: (dateString) => {
            if (dateString) {
              const date = new Date(dateString);
              if (!isNaN(date.getTime())) {
                setIncidentDate(date);
              } else {
                Alert.alert(
                  "Invalid Date",
                  "Please enter a valid date in YYYY-MM-DD format."
                );
              }
            }
          },
        },
      ],
      "plain-text"
    );
  };

  // Open camera to capture image
  const openCamera = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission required",
          "Please allow camera access to take photos."
        );
        return;
      }

      let result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaType.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      console.log("Camera result:", result);

      if (!result.canceled && result.assets) {
        const newImages = result.assets.map((asset) => asset.uri);
        setImages((prevImages) => [...prevImages, ...newImages].slice(0, 5)); // Limit to 5 images
      }
    } catch (error) {
      console.error("Camera error:", error);
      Alert.alert("Error", "Failed to open camera. Please try again.");
    }
  };

  // Pick image from gallery
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
      Alert.alert("Error", "Please fill all required fields.");
      return;
    }

    // Validate claim amount
    const amount = parseFloat(claimAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert("Error", "Please enter a valid claim amount.");
      return;
    }

    // Check if location is captured (optional but recommended)
    if (!location) {
      Alert.alert(
        "Location Missing",
        "We recommend adding location for better claim processing. Continue without location?",
        [
          { text: "Add Location", style: "cancel" },
          { text: "Continue", onPress: () => submitClaim(amount) },
        ]
      );
      return;
    }

    submitClaim(amount);
  };

  const submitClaim = async (amount) => {
    setUploading(true);
    try {
      console.log("Submitting claim for user:", auth.currentUser?.uid);

      let imageUrls = [];
      if (images.length > 0) {
        console.log(`Uploading ${images.length} images...`);
        imageUrls = await uploadAllImages();
        console.log(`Successfully uploaded ${imageUrls.length} images`);
      }

      // Prepare claim data
      const claimData = {
        userId: auth.currentUser?.uid || "anonymous",
        packageName,
        reason,
        details,
        claimAmount: amount,
        images: imageUrls,
        status: "Submitted",
        createdAt: Timestamp.now(),
        incidentDate: Timestamp.fromDate(incidentDate),
        incidentTimestamp: incidentDate.toISOString(),
      };

      // Add location data if available
      if (location) {
        claimData.location = {
          latitude: location.latitude,
          longitude: location.longitude,
          address: locationAddress,
          capturedAt: Timestamp.now(),
        };
      }

      // Submit claim to Firestore
      await addDoc(collection(db, "claims"), claimData);

      Alert.alert("Success", "Claim submitted successfully!");

      // Reset form
      setPackageName("");
      setReason("");
      setDetails("");
      setClaimAmount("");
      setImages([]);
      setLocation(null);
      setLocationAddress("");
      setIncidentDate(new Date());

      navigation.goBack();
    } catch (error) {
      console.log("Firestore error:", error);
      Alert.alert("Error", "Failed to submit claim: " + error.message);
    }
    setUploading(false);
  };

  // Handle back button press
  const handleBack = () => {
    if (
      packageName ||
      reason ||
      details ||
      claimAmount ||
      images.length > 0 ||
      location
    ) {
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

  const formatDate = (date) => {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Layout navigation={navigation}>
      <ScrollView contentContainerStyle={styles.container}>
        <Button
          mode="outlined"
          onPress={handleBack}
          style={styles.simpleBackButton}
          icon="arrow-left"
          textColor="#2E7D32"
        >
          Back
        </Button>

        <Title style={styles.title}>Submit a Claim</Title>

        {/* Package Name */}
        <TextInput
          label="Package Name *"
          value={packageName}
          onChangeText={setPackageName}
          style={styles.input}
          mode="outlined"
        />

        {/* Claim Amount */}
        <TextInput
          label="Claim Amount *"
          value={claimAmount}
          onChangeText={setClaimAmount}
          style={styles.input}
          mode="outlined"
          keyboardType="numeric"
          left={<TextInput.Affix text="$" />}
        />

        {/* Incident Date and Time */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Incident Date & Time *</Text>
          <Button
            mode="outlined"
            onPress={showDateSelection}
            style={styles.dateButton}
            icon="calendar"
          >
            {formatDate(incidentDate)} at {formatTime(incidentDate)}
          </Button>
          <Text style={styles.dateHelpText}>
            Select when the incident occurred
          </Text>
        </View>

        {/* Location */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Incident Location</Text>
          {location ? (
            <View style={styles.locationContainer}>
              <Chip
                icon="check-circle"
                mode="outlined"
                style={styles.locationChip}
              >
                Location Captured
              </Chip>
              {locationAddress ? (
                <Text style={styles.locationAddress}>{locationAddress}</Text>
              ) : null}
              <Button
                mode="text"
                onPress={getCurrentLocation}
                style={styles.retryLocationButton}
                textColor="#2E7D32"
              >
                Update Location
              </Button>
            </View>
          ) : (
            <View>
              <Button
                mode="outlined"
                onPress={getCurrentLocation}
                style={styles.locationButton}
                icon="map-marker"
                loading={locationLoading}
                disabled={locationLoading}
              >
                {locationLoading
                  ? "Getting Location..."
                  : "Capture Current Location"}
              </Button>
              <Text style={styles.locationHelpText}>
                Recommended for faster claim processing
              </Text>
            </View>
          )}
        </View>

        {/* Reason */}
        <TextInput
          label="Reason for Claim *"
          value={reason}
          onChangeText={setReason}
          style={styles.input}
          mode="outlined"
          placeholder="Brief description of what happened"
        />

        {/* Details */}
        <TextInput
          label="Detailed Description *"
          value={details}
          onChangeText={setDetails}
          style={styles.input}
          mode="outlined"
          multiline
          numberOfLines={4}
          placeholder="Provide detailed information about the incident, damage extent, and any other relevant details"
        />

        {/* Image Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>
            Evidence Photos ({images.length}/5)
          </Text>
          <View style={styles.imageButtonsContainer}>
            <Button
              icon="camera"
              mode="outlined"
              onPress={openCamera}
              style={styles.imageButton}
              disabled={uploading || images.length >= 5}
            >
              Take Photo
            </Button>
            <Button
              icon="image"
              mode="outlined"
              onPress={pickImage}
              style={styles.imageButton}
              disabled={uploading || images.length >= 5}
            >
              Choose from Gallery
            </Button>
          </View>

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

          {images.length >= 5 && (
            <Text style={styles.imageLimitText}>Maximum 5 images reached</Text>
          )}
        </View>

        <Button
          mode="contained"
          onPress={handleSubmit}
          loading={uploading}
          disabled={uploading}
          style={styles.button}
          contentStyle={styles.buttonContent}
        >
          Submit Claim
        </Button>

        <Text style={styles.requiredText}>* Required fields</Text>
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
    color: "#2E7D32",
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
    marginBottom: 16,
    paddingVertical: 8,
    backgroundColor: "#2E7D32",
  },
  buttonContent: {
    paddingVertical: 6,
  },
  simpleBackButton: {
    alignSelf: "flex-start",
    marginBottom: 10,
    borderColor: "#2E7D32",
  },
  section: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#333",
  },
  dateButton: {
    marginBottom: 4,
    borderColor: "#2E7D32",
  },
  dateHelpText: {
    fontSize: 12,
    color: "#666",
    fontStyle: "italic",
  },
  locationButton: {
    borderColor: "#2E7D32",
    marginBottom: 4,
  },
  locationHelpText: {
    fontSize: 12,
    color: "#666",
    fontStyle: "italic",
  },
  retryLocationButton: {
    alignSelf: "flex-start",
    marginTop: 8,
  },
  locationContainer: {
    backgroundColor: "#E8F5E8",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#C8E6C9",
  },
  locationChip: {
    alignSelf: "flex-start",
    marginBottom: 8,
    backgroundColor: "#4CAF50",
  },
  locationAddress: {
    fontSize: 14,
    color: "#333",
    marginBottom: 8,
  },
  imageButtonsContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  imageButton: {
    flex: 1,
    borderColor: "#2E7D32",
  },
  imagePreviewContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 8,
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
  imageLimitText: {
    fontSize: 12,
    color: "#f44336",
    textAlign: "center",
    fontStyle: "italic",
  },
  requiredText: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
    marginTop: 8,
  },
});

import React, { useState, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  Alert,
  Image,
  ScrollView,
  TouchableOpacity,
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
import { CameraView, CameraType, useCameraPermissions } from "expo-camera";
import DateTimePicker from "@react-native-community/datetimepicker";

export default function SubmitClaimScreen({ navigation }) {
  const [packageName, setPackageName] = useState("");
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [claimAmount, setClaimAmount] = useState("");
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);

  // Camera states
  const [facing, setFacing] = useState("back");
  const [permission, requestPermission] = useCameraPermissions();
  const [showCamera, setShowCamera] = useState(false);
  const cameraRef = useRef(null);

  // Location and date states
  const [incidentDate, setIncidentDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pickerMode, setPickerMode] = useState("date"); // 'date' or 'time'
  const [location, setLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationAddress, setLocationAddress] = useState("");
  const [locationTimestamp, setLocationTimestamp] = useState(null);

  // Request camera and location permissions on component mount
  useEffect(() => {
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    try {
      // Request camera permissions for ImagePicker
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
        console.log("Camera or library permission not granted");
      }

      if (locationPermission.status !== "granted") {
        console.log("Location permission not granted");
      }
    } catch (error) {
      console.error("Error requesting permissions:", error);
    }
  };

  // Get current location with timestamp
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
        accuracy: Location.Accuracy.Best,
        timeout: 15000, // 15 seconds timeout
      });

      const locationData = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
        altitude: location.coords.altitude,
        timestamp: new Date(location.timestamp), // Convert to Date object
      };

      setLocation(locationData);
      setLocationTimestamp(new Date(location.timestamp));

      // Get address from coordinates
      try {
        let address = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });

        if (address.length > 0) {
          const addr = address[0];
          const addressString = [
            addr.name,
            addr.street,
            addr.city,
            addr.region,
            addr.postalCode,
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

      Alert.alert(
        "Location Captured",
        `Location recorded at ${formatDateTime(
          new Date(location.timestamp)
        )}\n\nLatitude: ${location.coords.latitude.toFixed(
          6
        )}\nLongitude: ${location.coords.longitude.toFixed(6)}`
      );
    } catch (error) {
      console.error("Error getting location:", error);
      Alert.alert("Error", "Failed to get location. Please try again.");
    }
    setLocationLoading(false);
  };

  // Open date picker
  const openDatePicker = () => {
    setPickerMode("date");
    setShowDatePicker(true);
  };

  // Open time picker after date is selected
  const openTimePicker = () => {
    setPickerMode("time");
    setShowDatePicker(true);
  };

  // Handle date/time picker changes
  const onDateTimeChange = (event, selectedDate) => {
    setShowDatePicker(false);

    if (selectedDate) {
      // Prevent future dates
      const now = new Date();
      if (selectedDate > now) {
        Alert.alert(
          "Invalid Date",
          "Please select a date and time in the past. Future dates are not allowed for incident reports.",
          [{ text: "OK", onPress: () => setShowDatePicker(true) }]
        );
        return;
      }

      if (pickerMode === "date") {
        // Keep the current time, just update the date
        const currentTime = incidentDate;
        selectedDate.setHours(currentTime.getHours(), currentTime.getMinutes());
        setIncidentDate(selectedDate);

        // Auto-open time picker after date selection
        setTimeout(() => {
          setPickerMode("time");
          setShowDatePicker(true);
        }, 300);
      } else {
        // Time picker - update time while keeping the date
        const currentDate = incidentDate;
        selectedDate.setFullYear(
          currentDate.getFullYear(),
          currentDate.getMonth(),
          currentDate.getDate()
        );
        setIncidentDate(selectedDate);
      }
    }
  };

  // Quick date selection options
  const showQuickOptions = () => {
    Alert.alert("Select Incident Time", "Choose when the incident occurred:", [
      {
        text: "Right Now",
        onPress: () => {
          const now = new Date();
          setIncidentDate(now);
        },
      },
      {
        text: "1 Hour Ago",
        onPress: () => {
          const oneHourAgo = new Date();
          oneHourAgo.setHours(oneHourAgo.getHours() - 1);
          setIncidentDate(oneHourAgo);
        },
      },
      {
        text: "3 Hours Ago",
        onPress: () => {
          const threeHoursAgo = new Date();
          threeHoursAgo.setHours(threeHoursAgo.getHours() - 3);
          setIncidentDate(threeHoursAgo);
        },
      },
      {
        text: "Yesterday Same Time",
        onPress: () => {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          setIncidentDate(yesterday);
        },
      },
      {
        text: "Custom Date & Time",
        onPress: openDatePicker,
      },
      {
        text: "Cancel",
        style: "cancel",
      },
    ]);
  };

  // Toggle camera facing
  const toggleCameraFacing = () => {
    setFacing((current) => (current === "back" ? "front" : "back"));
  };

  // Take picture with Expo Camera
  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: false,
          skipProcessing: false,
          exif: true, // Include EXIF data which may contain location
        });

        if (photo && photo.uri) {
          const newImages = [...images, photo.uri].slice(0, 5);
          setImages(newImages);
          setShowCamera(false);
          Alert.alert("Success", "Photo captured successfully!");
        }
      } catch (error) {
        console.error("Error taking picture:", error);
        Alert.alert("Error", "Failed to capture photo. Please try again.");
      }
    }
  };

  // Open camera using Expo Camera
  const openCamera = async () => {
    if (!permission) {
      await requestPermission();
    }

    if (!permission?.granted) {
      Alert.alert(
        "Camera Permission Required",
        "Please grant camera permission to take photos."
      );
      return;
    }

    setShowCamera(true);
  };

  // Pick image from gallery
  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.getMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        const { status: newStatus } =
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (newStatus !== "granted") {
          Alert.alert(
            "Permission required",
            "Please allow access to your photos."
          );
          return;
        }
      }

      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaType.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        allowsMultipleSelection: true,
        selectionLimit: 5 - images.length,
      });

      console.log("Image picker result:", result);

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newImages = result.assets.map((asset) => asset.uri);
        const updatedImages = [...images, ...newImages].slice(0, 5);
        setImages(updatedImages);
      }
    } catch (error) {
      console.error("Image picker error:", error);
      Alert.alert("Error", "Failed to access photos. Please try again.");
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

      const filename = `claims/${
        auth.currentUser?.uid || "guest"
      }/${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;

      const response = await fetch(uri);
      const blob = await response.blob();

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

    const amount = parseFloat(claimAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert("Error", "Please enter a valid claim amount.");
      return;
    }

    // Show confirmation with all collected data
    const confirmationMessage = `
Package: ${packageName}
Amount: $${amount}
Incident Date: ${formatDateTime(incidentDate)}
${
  location
    ? `Location: ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(
        6
      )}`
    : "Location: Not provided"
}
Images: ${images.length} photo(s)

Are you sure you want to submit this claim?
    `.trim();

    Alert.alert("Confirm Claim Submission", confirmationMessage, [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Submit Claim",
        onPress: () => submitClaim(amount),
      },
    ]);
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

      // Prepare comprehensive claim data
      const claimData = {
        userId: auth.currentUser?.uid || "anonymous",
        packageName,
        reason,
        details,
        claimAmount: amount,
        images: imageUrls,
        status: "Submitted",

        // Submission metadata
        createdAt: Timestamp.now(),
        submittedAt: Timestamp.now(),

        // Incident details (when it actually happened)
        incidentDate: Timestamp.fromDate(incidentDate),
        incidentTimestamp: incidentDate.toISOString(),

        // Location data if available
        ...(location && {
          location: {
            // Coordinates
            latitude: location.latitude,
            longitude: location.longitude,

            // Additional location data
            accuracy: location.accuracy,
            altitude: location.altitude,
            address: locationAddress,

            // Timestamps
            capturedAt: Timestamp.fromDate(locationTimestamp || new Date()),
            locationTimestamp: location.timestamp
              ? Timestamp.fromDate(location.timestamp)
              : Timestamp.now(),
          },
        }),

        // Metadata
        metadata: {
          hasLocation: !!location,
          imageCount: images.length,
          locationAccuracy: location?.accuracy || null,
          submittedFrom: "mobile_app",
        },
      };

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
      setLocationTimestamp(null);
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

  // Format date and time for display
  const formatDateTime = (date) => {
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
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

  // Camera View Component
  if (showCamera) {
    return (
      <View style={styles.cameraContainer}>
        <CameraView style={styles.camera} facing={facing} ref={cameraRef}>
          <View style={styles.cameraControls}>
            <TouchableOpacity
              style={styles.cameraButton}
              onPress={() => setShowCamera(false)}
            >
              <Text style={styles.cameraButtonText}>✕</Text>
            </TouchableOpacity>

            <View style={styles.cameraBottomControls}>
              <TouchableOpacity
                style={styles.flipButton}
                onPress={toggleCameraFacing}
              >
                <Text style={styles.flipButtonText}>🔄</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.captureButton}
                onPress={takePicture}
              >
                <View style={styles.captureButtonInner} />
              </TouchableOpacity>

              <View style={styles.placeholder} />
            </View>
          </View>
        </CameraView>
      </View>
    );
  }

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
          <Text style={styles.sectionLabel}>When did it happen? *</Text>

          <View style={styles.dateTimeContainer}>
            <Button
              mode="outlined"
              onPress={showQuickOptions}
              style={styles.dateTimeButton}
              icon="calendar-clock"
            >
              {formatDateTime(incidentDate)}
            </Button>

            <View style={styles.dateTimeButtons}>
              <Button
                mode="text"
                onPress={openDatePicker}
                style={styles.smallButton}
                compact
              >
                Change Date
              </Button>
              <Button
                mode="text"
                onPress={openTimePicker}
                style={styles.smallButton}
                compact
              >
                Change Time
              </Button>
            </View>
          </View>

          <Text style={styles.dateHelpText}>
            Select the actual date and time when the incident occurred
          </Text>
        </View>

        {/* DateTime Picker */}
        {showDatePicker && (
          <DateTimePicker
            value={incidentDate}
            mode={pickerMode}
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={onDateTimeChange}
            maximumDate={new Date()} // Prevent future dates
            textColor="#2E7D32"
          />
        )}

        {/* Location */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Incident Location</Text>
          {location ? (
            <View style={styles.locationContainer}>
              <Chip
                icon="map-marker-check"
                mode="outlined"
                style={styles.locationChip}
              >
                📍 Location Recorded
              </Chip>
              <View style={styles.locationDetails}>
                <Text style={styles.coordinates}>
                  Lat: {location.latitude.toFixed(6)}, Lng:{" "}
                  {location.longitude.toFixed(6)}
                </Text>
                {locationAddress ? (
                  <Text style={styles.locationAddress}>{locationAddress}</Text>
                ) : null}
                <Text style={styles.locationTime}>
                  Captured: {formatDateTime(locationTimestamp)}
                </Text>
                {location.accuracy && (
                  <Text style={styles.accuracy}>
                    Accuracy: ±{Math.round(location.accuracy)} meters
                  </Text>
                )}
              </View>
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
                  : "📡 Capture Current Location"}
              </Button>
              <Text style={styles.locationHelpText}>
                Records precise GPS coordinates with timestamp
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
          style={styles.submitButton}
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
  submitButton: {
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
  dateTimeContainer: {
    marginBottom: 4,
  },
  dateTimeButton: {
    marginBottom: 8,
    borderColor: "#2E7D32",
  },
  dateTimeButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  smallButton: {
    flex: 1,
    marginHorizontal: 4,
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
  locationDetails: {
    marginBottom: 8,
  },
  coordinates: {
    fontSize: 12,
    fontFamily: "monospace",
    color: "#333",
    marginBottom: 4,
  },
  locationAddress: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  locationTime: {
    fontSize: 10,
    color: "#888",
    fontStyle: "italic",
    marginBottom: 4,
  },
  accuracy: {
    fontSize: 10,
    color: "#666",
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
  // Camera Styles
  cameraContainer: {
    flex: 1,
    backgroundColor: "black",
  },
  camera: {
    flex: 1,
  },
  cameraControls: {
    flex: 1,
    backgroundColor: "transparent",
    justifyContent: "space-between",
    padding: 20,
  },
  cameraButton: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 10,
    borderRadius: 25,
  },
  cameraButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  cameraBottomControls: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  flipButton: {
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 15,
    borderRadius: 25,
  },
  flipButtonText: {
    color: "white",
    fontSize: 20,
  },
  captureButton: {
    backgroundColor: "rgba(255,255,255,0.3)",
    padding: 4,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: "white",
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "white",
  },
  placeholder: {
    width: 60,
  },
});

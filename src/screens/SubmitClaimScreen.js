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
import { TextInput, Button, Title, Chip, Text, Card } from "react-native-paper";
import { db, auth } from "../services/firebase/config";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import * as ImagePicker from "expo-image-picker";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import Layout from "../components/Layout";
import { CameraView, useCameraPermissions } from "expo-camera";
import DateTimePicker from "@react-native-community/datetimepicker";

export default function SubmitClaimScreen({ route, navigation }) {
  // Form state management
  const [packageName, setPackageName] = useState("");
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [claimAmount, setClaimAmount] = useState("");
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);

  // Camera state management
  const [facing, setFacing] = useState("back");
  const [permission, requestPermission] = useCameraPermissions();
  const [showCamera, setShowCamera] = useState(false);
  const cameraRef = useRef(null);

  // Date and location state management
  const [incidentDate, setIncidentDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pickerMode, setPickerMode] = useState("date");
  const [location, setLocation] = useState(null);
  const [locationAddress, setLocationAddress] = useState("");

  // Handle location selection from MapPicker
  useEffect(() => {
    if (route.params?.pickedLocation) {
      const picked = route.params.pickedLocation;
      setLocation({
        latitude: picked.latitude,
        longitude: picked.longitude,
        accuracy: picked.accuracy || null,
        altitude: picked.altitude || null,
        timestamp: picked.timestamp ? new Date(picked.timestamp) : new Date(),
      });
      setLocationAddress("Location selected via map");
      navigation.setParams({ pickedLocation: null });
    }
  }, [route.params]);

  // Request necessary permissions on component mount
  useEffect(() => {
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    try {
      await ImagePicker.requestCameraPermissionsAsync();
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    } catch (error) {
      console.error("Permission request error:", error);
    }
  };

  // Date and time selection handlers
  const openDatePicker = () => {
    setPickerMode("date");
    setShowDatePicker(true);
  };

  const openTimePicker = () => {
    setPickerMode("time");
    setShowDatePicker(true);
  };

  const onDateTimeChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const now = new Date();
      if (selectedDate > now) {
        Alert.alert(
          "Invalid Date",
          "Please select a date and time in the past.",
          [{ text: "OK", onPress: () => setShowDatePicker(true) }]
        );
        return;
      }
      setIncidentDate(selectedDate);
    }
  };

  // Quick date selection options for user convenience
  const showQuickOptions = () => {
    Alert.alert("Select Incident Time", "Choose when the incident occurred:", [
      {
        text: "Right Now",
        onPress: () => setIncidentDate(new Date()),
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

  // Camera functionality for evidence capture
  const toggleCameraFacing = () => {
    setFacing((current) => (current === "back" ? "front" : "back"));
  };

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          exif: true,
        });
        if (photo?.uri) {
          const newImages = [...images, photo.uri].slice(0, 5);
          setImages(newImages);
          setShowCamera(false);
        }
      } catch (error) {
        Alert.alert("Error", "Failed to capture photo.");
      }
    }
  };

  const openCamera = async () => {
    if (!permission?.granted) {
      await requestPermission();
    }
    setShowCamera(true);
  };

  // Image gallery selection
  const pickImage = async () => {
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled && result.assets?.length > 0) {
        const newImages = result.assets.map((asset) => asset.uri);
        const updatedImages = [...images, ...newImages].slice(0, 5);
        setImages(updatedImages);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to access photos.");
    }
  };

  const removeImage = (index) => {
    setImages((prevImages) => prevImages.filter((_, i) => i !== index));
  };

  // Image upload to Firebase Storage
  const uploadImage = async (uri) => {
    try {
      const filename = `claims/${
        auth.currentUser?.uid || "guest"
      }/${Date.now()}.jpg`;
      const response = await fetch(uri);
      const blob = await response.blob();
      const storage = getStorage();
      const storageRef = ref(storage, filename);
      await uploadBytes(storageRef, blob);
      return await getDownloadURL(storageRef);
    } catch (error) {
      throw error;
    }
  };

  const uploadAllImages = async () => {
    const urls = [];
    for (const imageUri of images) {
      try {
        const url = await uploadImage(imageUri);
        urls.push(url);
      } catch (error) {
        throw error;
      }
    }
    return urls;
  };

  // Form validation and submission
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

    Alert.alert(
      "Confirm Claim Submission",
      `Package: ${packageName}\nAmount: $${amount}\nIncident Date: ${formatDateTime(
        incidentDate
      )}\nLocation: ${location ? "Provided" : "Not provided"}\nImages: ${
        images.length
      } photo(s)`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Submit Claim", onPress: () => submitClaim(amount) },
      ]
    );
  };

  const submitClaim = async (amount) => {
    setUploading(true);
    try {
      let imageUrls = [];
      if (images.length > 0) {
        imageUrls = await uploadAllImages();
      }

      const claimData = {
        userId: auth.currentUser?.uid || "anonymous",
        packageName,
        reason,
        details,
        claimAmount: amount,
        images: imageUrls,
        status: "Submitted",
        createdAt: Timestamp.now(),
        submittedAt: Timestamp.now(),
        incidentDate: Timestamp.fromDate(incidentDate),
        incidentTimestamp: incidentDate.toISOString(),
        ...(location && {
          location: {
            latitude: location.latitude,
            longitude: location.longitude,
            accuracy: location.accuracy,
            altitude: location.altitude,
            address: locationAddress,
            capturedAt: Timestamp.now(),
          },
        }),
        metadata: {
          hasLocation: !!location,
          imageCount: images.length,
          locationAccuracy: location?.accuracy || null,
          submittedFrom: "mobile_app",
        },
      };

      await addDoc(collection(db, "claims"), claimData);
      Alert.alert("Success", "Claim submitted successfully!");
      resetForm();
      navigation.goBack();
    } catch (error) {
      Alert.alert("Error", "Failed to submit claim: " + error.message);
    }
    setUploading(false);
  };

  const resetForm = () => {
    setPackageName("");
    setReason("");
    setDetails("");
    setClaimAmount("");
    setImages([]);
    setLocation(null);
    setLocationAddress("");
    setIncidentDate(new Date());
  };

  const handleBack = () => {
    if (
      packageName ||
      reason ||
      details ||
      claimAmount ||
      images.length > 0 ||
      location
    ) {
      Alert.alert("Discard Changes?", "You have unsaved changes.", [
        { text: "Stay", style: "cancel" },
        {
          text: "Discard",
          onPress: () => navigation.goBack(),
          style: "destructive",
        },
      ]);
    } else {
      navigation.goBack();
    }
  };

  // Utility functions for date formatting
  const formatDateTime = (date) => {
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Camera UI component
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

  // Main form UI
  return (
    <Layout navigation={navigation}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header with Back Button */}
        <View style={styles.header}>
          <Button
            mode="outlined"
            onPress={handleBack}
            style={styles.backButton}
            icon="arrow-left"
            textColor="#388E3C"
            compact
          >
            Back
          </Button>
          <Title style={styles.title}>Submit New Claim</Title>
        </View>

        {/* Basic Information Card */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.cardTitle}>Basic Information</Title>

            <TextInput
              label="Package Name *"
              value={packageName}
              onChangeText={setPackageName}
              style={styles.input}
              mode="outlined"
              outlineColor="#E0E0E0"
              activeOutlineColor="#388E3C"
            />

            <TextInput
              label="Claim Amount *"
              value={claimAmount}
              onChangeText={setClaimAmount}
              style={styles.input}
              mode="outlined"
              keyboardType="numeric"
              left={<TextInput.Affix text="$" />}
              outlineColor="#E0E0E0"
              activeOutlineColor="#388E3C"
            />
          </Card.Content>
        </Card>

        {/* Incident Details Card */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.cardTitle}>Incident Details</Title>

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>When did it happen? *</Text>
              <View style={styles.dateTimeContainer}>
                <Button
                  mode="outlined"
                  onPress={showQuickOptions}
                  style={styles.dateTimeButton}
                  icon="calendar-clock"
                  textColor="#388E3C"
                >
                  {formatDateTime(incidentDate)}
                </Button>
                <View style={styles.dateTimeButtons}>
                  <Button
                    mode="text"
                    onPress={openDatePicker}
                    style={styles.smallButton}
                    compact
                    textColor="#388E3C"
                  >
                    Change Date
                  </Button>
                  <Button
                    mode="text"
                    onPress={openTimePicker}
                    style={styles.smallButton}
                    compact
                    textColor="#388E3C"
                  >
                    Change Time
                  </Button>
                </View>
              </View>
              <Text style={styles.helpText}>
                Select the actual date and time when the incident occurred
              </Text>
            </View>

            {showDatePicker && (
              <DateTimePicker
                value={incidentDate}
                mode={pickerMode}
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={onDateTimeChange}
                maximumDate={new Date()}
              />
            )}

            <TextInput
              label="Reason for Claim *"
              value={reason}
              onChangeText={setReason}
              style={styles.input}
              mode="outlined"
              placeholder="Brief description of what happened"
              outlineColor="#E0E0E0"
              activeOutlineColor="#388E3C"
            />

            <TextInput
              label="Detailed Description *"
              value={details}
              onChangeText={setDetails}
              style={styles.input}
              mode="outlined"
              multiline
              numberOfLines={4}
              placeholder="Provide detailed information about the incident"
              outlineColor="#E0E0E0"
              activeOutlineColor="#388E3C"
            />
          </Card.Content>
        </Card>

        {/* Location Card */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.cardTitle}>Incident Location</Title>
            {location ? (
              <View style={styles.locationContainer}>
                <Chip
                  icon="map-marker-check"
                  mode="outlined"
                  style={styles.locationChip}
                  textStyle={styles.chipText}
                >
                  📍 Location Recorded
                </Chip>
                <Button
                  mode="outlined"
                  onPress={() => navigation.navigate("MapPicker", { location })}
                  style={styles.locationButton}
                  icon="map"
                  textColor="#388E3C"
                >
                  Update Location on Map
                </Button>
              </View>
            ) : (
              <View>
                <Button
                  mode="outlined"
                  onPress={() => navigation.navigate("MapPicker")}
                  style={styles.locationButton}
                  icon="map-marker"
                  textColor="#388E3C"
                >
                  Select Location on Map
                </Button>
                <Text style={styles.helpText}>
                  Choose incident location using interactive map
                </Text>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Evidence Photos Card */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.cardTitle}>
              Evidence Photos ({images.length}/5)
            </Title>
            <View style={styles.imageButtonsContainer}>
              <Button
                icon="camera"
                mode="outlined"
                onPress={openCamera}
                style={styles.imageButton}
                disabled={images.length >= 5}
                textColor="#388E3C"
              >
                Take Photo
              </Button>
              <Button
                icon="image"
                mode="outlined"
                onPress={pickImage}
                style={styles.imageButton}
                disabled={images.length >= 5}
                textColor="#388E3C"
              >
                Choose from Gallery
              </Button>
            </View>

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
              <Text style={styles.limitText}>Maximum 5 images reached</Text>
            )}
          </Card.Content>
        </Card>

        {/* Submit Button */}
        <Button
          mode="contained"
          onPress={handleSubmit}
          loading={uploading}
          disabled={uploading}
          style={styles.submitButton}
          contentStyle={styles.submitButtonContent}
          icon="send"
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
    backgroundColor: "#F5F5F5",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  backButton: {
    borderColor: "#388E3C",
    marginRight: 12,
  },
  title: {
    flex: 1,
    fontSize: 24,
    fontWeight: "bold",
    color: "#388E3C",
    textAlign: "center",
    marginRight: 60,
  },
  card: {
    marginBottom: 16,
    elevation: 2,
    borderRadius: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#388E3C",
    marginBottom: 16,
  },
  input: {
    marginBottom: 16,
    backgroundColor: "#FFF",
  },
  section: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    color: "#333",
  },
  dateTimeContainer: {
    marginBottom: 8,
  },
  dateTimeButton: {
    marginBottom: 8,
    borderColor: "#388E3C",
  },
  dateTimeButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  smallButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  helpText: {
    fontSize: 12,
    color: "#666",
    fontStyle: "italic",
    marginTop: 4,
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
    marginBottom: 12,
    backgroundColor: "#4CAF50",
  },
  chipText: {
    color: "#FFF",
    fontWeight: "500",
  },
  locationButton: {
    borderColor: "#388E3C",
  },
  imageButtonsContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  imageButton: {
    flex: 1,
    borderColor: "#388E3C",
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
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  removeButton: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "#F44336",
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  limitText: {
    fontSize: 12,
    color: "#F44336",
    textAlign: "center",
    fontStyle: "italic",
  },
  submitButton: {
    marginTop: 8,
    marginBottom: 16,
    backgroundColor: "#388E3C",
    borderRadius: 8,
  },
  submitButtonContent: {
    paddingVertical: 8,
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

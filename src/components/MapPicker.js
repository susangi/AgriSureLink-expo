import React, { useState, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  Alert,
  TextInput,
  TouchableOpacity,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import { Button, Text } from "react-native-paper";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";

export default function MapPicker({ route, navigation }) {
  const mapRef = useRef(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [region, setRegion] = useState({
    latitude: 6.9271,
    longitude: 79.8612,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(true);

  // Get current location on component mount
  useEffect(() => {
    getCurrentLocation();
  }, []);

  // Set initial location from params if available
  useEffect(() => {
    if (route.params?.location) {
      const initialLocation = route.params.location;
      setSelectedLocation(initialLocation);
      setRegion({
        ...initialLocation,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
    }
  }, [route.params?.location]);

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
      });

      const newRegion = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };

      setRegion(newRegion);
      setSelectedLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      // Animate to current location
      if (mapRef.current) {
        mapRef.current.animateToRegion(newRegion, 1000);
      }
    } catch (error) {
      console.error("Error getting location:", error);
      Alert.alert("Error", "Failed to get current location");
    }
    setLocationLoading(false);
  };

  const handleMapPress = (event) => {
    const { coordinate } = event.nativeEvent;
    setSelectedLocation(coordinate);
  };

  const searchLocation = async () => {
    if (!searchQuery.trim()) {
      Alert.alert("Error", "Please enter a location to search");
      return;
    }

    setLoading(true);
    try {
      const geocode = await Location.geocodeAsync(searchQuery);

      if (geocode.length > 0) {
        const location = geocode[0];
        const newRegion = {
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        };

        setRegion(newRegion);
        setSelectedLocation({
          latitude: location.latitude,
          longitude: location.longitude,
        });

        if (mapRef.current) {
          mapRef.current.animateToRegion(newRegion, 1000);
        }
      } else {
        Alert.alert(
          "Not Found",
          "Location not found. Please try a different search term."
        );
      }
    } catch (error) {
      console.error("Geocoding error:", error);
      Alert.alert("Error", "Failed to search location");
    }
    setLoading(false);
  };

  const saveLocation = () => {
    if (!selectedLocation) {
      Alert.alert(
        "No location selected",
        "Please select a location on the map or use your current location."
      );
      return;
    }

    navigation.navigate({
      name: "claimCreate",
      params: { pickedLocation: selectedLocation },
      merge: true,
    });
  };

  const goToCurrentLocation = () => {
    getCurrentLocation();
  };

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search for a location..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={searchLocation}
        />
        <TouchableOpacity style={styles.searchButton} onPress={searchLocation}>
          <Ionicons name="search" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Map */}
      <MapView
        ref={mapRef}
        style={styles.map}
        region={region}
        onPress={handleMapPress}
        showsUserLocation={true}
        showsMyLocationButton={false}
        showsCompass={true}
        showsScale={true}
      >
        {selectedLocation && <Marker coordinate={selectedLocation} />}
      </MapView>

      {/* Current Location Button */}
      <TouchableOpacity
        style={styles.currentLocationButton}
        onPress={goToCurrentLocation}
      >
        <Ionicons name="locate" size={24} color="#388E3C" />
      </TouchableOpacity>

      {/* Selected Location Info */}
      {selectedLocation && (
        <View style={styles.locationInfo}>
          <Text style={styles.locationText}>
            Selected Location: {selectedLocation.latitude.toFixed(6)},{" "}
            {selectedLocation.longitude.toFixed(6)}
          </Text>
        </View>
      )}

      {/* Save Button */}
      <Button
        mode="contained"
        onPress={saveLocation}
        style={styles.saveButton}
        contentStyle={{ paddingVertical: 8 }}
        loading={loading}
        disabled={loading}
      >
        Save Location
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  searchContainer: {
    position: "absolute",
    top: 10,
    left: 10,
    right: 10,
    flexDirection: "row",
    backgroundColor: "white",
    borderRadius: 8,
    padding: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 1,
  },
  searchInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
  },
  searchButton: {
    backgroundColor: "#388E3C",
    borderRadius: 6,
    padding: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  currentLocationButton: {
    position: "absolute",
    top: 70,
    right: 10,
    backgroundColor: "white",
    borderRadius: 25,
    padding: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  locationInfo: {
    position: "absolute",
    bottom: 70,
    left: 10,
    right: 10,
    backgroundColor: "white",
    padding: 12,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  locationText: {
    fontSize: 14,
    textAlign: "center",
    color: "#333",
  },
  saveButton: {
    position: "absolute",
    bottom: 10,
    left: 10,
    right: 10,
    backgroundColor: "#388E3C",
  },
});

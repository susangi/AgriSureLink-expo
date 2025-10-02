import React from "react";
import { View, ScrollView, StyleSheet, Dimensions } from "react-native";
import { Card, Title, Paragraph, Button, Text, Chip } from "react-native-paper";
import Layout from "../components/Layout";

const { width } = Dimensions.get("window");

export default function ClaimsScreen({ navigation }) {
  const features = [
    {
      id: 1,
      title: "Submit a Claim",
      description:
        "Start a new insurance claim for your package with easy step-by-step process",
      icon: "plus-circle",
      route: "claimCreate",
      buttonText: "Submit Claim",
      color: "#388E3C",
      gradient: ["#4CAF50", "#388E3C"],
      stats: "Quick & Easy",
    },
    {
      id: 2,
      title: "Claim History",
      description:
        "View all your past claims, check statuses and download documents",
      icon: "history",
      route: "ClaimHistory",
      buttonText: "View History",
      color: "#2196F3",
      gradient: ["#42A5F5", "#2196F3"],
      stats: "Complete Overview",
    },
    {
      id: 3,
      title: "Track Claims",
      description:
        "Real-time tracking of your submitted claims with status updates",
      icon: "progress-clock",
      route: "TrackClaims",
      buttonText: "Track Now",
      color: "#FF9800",
      gradient: ["#FFB74D", "#FF9800"],
      stats: "Live Updates",
    },
  ];

  return (
    <Layout navigation={navigation}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.welcomeText}>Welcome to</Text>
            <Text style={styles.appName}>Claims Center</Text>
            <Text style={styles.subtitle}>
              Manage your insurance claims efficiently and track their progress
              in real-time
            </Text>
          </View>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>24/7</Text>
              <Text style={styles.statLabel}>Support</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>Fast</Text>
              <Text style={styles.statLabel}>Processing</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>Secure</Text>
              <Text style={styles.statLabel}>Documents</Text>
            </View>
          </View>
        </View>

        {/* Features Grid */}
        <View style={styles.featuresGrid}>
          {features.map((feature, index) => (
            <Card
              key={feature.id}
              style={[styles.featureCard, { borderLeftColor: feature.color }]}
              onPress={() => navigation.navigate(feature.route)}
            >
              <Card.Content style={styles.cardContent}>
                {/* Icon Badge */}
                <View
                  style={[
                    styles.iconContainer,
                    { backgroundColor: feature.color + "20" },
                  ]}
                >
                  <Text style={[styles.icon, { color: feature.color }]}>
                    {getFeatureIcon(feature.icon)}
                  </Text>
                </View>

                {/* Feature Stats Chip */}
                <Chip
                  mode="outlined"
                  style={[styles.statsChip, { borderColor: feature.color }]}
                  textStyle={[styles.statsChipText, { color: feature.color }]}
                >
                  {feature.stats}
                </Chip>

                {/* Content */}
                <Title style={styles.cardTitle}>{feature.title}</Title>
                <Paragraph style={styles.cardDescription}>
                  {feature.description}
                </Paragraph>

                {/* Action Button */}
                <Button
                  mode="contained"
                  onPress={() => navigation.navigate(feature.route)}
                  style={[
                    styles.actionButton,
                    { backgroundColor: feature.color },
                  ]}
                  labelStyle={styles.actionButtonLabel}
                  icon={feature.icon}
                  contentStyle={styles.buttonContent}
                >
                  {feature.buttonText}
                </Button>
              </Card.Content>

              {/* Card Background Pattern */}
              <View
                style={[
                  styles.cardPattern,
                  { backgroundColor: feature.color + "10" },
                ]}
              />
            </Card>
          ))}
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Text style={styles.quickActionsTitle}>Need Help?</Text>
          <View style={styles.helpButtons}>
            <Button
              mode="outlined"
              onPress={() => navigation.navigate("Help")}
              style={styles.helpButton}
              labelStyle={styles.helpButtonLabel}
              icon="help-circle"
            >
              Help Center
            </Button>
            <Button
              mode="outlined"
              onPress={() => navigation.navigate("Contact")}
              style={styles.helpButton}
              labelStyle={styles.helpButtonLabel}
              icon="headset"
            >
              Contact Support
            </Button>
          </View>
        </View>
      </ScrollView>
    </Layout>
  );
}

// Helper function for icons (using text as placeholder - replace with actual icon components if needed)
const getFeatureIcon = (iconName) => {
  const icons = {
    "plus-circle": "+",
    history: "📋",
    "progress-clock": "⏱️",
    "help-circle": "?",
    headset: "🎧",
  };
  return icons[iconName] || "●";
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#F8F9FA",
    paddingBottom: 24,
  },
  header: {
    backgroundColor: "#388E3C",
    padding: 24,
    paddingTop: 40,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    marginBottom: 24,
  },
  headerContent: {
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 16,
    color: "rgba(255,255,255,0.8)",
    marginBottom: 4,
    fontWeight: "500",
  },
  appName: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
    lineHeight: 20,
  },
  statsContainer: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statNumber: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.9)",
    fontWeight: "500",
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  featuresGrid: {
    paddingHorizontal: 16,
    gap: 16,
  },
  featureCard: {
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    overflow: "hidden",
    borderLeftWidth: 4,
  },
  cardContent: {
    padding: 24,
    position: "relative",
    zIndex: 2,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  icon: {
    fontSize: 28,
    fontWeight: "bold",
  },
  statsChip: {
    alignSelf: "flex-start",
    marginBottom: 16,
    height: 28,
  },
  statsChipText: {
    fontSize: 12,
    fontWeight: "600",
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1A1A1A",
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    marginBottom: 24,
  },
  actionButton: {
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  actionButtonLabel: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 14,
  },
  buttonContent: {
    height: 48,
  },
  cardPattern: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 1,
  },
  quickActions: {
    paddingHorizontal: 16,
    marginTop: 8,
  },
  quickActionsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
    textAlign: "center",
  },
  helpButtons: {
    flexDirection: "row",
    gap: 12,
  },
  helpButton: {
    flex: 1,
    borderColor: "#388E3C",
    borderRadius: 12,
    borderWidth: 1.5,
  },
  helpButtonLabel: {
    color: "#388E3C",
    fontWeight: "600",
    fontSize: 12,
  },
});

import React from "react";
import { View, ScrollView, StyleSheet, Dimensions } from "react-native";
import { Card, Title, Paragraph, Button, Text, Chip } from "react-native-paper";
import Layout from "../components/Layout";

const { width } = Dimensions.get("window");
const cardWidth = width * 0.85; // 85% of screen width

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
      stats: "Complete Overview",
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
          {features.map((feature) => (
            <Card
              key={feature.id}
              style={[styles.featureCard, { borderLeftColor: feature.color }]}
              onPress={() => navigation.navigate(feature.route)}
            >
              <Card.Content style={styles.cardContent}>
                <View style={styles.iconRow}>
                  {/* Icon */}
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

                  {/* Stats next to icon */}
                  <Chip
                    mode="outlined"
                    style={[styles.statsChip, { borderColor: feature.color }]}
                    textStyle={[styles.statsChipText, { color: feature.color }]}
                  >
                    {feature.stats}
                  </Chip>
                </View>

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
      </ScrollView>
    </Layout>
  );
}

const getFeatureIcon = (iconName) => {
  const icons = {
    "plus-circle": "+",
    history: "📋",
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
    padding: 20,
    paddingTop: 30, // reduced top space
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    marginBottom: 24,
  },
  headerContent: {
    marginBottom: 16,
  },
  welcomeText: {
    fontSize: 16,
    color: "rgba(255,255,255,0.8)",
    marginBottom: 4,
    fontWeight: "500",
  },
  appName: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 6,
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
  },
  featureCard: {
    width: cardWidth,
    alignSelf: "center",
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    overflow: "hidden",
    borderLeftWidth: 4,
    marginBottom: 16,
  },
  cardContent: {
    padding: 16,
    position: "relative",
    zIndex: 2,
  },
  iconRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 12,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  icon: {
    fontSize: 24,
    fontWeight: "bold",
  },
  statsChip: {
    height: 28,
  },
  statsChipText: {
    fontSize: 12,
    fontWeight: "600",
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1A1A1A",
    marginBottom: 6,
  },
  cardDescription: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    marginBottom: 16,
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
});

import React from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import { Card, Title, Paragraph, Button } from "react-native-paper";
import Layout from "../components/Layout";

export default function ClaimsScreen({ navigation }) {
  return (
    <Layout navigation={navigation}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Submit Claim Card */}
        <Card
          style={styles.card}
          onPress={() => navigation.navigate("claimCreate")}
        >
          <Card.Content>
            <Title>Submit a Claim</Title>
            <Paragraph>Start a new insurance claim for your package.</Paragraph>
          </Card.Content>
          <Card.Actions>
            <Button onPress={() => navigation.navigate("claimCreate")}>
              Submit
            </Button>
          </Card.Actions>
        </Card>

        {/* Claim History Card */}
        <Card
          style={styles.card}
          onPress={() => navigation.navigate("ClaimHistory")}
        >
          <Card.Content>
            <Title>Claim History</Title>
            <Paragraph>View all your past claims and their statuses.</Paragraph>
          </Card.Content>
          <Card.Actions>
            <Button onPress={() => navigation.navigate("ClaimHistory")}>
              View History
            </Button>
          </Card.Actions>
        </Card>

        {/* Track Claims Card */}
        <Card
          style={styles.card}
          onPress={() => navigation.navigate("TrackClaims")}
        >
          <Card.Content>
            <Title>Track Claims</Title>
            <Paragraph>Track the progress of your submitted claims.</Paragraph>
          </Card.Content>
          <Card.Actions>
            <Button onPress={() => navigation.navigate("TrackClaims")}>
              Track
            </Button>
          </Card.Actions>
        </Card>
      </ScrollView>
    </Layout>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
});

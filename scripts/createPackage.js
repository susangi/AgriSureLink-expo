const admin = require("firebase-admin");
const path = require("path");

// Path to your service account key
const serviceAccount = require(path.resolve(__dirname, "../serviceAccountKey.json"));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function getNextPackageId() {
  const counterRef = db.collection("counters").doc("packages");
  const counterSnap = await counterRef.get();
  let nextNumber = 1;
  if (counterSnap.exists) {
    nextNumber = counterSnap.data().value + 1;
    await counterRef.update({ value: admin.firestore.FieldValue.increment(1) });
  } else {
    await counterRef.set({ value: 1 });
  }
  return `PKG${String(nextNumber).padStart(3, "0")}`;
}

async function createPackage({
  name,
  description,
  amount,
  createdBy,
  expiredBy, // "YYYY-MM-DD"
}) {
  const packageId = await getNextPackageId();
  const now = admin.firestore.Timestamp.now();
  const expiredTimestamp = admin.firestore.Timestamp.fromDate(new Date(expiredBy));
  await db.collection("packages").add({
    packageId,
    name,
    description,
    amount: Number(amount),
    createdAt: now,
    updatedAt: now,
    createdBy,
    updatedBy: createdBy,
    expiredBy: expiredTimestamp,
  });
  console.log(`Package ${packageId} created.`);
}

async function main() {
  await createPackage({
    name: "Crop Insurance",
    description: "Covers rice crops.",
    amount: 5000,
    createdBy: "admin_user_id",
    expiredBy: "2026-01-01",
  });

  await createPackage({
    name: "Livestock Insurance",
    description: "Protects against loss of cattle and livestock.",
    amount: 8000,
    createdBy: "admin_user_id",
    expiredBy: "2026-06-30",
  });

  await createPackage({
    name: "Equipment Insurance",
    description: "Covers damage to farming equipment.",
    amount: 12000,
    createdBy: "admin_user_id",
    expiredBy: "2027-01-15",
  });

  await createPackage({
    name: "Weather Insurance",
    description: "Compensation for crop loss due to adverse weather.",
    amount: 7000,
    createdBy: "admin_user_id",
    expiredBy: "2026-12-31",
  });

  await createPackage({
    name: "Pest Insurance",
    description: "Covers losses caused by pest infestations.",
    amount: 6000,
    createdBy: "admin_user_id",
    expiredBy: "2026-09-01",
  });

  await createPackage({
    name: "Seed Insurance",
    description: "Protects investment in seeds for the season.",
    amount: 4000,
    createdBy: "admin_user_id",
    expiredBy: "2026-11-20",
  });

  process.exit();
}

main();
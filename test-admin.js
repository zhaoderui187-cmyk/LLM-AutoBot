import admin from "firebase-admin";
import fs from "fs";

const config = JSON.parse(fs.readFileSync("./firebase-applet-config.json", "utf8"));
admin.initializeApp({ projectId: config.projectId });

try {
  const db = admin.firestore();
  db.settings({ databaseId: config.firestoreDatabaseId });
  db.collection("users").get().then((snap) => {
    console.log("Docs:", snap.size);
  }).catch(e => console.error("Error1:", e.message));
} catch(e) {
  console.error("Error setting DB1:", e);
}

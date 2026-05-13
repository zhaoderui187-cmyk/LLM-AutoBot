import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";

const config = JSON.parse(fs.readFileSync("./firebase-applet-config.json", "utf8"));
const app = initializeApp({ projectId: config.projectId });

try {
  const db = getFirestore(app, config.firestoreDatabaseId);
  db.collection("users").get().then((snap) => {
    console.log("Docs:", snap.size);
  }).catch(e => console.error("Error2:", e.message));
} catch (e) {
  console.log("Failed init API:", e);
}

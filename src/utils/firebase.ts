import admin from "firebase-admin";
import fs from "fs";
import path from "path";
const serviceAccountPath = path.join(
  __dirname,
  "..",
  "..",
  "may-9b275-firebase-adminsdk-fbsvc-d60994312c.json"
);

// Ensure file exists before reading (avoid crash)
if (!fs.existsSync(serviceAccountPath)) {
  throw new Error("Firebase service account file not found");
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf-8"));

// Avoid initializing multiple times (important in dev/watch mode)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}


export const messaging: admin.messaging.Messaging = admin.messaging();
export const firestore = admin.firestore();
export default admin;





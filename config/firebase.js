const admin = require('firebase-admin');

// Leer el contenido JSON desde la variable de entorno FIREBASE_CONFIG
const serviceAccount = JSON.parse(process.env.FIREBASE_CONFIG);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

module.exports = db;
const express = require('express');
const admin = require('firebase-admin');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;

require('dotenv').config(); // Agregado al principio del archivo

const admin = require('firebase-admin');

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  }),
});

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

app.use(cors());
app.use(bodyParser.json());

app.post('/api/sensores', async (req, res) => {
  try {
    const { temperatura, humedad, device_id } = req.body;
    if (temperatura == null || humedad == null || !device_id) {
      return res.status(400).send('Datos incompletos');
    }

    const timestamp = new Date().toLocaleString('es-MX', { timeZone: 'America/Mexico_City' });

    const data = {
      temperatura,
      humedad,
      device_id,
      timestamp,
    };

    await db.collection('dht_readings').add(data);
    res.status(200).send('Datos guardados correctamente');
  } catch (error) {
    console.error('Error al guardar datos:', error);
    res.status(500).send('Error del servidor');
  }
});

app.listen(port, () => {
  console.log(`Servidor API corriendo en puerto ${port}`);
});

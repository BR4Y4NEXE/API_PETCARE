require('dotenv').config(); // ✅ SIEMPRE al principio

const express = require('express');
const admin = require('firebase-admin');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;

// Inicializar Firebase
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  }),
});

const db = admin.firestore();

// Configurar EJS
app.set('view engine', 'ejs');
app.set('views', './views');

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true })); // Para formularios HTML

// Página de prueba EJS
app.get('/', (req, res) => {
  res.render('index'); // renderiza views/index.ejs
});

// Endpoint principal de la API
app.post('/api/sensores', async (req, res) => {
  try {
    const { temperatura, humedad, device_id } = req.body;
    if (temperatura == null || humedad == null || !device_id) {
      return res.status(400).send('Datos incompletos');
    }

    const timestamp = new Date().toLocaleString('es-MX', { timeZone: 'America/Mexico_City' });

    const data = {
      temperatura: parseFloat(temperatura),
      humedad: parseFloat(humedad),
      device_id,
      timestamp,
    };

    await db.collection('dht_readings').add(data);

    // Si la solicitud vino del formulario web, redirige de nuevo a /
    if (req.headers['content-type'].includes('application/x-www-form-urlencoded')) {
      return res.redirect('/?estado=ok');
    }

    res.status(200).send('Datos guardados correctamente');
  } catch (error) {
    console.error('Error al guardar datos:', error);
    res.status(500).send('Error del servidor');
  }
});

app.listen(port, () => {
  console.log(`Servidor API corriendo en puerto ${port}`);
});

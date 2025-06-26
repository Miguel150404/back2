// config/paypal-config.js
require('dotenv').config(); // Carga las variables de entorno desde .env
const paypal = require('@paypal/checkout-server-sdk');

// Determina el entorno (Sandbox para pruebas)
const environment = new paypal.core.SandboxEnvironment(
    process.env.PAYPAL_CLIENT_ID,
    process.env.PAYPAL_CLIENT_SECRET
);

// Crea un cliente HTTP de PayPal
const client = new paypal.core.PayPalHttpClient(environment);

module.exports = { client }; // Exporta el cliente para usarlo en tus rutas
// routes/paypal.js
const express = require('express');
const router = express.Router();
const paypal = require('@paypal/checkout-server-sdk'); // SDK de PayPal
const { client } = require('../config/paypal-config'); // Tu configuración de PayPal

/**
 * @route POST /api/paypal/create-order
 * @desc Crea una orden de pago en PayPal
 * @access Public (el frontend lo llama)
 */
router.post('/create-order', async (req, res) => {

    const { purchase_units } = req.body;

    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer("return=representation"); 
    request.requestBody({
        intent: 'CAPTURE', 
        purchase_units: purchase_units,
        
    });

    try {
        const order = await client.execute(request);
        // Devuelve el ID de la orden de PayPal al frontend
        res.status(200).json({ id: order.result.id });
    } catch (err) {
        console.error('Error al crear orden de PayPal:', err);
        // Devuelve un error si falla la creación de la orden
        res.status(500).json({ error: err.message || 'Error al crear orden de PayPal' });
    }
});

/**
 * @route POST /api/paypal/capture-order
 * @desc Captura (finaliza) una orden de pago en PayPal
 * @access Public (el frontend lo llama)
 */
router.post('/capture-order', async (req, res) => {
    const { orderID } = req.body; // Recibe el orderID del frontend

    const request = new paypal.orders.OrdersCaptureRequest(orderID);
    request.prefer("return=representation");

    try {
        const capture = await client.execute(request);
        // ¡Importante! Aquí debes actualizar tu base de datos con el estado del pago.
        // Por ejemplo, marcar el pedido como "pagado" y guardar los detalles de la transacción.
        console.log('Pago capturado con éxito:', capture.result);
        res.status(200).json(capture.result);
    } catch (err) {
        console.error('Error al capturar orden de PayPal:', err);
        // Devuelve un error si falla la captura
        res.status(500).json({ error: err.message || 'Error al capturar pago de PayPal' });
    }
});

module.exports = router;
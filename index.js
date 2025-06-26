const express = require('express');
const cors = require('cors');
const db = require('./config/firebase');
const { enviarCorreoBienvenida } = require('./mailer');
const paypalRoutes = require('./routes/paypal');
const axios = require('axios');

const app = express();

app.use(cors());
app.use(express.json());

// Rutas del frontend Angular (PWA)
/*app.use(express.static(__dirname + '/dist/ProyectoFinal_front'));
app.get(/^\/(?!api)., (req, res) => {
  res.sendFile(__dirname + '/dist/ProyectoFinal_front/index.html');
});*/


//Captcha
async function verificarCaptcha(token) {
  const secret = process.env.RECAPTCHA_SECRET;
  const respuesta = await axios.post(`https://www.google.com/recaptcha/api/siteverify`, null, {
    params: {
      secret,
      response: token
    }
  });

  return respuesta.data.success;
}

//Usuarios
//Obtener Usuarios
app.get('/api/usuarios', async (req, res) => {
  try {
    const snapshot = await db.collection('usuarios').get();
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Eliminar usuario
app.delete('/api/usuarios/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.collection('usuarios').doc(id).delete();
    res.json({ message: 'Usuario eliminado correctamente' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Agregar usuario
app.post('/api/usuarios', async (req, res) => {
  const { captcha, ...nuevoUsuario } = req.body;

  // Verificación del token de reCAPTCHA
  const captchaVerificado = await verificarCaptcha(captcha);
  if (!captchaVerificado) {
    return res.status(400).json({ error: 'Captcha inválido o expirado.' });
  }

  try {
    const ref = await db.collection('usuarios').add(nuevoUsuario);

    // Enviar correo si aplica
    if (nuevoUsuario.correo && nuevoUsuario.nombre) {
      enviarCorreoBienvenida(nuevoUsuario.correo, nuevoUsuario.nombre)
        .then(() => console.log('Correo enviado correctamente'))
        .catch(err => console.error('Error al enviar correo:', err));
    }

    res.status(201).json({ id: ref.id, ...nuevoUsuario });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Actualizar usuario
app.put('/api/usuarios/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.collection('usuarios').doc(id).update(req.body);
    res.json({ message: 'Usuario actualizado correctamente' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//Bloquear y desbloquear usuarios
app.put('/api/usuarios/:id/bloqueo', async (req, res) => {
  const { id } = req.params;
  const { estado, motivo, realizadoPor } = req.body;

  try {
    // Actualizar estado del usuario
    const usuarioRef = db.collection('usuarios').doc(id);
    await usuarioRef.update({ estado });

    // Agregar entrada en bitácora
    const bitacoraRef = db.collection('bitacoraBloqueos').doc();
    await bitacoraRef.set({
      accion: estado ? 'desbloqueado' : 'bloqueado',
      fecha: new Date(),
      motivo,
      realizadoPor: `/usuarios/${realizadoPor}`,
      usuarioAfectado: `/usuarios/${id}`
    });

    res.json({ message: `Usuario ${estado ? 'desbloqueado' : 'bloqueado'} correctamente.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//Productos
//Obtener Productos
app.get('/api/productos', async (req, res) => {
  try {
    const snapshot = await db.collection('productos').get();
    const productos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(productos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//Agregar Productos
app.post('/api/productos', async (req, res) => {
  try {
    const nuevoProducto = req.body;
    const ref = await db.collection('productos').add(nuevoProducto);
    res.status(201).json({ id: ref.id, ...nuevoProducto });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//Editar Productos
app.put('/api/productos/:id', async (req, res) => {
  const { id } = req.params;
  const data = req.body;
  try {
    await db.collection('productos').doc(id).update(data);
    res.json({ message: 'Producto actualizado correctamente' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//Eliminar Productos
app.delete('/api/productos/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.collection('productos').doc(id).delete();
    res.json({ message: 'Producto eliminado correctamente' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Obtener producto por ID
app.get('/api/productos/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const doc = await db.collection('productos').doc(id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json({ id: doc.id, ...doc.data() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Registrar una compra
app.post('/api/compras-productos', async (req, res) => {
  try {
    const { idUsuario, productos, total } = req.body;

    const compraRef = db.collection('comprasProductos').doc();
    await compraRef.set({
      idUsuario: `/usuarios/${idUsuario}`,
      fecha: new Date(),
      productos: productos.map(p => ({
        producto: `/productos/${p.id}`,
        cantidad: p.cantidad
      })),
      total
    });

    res.status(201).json({ message: 'Compra registrada correctamente' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Obtener todas las subscripciones
app.get('/api/subscripciones', async (req, res) => {
  try {
    const snapshot = await db.collection('subscripciones').get();
    const subs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(subs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Graficas
// Total por tipo
app.get('/api/reportes/usuarios-tipo', async (req, res) => {
  try {
    const snapshot = await db.collection('usuarios').get();
    const conteo = { admin: 0, cliente: 0 };

    snapshot.forEach(doc => {
      const data = doc.data();
      const tipo = data.tipo;
      if (tipo === 'admin') conteo.admin++;
      else if (tipo === 'cliente') conteo.cliente++;
    });

    res.json(conteo);
  } catch (error) {
    console.error('Error al obtener usuarios por tipo:', error);
    res.status(500).json({ error: 'Error al obtener usuarios por tipo' });
  }
});

// Total por suscripción (solo clientes con subscripción "1", "2" o "3")
app.get('/api/reportes/suscripciones', async (req, res) => {
  try {
    const snapshot = await db.collection('usuarios').get();
    const conteo = { '1': 0, '2': 0, '3': 0 };

    snapshot.forEach(doc => {
      const data = doc.data();

      // Validar que es cliente y que subscripción es válida
      if (
        data.tipo === 'cliente' &&
        typeof data.subscripcion === 'string' &&
        ['1', '2', '3'].includes(data.subscripcion)
      ) {
        conteo[data.subscripcion]++;
      }
    });

    res.json(conteo);
  } catch (error) {
    console.error('Error al obtener usuarios por suscripción:', error);
    res.status(500).json({ error: 'Error al obtener usuarios por suscripción' });
  }
});

//PAYPAL
// Rutas de PayPal
app.use('/api/paypal', paypalRoutes); // Monta las rutas de PayPal bajo el prefijo /api/paypal

//Servidor Node
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor Node escuchando en puerto ${PORT}`));

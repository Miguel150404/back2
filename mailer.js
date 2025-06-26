const nodemailer = require('nodemailer');

// Configura tu transporte (ejemplo con Gmail)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'brunomax090@gmail.com',
    pass: 'krao fzfy bsut zbar'
  }
});

function enviarCorreoBienvenida(destinatario, nombre) {
  const mailOptions = {
    from: '"Animal Gym" <tucorreo@gmail.com>',
    to: destinatario,
    subject: 'Bienvenido a Animal Gym',
    html: `
      <h2>Hola ${nombre} 👋</h2>
      <p>Tu cuenta ha sido creada exitosamente en <strong>Animal Gym</strong>.</p>
      <p>¡Gracias por formar parte de nuestra comunidad!</p>
    `
  };

  return transporter.sendMail(mailOptions);
}

module.exports = { enviarCorreoBienvenida };

/*const transporter = nodemailer.createTransport({
  host: 'smtp.office365.com',
  port: 587,
  secure: false, // STARTTLS (seguro pero explícito)
  auth: {
    user: 'brunotrax2004@outlook.com',
    pass: 'Pinkfloyd2021'
  },
  tls: {
    rejectUnauthorized: false,
    ciphers: 'SSLv3'
  }
});

export async function enviarCorreo(destinatario, asunto, mensajeHtml) {
  try {
    const info = await transporter.sendMail({
      from: '"Animal Gym" <tu_correo@outlook.com>', // nombre y remitente
      to: destinatario, // correo del cliente
      subject: asunto,
      html: mensajeHtml
    });

    console.log('Correo enviado:', info.messageId);
  } catch (error) {
    console.error('Error al enviar correo:', error);
  }
}*/

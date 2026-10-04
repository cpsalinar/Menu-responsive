const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const CSV_FILE = path.join(__dirname, 'logins.csv');

// Middleware para leer JSON y formularios
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir la raíz del proyecto (HTML, CSS, carpeta de imágenes)
app.use(express.static(__dirname));

// Función para obtener el siguiente ID de usuario autoincremental
function getNextUserId() {
  if (!fs.existsSync(CSV_FILE)) {
    fs.writeFileSync(CSV_FILE, 'id,timestamp,nombre,apellido,email\n', 'utf8');
    return 1;
  }

  const fileContent = fs.readFileSync(CSV_FILE, 'utf8').trim();
  const lines = fileContent.split('\n');

  if (lines.length <= 1) return 1;

  const lastLine = lines[lines.length - 1];
  const lastId = parseInt(lastLine.split(',')[0], 10);
  return isNaN(lastId) ? 1 : lastId + 1;
}

// Endpoint para procesar el registro de usuarios
app.post('/api/login', (req, res) => {
  const { nombre, apellido, email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'El email es requerido' });
  }

  const userId = getNextUserId();
  const timestamp = new Date().toISOString();

  // Crear la fila del CSV
  const newRecord = `${userId},"${timestamp}","${nombre || ''}","${apellido || ''}","${email}"\n`;

  fs.appendFile(CSV_FILE, newRecord, 'utf8', (err) => {
    if (err) {
      console.error('Error al guardar registro:', err);
      return res.status(500).json({ error: 'Error al registrar en archivo local' });
    }

    console.log(`[CSV OK] Usuario asignado con ID #${userId}: ${email}`);
    res.json({ success: true, userId, message: 'Usuario registrado correctamente' });
  });
});

// Iniciar servidor en el puerto 3000
app.listen(3000, () => {
  console.log('Servidor listo en http://localhost:3000');
});
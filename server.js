const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const CSV_FILE = path.join(__dirname, 'logins.csv');

// Middlewares
app.use(express.json());
// Servir archivos estáticos (HTML, CSS, JS e imágenes) desde el directorio raíz
app.use(express.static(__dirname));

// Detección de SO y Dispositivo
function parseUserAgent(userAgent = '') {
  let so = 'Desconocido';
  let dispositivo = 'Desktop';

  if (/windows/i.test(userAgent)) so = 'Windows';
  else if (/macintosh|mac os x/i.test(userAgent)) so = 'macOS';
  else if (/android/i.test(userAgent)) { so = 'Android'; dispositivo = 'Móvil'; }
  else if (/iphone|ipad|ipod/i.test(userAgent)) { so = 'iOS'; dispositivo = 'Móvil/Tablet'; }
  else if (/linux/i.test(userAgent)) so = 'Linux';

  if (/tablet|ipad/i.test(userAgent)) dispositivo = 'Tablet';

  return { so, dispositivo };
}

// Sanitización para evitar valores "undefined"
const sanitizar = (valor, porDefecto = 'No especificado') => {
  if (valor === undefined || valor === null || valor === 'undefined' || valor === '') {
    return porDefecto;
  }
  return valor;
};

// Verificar si el correo ya existe en logins.csv
function existeEmailEnCSV(emailBuscado) {
  if (!fs.existsSync(CSV_FILE)) return false;

  const contenido = fs.readFileSync(CSV_FILE, 'utf8').trim();
  if (!contenido) return false;

  const lineas = contenido.split('\n');
  for (let i = 1; i < lineas.length; i++) {
    const columnas = lineas[i].split(',');
    if (columnas[3]) {
      const emailLimpio = columnas[3].replace(/"/g, '').trim().toLowerCase();
      if (emailLimpio === emailBuscado.trim().toLowerCase()) {
        return true;
      }
    }
  }
  return false;
}

// Endpoint de Registro / Login
app.post('/api/login', (req, res) => {
  const { nombre, apellido, email, genero, ip, ciudad, pais, idioma, zonaHoraria, pantalla } = req.body;

  // Validar correo duplicado
  if (existeEmailEnCSV(email)) {
    return res.status(400).json({
      success: false,
      correoExiste: true,
      error: 'El correo electrónico ya se encuentra registrado.'
    });
  }

  const userAgentHeader = req.headers['user-agent'] || '';
  const { so, dispositivo } = parseUserAgent(userAgentHeader);

  // Crear CSV con encabezados si no existe
  if (!fs.existsSync(CSV_FILE)) {
    const header = 'id,nombre,apellido,email,genero,ip,ciudad,pais,sistemaOperativo,dispositivo,pantalla,idioma,zonaHoraria,fecha\n';
    fs.writeFileSync(CSV_FILE, header, 'utf8');
  }

  // Calcular ID incremental
  const contenido = fs.readFileSync(CSV_FILE, 'utf8').trim();
  const lineas = contenido ? contenido.split('\n') : [];
  const nextId = lineas.length > 0 ? lineas.length : 1;

  const fecha = new Date().toISOString();
  const clientIp = ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';

  // Fila para el CSV
  const nuevaFila = `${nextId},"${sanitizar(nombre)}","${sanitizar(apellido)}","${sanitizar(email)}","${sanitizar(genero)}","${sanitizar(clientIp)}","${sanitizar(ciudad)}","${sanitizar(pais)}","${so}","${dispositivo}","${sanitizar(pantalla)}","${sanitizar(idioma)}","${sanitizar(zonaHoraria)}","${fecha}"\n`;

  fs.appendFile(CSV_FILE, nuevaFila, 'utf8', (err) => {
    if (err) {
      console.error('Error al escribir en CSV:', err);
      return res.status(500).json({ success: false, error: 'Error interno al guardar los datos' });
    }

    res.json({ success: true, userId: nextId });
  });
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
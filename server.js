require('dotenv').config();
// Importación de las dependencias necesarias
let mysql = require("mysql2");
let express = require("express");
let cors = require("cors");

// Inicialización de la aplicación Express
let app = express();
app.use(cors({
   origin: [
    'http://127.0.0.1:5500',  // Para trabajo local
    'https://serene-soul.netlify.app',  // Para producción en Netlify
  ]
}
));  // Habilita CORS para permitir peticiones desde otros dominios
app.use(express.json());  // Permite a Express interpretar solicitudes con cuerpo JSON

// Configuración de la conexión a la base de datos MySQL
let db;
// mysql://root:GlWCizYaqIRtSJFmYPmaPeBqHdYyHxjn@nozomi.proxy.rlwy.net:/railway
function manejarConexion() {
  db = mysql.createConnection({
    host:  process.env.DBHOST || "localhost",
    user: process.env.DBUSER || "root",
    password: process.env.DBPASSWORD || "",
    database: process.env.DB || "serene_soul",
    port: process.env.PORT || 3000
  });

  db.connect((err) => {
    if (err) {
      console.log("Error al conectar a DB:", err);
      // setTimeout(manejarConexion, 2000); // Espera 2s e intenta reconectar
    } else {
      console.log("Conexión a la base de datos establecida ✅");
    }
  });

  db.on("error", (err) => {
    console.error("Error de conexión DB:", err);
    if (err.code === "PROTOCOL_CONNECTION_LOST") {
      manejarConexion(); // Intenta reconectar si la conexión se pierde
    } else {
      throw err;
    }
  });
}

manejarConexion(); // Llamamos a la función por primera vez


// Ruta para registrar un nuevo usuario
app.post("/registrar", (req, res) => {
  // Se obtienen los datos del cuerpo de la solicitud
  const {
    nombre,
    apellido,
    correo,
    fechaNacimiento,
    genero,
    generoPersonalizado,
    pronombre,
    contrasena,
  } = req.body;

  // Se define el género final dependiendo si es personalizado o no
  const generoFinal = genero === "personalizado" ? generoPersonalizado : genero;

  // Query SQL para insertar el nuevo usuario en la base de datos
  const query = `INSERT INTO usuarios 
      (nombre, apellido, correo, fecha_nacimiento, genero, genero_personalizado, pronombre, contrasena)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

  // Valores que se insertarán en la base de datos
  const valores = [
    nombre,
    apellido,
    correo,
    fechaNacimiento,
    generoFinal,
    pronombre,
    generoPersonalizado,
    contrasena,
  ];

  // Ejecución de la query
  db.query(query, valores, (err, result) => {
    if (err) {
      console.error(err);  // Si hay un error, lo mostramos en la consola
      return res.status(500).json({ mensaje: "Error al registrar" });  // Enviamos error de servidor al cliente
    }
    // Si todo sale bien, enviamos una respuesta con el mensaje de éxito
    res.json({ mensaje: "Registro exitoso 🎉" });
  });
});

// Ruta para iniciar sesión de un usuario
app.post("/login", (req, res) => {
  const { correo, contrasena } = req.body;

  console.log("Correo recibido:", correo);
  console.log("Contraseña recibida:", contrasena);

  const buscarCorreo = "SELECT * FROM usuarios WHERE correo = ?";
  db.query(buscarCorreo, [correo], (error, resultados) => {
    if (error) {
      console.error("Error de DB:", error);
      return res.status(500).json({ mensaje: "Error en el servidor" });
    }

    console.log("Resultados de DB:", resultados);

    if (resultados.length === 0) {
      console.log("Correo NO registrado");
      return res.status(404).json({ mensaje: "Correo no registrado" });
    }

    const usuario = resultados[0];
    console.log("Contraseña en la base de datos:", usuario.contrasena);

    if (usuario.contrasena !== contrasena) {
      console.log("Contraseña incorrecta");
      return res.status(401).json({ mensaje: "Contraseña incorrecta" });
    }

    console.log("Inicio de sesión exitoso");
    res.json({ mensaje: "Inicio de sesión exitoso", usuario });
  });
});

// Configuración del servidor para que escuche en el puerto 3000
const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http ${PORT}`);
});

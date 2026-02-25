const Database = require('better-sqlite3');
const path = require('path');
const { app } = require('electron');

let db;

function initDatabase() {
  const dbPath = path.join(app.getPath('userData'), 'colorado_express.db');
  console.log('[DB-INIT] Starting initialization at:', dbPath);

  try {
    db = new Database(dbPath);
    console.log('[DB-INIT] Database instance created');

    db.pragma('foreign_keys = ON');
    // Remove WAL mode to avoid potential locking issues on some OneDrive/Network drives
    db.pragma('journal_mode = DELETE');
    console.log('[DB-INIT] Pragmas set (DELETE mode)');

    // Create tables
    console.log("[DB-INIT] Creating tables if they don't exist...");
    db.exec(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        clave_hash TEXT NOT NULL,
        rol TEXT
      );

      CREATE TABLE IF NOT EXISTS vehiculos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nro TEXT,
        tipo TEXT,
        placa TEXT UNIQUE,
        anio INTEGER
      );

      CREATE TABLE IF NOT EXISTS conductores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        doc_identidad TEXT UNIQUE,
        nombre TEXT NOT NULL,
        telefono TEXT
      );

      CREATE TABLE IF NOT EXISTS rutas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        sector TEXT,
        institucion TEXT,
        num_estudiantes INTEGER,
        conductor_id INTEGER,
        vehiculo_id INTEGER,
        FOREIGN KEY(conductor_id) REFERENCES conductores(id) ON DELETE SET NULL,
        FOREIGN KEY(vehiculo_id) REFERENCES vehiculos(id) ON DELETE SET NULL
      );

      CREATE TABLE IF NOT EXISTS estudiantes_ruta (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ruta_id INTEGER,
        numero_estudiante TEXT,
        nombre_estudiante TEXT,
        nombre_representante TEXT,
        cedula_representante TEXT,
        correo_representante TEXT,
        telefono_representante TEXT,
        FOREIGN KEY(ruta_id) REFERENCES rutas(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS creditos_socio (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        conductor_id INTEGER,
        valor_prestamo REAL NOT NULL,
        saldo_pendiente REAL NOT NULL,
        fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
        estado TEXT DEFAULT 'ACTIVO',
        FOREIGN KEY(conductor_id) REFERENCES conductores(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS flujo_caja (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        conductor_id INTEGER,
        mes INTEGER,
        anio INTEGER,
        total_ingresos REAL,
        cuota_administrativa REAL,
        renta_1pct REAL,
        comision_cade REAL,
        anticipo_socio REAL,
        abono_prestamo REAL,
        aplicativo_buseta REAL,
        comision_compania REAL,
        total_egresos REAL,
        total_recibir REAL,
        FOREIGN KEY(conductor_id) REFERENCES conductores(id) ON DELETE SET NULL
      );
    `);
    console.log('[DB-INIT] Table creation script executed');

    // Migrations / Safety checks for missing columns
    console.log('[DB-INIT] Checking migrations...');




    // Seed default admin user
    try {
      const user = db.prepare("SELECT * FROM usuarios WHERE nombre = 'admin'").get();
      if (!user) {
        db.prepare("INSERT INTO usuarios (nombre, clave_hash, rol) VALUES (?, ?, ?)").run('admin', 'admin', 'admin');
        console.log('[DB-INIT] Seeded default admin user');
      }
    } catch (e) { }

    console.log('[DB-INIT] SUCCESS: Database ready');
  } catch (error) {
    console.error('[DB-INIT ERROR]', error);
  }
}

function getDb() {
  return db;
}

module.exports = { initDatabase, getDb };


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

      CREATE TABLE IF NOT EXISTS gastos_administrativos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        mes INTEGER NOT NULL,
        anio INTEGER NOT NULL,
        total_cuota_admin REAL DEFAULT 0,
        insumos_oficina REAL DEFAULT 0,
        varios_valor REAL DEFAULT 0,
        varios_descripcion TEXT,
        nro_cheque TEXT,
        fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('[DB-INIT] Table creation script executed');

    // Migrations / Safety checks for missing columns
    console.log('[DB-INIT] Checking migrations...');

    // Migration: Add nro_cheque column to flujo_caja
    try {
      const cols = db.pragma("table_info(flujo_caja)");
      if (!cols.find(c => c.name === 'nro_cheque')) {
        db.exec("ALTER TABLE flujo_caja ADD COLUMN nro_cheque TEXT");
        console.log('[DB-INIT] Migration: added nro_cheque column');
      }
      if (!cols.find(c => c.name === 'nro_cheque_anticipo')) {
        db.exec("ALTER TABLE flujo_caja ADD COLUMN nro_cheque_anticipo TEXT");
        console.log('[DB-INIT] Migration: added nro_cheque_anticipo column');
      }
      if (!cols.find(c => c.name === 'nro_factura')) {
        db.exec("ALTER TABLE flujo_caja ADD COLUMN nro_factura TEXT");
        console.log('[DB-INIT] Migration: added nro_factura column');
      }
      if (!cols.find(c => c.name === 'num_estudiantes')) {
        db.exec("ALTER TABLE flujo_caja ADD COLUMN num_estudiantes INTEGER DEFAULT 0");
        console.log('[DB-INIT] Migration: added num_estudiantes column');
      }
    } catch (e) { console.log('[DB-INIT] Migration nro_cheque/nro_factura skipped:', e.message); }

    // Migration: Add numero_cheque column to creditos_socio
    try {
      const cols2 = db.pragma("table_info(creditos_socio)");
      if (!cols2.find(c => c.name === 'numero_cheque')) {
        db.exec("ALTER TABLE creditos_socio ADD COLUMN numero_cheque TEXT");
        console.log('[DB-INIT] Migration: added numero_cheque to creditos_socio');
      }
    } catch (e) { console.log('[DB-INIT] Migration numero_cheque skipped:', e.message); }

    // Migration: Add new expense columns to gastos_administrativos
    try {
      const gcols = db.pragma("table_info(gastos_administrativos)");
      const newCols = [
        'arriendo REAL DEFAULT 0', 'arriendo_cheque TEXT', 'arriendo_factura TEXT',
        'papeleria REAL DEFAULT 0', 'papeleria_cheque TEXT', 'papeleria_factura TEXT',
        'sueldo_gerente REAL DEFAULT 0', 'sueldo_gerente_cheque TEXT', 'sueldo_gerente_factura TEXT',
        'patente REAL DEFAULT 0', 'patente_cheque TEXT', 'patente_factura TEXT',
        'honorarios REAL DEFAULT 0', 'honorarios_cheque TEXT', 'honorarios_factura TEXT',
        'pago_iess REAL DEFAULT 0', 'pago_iess_cheque TEXT', 'pago_iess_factura TEXT',
        'convocatorias REAL DEFAULT 0', 'convocatorias_cheque TEXT', 'convocatorias_factura TEXT',
        'capacitaciones REAL DEFAULT 0', 'capacitaciones_cheque TEXT', 'capacitaciones_factura TEXT',
        'insumos_cheque TEXT', 'insumos_factura TEXT',
        'varios_cheque TEXT', 'varios_factura TEXT',
      ];
      for (const colDef of newCols) {
        const colName = colDef.split(' ')[0];
        if (!gcols.find(c => c.name === colName)) {
          db.exec(`ALTER TABLE gastos_administrativos ADD COLUMN ${colDef}`);
          console.log(`[DB-INIT] Migration: added ${colName} to gastos_administrativos`);
        }
      }
    } catch (e) { console.log('[DB-INIT] Migration gastos_admin_cols skipped:', e.message); }


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


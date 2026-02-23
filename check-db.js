const Database = require('better-sqlite3');
const path = require('path');
const os = require('os');

// In Electron, app.getPath('userData') on Windows is usually:
// C:\Users\<user>\AppData\Roaming\colorado-express
const dbPath = path.join(os.homedir(), 'AppData', 'Roaming', 'colorado-express', 'colorado_express.db');

console.log('Checking database at:', dbPath);

try {
    const db = new Database(dbPath, { readonly: true });

    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    console.log('Tables found:', tables.map(t => t.name).join(', '));

    if (tables.some(t => t.name === 'vehiculos')) {
        const vehiculos = db.prepare("SELECT * FROM vehiculos").all();
        console.log('Vehiculos count:', vehiculos.length);
        if (vehiculos.length > 0) console.log('Sample Vehiculo:', vehiculos[0]);
    }

    if (tables.some(t => t.name === 'conductores')) {
        const conductores = db.prepare("SELECT * FROM conductores").all();
        console.log('Conductores count:', conductores.length);
        if (conductores.length > 0) console.log('Sample Conductor:', conductores[0]);
    }

    if (tables.some(t => t.name === 'rutas')) {
        const rutas = db.prepare("SELECT * FROM rutas").all();
        console.log('Rutas count:', rutas.length);
        if (rutas.length > 0) console.log('Sample Ruta:', rutas[0]);
    }

    db.close();
} catch (error) {
    console.error('Error checking database:', error.message);
    console.log('Trying alternative path (local)...');
    // Fallback or check current dir if it was accidentally created here
}

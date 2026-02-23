const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const url = require('url');
const { initDatabase } = require('./database');

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false // Simplifies communication for this local app
        }
    });

    // Load the Angular app (from build output)
    mainWindow.loadURL(
        url.format({
            pathname: path.join(__dirname, `../dist/colorado-express/browser/index.html`),
            protocol: "file:",
            slashes: true
        })
    );

    // Open DevTools during development
    // mainWindow.webContents.openDevTools();

    mainWindow.on('closed', function () {
        mainWindow = null;
    });
}

app.on('ready', () => {
    console.log('[MAIN] App Ready');
    try {
        initDatabase();
    } catch (err) {
        console.error('[MAIN] initDatabase failed:', err);
    }
    createWindow();
});

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
});

app.on('activate', function () {
    if (mainWindow === null) createWindow();
});

// Database IPC Handlers
ipcMain.handle('db-query', async (event, { query, params }) => {
    console.log('[IPC-MAIN] Request: db-query', query, params);
    const { getDb } = require('./database');
    const db = getDb();

    if (!db) {
        console.error('[IPC-MAIN] ERROR: DB instance is null');
        return { success: false, error: 'DB not initialized' };
    }

    // Add a race condition to prevent freezing if better-sqlite3 hangs
    const queryPromise = (async () => {
        try {
            console.log('[IPC-MAIN] Preparing stmt...');
            const stmt = db.prepare(query);
            console.log('[IPC-MAIN] Executing stmt...');
            const result = stmt.all(...(params || []));
            console.log('[IPC-MAIN] Done. Rows:', result.length);
            return { success: true, data: result };
        } catch (err) {
            console.error('[IPC-MAIN] Query execution failed:', err);
            return { success: false, error: err.message };
        }
    })();

    const timeoutPromise = new Promise((resolve) =>
        setTimeout(() => resolve({ success: false, error: 'Database timeout (5s)' }), 5000)
    );

    return Promise.race([queryPromise, timeoutPromise]);
});

ipcMain.handle('db-run', async (event, { query, params }) => {
    console.log('[IPC-MAIN] Received db-run:', query, params);
    const { getDb } = require('./database');
    const db = getDb();

    if (!db) {
        console.error('[IPC-MAIN] ERROR: Database not initialized');
        return { success: false, error: 'Database not initialized' };
    }

    try {
        console.log('[IPC-MAIN] Preparing statement...');
        const stmt = db.prepare(query);
        console.log('[IPC-MAIN] Executing statement...');
        const result = stmt.run(...(params || []));
        console.log('[IPC-MAIN] Run SUCCESS:', result);
        return { success: true, data: result };
    } catch (error) {
        console.error('[IPC-MAIN] RUN ERROR:', error);
        return { success: false, error: error.message };
    }
});

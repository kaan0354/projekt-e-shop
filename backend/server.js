// Server und zentrale Backend-Konfiguration
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const session = require('express-session');

const { mysql, dbConfig } = require('./db');
const transporter = require('./services/mail');

const productRoutes = require('./routes/products');
const cartRoutes = require('./routes/cart');
const authRoutes = require('./routes/auth');
const orderRoutes = require('./routes/orders');
const paypalRoutes = require('./routes/paypal');
const adminRoutes = require('./routes/admin');
const withdrawalRoutes = require('./routes/withdrawals');

const app = express();


// WICHTIGE KONFIGURATION:
// Port des Backend-Servers.
// Lokal wird standardmäßig Port 3000 verwendet.
// Bei Bedarf kann PORT in der .env-Datei geändert werden.
const PORT = process.env.PORT || 3000;


// WICHTIGE KONFIGURATION:
// Adresse des Frontends, das auf das Backend zugreifen darf.
// Der Standardwert ist für die lokale Entwicklung mit VS Code Live Server.
// Bei einer Serverbereitstellung FRONTEND_URL in der .env-Datei
// durch die tatsächliche Adresse des Frontends ersetzen.
const FRONTEND_URL =
    process.env.FRONTEND_URL || 'http://127.0.0.1:5500';


// WICHTIGE KONFIGURATION:
// Name der MySQL-Datenbank.
// Muss mit DB_NAME in der .env-Datei übereinstimmen.
const DATABASE_NAME =
    process.env.DB_NAME || 'webshop';


// WICHTIGE KONFIGURATION:
// SESSION_SECRET muss in der .env-Datei festgelegt werden.
// Keine echten Session-Schlüssel direkt im Quellcode speichern.
if (!process.env.SESSION_SECRET) {
    console.error(
        'SESSION_SECRET fehlt. Bitte in der .env-Datei festlegen.'
    );
    process.exit(1);
}


// CORS
app.use(cors({
    origin: FRONTEND_URL,
    credentials: true
}));


// JSON
app.use(express.json());


// Session
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,

    cookie: {

        // KONFIGURATION:
        // Gültigkeitsdauer der Session.
        // Aktuell 24 Stunden.
        maxAge: 1000 * 60 * 60 * 24
    }
}));


// Datenbank vorbereiten
async function setupDatabase() {

    try {

        const connection =
            await mysql.createConnection({

                // WICHTIGE KONFIGURATION:
                // Datenbankserver wird über DB_HOST in .env festgelegt.
                // Für eine lokale MySQL-Installation normalerweise localhost.
                host: process.env.DB_HOST,

                // WICHTIGE KONFIGURATION:
                // MySQL-Benutzer wird über DB_USER in .env festgelegt.
                user: process.env.DB_USER,

                // WICHTIGE KONFIGURATION:
                // MySQL-Passwort wird ausschließlich über .env geladen.
                password: process.env.DB_PASSWORD
            });


        // WICHTIGE KONFIGURATION:
        // Der Datenbankname stammt aus DB_NAME in der .env-Datei.
        await connection.query(
            `CREATE DATABASE IF NOT EXISTS \`${DATABASE_NAME}\``
        );

        await connection.query(
            `USE \`${DATABASE_NAME}\``
        );


        await connection.query(`
            CREATE TABLE IF NOT EXISTS products (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                price DECIMAL(10,2) NOT NULL,
                image VARCHAR(255),
                stock INT NOT NULL DEFAULT 0
            )
        `);


        await connection.query(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(100) NOT NULL UNIQUE,
                email VARCHAR(255) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);


        await connection.query(`
            CREATE TABLE IF NOT EXISTS orders (
                id INT AUTO_INCREMENT PRIMARY KEY,
                order_number VARCHAR(50) NOT NULL UNIQUE,
                user_id INT NOT NULL,
                total DECIMAL(10,2) NOT NULL,
                status VARCHAR(50) NOT NULL DEFAULT 'offen',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        `);


        await connection.query(`
            CREATE TABLE IF NOT EXISTS order_items (
                id INT AUTO_INCREMENT PRIMARY KEY,
                order_id INT NOT NULL,
                product_id INT NOT NULL,
                quantity INT NOT NULL,
                unit_price DECIMAL(10,2) NOT NULL,

                FOREIGN KEY (order_id) REFERENCES orders(id),
                FOREIGN KEY (product_id) REFERENCES products(id)
            )
        `);


        console.log('Datenbank ist bereit.');

        await connection.end();

    } catch (error) {

        console.error(
            'MySQL-Fehler:',
            error.message
        );
    }
}


// Testprodukte einfügen
app.get('/api/setup-products', async (req, res) => {

    let connection;

    try {

        connection =
            await mysql.createConnection(dbConfig);


        const [existingProducts] =
            await connection.query(
                'SELECT COUNT(*) AS count FROM products'
            );


        if (existingProducts[0].count > 0) {

            return res.send(
                'Produkte existieren bereits.'
            );
        }


        // KONFIGURATION:
        // Beispielprodukte für die erstmalige Einrichtung des Shops.
        // Namen, Beschreibungen, Preise, Bilder und Lagerbestände
        // können an das gewünschte Produktsortiment angepasst werden.
        await connection.query(`
            INSERT INTO products
            (name, description, price, image, stock)
            VALUES
            (?, ?, ?, ?, ?),
            (?, ?, ?, ?, ?),
            (?, ?, ?, ?, ?)
        `, [

            'Blaues Werkstück',
            'Ein blaues Werkstück mit einer sauberen Bohrung in der Mitte und zwei Frästaschen',
            2.00,
            'img/blau.png',
            20,

            'Rotes Werkstück',
            'Ein rotes gefrästes Werkstück',
            2.00,
            'img/rot.png',
            20,

            'Weißes Werkstück',
            'Ein weißes gebohrtes Werkstück',
            2.00,
            'img/Weiß.png',
            20
        ]);


        res.send(
            '3 Produkte wurden angelegt!'
        );

    } catch (error) {

        console.error(error);

        res.status(500).send(
            'Fehler beim Anlegen der Produkte'
        );

    } finally {

        if (connection) {
            await connection.end();
        }
    }
});


// Backend testen
app.get('/', (req, res) => {

    res.send(
        'Backend läuft!'
    );
});


// Mail testen
app.get('/api/test-mail', async (req, res) => {

    try {

        await transporter.sendMail({

            // WICHTIGE KONFIGURATION:
            // MAIL_USER wird in der .env-Datei festgelegt.
            from: process.env.MAIL_USER,

            // WICHTIGE KONFIGURATION:
            // PRODUCTION_EMAIL ist die interne Empfängeradresse
            // für Produktions-/Shop-Benachrichtigungen.
            // Diese Adresse in der .env-Datei festlegen.
            to: process.env.PRODUCTION_EMAIL,

            // KONFIGURATION:
            // Betreff der Testmail kann an den Shopnamen angepasst werden.
            subject: 'E-Shop Testmail',

            text:
                'Wenn du diese Mail bekommst, funktioniert der Mailversand.'
        });


        res.send(
            'Testmail wurde gesendet.'
        );

    } catch (error) {

        console.error(error);

        res.status(500).send(
            'Testmail konnte nicht gesendet werden.'
        );
    }
});


// Routen
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/paypal', paypalRoutes);
app.use('/api', adminRoutes);
app.use('/api/withdrawals', withdrawalRoutes);


// Datenbank starten
setupDatabase();


// Server starten
app.listen(PORT, () => {

    // localhost bezeichnet bei lokalem Betrieb immer den jeweiligen Computer.
    // Bei einem Deployment wird die öffentliche Serveradresse
    // außerhalb dieser Konsolenausgabe konfiguriert.
    console.log(
        `Server läuft lokal auf http://localhost:${PORT}`
    );
});
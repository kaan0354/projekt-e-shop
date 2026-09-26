// Datenbankverbindung
const mysql = require('mysql2/promise');


// WICHTIGE KONFIGURATION:
// Die Zugangsdaten und der Name der MySQL-Datenbank werden
// ausschließlich über die .env-Datei festgelegt.
// Benötigte Variablen:
// DB_HOST     = Adresse des MySQL-Servers (lokal normalerweise localhost)
// DB_USER     = MySQL-Benutzer
// DB_PASSWORD = Passwort des MySQL-Benutzers
// DB_NAME     = Name der verwendeten Datenbank
//
// Keine echten Datenbank-Zugangsdaten direkt in dieser Datei speichern.
const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
};


module.exports = {
    mysql,
    dbConfig
};
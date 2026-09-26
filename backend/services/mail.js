// Gemeinsamer Mail-Transporter
const nodemailer = require('nodemailer');


// Mail-Transporter
const transporter = nodemailer.createTransport({

    // KONFIGURATION:
    // Verwendeten Mailanbieter bei Bedarf vor Inbetriebnahme anpassen.
    service: 'gmail',

    auth: {

        // WICHTIGE KONFIGURATION:
        // MAIL_USER muss in der .env-Datei festgelegt werden.
        user: process.env.MAIL_USER,

        // WICHTIGE KONFIGURATION:
        // MAIL_PASSWORD muss in der .env-Datei festgelegt werden.
        // Kein echtes Mail-Passwort direkt im Quellcode speichern.
        pass: process.env.MAIL_PASSWORD
    }
});


module.exports = transporter;
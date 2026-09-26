// Elektronische Widerrufe verarbeiten
const express = require('express');

const { mysql, dbConfig } = require('../db');
const transporter = require('../services/mail');

const {
    createCustomerMail,
    escapeHtml
} = require('../services/mailTemplate');

const router = express.Router();


// KONFIGURATION: Zeitzone für die Anzeige des Widerrufseingangs anpassen
const TIME_ZONE = 'Europe/Berlin';

// KONFIGURATION: Sprache und Datumsformat bei Bedarf anpassen
const LOCALE = 'de-DE';


// Widerruf absenden
router.post('/', async (req, res) => {

    const {
        fullName,
        email,
        orderNumber
    } = req.body;


    if (!fullName || !email || !orderNumber) {
        return res.status(400).json({
            message:
                'Bitte alle Felder ausfüllen.'
        });
    }


    const cleanFullName =
        String(fullName).trim();

    const cleanEmail =
        String(email)
            .trim()
            .toLowerCase();

    const cleanOrderNumber =
        String(orderNumber).trim();


    if (cleanFullName.length < 2) {
        return res.status(400).json({
            message:
                'Bitte gib einen gültigen Namen ein.'
        });
    }


    const emailRegex =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


    if (!emailRegex.test(cleanEmail)) {
        return res.status(400).json({
            message:
                'Bitte gib eine gültige E-Mail-Adresse ein.'
        });
    }


    if (cleanOrderNumber.length < 3) {
        return res.status(400).json({
            message:
                'Bitte gib eine gültige Bestellnummer ein.'
        });
    }


    let connection;


    try {

        connection =
            await mysql.createConnection(
                dbConfig
            );


        // Widerruf speichern
        const [result] =
            await connection.query(
                `INSERT INTO withdrawals
                (
                    full_name,
                    email,
                    order_number
                )
                VALUES (?, ?, ?)`,
                [
                    cleanFullName,
                    cleanEmail,
                    cleanOrderNumber
                ]
            );


        // Eingangszeit laden
        const [withdrawals] =
            await connection.query(
                `SELECT received_at
                 FROM withdrawals
                 WHERE id = ?`,
                [
                    result.insertId
                ]
            );


        const receivedAt =
            withdrawals[0].received_at;


        // Eingangszeit formatieren
        const dateTime =
            new Date(receivedAt)
                .toLocaleString(
                    LOCALE,
                    {
                        timeZone:
                            TIME_ZONE,

                        dateStyle:
                            'medium',

                        timeStyle:
                            'medium'
                    }
                );


        // Eingangsbestätigung an den Kunden
        await transporter.sendMail({

            // WICHTIGE KONFIGURATION:
            // MAIL_USER muss in der .env-Datei festgelegt werden.
            from:
                process.env.MAIL_USER,

            to:
                cleanEmail,

            subject:
                `Bestätigung deines Widerrufs ${cleanOrderNumber}`,

            html:
                createCustomerMail({

                    title:
                        'Widerruf eingegangen',

                    greeting:
                        `Hallo ${cleanFullName},`,

                    intro:
                        'wir bestätigen dir hiermit den Eingang deiner Widerrufserklärung.',

                    content: `

                        <div style="
                            margin-bottom: 22px;
                            padding: 16px 18px;
                            background: #f6f6f6;
                            border: 1px solid #e5e5e5;
                            border-radius: 8px;
                            color: #333333;
                            font-size: 14px;
                            line-height: 1.6;
                        ">

                            <strong>
                                Deine Widerrufserklärung
                            </strong>

                            <br><br>

                            Du widerrufst den Vertrag zur Bestellung

                            <strong>
                                ${escapeHtml(cleanOrderNumber)}
                            </strong>.

                        </div>


                        <table
                            role="presentation"
                            width="100%"
                            cellspacing="0"
                            cellpadding="0"
                            style="
                                border-collapse: collapse;
                                margin-top: 8px;
                                font-size: 14px;
                                color: #222222;
                            "
                        >

                            <tr>

                                <td style="
                                    padding: 10px 0;
                                    border-bottom: 1px solid #eeeeee;
                                ">
                                    <strong>
                                        Bestellnummer
                                    </strong>
                                </td>

                                <td style="
                                    padding: 10px 0;
                                    border-bottom: 1px solid #eeeeee;
                                    text-align: right;
                                ">
                                    ${escapeHtml(cleanOrderNumber)}
                                </td>

                            </tr>


                            <tr>

                                <td style="
                                    padding: 10px 0;
                                    border-bottom: 1px solid #eeeeee;
                                ">
                                    <strong>
                                        Name
                                    </strong>
                                </td>

                                <td style="
                                    padding: 10px 0;
                                    border-bottom: 1px solid #eeeeee;
                                    text-align: right;
                                ">
                                    ${escapeHtml(cleanFullName)}
                                </td>

                            </tr>


                            <tr>

                                <td style="
                                    padding: 10px 0;
                                    border-bottom: 1px solid #eeeeee;
                                ">
                                    <strong>
                                        E-Mail-Adresse
                                    </strong>
                                </td>

                                <td style="
                                    padding: 10px 0;
                                    border-bottom: 1px solid #eeeeee;
                                    text-align: right;
                                ">
                                    ${escapeHtml(cleanEmail)}
                                </td>

                            </tr>


                            <tr>

                                <td style="
                                    padding: 10px 0;
                                ">
                                    <strong>
                                        Eingang
                                    </strong>
                                </td>

                                <td style="
                                    padding: 10px 0;
                                    text-align: right;
                                ">
                                    ${escapeHtml(dateTime)}
                                </td>

                            </tr>

                        </table>
                    `,

                    notice:
                        `Diese E-Mail bestätigt zunächst den Eingang deiner Widerrufserklärung zur Bestellung ${cleanOrderNumber}.`
                })
        });


        // Produktion über den Widerruf informieren
        await transporter.sendMail({

            // WICHTIGE KONFIGURATION:
            // MAIL_USER muss in der .env-Datei festgelegt werden.
            from:
                process.env.MAIL_USER,

            // WICHTIGE KONFIGURATION:
            // PRODUCTION_EMAIL muss in der .env-Datei festgelegt werden.
            to:
                process.env.PRODUCTION_EMAIL,

            subject:
                `WIDERRUF ${cleanOrderNumber}`,

            text: `
Ein elektronischer Widerruf ist eingegangen.

Name:
${cleanFullName}

E-Mail:
${cleanEmail}

Bestellnummer:
${cleanOrderNumber}

Eingang:
${dateTime}
            `
        });


        res.status(201).json({
            message:
                'Dein Widerruf wurde erfolgreich übermittelt.'
        });


    } catch (error) {

        console.error(error);


        res.status(500).json({
            message:
                'Der Widerruf konnte momentan nicht übermittelt werden.'
        });


    } finally {

        if (connection) {
            await connection.end();
        }
    }
});


module.exports = router;
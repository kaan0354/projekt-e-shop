// Auth-Routen
const express = require('express');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const { mysql, dbConfig } = require('../db');
const { requireLogin } = require('../middleware/auth');
const transporter = require('../services/mail');

const {
    createCustomerMail
} = require('../services/mailTemplate');

const router = express.Router();


// WICHTIGE KONFIGURATION:
// Öffentliche Adresse des Backends.
// Der Standardwert ist für die lokale Entwicklung.
// Bei einer Serverbereitstellung BACKEND_URL in der .env-Datei
// durch die tatsächliche öffentliche Backend-Adresse ersetzen.
const BACKEND_URL =
    process.env.BACKEND_URL || 'http://127.0.0.1:3000';


// WICHTIGE KONFIGURATION:
// Adresse des Frontends.
// Der Standardwert ist für die lokale Entwicklung mit VS Code Live Server.
// Bei einer Serverbereitstellung FRONTEND_URL in der .env-Datei
// durch die tatsächliche Adresse des Frontends ersetzen.
const FRONTEND_URL =
    process.env.FRONTEND_URL || 'http://127.0.0.1:5500';


// Registrierung
router.post('/register', async (req, res) => {

    let { username, email, password } = req.body;


    if (!username || !email || !password) {
        return res.status(400).json({
            message: 'Bitte alle Felder ausfüllen.'
        });
    }


    username = username.trim();
    email = email.trim().toLowerCase();


    // KONFIGURATION: Erlaubte Länge des Benutzernamens bei Bedarf anpassen
    if (username.length < 3 || username.length > 30) {
        return res.status(400).json({
            message: 'Der Benutzername muss zwischen 3 und 30 Zeichen lang sein.'
        });
    }


    const emailRegex =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


    if (!emailRegex.test(email)) {
        return res.status(400).json({
            message: 'Bitte gib eine gültige E-Mail-Adresse ein.'
        });
    }


    // KONFIGURATION: Mindestlänge für Benutzerpasswörter bei Bedarf anpassen
    if (password.length < 8) {
        return res.status(400).json({
            message: 'Das Passwort muss mindestens 8 Zeichen lang sein.'
        });
    }


    let connection;


    try {

        connection =
            await mysql.createConnection(dbConfig);


        const [existingUsers] =
            await connection.query(
                `SELECT id
                 FROM users
                 WHERE username = ? OR email = ?`,
                [
                    username,
                    email
                ]
            );


        if (existingUsers.length > 0) {
            return res.status(409).json({
                message: 'Benutzername oder E-Mail existiert bereits.'
            });
        }


        // KONFIGURATION: Stärke der Passwortverschlüsselung bei Bedarf anpassen
        const hashedPassword =
            await bcrypt.hash(
                password,
                12
            );


        const [result] =
            await connection.query(
                `INSERT INTO users
                 (
                    username,
                    email,
                    password,
                    email_verified
                 )
                 VALUES (?, ?, ?, 0)`,
                [
                    username,
                    email,
                    hashedPassword
                ]
            );


        const userId =
            result.insertId;


        const token =
            crypto
                .randomBytes(32)
                .toString('hex');


        const tokenHash =
            crypto
                .createHash('sha256')
                .update(token)
                .digest('hex');


        // KONFIGURATION: Gültigkeitsdauer des Bestätigungslinks bei Bedarf anpassen
        await connection.query(
            `INSERT INTO email_verification_tokens
             (
                user_id,
                token_hash,
                expires_at
             )
             VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 24 HOUR))`,
            [
                userId,
                tokenHash
            ]
        );


        const verificationLink =
            `${BACKEND_URL}/api/verify-email?token=${token}`;


        // Bestätigungs-Mail
        await transporter.sendMail({

            // WICHTIGE KONFIGURATION:
            // MAIL_USER muss in der .env-Datei festgelegt werden.
            from:
                process.env.MAIL_USER,

            to:
                email,

            subject:
                'E-Mail-Adresse bestätigen',

            html:
                createCustomerMail({

                    title:
                        'E-Mail-Adresse bestätigen',

                    greeting:
                        `Hallo ${username},`,

                    intro:
                        'vielen Dank für deine Registrierung. Bestätige bitte deine E-Mail-Adresse, damit du dein Konto vollständig nutzen kannst.',

                    content: `
                        <div style="
                            padding: 16px 18px;
                            background: #f6f6f6;
                            border: 1px solid #e5e5e5;
                            border-radius: 8px;
                            color: #333333;
                            font-size: 14px;
                            line-height: 1.6;
                        ">
                            Der Bestätigungslink ist
                            <strong>24 Stunden</strong>
                            gültig.
                        </div>
                    `,

                    buttonText:
                        'E-Mail-Adresse bestätigen',

                    buttonUrl:
                        verificationLink,

                    notice:
                        'Falls du dich nicht registriert hast, kannst du diese E-Mail ignorieren.'
                })
        });


        res.status(201).json({
            message:
                'Registrierung erfolgreich! Bitte bestätige deine E-Mail-Adresse.'
        });


    } catch (error) {

        console.error(error);


        res.status(500).json({
            message:
                'Die Registrierung konnte nicht abgeschlossen werden.'
        });


    } finally {

        if (connection) {
            await connection.end();
        }
    }
});


// E-Mail bestätigen
router.get('/verify-email', async (req, res) => {

    const { token } =
        req.query;


    if (!token) {
        return res.status(400).send(
            'Der Bestätigungslink ist ungültig.'
        );
    }


    const tokenHash =
        crypto
            .createHash('sha256')
            .update(token)
            .digest('hex');


    let connection;


    try {

        connection =
            await mysql.createConnection(dbConfig);


        const [tokens] =
            await connection.query(
                `SELECT user_id
                 FROM email_verification_tokens
                 WHERE token_hash = ?
                 AND expires_at > NOW()`,
                [
                    tokenHash
                ]
            );


        if (tokens.length === 0) {
            return res.status(400).send(
                'Der Bestätigungslink ist ungültig oder abgelaufen.'
            );
        }


        const userId =
            tokens[0].user_id;


        await connection.query(
            `UPDATE users
             SET email_verified = 1
             WHERE id = ?`,
            [
                userId
            ]
        );


        await connection.query(
            `DELETE FROM email_verification_tokens
             WHERE user_id = ?`,
            [
                userId
            ]
        );


        res.redirect(
            `${FRONTEND_URL}/frontend/login.html?verified=1`
        );


    } catch (error) {

        console.error(error);


        res.status(500).send(
            'Die E-Mail-Adresse konnte nicht bestätigt werden.'
        );


    } finally {

        if (connection) {
            await connection.end();
        }
    }
});


// Login
router.post('/login', async (req, res) => {

    const {
        email,
        password
    } = req.body;


    if (!email || !password) {
        return res.status(400).json({
            message:
                'Bitte E-Mail und Passwort eingeben.'
        });
    }


    let connection;


    try {

        connection =
            await mysql.createConnection(dbConfig);


        const [users] =
            await connection.query(
                `SELECT *
                 FROM users
                 WHERE email = ?
                 AND is_deleted = 0`,
                [
                    email
                ]
            );


        if (users.length === 0) {
            return res.status(401).json({
                message:
                    'E-Mail oder Passwort falsch.'
            });
        }


        const user =
            users[0];


        if (!user.email_verified) {
            return res.status(403).json({
                message:
                    'Bitte bestätige zuerst deine E-Mail-Adresse.'
            });
        }


        const passwordCorrect =
            await bcrypt.compare(
                password,
                user.password
            );


        if (!passwordCorrect) {
            return res.status(401).json({
                message:
                    'E-Mail oder Passwort falsch.'
            });
        }


        req.session.user = {
            id:
                user.id,

            username:
                user.username,

            email:
                user.email,

            role:
                user.role
        };


        res.json({
            message:
                'Login erfolgreich!',

            user:
                req.session.user
        });


    } catch (error) {

        console.error(error);


        res.status(500).json({
            message:
                'Fehler beim Login.'
        });


    } finally {

        if (connection) {
            await connection.end();
        }
    }
});


// Aktuellen Benutzer laden
router.get(
    '/me',
    requireLogin,
    (req, res) => {

        res.json({
            user:
                req.session.user
        });
    }
);


// Logout
router.post(
    '/logout',
    requireLogin,
    (req, res) => {

        req.session.destroy(
            (error) => {

                if (error) {

                    console.error(error);

                    return res.status(500).json({
                        message:
                            'Logout fehlgeschlagen.'
                    });
                }


                res.clearCookie(
                    'connect.sid'
                );


                res.json({
                    message:
                        'Erfolgreich abgemeldet.'
                });
            }
        );
    }
);


// Passwort-Reset anfordern
router.post('/forgot-password', async (req, res) => {

    const { email } =
        req.body;


    if (!email) {
        return res.status(400).json({
            message:
                'Bitte gib deine E-Mail-Adresse ein.'
        });
    }


    let connection;


    try {

        connection =
            await mysql.createConnection(dbConfig);


        const [users] =
            await connection.query(
                `SELECT
                    id,
                    email
                 FROM users
                 WHERE email = ?`,
                [
                    email
                ]
            );


        if (users.length === 0) {
            return res.json({
                message:
                    'Falls ein Konto mit dieser E-Mail existiert, wurde ein Reset-Link versendet.'
            });
        }


        const user =
            users[0];


        const token =
            crypto
                .randomBytes(32)
                .toString('hex');


        const tokenHash =
            crypto
                .createHash('sha256')
                .update(token)
                .digest('hex');


        await connection.query(
            `DELETE FROM password_reset_tokens
             WHERE user_id = ?`,
            [
                user.id
            ]
        );


        // KONFIGURATION: Gültigkeitsdauer des Passwort-Reset-Links bei Bedarf anpassen
        await connection.query(
            `INSERT INTO password_reset_tokens
             (
                user_id,
                token_hash,
                expires_at
             )
             VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 30 MINUTE))`,
            [
                user.id,
                tokenHash
            ]
        );


        const resetLink =
            `${FRONTEND_URL}/frontend/reset-password.html?token=${token}`;


        // Passwort-Reset-Mail
        await transporter.sendMail({

            // WICHTIGE KONFIGURATION:
            // MAIL_USER muss in der .env-Datei festgelegt werden.
            from:
                process.env.MAIL_USER,

            to:
                user.email,

            subject:
                'Passwort zurücksetzen',

            html:
                createCustomerMail({

                    title:
                        'Passwort zurücksetzen',

                    greeting:
                        'Hallo,',

                    intro:
                        'für dein Konto wurde das Zurücksetzen des Passworts angefordert.',

                    content: `
                        <div style="
                            padding: 16px 18px;
                            background: #f6f6f6;
                            border: 1px solid #e5e5e5;
                            border-radius: 8px;
                            color: #333333;
                            font-size: 14px;
                            line-height: 1.6;
                        ">
                            Der Link ist
                            <strong>30 Minuten</strong>
                            gültig.
                        </div>
                    `,

                    buttonText:
                        'Neues Passwort festlegen',

                    buttonUrl:
                        resetLink,

                    notice:
                        'Falls du das Zurücksetzen nicht angefordert hast, kannst du diese E-Mail ignorieren.'
                })
        });


        res.json({
            message:
                'Falls ein Konto mit dieser E-Mail existiert, wurde ein Reset-Link versendet.'
        });


    } catch (error) {

        console.error(error);


        res.status(500).json({
            message:
                'Der Reset-Link konnte momentan nicht versendet werden.'
        });


    } finally {

        if (connection) {
            await connection.end();
        }
    }
});


// Passwort zurücksetzen
router.post('/reset-password', async (req, res) => {

    const {
        token,
        password
    } = req.body;


    if (!token || !password) {
        return res.status(400).json({
            message:
                'Token und neues Passwort werden benötigt.'
        });
    }


    // KONFIGURATION: Mindestlänge für Benutzerpasswörter bei Bedarf anpassen
    if (password.length < 8) {
        return res.status(400).json({
            message:
                'Das neue Passwort muss mindestens 8 Zeichen lang sein.'
        });
    }


    let connection;


    try {

        connection =
            await mysql.createConnection(dbConfig);


        const tokenHash =
            crypto
                .createHash('sha256')
                .update(token)
                .digest('hex');


        const [tokens] =
            await connection.query(
                `SELECT
                    id,
                    user_id
                 FROM password_reset_tokens
                 WHERE token_hash = ?
                 AND expires_at > NOW()
                 LIMIT 1`,
                [
                    tokenHash
                ]
            );


        if (tokens.length === 0) {
            return res.status(400).json({
                message:
                    'Der Reset-Link ist ungültig oder abgelaufen.'
            });
        }


        const resetToken =
            tokens[0];


        // KONFIGURATION: Stärke der Passwortverschlüsselung bei Bedarf anpassen
        const hashedPassword =
            await bcrypt.hash(
                password,
                12
            );


        await connection.query(
            `UPDATE users
             SET password = ?
             WHERE id = ?`,
            [
                hashedPassword,
                resetToken.user_id
            ]
        );


        await connection.query(
            `DELETE FROM password_reset_tokens
             WHERE user_id = ?`,
            [
                resetToken.user_id
            ]
        );


        res.json({
            message:
                'Passwort wurde erfolgreich geändert.'
        });


    } catch (error) {

        console.error(error);


        res.status(500).json({
            message:
                'Passwort konnte nicht geändert werden.'
        });


    } finally {

        if (connection) {
            await connection.end();
        }
    }
});


// Reset-Token prüfen
router.get('/reset-password/validate', async (req, res) => {

    const { token } =
        req.query;


    if (!token) {
        return res.status(400).json({
            message:
                'Der Reset-Link ist ungültig.'
        });
    }


    let connection;


    try {

        connection =
            await mysql.createConnection(dbConfig);


        const tokenHash =
            crypto
                .createHash('sha256')
                .update(token)
                .digest('hex');


        const [tokens] =
            await connection.query(
                `SELECT
                    id,
                    expires_at
                 FROM password_reset_tokens
                 WHERE token_hash = ?
                 LIMIT 1`,
                [
                    tokenHash
                ]
            );


        if (tokens.length === 0) {
            return res.status(400).json({
                message:
                    'Der Reset-Link ist ungültig oder wurde bereits verwendet.'
            });
        }


        const expiresAt =
            new Date(
                tokens[0].expires_at
            );


        if (expiresAt <= new Date()) {
            return res.status(400).json({
                message:
                    'Der Reset-Link ist abgelaufen.'
            });
        }


        res.json({
            valid:
                true
        });


    } catch (error) {

        console.error(error);


        res.status(500).json({
            message:
                'Der Reset-Link konnte nicht überprüft werden.'
        });


    } finally {

        if (connection) {
            await connection.end();
        }
    }
});


// Passwort ändern
router.post(
    '/change-password',
    requireLogin,
    async (req, res) => {

        const {
            currentPassword,
            newPassword
        } = req.body;


        // KONFIGURATION: Mindestlänge für Benutzerpasswörter bei Bedarf anpassen
        if (
            !newPassword ||
            newPassword.length < 8
        ) {
            return res.status(400).json({
                message:
                    'Das neue Passwort muss mindestens 8 Zeichen lang sein.'
            });
        }


        let connection;


        try {

            connection =
                await mysql.createConnection(
                    dbConfig
                );


            const [users] =
                await connection.query(
                    `SELECT password
                     FROM users
                     WHERE id = ?`,
                    [
                        req.session.user.id
                    ]
                );


            if (users.length === 0) {
                return res.status(404).json({
                    message:
                        'Benutzer wurde nicht gefunden.'
                });
            }


            const passwordCorrect =
                await bcrypt.compare(
                    currentPassword,
                    users[0].password
                );


            if (!passwordCorrect) {
                return res.status(400).json({
                    message:
                        'Das aktuelle Passwort ist falsch.'
                });
            }


            // KONFIGURATION: Stärke der Passwortverschlüsselung bei Bedarf anpassen
            const hashedPassword =
                await bcrypt.hash(
                    newPassword,
                    12
                );


            await connection.query(
                `UPDATE users
                 SET password = ?
                 WHERE id = ?`,
                [
                    hashedPassword,
                    req.session.user.id
                ]
            );


            res.json({
                message:
                    'Passwort wurde erfolgreich geändert.'
            });


        } catch (error) {

            console.error(error);


            res.status(500).json({
                message:
                    'Passwort konnte nicht geändert werden.'
            });


        } finally {

            if (connection) {
                await connection.end();
            }
        }
    }
);


// Konto löschen
router.post(
    '/delete-account',
    requireLogin,
    async (req, res) => {

        const {
            email,
            password
        } = req.body;


        if (!email || !password) {
            return res.status(400).json({
                message:
                    'Bitte fülle alle Felder aus.'
            });
        }


        let connection;


        try {

            connection =
                await mysql.createConnection(
                    dbConfig
                );


            const [users] =
                await connection.query(
                    `SELECT
                        id,
                        email,
                        password
                     FROM users
                     WHERE id = ?
                     AND is_deleted = 0`,
                    [
                        req.session.user.id
                    ]
                );


            if (users.length === 0) {
                return res.status(404).json({
                    message:
                        'Benutzer wurde nicht gefunden.'
                });
            }


            const user =
                users[0];


            if (
                user.email.toLowerCase() !==
                email.toLowerCase()
            ) {
                return res.status(400).json({
                    message:
                        'Die eingegebene E-Mail-Adresse ist falsch.'
                });
            }


            const passwordCorrect =
                await bcrypt.compare(
                    password,
                    user.password
                );


            if (!passwordCorrect) {
                return res.status(400).json({
                    message:
                        'Das eingegebene Passwort ist falsch.'
                });
            }


            const deletedUsername =
                `deleted_user_${user.id}`;


            const deletedEmail =
                `deleted_${user.id}@deleted.invalid`;


            // KONFIGURATION: Stärke der Passwortverschlüsselung bei Bedarf anpassen
            const unusablePassword =
                await bcrypt.hash(
                    crypto
                        .randomBytes(32)
                        .toString('hex'),
                    12
                );


            await connection.query(
                `UPDATE users
                 SET
                    username = ?,
                    email = ?,
                    password = ?,
                    is_deleted = 1
                 WHERE id = ?`,
                [
                    deletedUsername,
                    deletedEmail,
                    unusablePassword,
                    user.id
                ]
            );


            await connection.query(
                `DELETE FROM cart_items
                 WHERE user_id = ?`,
                [
                    user.id
                ]
            );


            await connection.query(
                `DELETE FROM password_reset_tokens
                 WHERE user_id = ?`,
                [
                    user.id
                ]
            );


            req.session.destroy(
                (error) => {

                    if (error) {

                        console.error(error);

                        return res.status(500).json({
                            message:
                                'Konto wurde gelöscht, die Sitzung konnte aber nicht beendet werden.'
                        });
                    }


                    res.json({
                        message:
                            'Dein Konto wurde erfolgreich gelöscht.'
                    });
                }
            );


        } catch (error) {

            console.error(error);


            res.status(500).json({
                message:
                    'Das Konto konnte nicht gelöscht werden.'
            });


        } finally {

            if (connection) {
                await connection.end();
            }
        }
    }
);


module.exports = router;
// PayPal-Routen
const express = require('express');

const { mysql, dbConfig } = require('../db');
const { requireLogin } = require('../middleware/auth');
const { getPayPalAccessToken } = require('../services/paypal');

const router = express.Router();


// PayPal-Verbindung testen
router.get('/test', async (req, res) => {

    try {

        const accessToken =
            await getPayPalAccessToken();


        res.json({
            message:
                'PayPal-Verbindung erfolgreich!',

            tokenReceived:
                !!accessToken
        });


    } catch (error) {

        console.error(error);


        res.status(500).json({
            message:
                'PayPal-Verbindung fehlgeschlagen.'
        });
    }
});


// PayPal-Bestellung erstellen
router.post('/create-order', requireLogin, async (req, res) => {

    const { items } =
        req.body;


    if (
        !items ||
        !Array.isArray(items) ||
        items.length === 0
    ) {
        return res.status(400).json({
            message:
                'Der Warenkorb ist leer.'
        });
    }


    let connection;


    try {

        connection =
            await mysql.createConnection(
                dbConfig
            );


        let total = 0;


        for (const item of items) {

            const quantity =
                Number(item.quantity);


            if (
                !Number.isInteger(quantity) ||
                quantity < 1
            ) {
                return res.status(400).json({
                    message:
                        'Ungültige Produktmenge.'
                });
            }


            const [products] =
                await connection.query(
                    `SELECT
                        price,
                        stock,
                        is_available,
                        is_archived
                     FROM products
                     WHERE id = ?`,
                    [
                        item.productId
                    ]
                );


            if (products.length === 0) {

                return res.status(404).json({
                    message:
                        'Produkt nicht gefunden.'
                });
            }


            const product =
                products[0];


            // Archivierte Produkte dürfen nicht gekauft werden
            if (product.is_archived) {

                return res.status(409).json({
                    message:
                        'Ein Produkt in deinem Warenkorb wurde archiviert und kann nicht mehr gekauft werden.'
                });
            }


            if (!product.is_available) {

                return res.status(409).json({
                    message:
                        'Ein Produkt in deinem Warenkorb ist momentan nicht verfügbar.'
                });
            }


            // Bestand vor Erstellung der PayPal-Bestellung prüfen
            if (quantity > product.stock) {

                return res.status(409).json({
                    message:
                        `Von einem Produkt sind nur noch ${product.stock} Stück verfügbar.`
                });
            }


            total +=
                Number(product.price) *
                quantity;
        }


        total =
            total.toFixed(2);


        const accessToken =
            await getPayPalAccessToken();


        // WICHTIGE KONFIGURATION:
        // PAYPAL_BASE_URL muss in der .env-Datei passend zur verwendeten
        // PayPal-Umgebung festgelegt werden (Sandbox oder Live-Betrieb).
        const paypalResponse =
            await fetch(
                `${process.env.PAYPAL_BASE_URL}/v2/checkout/orders`,
                {
                    method:
                        'POST',

                    headers: {
                        'Content-Type':
                            'application/json',

                        'Authorization':
                            `Bearer ${accessToken}`
                    },

                    body: JSON.stringify({
                        intent:
                            'CAPTURE',

                        purchase_units: [
                            {
                                amount: {

                                    // KONFIGURATION:
                                    // Verwendete Shop- und PayPal-Währung.
                                    currency_code:
                                        'EUR',

                                    value:
                                        total
                                }
                            }
                        ]
                    })
                }
            );


        const paypalOrder =
            await paypalResponse.json();


        if (!paypalResponse.ok) {

            console.error(
                paypalOrder
            );


            return res.status(500).json({
                message:
                    'PayPal-Bestellung konnte nicht erstellt werden.'
            });
        }


        res.json({
            paypalOrderId:
                paypalOrder.id
        });


    } catch (error) {

        console.error(error);


        res.status(500).json({
            message:
                'PayPal-Bestellung konnte nicht erstellt werden.'
        });


    } finally {

        if (connection) {
            await connection.end();
        }
    }
});


// PayPal-Zahlung abschließen
router.post('/capture-order', requireLogin, async (req, res) => {

    const { orderId } =
        req.body;


    if (!orderId) {

        return res.status(400).json({
            message:
                'Keine PayPal Order ID vorhanden.'
        });
    }


    let connection;


    try {

        connection =
            await mysql.createConnection(
                dbConfig
            );


        // Produktstatus und Bestand direkt vor der Zahlung prüfen
        const [unavailableProducts] =
            await connection.query(
                `
                    SELECT
                        p.id,
                        p.name,
                        p.stock,
                        p.is_available,
                        p.is_archived,
                        ci.quantity

                    FROM cart_items ci

                    JOIN products p
                        ON ci.product_id = p.id

                    WHERE ci.user_id = ?

                    AND (
                        p.is_available = 0
                        OR p.is_archived = 1
                        OR ci.quantity > p.stock
                    )
                `,
                [
                    req.session.user.id
                ]
            );


        // Zahlung bei ungültigem Produkt verhindern
        if (
            unavailableProducts.length > 0
        ) {

            return res.status(409).json({
                message:
                    'Ein Produkt ist nicht mehr verfügbar, wurde archiviert oder ist nicht mehr in der gewünschten Menge vorhanden.'
            });
        }


    } catch (error) {

        console.error(error);


        return res.status(500).json({
            message:
                'Die Produktverfügbarkeit konnte nicht geprüft werden.'
        });


    } finally {

        if (connection) {
            await connection.end();
        }
    }


    try {

        const accessToken =
            await getPayPalAccessToken();


        // WICHTIGE KONFIGURATION:
        // PAYPAL_BASE_URL muss in der .env-Datei passend zur verwendeten
        // PayPal-Umgebung festgelegt werden (Sandbox oder Live-Betrieb).
        const response =
            await fetch(
                `${process.env.PAYPAL_BASE_URL}/v2/checkout/orders/${orderId}/capture`,
                {
                    method:
                        'POST',

                    headers: {
                        'Content-Type':
                            'application/json',

                        'Authorization':
                            `Bearer ${accessToken}`
                    }
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            console.error(data);


            return res.status(500).json({
                message:
                    'PayPal-Zahlung konnte nicht abgeschlossen werden.'
            });
        }


        res.json({
            message:
                'PayPal-Zahlung erfolgreich.',

            status:
                data.status,

            paypalOrderId:
                data.id
        });


    } catch (error) {

        console.error(error);


        res.status(500).json({
            message:
                'PayPal-Zahlung konnte nicht abgeschlossen werden.'
        });
    }
});


module.exports = router;
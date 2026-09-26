// Admin-Routen
const express = require('express');

const { mysql, dbConfig } = require('../db');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();


// Bestellstatus ändern
router.patch('/orders/:id/status', requireAdmin, async (req, res) => {

    const { status } =
        req.body;

    const orderId =
        req.params.id;


    const allowedStatus = [
        'offen',
        'in_bearbeitung',
        'versendet',
        'abgeschlossen',
        'storniert'
    ];


    if (!allowedStatus.includes(status)) {
        return res.status(400).json({
            message:
                'Ungültiger Bestellstatus.'
        });
    }


    let connection;


    try {

        connection =
            await mysql.createConnection(
                dbConfig
            );


        const [result] =
            await connection.query(
                `UPDATE orders
                 SET status = ?
                 WHERE id = ?`,
                [
                    status,
                    orderId
                ]
            );


        if (result.affectedRows === 0) {
            return res.status(404).json({
                message:
                    'Bestellung nicht gefunden.'
            });
        }


        res.json({
            message:
                'Bestellstatus aktualisiert.',

            status:
                status
        });


    } catch (error) {

        console.error(error);


        res.status(500).json({
            message:
                'Bestellstatus konnte nicht geändert werden.'
        });


    } finally {

        if (connection) {
            await connection.end();
        }
    }
});


// Rechnungsbestellung als bezahlt markieren
// Zahlungsstatus einer Rechnungsbestellung ändern
router.patch(
    '/admin/orders/:id/payment-status',
    requireAdmin,
    async (req, res) => {

        const orderId =
            Number(req.params.id);

        const { paymentStatus } =
            req.body;


        if (!Number.isInteger(orderId)) {
            return res.status(400).json({
                message:
                    'Ungültige Bestell-ID.'
            });
        }


        if (
            paymentStatus !== 'paid' &&
            paymentStatus !== 'pending'
        ) {
            return res.status(400).json({
                message:
                    'Ungültiger Zahlungsstatus.'
            });
        }


        let connection;


        try {

            connection =
                await mysql.createConnection(
                    dbConfig
                );


            const [orders] =
                await connection.query(
                    `SELECT
                        id,
                        payment_method,
                        payment_status,
                        status
                     FROM orders
                     WHERE id = ?`,
                    [orderId]
                );


            if (orders.length === 0) {
                return res.status(404).json({
                    message:
                        'Bestellung nicht gefunden.'
                });
            }


            const order =
                orders[0];


            // Nur Rechnungsbestellungen dürfen manuell geändert werden
            if (order.payment_method !== 'invoice') {
                return res.status(400).json({
                    message:
                        'Der Zahlungsstatus kann nur bei Rechnungsbestellungen manuell geändert werden.'
                });
            }


            // Stornierte Bestellungen nicht mehr ändern
            if (order.status === 'storniert') {
                return res.status(400).json({
                    message:
                        'Der Zahlungsstatus einer stornierten Bestellung kann nicht geändert werden.'
                });
            }


            if (order.payment_status === paymentStatus) {

                return res.json({
                    message:
                        'Der Zahlungsstatus ist bereits aktuell.',

                    paymentStatus:
                        paymentStatus
                });
            }


            await connection.query(
                `UPDATE orders
                 SET payment_status = ?
                 WHERE id = ?`,
                [
                    paymentStatus,
                    orderId
                ]
            );


            res.json({
                message:
                    paymentStatus === 'paid'
                        ? 'Zahlung wurde als bezahlt markiert.'
                        : 'Zahlung wurde wieder als offen markiert.',

                paymentStatus:
                    paymentStatus
            });


        } catch (error) {

            console.error(error);


            res.status(500).json({
                message:
                    'Zahlungsstatus konnte nicht geändert werden.'
            });


        } finally {

            if (connection) {
                await connection.end();
            }
        }
    }
);


// Admin-Bestellungen laden
router.get(
    '/admin/orders',
    requireAdmin,
    async (req, res) => {

        let connection;


        try {

            connection =
                await mysql.createConnection(
                    dbConfig
                );


            const [orders] =
                await connection.query(`
                    SELECT
                        o.id,
                        o.order_number,
                        o.invoice_number,
                        o.total,
                        o.status,
                        o.created_at,
                        o.full_name,
                        o.street,
                        o.postal_code,
                        o.city,
                        o.email,
                        o.payment_method,
                        o.payment_status,
                        oi.product_id,
                        oi.quantity,
                        oi.unit_price,
                        oi.product_name,
                        oi.product_image
                    FROM orders o
                    JOIN order_items oi
                        ON o.id = oi.order_id
                    ORDER BY o.created_at DESC
                `);


            res.json(orders);


        } catch (error) {

            console.error(error);


            res.status(500).json({
                message:
                    'Produktionsbestellungen konnten nicht geladen werden.'
            });


        } finally {

            if (connection) {
                await connection.end();
            }
        }
    }
);


// Neues Produkt als Admin anlegen
router.post(
    '/admin/products',
    requireAdmin,
    async (req, res) => {

        const {
            name,
            description,
            price,
            stock,
            image
        } = req.body;


        const numericPrice =
            Number(price);

        const numericStock =
            Number(stock);


        if (
            !name?.trim() ||
            !description?.trim() ||
            !image?.trim() ||
            !Number.isFinite(numericPrice) ||
            numericPrice < 0 ||
            !Number.isInteger(numericStock) ||
            numericStock < 0
        ) {
            return res.status(400).json({
                message:
                    'Bitte alle Produktdaten gültig eingeben.'
            });
        }


        let connection;


        try {

            connection =
                await mysql.createConnection(
                    dbConfig
                );


            const [result] =
                await connection.query(
                    `INSERT INTO products
                    (
                        name,
                        description,
                        price,
                        image,
                        stock,
                        is_available,
                        show_on_homepage,
                        homepage_position
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        name.trim(),
                        description.trim(),
                        numericPrice,
                        image.trim(),
                        numericStock,
                        true,
                        false,
                        null
                    ]
                );


            res.status(201).json({
                message:
                    'Produkt wurde erstellt.',

                productId:
                    result.insertId
            });


        } catch (error) {

            console.error(error);


            res.status(500).json({
                message:
                    'Produkt konnte nicht erstellt werden.'
            });


        } finally {

            if (connection) {
                await connection.end();
            }
        }
    }
);


// Produktdaten als Admin bearbeiten
router.patch(
    '/admin/products/:id',
    requireAdmin,
    async (req, res) => {

        const productId =
            Number(req.params.id);


        const {
            name,
            description,
            price,
            stock,
            image
        } = req.body;


        const numericPrice =
            Number(price);

        const numericStock =
            Number(stock);


        if (
            !Number.isInteger(productId) ||
            !name?.trim() ||
            !description?.trim() ||
            !image?.trim() ||
            !Number.isFinite(numericPrice) ||
            numericPrice < 0 ||
            !Number.isInteger(numericStock) ||
            numericStock < 0
        ) {
            return res.status(400).json({
                message:
                    'Bitte alle Produktdaten gültig eingeben.'
            });
        }


        let connection;


        try {

            connection =
                await mysql.createConnection(
                    dbConfig
                );


            const [result] =
                await connection.query(
                    `UPDATE products
                     SET name = ?,
                         description = ?,
                         price = ?,
                         image = ?,
                         stock = ?
                     WHERE id = ?`,
                    [
                        name.trim(),
                        description.trim(),
                        numericPrice,
                        image.trim(),
                        numericStock,
                        productId
                    ]
                );


            if (result.affectedRows === 0) {
                return res.status(404).json({
                    message:
                        'Produkt nicht gefunden.'
                });
            }


            res.json({
                message:
                    'Produkt wurde aktualisiert.'
            });


        } catch (error) {

            console.error(error);


            res.status(500).json({
                message:
                    'Produkt konnte nicht aktualisiert werden.'
            });


        } finally {

            if (connection) {
                await connection.end();
            }
        }
    }
);


// Produktverfügbarkeit ändern
router.patch(
    '/admin/products/:id/availability',
    requireAdmin,
    async (req, res) => {

        const productId =
            Number(req.params.id);

        const { isAvailable } =
            req.body;


        if (!Number.isInteger(productId)) {
            return res.status(400).json({
                message:
                    'Ungültige Produkt-ID.'
            });
        }


        if (typeof isAvailable !== 'boolean') {
            return res.status(400).json({
                message:
                    'Ungültiger Verfügbarkeitsstatus.'
            });
        }


        let connection;


        try {

            connection =
                await mysql.createConnection(
                    dbConfig
                );


            const [result] =
                await connection.query(
                    `UPDATE products
                     SET is_available = ?
                     WHERE id = ?`,
                    [
                        isAvailable,
                        productId
                    ]
                );


            if (result.affectedRows === 0) {
                return res.status(404).json({
                    message:
                        'Produkt nicht gefunden.'
                });
            }


            res.json({
                message:
                    'Produktverfügbarkeit wurde aktualisiert.',

                isAvailable:
                    isAvailable
            });


        } catch (error) {

            console.error(error);


            res.status(500).json({
                message:
                    'Produktverfügbarkeit konnte nicht geändert werden.'
            });


        } finally {

            if (connection) {
                await connection.end();
            }
        }
    }
);


// Produktbestand ändern
router.patch(
    '/admin/products/:id/stock',
    requireAdmin,
    async (req, res) => {

        const productId =
            Number(req.params.id);

        const stock =
            Number(req.body.stock);


        if (!Number.isInteger(productId)) {
            return res.status(400).json({
                message:
                    'Ungültige Produkt-ID.'
            });
        }


        if (
            !Number.isInteger(stock) ||
            stock < 0
        ) {
            return res.status(400).json({
                message:
                    'Ungültiger Bestand.'
            });
        }


        let connection;


        try {

            connection =
                await mysql.createConnection(
                    dbConfig
                );


            const [result] =
                await connection.query(
                    `UPDATE products
                     SET stock = ?
                     WHERE id = ?`,
                    [
                        stock,
                        productId
                    ]
                );


            if (result.affectedRows === 0) {
                return res.status(404).json({
                    message:
                        'Produkt nicht gefunden.'
                });
            }


            res.json({
                message:
                    'Produktbestand wurde aktualisiert.',

                stock:
                    stock
            });


        } catch (error) {

            console.error(error);


            res.status(500).json({
                message:
                    'Produktbestand konnte nicht geändert werden.'
            });


        } finally {

            if (connection) {
                await connection.end();
            }
        }
    }
);


// Zusätzliche Produktbilder speichern
router.patch(
    '/admin/products/:id/images',
    requireAdmin,
    async (req, res) => {

        const productId =
            Number(req.params.id);

        const { images } =
            req.body;


        if (
            !Number.isInteger(productId) ||
            !Array.isArray(images)
        ) {
            return res.status(400).json({
                message:
                    'Ungültige Produktbilder.'
            });
        }


        const cleanImages =
            images
                .map(image =>
                    String(image).trim()
                )
                .filter(image =>
                    image.length > 0
                );


        let connection;


        try {

            connection =
                await mysql.createConnection(
                    dbConfig
                );


            const [products] =
                await connection.query(
                    `SELECT id
                     FROM products
                     WHERE id = ?`,
                    [productId]
                );


            if (products.length === 0) {
                return res.status(404).json({
                    message:
                        'Produkt nicht gefunden.'
                });
            }


            await connection.beginTransaction();


            await connection.query(
                `DELETE FROM product_images
                 WHERE product_id = ?`,
                [productId]
            );


            for (
                let i = 0;
                i < cleanImages.length;
                i++
            ) {

                await connection.query(
                    `INSERT INTO product_images
                    (
                        product_id,
                        image_url,
                        sort_order
                    )
                    VALUES (?, ?, ?)`,
                    [
                        productId,
                        cleanImages[i],
                        i
                    ]
                );
            }


            await connection.commit();


            res.json({
                message:
                    'Produktbilder wurden aktualisiert.'
            });


        } catch (error) {

            if (connection) {

                try {
                    await connection.rollback();
                } catch (rollbackError) {
                    console.error(
                        rollbackError
                    );
                }
            }


            console.error(error);


            res.status(500).json({
                message:
                    'Produktbilder konnten nicht gespeichert werden.'
            });


        } finally {

            if (connection) {
                await connection.end();
            }
        }
    }
);


// Alle Produkte für den Admin laden
router.get(
    '/admin/products',
    requireAdmin,
    async (req, res) => {

        let connection;


        try {

            connection =
                await mysql.createConnection(
                    dbConfig
                );


            const [products] =
                await connection.query(
                    `SELECT *
                     FROM products
                     ORDER BY
                        is_archived ASC,
                        show_on_homepage DESC,
                        homepage_position ASC,
                        id ASC`
                );


            res.json(products);


        } catch (error) {

            console.error(error);


            res.status(500).json({
                message:
                    'Produkte konnten nicht geladen werden.'
            });


        } finally {

            if (connection) {
                await connection.end();
            }
        }
    }
);


// Startseitenposition eines Produkts ändern
router.patch(
    '/admin/products/:id/homepage',
    requireAdmin,
    async (req, res) => {

        const productId =
            Number(req.params.id);

        const rawPosition =
            req.body.position;

        const position =
            rawPosition === null
                ? null
                : Number(rawPosition);


        if (!Number.isInteger(productId)) {
            return res.status(400).json({
                message:
                    'Ungültige Produkt-ID.'
            });
        }


        if (
            position !== null &&
            ![1, 2, 3].includes(position)
        ) {
            return res.status(400).json({
                message:
                    'Die Startseitenposition muss 1, 2 oder 3 sein.'
            });
        }


        let connection;


        try {

            connection =
                await mysql.createConnection(
                    dbConfig
                );


            const [products] =
                await connection.query(
                    `SELECT
                        id,
                        is_archived,
                        show_on_homepage,
                        homepage_position
                     FROM products
                     WHERE id = ?`,
                    [productId]
                );


            if (products.length === 0) {
                return res.status(404).json({
                    message:
                        'Produkt nicht gefunden.'
                });
            }


            const product =
                products[0];


            if (
                position !== null &&
                product.is_archived
            ) {
                return res.status(409).json({
                    message:
                        'Archivierte Produkte können nicht auf der Startseite angezeigt werden.'
                });
            }


            await connection.beginTransaction();


            if (position === null) {

                await connection.query(
                    `UPDATE products
                     SET show_on_homepage = FALSE,
                         homepage_position = NULL
                     WHERE id = ?`,
                    [productId]
                );


                await connection.commit();


                return res.json({
                    message:
                        'Produkt wurde von der Startseite entfernt.',

                    position:
                        null
                });
            }


            const oldPosition =
                product.homepage_position === null
                    ? null
                    : Number(
                        product.homepage_position
                    );


            const [positionProducts] =
                await connection.query(
                    `SELECT
                        id,
                        homepage_position
                     FROM products
                     WHERE show_on_homepage = TRUE
                     AND is_archived = FALSE
                     AND homepage_position = ?
                     AND id <> ?
                     LIMIT 1`,
                    [
                        position,
                        productId
                    ]
                );


            const occupyingProduct =
                positionProducts.length > 0
                    ? positionProducts[0]
                    : null;


            if (occupyingProduct) {

                if (oldPosition !== null) {

                    await connection.query(
                        `UPDATE products
                         SET homepage_position = ?
                         WHERE id = ?`,
                        [
                            oldPosition,
                            occupyingProduct.id
                        ]
                    );

                } else {

                    await connection.query(
                        `UPDATE products
                         SET show_on_homepage = FALSE,
                             homepage_position = NULL
                         WHERE id = ?`,
                        [
                            occupyingProduct.id
                        ]
                    );
                }
            }


            await connection.query(
                `UPDATE products
                 SET show_on_homepage = TRUE,
                     homepage_position = ?
                 WHERE id = ?`,
                [
                    position,
                    productId
                ]
            );


            await connection.commit();


            res.json({
                message:
                    `Produkt wurde auf Position ${position} gesetzt.`,

                position:
                    position
            });


        } catch (error) {

            if (connection) {

                try {
                    await connection.rollback();
                } catch (rollbackError) {
                    console.error(
                        rollbackError
                    );
                }
            }


            console.error(error);


            res.status(500).json({
                message:
                    'Startseitenposition konnte nicht geändert werden.'
            });


        } finally {

            if (connection) {
                await connection.end();
            }
        }
    }
);


// Produkt archivieren
router.patch(
    '/admin/products/:id/archive',
    requireAdmin,
    async (req, res) => {

        const productId =
            Number(req.params.id);


        if (!Number.isInteger(productId)) {
            return res.status(400).json({
                message:
                    'Ungültige Produkt-ID.'
            });
        }


        let connection;


        try {

            connection =
                await mysql.createConnection(
                    dbConfig
                );


            const [result] =
                await connection.query(
                    `UPDATE products
                     SET is_archived = TRUE,
                         show_on_homepage = FALSE,
                         homepage_position = NULL
                     WHERE id = ?`,
                    [productId]
                );


            if (result.affectedRows === 0) {
                return res.status(404).json({
                    message:
                        'Produkt nicht gefunden.'
                });
            }


            res.json({
                message:
                    'Produkt wurde archiviert.'
            });


        } catch (error) {

            console.error(error);


            res.status(500).json({
                message:
                    'Produkt konnte nicht archiviert werden.'
            });


        } finally {

            if (connection) {
                await connection.end();
            }
        }
    }
);


// Archiviertes Produkt wiederherstellen
router.patch(
    '/admin/products/:id/restore',
    requireAdmin,
    async (req, res) => {

        const productId =
            Number(req.params.id);


        if (!Number.isInteger(productId)) {
            return res.status(400).json({
                message:
                    'Ungültige Produkt-ID.'
            });
        }


        let connection;


        try {

            connection =
                await mysql.createConnection(
                    dbConfig
                );


            const [result] =
                await connection.query(
                    `UPDATE products
                     SET is_archived = FALSE
                     WHERE id = ?`,
                    [productId]
                );


            if (result.affectedRows === 0) {
                return res.status(404).json({
                    message:
                        'Produkt nicht gefunden.'
                });
            }


            res.json({
                message:
                    'Produkt wurde wiederhergestellt.'
            });


        } catch (error) {

            console.error(error);


            res.status(500).json({
                message:
                    'Produkt konnte nicht wiederhergestellt werden.'
            });


        } finally {

            if (connection) {
                await connection.end();
            }
        }
    }
);


module.exports = router;
// Warenkorb-Routen
const express = require('express');
const { mysql, dbConfig } = require('../db');
const { requireLogin } = require('../middleware/auth');

const router = express.Router();


// Warenkorb laden
router.get('/', requireLogin, async (req, res) => {
    let connection;

    try {
        connection =
            await mysql.createConnection(dbConfig);

        const [items] =
            await connection.query(
                `SELECT
                    ci.product_id AS id,
                    ci.quantity,
                    p.name,
                    p.price,
                    p.image,
                    p.is_available,
                    p.is_archived,
                    p.stock
                FROM cart_items ci
                JOIN products p
                    ON ci.product_id = p.id
                WHERE ci.user_id = ?
                ORDER BY ci.id ASC`,
                [req.session.user.id]
            );

        res.json(items);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message:
                'Warenkorb konnte nicht geladen werden.'
        });

    } finally {
        if (connection) {
            await connection.end();
        }
    }
});


// Produkt hinzufügen
router.post('/', requireLogin, async (req, res) => {
    const productId =
        Number(req.body.productId);

    const quantity =
        Number(req.body.quantity);

    if (
        !Number.isInteger(productId) ||
        !Number.isInteger(quantity) ||
        quantity < 1
    ) {
        return res.status(400).json({
            message:
                'Ungültige Warenkorb-Daten.'
        });
    }

    let connection;

    try {
        connection =
            await mysql.createConnection(dbConfig);

        const [products] =
            await connection.query(
                `SELECT
                    id,
                    stock,
                    is_available,
                    is_archived
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


        // Archivierte Produkte können nicht gekauft werden
        if (products[0].is_archived) {
            return res.status(409).json({
                message:
                    'Dieses Produkt ist nicht mehr verfügbar.'
            });
        }


        if (!products[0].is_available) {
            return res.status(409).json({
                message:
                    'Dieses Produkt ist momentan nicht verfügbar.'
            });
        }


        // Bereits vorhandene Menge im Warenkorb prüfen
        const [cartItems] =
            await connection.query(
                `SELECT quantity
                FROM cart_items
                WHERE user_id = ?
                AND product_id = ?`,
                [
                    req.session.user.id,
                    productId
                ]
            );

        const currentQuantity =
            cartItems.length > 0
                ? Number(
                    cartItems[0].quantity
                )
                : 0;


        if (
            currentQuantity + quantity >
            products[0].stock
        ) {
            return res.status(409).json({
                message:
                    `Es sind nur noch ${products[0].stock} Stück verfügbar.`
            });
        }


        await connection.query(
            `INSERT INTO cart_items
            (
                user_id,
                product_id,
                quantity
            )
            VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE
            quantity = quantity + VALUES(quantity)`,
            [
                req.session.user.id,
                productId,
                quantity
            ]
        );


        res.json({
            message:
                'Produkt wurde zum Warenkorb hinzugefügt.'
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message:
                'Produkt konnte nicht zum Warenkorb hinzugefügt werden.'
        });

    } finally {
        if (connection) {
            await connection.end();
        }
    }
});


// Produkt entfernen
router.delete('/:productId', requireLogin, async (req, res) => {
    const productId =
        Number(req.params.productId);

    let connection;

    try {
        connection =
            await mysql.createConnection(dbConfig);

        await connection.query(
            `DELETE FROM cart_items
            WHERE user_id = ?
            AND product_id = ?`,
            [
                req.session.user.id,
                productId
            ]
        );


        res.json({
            message:
                'Produkt wurde aus dem Warenkorb entfernt.'
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message:
                'Produkt konnte nicht entfernt werden.'
        });

    } finally {
        if (connection) {
            await connection.end();
        }
    }
});


// Menge ändern
router.patch('/:productId', requireLogin, async (req, res) => {
    const productId =
        Number(req.params.productId);

    const quantity =
        Number(req.body.quantity);

    if (
        !Number.isInteger(productId) ||
        !Number.isInteger(quantity) ||
        quantity < 1
    ) {
        return res.status(400).json({
            message:
                'Ungültige Menge.'
        });
    }

    let connection;

    try {
        connection =
            await mysql.createConnection(dbConfig);


        // Aktuellen Produktbestand und Status prüfen
        const [products] =
            await connection.query(
                `SELECT
                    stock,
                    is_available,
                    is_archived
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


        // Archivierte Produkte können nicht geändert werden
        if (products[0].is_archived) {
            return res.status(409).json({
                message:
                    'Dieses Produkt ist nicht mehr verfügbar.'
            });
        }


        if (!products[0].is_available) {
            return res.status(409).json({
                message:
                    'Dieses Produkt ist momentan nicht verfügbar.'
            });
        }


        if (quantity > products[0].stock) {
            return res.status(409).json({
                message:
                    `Es sind nur noch ${products[0].stock} Stück verfügbar.`
            });
        }


        const [result] =
            await connection.query(
                `UPDATE cart_items
                SET quantity = ?
                WHERE user_id = ?
                AND product_id = ?`,
                [
                    quantity,
                    req.session.user.id,
                    productId
                ]
            );


        if (result.affectedRows === 0) {
            return res.status(404).json({
                message:
                    'Produkt nicht im Warenkorb gefunden.'
            });
        }


        res.json({
            message:
                'Menge wurde aktualisiert.'
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message:
                'Menge konnte nicht geändert werden.'
        });

    } finally {
        if (connection) {
            await connection.end();
        }
    }
});


module.exports = router;
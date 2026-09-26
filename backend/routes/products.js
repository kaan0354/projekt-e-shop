// Produkt-Routen
const express = require('express');
const { mysql, dbConfig } = require('../db');

const router = express.Router();


// Alle nicht archivierten Produkte abrufen
router.get('/', async (req, res) => {
    let connection;

    try {
        connection =
            await mysql.createConnection(dbConfig);

        const [products] =
            await connection.query(
                `SELECT *
                 FROM products
                 WHERE is_archived = FALSE`
            );

        res.json(products);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message:
                'Produkte konnten nicht geladen werden'
        });

    } finally {
        if (connection) {
            await connection.end();
        }
    }
});


// Einzelnes nicht archiviertes Produkt mit zusätzlichen Bildern abrufen
router.get('/:id', async (req, res) => {
    const productId =
        Number(req.params.id);

    if (!Number.isInteger(productId)) {
        return res.status(400).json({
            message:
                'Ungültige Produkt-ID'
        });
    }

    let connection;

    try {
        connection =
            await mysql.createConnection(dbConfig);

        const [products] =
            await connection.query(
                `SELECT *
                 FROM products
                 WHERE id = ?
                 AND is_archived = FALSE`,
                [productId]
            );

        if (products.length === 0) {
            return res.status(404).json({
                message:
                    'Produkt nicht gefunden'
            });
        }

        // Zusätzliche Produktbilder laden
        const [images] =
            await connection.query(
                `SELECT
                    id,
                    image_url,
                    sort_order
                 FROM product_images
                 WHERE product_id = ?
                 ORDER BY sort_order ASC, id ASC`,
                [productId]
            );

        const product =
            products[0];

        product.additional_images =
            images.map(image => ({
                id: image.id,
                image_url: image.image_url,
                sort_order: image.sort_order
            }));

        res.json(product);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message:
                'Produkt konnte nicht geladen werden'
        });

    } finally {
        if (connection) {
            await connection.end();
        }
    }
});


// Router exportieren
module.exports = router;
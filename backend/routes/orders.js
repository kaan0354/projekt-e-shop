// Bestell-Routen
const express = require('express');
const path = require('path');

const { mysql, dbConfig } = require('../db');
const { requireLogin } = require('../middleware/auth');
const transporter = require('../services/mail');
const { getPayPalAccessToken } = require('../services/paypal');
const { createInvoicePdf } = require('../services/invoice');

const {
    createCustomerMail,
    escapeHtml
} = require('../services/mailTemplate');

const router = express.Router();


// KONFIGURATION: Shopname vor Inbetriebnahme anpassen
const SHOP_NAME = 'MusterShop';

// KONFIGURATION: Bankname für Rechnungskauf vor Inbetriebnahme anpassen
const BANK_NAME = 'Musterbank';

// KONFIGURATION: Kontoinhaber für Rechnungskauf vor Inbetriebnahme anpassen
const ACCOUNT_HOLDER = 'Muster GmbH';

// KONFIGURATION: IBAN für Rechnungskauf vor Inbetriebnahme anpassen
const IBAN = 'DE12 3123 1231 2312 3123 12';

// KONFIGURATION: BIC für Rechnungskauf vor Inbetriebnahme anpassen
const BIC = 'MUSTDE12XXX';

// KONFIGURATION: Zahlungsziel für Rechnungskauf vor Inbetriebnahme anpassen
const PAYMENT_DAYS = 14;


// Bestellung erstellen
router.post('/', requireLogin, async (req, res) => {

    const {
        items,
        fullName,
        street,
        postalCode,
        city,
        email,
        paypalOrderId,
        paymentMethod
    } = req.body;


    if (
        !fullName ||
        !street ||
        !postalCode ||
        !city ||
        !email
    ) {
        return res.status(400).json({
            message:
                'Bitte alle Lieferdaten ausfüllen.'
        });
    }


    const cleanFullName =
        String(fullName).trim();

    const cleanStreet =
        String(street).trim();

    const cleanPostalCode =
        String(postalCode).trim();

    const cleanCity =
        String(city).trim();

    const cleanEmail =
        String(email)
            .trim()
            .toLowerCase();


    if (
        cleanFullName.length < 3 ||
        !cleanFullName.includes(' ')
    ) {
        return res.status(400).json({
            message:
                'Bitte gib deinen Vor- und Nachnamen ein.'
        });
    }


    if (
        cleanStreet.length < 3 ||
        !/[a-zA-ZäöüÄÖÜß]/.test(cleanStreet) ||
        !/\d/.test(cleanStreet)
    ) {
        return res.status(400).json({
            message:
                'Bitte gib eine gültige Straße mit Hausnummer ein.'
        });
    }


    if (!/^\d{5}$/.test(cleanPostalCode)) {
        return res.status(400).json({
            message:
                'Die PLZ muss aus genau 5 Ziffern bestehen.'
        });
    }


    if (
        cleanCity.length < 2 ||
        !/[a-zA-ZäöüÄÖÜß]/.test(cleanCity)
    ) {
        return res.status(400).json({
            message:
                'Bitte gib einen gültigen Ort ein.'
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


    // Zahlungsart prüfen
    if (
        paymentMethod !== 'paypal' &&
        paymentMethod !== 'invoice'
    ) {
        return res.status(400).json({
            message:
                'Ungültige Zahlungsart.'
        });
    }


    if (
        paymentMethod === 'paypal' &&
        !paypalOrderId
    ) {
        return res.status(400).json({
            message:
                'Keine bestätigte PayPal-Zahlung vorhanden.'
        });
    }


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


        await connection.beginTransaction();


        let total = 0;

        const checkedItems = [];


        for (const item of items) {

            const quantity =
                Number(item.quantity);


            if (
                !Number.isInteger(quantity) ||
                quantity < 1
            ) {
                throw new Error(
                    'Ungültige Menge.'
                );
            }


            // Produktdaten laden
            const [products] =
                await connection.query(
                    `SELECT
                        id,
                        name,
                        image,
                        price,
                        stock,
                        is_available,
                        is_archived
                    FROM products
                    WHERE id = ?
                    FOR UPDATE`,
                    [
                        item.productId
                    ]
                );


            if (products.length === 0) {
                throw new Error(
                    'Produkt nicht gefunden.'
                );
            }


            const product =
                products[0];


            if (product.is_archived) {
                throw new Error(
                    `${product.name} ist nicht mehr verfügbar.`
                );
            }


            if (!product.is_available) {
                throw new Error(
                    'Ein Produkt ist momentan nicht verfügbar.'
                );
            }


            if (quantity > product.stock) {
                throw new Error(
                    `Für ${product.name} sind nur noch ${product.stock} Stück verfügbar.`
                );
            }


            const price =
                Number(product.price);


            total +=
                price * quantity;


            checkedItems.push({
                productId:
                    product.id,

                name:
                    product.name,

                image:
                    product.image,

                quantity:
                    quantity,

                unitPrice:
                    price
            });
        }


        total =
            Number(
                total.toFixed(2)
            );


        // PayPal-Zahlung prüfen
        if (paymentMethod === 'paypal') {

            const accessToken =
                await getPayPalAccessToken();


            // WICHTIGE KONFIGURATION:
            // PAYPAL_BASE_URL muss in der .env-Datei passend zur verwendeten
            // PayPal-Umgebung festgelegt werden (Sandbox oder Live-Betrieb).
            const paypalCheckResponse =
                await fetch(
                    `${process.env.PAYPAL_BASE_URL}/v2/checkout/orders/${paypalOrderId}`,
                    {
                        method:
                            'GET',

                        headers: {
                            'Authorization':
                                `Bearer ${accessToken}`
                        }
                    }
                );


            const paypalOrder =
                await paypalCheckResponse.json();


            if (
                !paypalCheckResponse.ok ||
                paypalOrder.status !== 'COMPLETED'
            ) {
                throw new Error(
                    'PayPal-Zahlung ist nicht abgeschlossen.'
                );
            }


            const paypalCapture =
                paypalOrder
                    .purchase_units?.[0]
                    ?.payments?.captures?.[0];


            if (!paypalCapture) {
                throw new Error(
                    'Keine PayPal-Zahlung gefunden.'
                );
            }


            const paypalAmount =
                Number(
                    paypalCapture.amount.value
                );


            const paypalCurrency =
                paypalCapture
                    .amount
                    .currency_code;


            // KONFIGURATION: Shop-Währung bei Bedarf anpassen
            if (paypalCurrency !== 'EUR') {
                throw new Error(
                    'Ungültige PayPal-Währung.'
                );
            }


            if (
                Math.abs(
                    paypalAmount - total
                ) > 0.001
            ) {
                throw new Error(
                    'PayPal-Betrag stimmt nicht mit der Bestellung überein.'
                );
            }
        }


        // Zahlungsstatus festlegen
        const paymentStatus =
            paymentMethod === 'invoice'
                ? 'pending'
                : 'paid';


        // Bestellung speichern
        const [orderResult] =
            await connection.query(
                `INSERT INTO orders
                (
                    user_id,
                    total,
                    status,
                    full_name,
                    street,
                    postal_code,
                    city,
                    email,
                    paypal_order_id,
                    payment_method,
                    payment_status
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    req.session.user.id,
                    total,
                    'offen',
                    cleanFullName,
                    cleanStreet,
                    cleanPostalCode,
                    cleanCity,
                    cleanEmail,
                    paymentMethod === 'paypal'
                        ? paypalOrderId
                        : null,
                    paymentMethod,
                    paymentStatus
                ]
            );


        const orderId =
            orderResult.insertId;


        // KONFIGURATION: Format der Bestellnummer bei Bedarf anpassen
        const orderNumber =
            `ORD-${orderId}`;


        // KONFIGURATION: Format der Rechnungsnummer bei Bedarf anpassen
        const invoiceNumber =
            `RE-${new Date().getFullYear()}-${String(
                orderId
            ).padStart(4, '0')}`;


        await connection.query(
            `UPDATE orders
             SET
                order_number = ?,
                invoice_number = ?
             WHERE id = ?`,
            [
                orderNumber,
                invoiceNumber,
                orderId
            ]
        );


        // Bestellpositionen speichern
        for (const item of checkedItems) {

            await connection.query(
                `INSERT INTO order_items
                (
                    order_id,
                    product_id,
                    product_name,
                    product_image,
                    quantity,
                    unit_price
                )
                VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    orderId,
                    item.productId,
                    item.name,
                    item.image,
                    item.quantity,
                    item.unitPrice
                ]
            );


            // Bestand reduzieren
            await connection.query(
                `UPDATE products
                 SET stock = stock - ?
                 WHERE id = ?`,
                [
                    item.quantity,
                    item.productId
                ]
            );
        }


        // Warenkorb leeren
        await connection.query(
            `DELETE FROM cart_items
             WHERE user_id = ?`,
            [
                req.session.user.id
            ]
        );


        await connection.commit();


        const productsText =
            checkedItems
                .map(
                    item =>
                        `${item.quantity}x ${item.name}`
                )
                .join('\n');


        const paymentText =
            paymentMethod === 'invoice'
                ? 'Kauf auf Rechnung'
                : 'PayPal';


        const paymentStatusText =
            paymentStatus === 'paid'
                ? 'Bezahlt'
                : 'Zahlung offen';


        // PDF-Rechnung erstellen
        const invoicePdf =
            await createInvoicePdf({
                orderNumber:
                    orderNumber,

                invoiceNumber:
                    invoiceNumber,

                fullName:
                    cleanFullName,

                street:
                    cleanStreet,

                postalCode:
                    cleanPostalCode,

                city:
                    cleanCity,

                items:
                    checkedItems,

                total:
                    total,

                paymentMethod:
                    paymentMethod
            });


        // Produktion informieren
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
                `Neue Bestellung ${orderNumber}`,

            text: `
Neue Bestellung eingegangen.

Bestellnummer: ${orderNumber}
Rechnungsnummer: ${invoiceNumber}
Kunde: ${cleanFullName}
E-Mail: ${cleanEmail}

Lieferadresse:
${cleanStreet}
${cleanPostalCode} ${cleanCity}

Produkte:
${productsText}

Gesamtpreis: ${total.toFixed(2)} €
Zahlungsart: ${paymentText}
Zahlungsstatus: ${paymentStatusText}
Status: offen
            `
        });


        // Produkte für Kundenmail
        const productsHtml =
            checkedItems
                .map(
                    item => `
                        <tr>
                            <td style="
                                padding: 10px 0;
                                border-bottom: 1px solid #eeeeee;
                            ">
                                ${escapeHtml(item.quantity)}x
                                ${escapeHtml(item.name)}
                            </td>

                            <td style="
                                padding: 10px 0;
                                border-bottom: 1px solid #eeeeee;
                                text-align: right;
                            ">
                                ${Number(
                                    item.unitPrice * item.quantity
                                ).toFixed(2).replace('.', ',')} €
                            </td>
                        </tr>
                    `
                )
                .join('');


        // Zahlungsinformationen für Kundenmail
        const paymentHtml =
            paymentMethod === 'invoice'
                ? `
                    <div style="
                        margin-top: 24px;
                        padding: 18px;
                        background: #f6f6f6;
                        border: 1px solid #e5e5e5;
                        border-radius: 8px;
                        color: #222222;
                        font-size: 14px;
                        line-height: 1.7;
                    ">

                        <strong>
                            Zahlung per Rechnung
                        </strong>

                        <br><br>

                        Bitte überweise den Rechnungsbetrag innerhalb von
                        <strong>${PAYMENT_DAYS} Tagen</strong>.

                        <br><br>

                        Kontoinhaber:
                        ${escapeHtml(ACCOUNT_HOLDER)}

                        <br>

                        Bank:
                        ${escapeHtml(BANK_NAME)}

                        <br>

                        IBAN:
                        ${escapeHtml(IBAN)}

                        <br>

                        BIC:
                        ${escapeHtml(BIC)}

                        <br><br>

                        <strong>
                            Verwendungszweck:
                        </strong>

                        <br>

                        ${escapeHtml(orderNumber)}
                        /
                        ${escapeHtml(invoiceNumber)}

                        <br><br>

                        Erfolgt innerhalb dieser Frist kein Zahlungseingang,
                        kann die Bestellung storniert werden.

                        <br><br>

                        Die weitere Bearbeitung bzw. der Versand erfolgt
                        nach Eingang der Zahlung.

                    </div>
                `
                : `
                    <div style="
                        margin-top: 24px;
                        padding: 18px;
                        background: #f6f6f6;
                        border: 1px solid #e5e5e5;
                        border-radius: 8px;
                        color: #222222;
                        font-size: 14px;
                        line-height: 1.7;
                    ">

                        <strong>
                            Zahlung per PayPal
                        </strong>

                        <br><br>

                        Deine Zahlung wurde erfolgreich abgeschlossen.

                    </div>
                `;


        // Bestellbestätigung an Kunden
        await transporter.sendMail({

            // WICHTIGE KONFIGURATION:
            // MAIL_USER muss in der .env-Datei festgelegt werden.
            from:
                process.env.MAIL_USER,

            to:
                cleanEmail,

            subject:
                `Bestellbestätigung ${orderNumber}`,

            html:
                createCustomerMail({

                    title:
                        'Vielen Dank für deine Bestellung!',

                    greeting:
                        `Hallo ${cleanFullName},`,

                    intro:
                        `deine Bestellung bei ${SHOP_NAME} ist erfolgreich bei uns eingegangen.`,

                    content: `

                        <table
                            role="presentation"
                            width="100%"
                            cellspacing="0"
                            cellpadding="0"
                            style="
                                border-collapse: collapse;
                                font-size: 14px;
                                color: #222222;
                            "
                        >

                            <tr>
                                <td style="
                                    padding: 9px 0;
                                    border-bottom: 1px solid #eeeeee;
                                ">
                                    <strong>Bestellnummer</strong>
                                </td>

                                <td style="
                                    padding: 9px 0;
                                    border-bottom: 1px solid #eeeeee;
                                    text-align: right;
                                ">
                                    ${escapeHtml(orderNumber)}
                                </td>
                            </tr>


                            <tr>
                                <td style="
                                    padding: 9px 0;
                                    border-bottom: 1px solid #eeeeee;
                                ">
                                    <strong>Rechnungsnummer</strong>
                                </td>

                                <td style="
                                    padding: 9px 0;
                                    border-bottom: 1px solid #eeeeee;
                                    text-align: right;
                                ">
                                    ${escapeHtml(invoiceNumber)}
                                </td>
                            </tr>


                            <tr>
                                <td style="
                                    padding: 9px 0;
                                    border-bottom: 1px solid #eeeeee;
                                ">
                                    <strong>Zahlungsart</strong>
                                </td>

                                <td style="
                                    padding: 9px 0;
                                    border-bottom: 1px solid #eeeeee;
                                    text-align: right;
                                ">
                                    ${escapeHtml(paymentText)}
                                </td>
                            </tr>


                            <tr>
                                <td style="
                                    padding: 9px 0;
                                ">
                                    <strong>Zahlungsstatus</strong>
                                </td>

                                <td style="
                                    padding: 9px 0;
                                    text-align: right;
                                ">
                                    ${escapeHtml(paymentStatusText)}
                                </td>
                            </tr>

                        </table>


                        <h2 style="
                            margin: 28px 0 8px;
                            font-size: 17px;
                            color: #111111;
                        ">
                            Deine Bestellung
                        </h2>


                        <table
                            role="presentation"
                            width="100%"
                            cellspacing="0"
                            cellpadding="0"
                            style="
                                border-collapse: collapse;
                                font-size: 14px;
                                color: #222222;
                            "
                        >

                            ${productsHtml}


                            <tr>
                                <td style="
                                    padding: 14px 0;
                                    font-weight: 700;
                                ">
                                    Gesamtbetrag
                                </td>

                                <td style="
                                    padding: 14px 0;
                                    text-align: right;
                                    font-weight: 700;
                                ">
                                    ${total
                                        .toFixed(2)
                                        .replace('.', ',')} €
                                </td>
                            </tr>

                        </table>


                        ${paymentHtml}


                        <h2 style="
                            margin: 28px 0 8px;
                            font-size: 17px;
                            color: #111111;
                        ">
                            Lieferadresse
                        </h2>


                        <p style="
                            margin: 0;
                            color: #333333;
                            font-size: 14px;
                            line-height: 1.7;
                        ">
                            ${escapeHtml(cleanFullName)}
                            <br>

                            ${escapeHtml(cleanStreet)}
                            <br>

                            ${escapeHtml(cleanPostalCode)}
                            ${escapeHtml(cleanCity)}
                        </p>


                        <p style="
                            margin: 24px 0 0;
                            color: #333333;
                            font-size: 14px;
                            line-height: 1.6;
                        ">
                            Deine Rechnung, die AGB und die
                            Widerrufsbelehrung findest du im Anhang
                            dieser E-Mail.

                            Den aktuellen Stand deiner Bestellung
                            kannst du in deinem Kundenkonto unter
                            „Bestellungen“ einsehen.
                        </p>
                    `
                }),


            // Rechnung und rechtliche Dokumente anhängen
            attachments: [

                {
                    filename:
                        `${invoiceNumber}.pdf`,

                    content:
                        invoicePdf,

                    contentType:
                        'application/pdf'
                },


                {
                    // KONFIGURATION: AGB-PDF nach Änderungen der AGB aktualisieren
                    filename:
                        'AGB.pdf',

                    path:
                        path.join(
                            __dirname,
                            '../documents/AGB.pdf'
                        ),

                    contentType:
                        'application/pdf'
                },


                {
                    // KONFIGURATION: PDF nach Änderungen der Widerrufsbelehrung aktualisieren
                    filename:
                        'Widerrufsbelehrung.pdf',

                    path:
                        path.join(
                            __dirname,
                            '../documents/Widerrufsbelehrung.pdf'
                        ),

                    contentType:
                        'application/pdf'
                }
            ]
        });


        res.status(201).json({

            message:
                'Bestellung erfolgreich erstellt!',

            orderNumber:
                orderNumber,

            invoiceNumber:
                invoiceNumber,

            paymentMethod:
                paymentMethod,

            paymentStatus:
                paymentStatus,

            total:
                total
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
                'Bestellung konnte nicht erstellt werden.'
        });


    } finally {

        if (connection) {
            await connection.end();
        }
    }
});


// Eigene Bestellungen laden
router.get('/', requireLogin, async (req, res) => {

    let connection;


    try {

        connection =
            await mysql.createConnection(
                dbConfig
            );


        const [orders] =
            await connection.query(
                `SELECT
                    o.id,
                    o.order_number,
                    o.invoice_number,
                    o.total,
                    o.status,
                    o.created_at,
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
                WHERE o.user_id = ?
                ORDER BY o.created_at DESC`,
                [
                    req.session.user.id
                ]
            );


        res.json(orders);


    } catch (error) {

        console.error(error);


        res.status(500).json({
            message:
                'Bestellungen konnten nicht geladen werden.'
        });


    } finally {

        if (connection) {
            await connection.end();
        }
    }
});


// Bestellung stornieren
router.patch(
    '/:id/cancel',
    requireLogin,
    async (req, res) => {

        const orderId =
            Number(req.params.id);


        if (!Number.isInteger(orderId)) {
            return res.status(400).json({
                message:
                    'Ungültige Bestell-ID.'
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
                        order_number,
                        full_name,
                        email,
                        total,
                        status,
                        payment_method,
                        payment_status
                    FROM orders
                    WHERE id = ?
                    AND user_id = ?
                    AND status = 'offen'`,
                    [
                        orderId,
                        req.session.user.id
                    ]
                );


            if (orders.length === 0) {
                return res.status(400).json({
                    message:
                        'Diese Bestellung kann nicht storniert werden.'
                });
            }


            const order =
                orders[0];


            const [items] =
                await connection.query(
                    `SELECT
                        quantity,
                        product_name AS name
                    FROM order_items
                    WHERE order_id = ?`,
                    [
                        orderId
                    ]
                );


            const [result] =
                await connection.query(
                    `UPDATE orders
                     SET status = 'storniert'
                     WHERE id = ?
                     AND user_id = ?
                     AND status = 'offen'`,
                    [
                        orderId,
                        req.session.user.id
                    ]
                );


            if (result.affectedRows === 0) {
                return res.status(400).json({
                    message:
                        'Diese Bestellung kann nicht storniert werden.'
                });
            }


            const productsText =
                items
                    .map(
                        item =>
                            `${item.quantity}x ${item.name}`
                    )
                    .join('\n');


            const cancellationPaymentText =
                order.payment_method === 'invoice' &&
                order.payment_status === 'pending'
                    ? 'Da du auf Rechnung bestellt hast, ist für diese stornierte Bestellung keine Zahlung mehr erforderlich.'
                    : 'Bitte beachte, dass eine mögliche Rückerstattung separat erfolgt.';


            const cancellationProductsHtml =
                items
                    .map(
                        item => `
                            <tr>
                                <td style="
                                    padding: 10px 0;
                                    border-bottom: 1px solid #eeeeee;
                                ">
                                    ${escapeHtml(item.quantity)}x
                                    ${escapeHtml(item.name)}
                                </td>
                            </tr>
                        `
                    )
                    .join('');


            // Stornierungsbestätigung an Kunden
            await transporter.sendMail({

                // WICHTIGE KONFIGURATION:
                // MAIL_USER muss in der .env-Datei festgelegt werden.
                from:
                    process.env.MAIL_USER,

                to:
                    order.email,

                subject:
                    `Stornierungsbestätigung ${order.order_number}`,

                html:
                    createCustomerMail({

                        title:
                            'Bestellung storniert',

                        greeting:
                            `Hallo ${order.full_name},`,

                        intro:
                            'deine Bestellung wurde erfolgreich storniert.',

                        content: `

                            <table
                                role="presentation"
                                width="100%"
                                cellspacing="0"
                                cellpadding="0"
                                style="
                                    border-collapse: collapse;
                                    font-size: 14px;
                                    color: #222222;
                                "
                            >

                                <tr>
                                    <td style="
                                        padding: 10px 0;
                                        border-bottom: 1px solid #eeeeee;
                                    ">
                                        <strong>Bestellnummer</strong>
                                    </td>

                                    <td style="
                                        padding: 10px 0;
                                        border-bottom: 1px solid #eeeeee;
                                        text-align: right;
                                    ">
                                        ${escapeHtml(order.order_number)}
                                    </td>
                                </tr>


                                <tr>
                                    <td style="
                                        padding: 10px 0;
                                    ">
                                        <strong>Gesamtbetrag</strong>
                                    </td>

                                    <td style="
                                        padding: 10px 0;
                                        text-align: right;
                                    ">
                                        ${Number(order.total)
                                            .toFixed(2)
                                            .replace('.', ',')} €
                                    </td>
                                </tr>

                            </table>


                            <h2 style="
                                margin: 28px 0 8px;
                                font-size: 17px;
                                color: #111111;
                            ">
                                Stornierte Produkte
                            </h2>


                            <table
                                role="presentation"
                                width="100%"
                                cellspacing="0"
                                cellpadding="0"
                                style="
                                    border-collapse: collapse;
                                    font-size: 14px;
                                    color: #222222;
                                "
                            >
                                ${cancellationProductsHtml}
                            </table>
                        `,

                        notice:
                            cancellationPaymentText
                    })
            });


            // Produktion informieren
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
                    `STORNIERUNG ${order.order_number}`,

                text: `
Eine Bestellung wurde vom Kunden storniert.

Bestellnummer:
${order.order_number}

Kunde:
${order.full_name}

Produkte:
${productsText}

Gesamtbetrag:
${Number(order.total).toFixed(2)} €

Die Bestellung darf nicht mehr produziert oder versendet werden.
                `
            });


            res.json({
                message:
                    'Bestellung wurde erfolgreich storniert.'
            });


        } catch (error) {

            console.error(error);


            res.status(500).json({
                message:
                    'Bestellung konnte nicht storniert werden.'
            });


        } finally {

            if (connection) {
                await connection.end();
            }
        }
    }
);


module.exports = router;
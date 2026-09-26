// PDF-Rechnungen erstellen

const PDFDocument = require('pdfkit');


// KONFIGURATION: Shopname vor Inbetriebnahme anpassen
const SHOP_NAME = 'MusterShop';


// KONFIGURATION: Unternehmensname und Rechtsform vor Inbetriebnahme anpassen
const COMPANY_NAME = 'Muster GmbH';


// KONFIGURATION: Unternehmensanschrift vor Inbetriebnahme anpassen
const COMPANY_STREET = 'Musterstraße 12';
const COMPANY_CITY = '66111 Saarbrücken';
const COMPANY_COUNTRY = 'Deutschland';


// KONFIGURATION: Unternehmens-E-Mail vor Inbetriebnahme anpassen
const COMPANY_EMAIL = 'shop@muster.de';


// KONFIGURATION: Unternehmenstelefonnummer vor Inbetriebnahme anpassen
const COMPANY_PHONE = '+49 123 12345';


// KONFIGURATION: Geschäftsführer vor Inbetriebnahme anpassen
const MANAGING_DIRECTOR = 'Max Mustermann';


// KONFIGURATION: Registergericht und Handelsregisternummer vor Inbetriebnahme anpassen
const REGISTER_COURT = 'Amtsgericht Saarbrücken';
const REGISTER_NUMBER = 'HRB 12345';


// KONFIGURATION: Umsatzsteuer-ID und Steuernummer vor Inbetriebnahme anpassen
const VAT_ID = 'DE123456789';
const TAX_NUMBER = '123/123/12345';


// KONFIGURATION: Bankname vor Inbetriebnahme anpassen
const BANK_NAME = 'Musterbank';


// KONFIGURATION: Kontoinhaber vor Inbetriebnahme anpassen
const ACCOUNT_HOLDER = 'Muster GmbH';


// KONFIGURATION: IBAN vor Inbetriebnahme anpassen
const IBAN = 'DE12 3123 1231 2312 3123 12';


// KONFIGURATION: BIC vor Inbetriebnahme anpassen
const BIC = 'MUSTDE12XXX';


// KONFIGURATION: Zahlungsziel für Rechnungskauf vor Inbetriebnahme anpassen
const PAYMENT_DAYS = 14;


// KONFIGURATION: Sprache und Zahlenformat vor Inbetriebnahme bei Bedarf anpassen
const LOCALE = 'de-DE';


// Euro formatieren
function formatEuro(value) {

    return `${Number(value)
        .toFixed(2)
        .replace('.', ',')} €`;
}


// Datum formatieren
function formatDate(date) {

    return new Intl.DateTimeFormat(
        LOCALE
    ).format(date);
}


// Footer zeichnen
function drawFooter(doc) {

    const footerLineY = 720;
    const footerTextY = 732;

    const leftX = 50;
    const middleX = 220;
    const rightX = 420;


    // Trennlinie
    doc
        .strokeColor('#cccccc')
        .lineWidth(0.7)
        .moveTo(50, footerLineY)
        .lineTo(545, footerLineY)
        .stroke();


    // Linke Spalte
    doc
        .font('Helvetica')
        .fontSize(7.5)
        .fillColor('#555555')
        .text(
            COMPANY_NAME,
            leftX,
            footerTextY,
            {
                width: 145,
                lineBreak: false
            }
        )
        .text(
            COMPANY_STREET,
            leftX,
            footerTextY + 10,
            {
                width: 145,
                lineBreak: false
            }
        )
        .text(
            COMPANY_CITY,
            leftX,
            footerTextY + 20,
            {
                width: 145,
                lineBreak: false
            }
        )
        .text(
            COMPANY_COUNTRY,
            leftX,
            footerTextY + 30,
            {
                width: 145,
                lineBreak: false
            }
        );


    // Mittlere Spalte
    doc
        .text(
            `Geschäftsführer: ${MANAGING_DIRECTOR}`,
            middleX,
            footerTextY,
            {
                width: 180,
                lineBreak: false
            }
        )
        .text(
            REGISTER_COURT,
            middleX,
            footerTextY + 10,
            {
                width: 180,
                lineBreak: false
            }
        )
        .text(
            REGISTER_NUMBER,
            middleX,
            footerTextY + 20,
            {
                width: 180,
                lineBreak: false
            }
        )
        .text(
            `USt-IdNr.: ${VAT_ID}`,
            middleX,
            footerTextY + 30,
            {
                width: 180,
                lineBreak: false
            }
        )
        .text(
            `Steuernummer: ${TAX_NUMBER}`,
            middleX,
            footerTextY + 40,
            {
                width: 180,
                lineBreak: false
            }
        );


    // Rechte Spalte
    doc
        .text(
            COMPANY_EMAIL,
            rightX,
            footerTextY,
            {
                width: 125,
                lineBreak: false
            }
        )
        .text(
            COMPANY_PHONE,
            rightX,
            footerTextY + 10,
            {
                width: 125,
                lineBreak: false
            }
        );


    doc.fillColor('#000000');
}


// Tabellenkopf zeichnen
function drawTableHeader(
    doc,
    y,
    quantityX,
    productX,
    unitPriceX,
    totalPriceX
) {

    doc
        .font('Helvetica-Bold')
        .fontSize(10)
        .fillColor('#000000')
        .text(
            'Menge',
            quantityX,
            y
        );

    doc.text(
        'Artikel',
        productX,
        y
    );

    doc.text(
        'Einzelpreis',
        unitPriceX,
        y,
        {
            width: 80,
            align: 'right'
        }
    );

    doc.text(
        'Gesamt',
        totalPriceX,
        y,
        {
            width: 95,
            align: 'right'
        }
    );


    // Linie unter Tabellenkopf
    doc
        .strokeColor('#cccccc')
        .lineWidth(0.5)
        .moveTo(50, y + 18)
        .lineTo(545, y + 18)
        .stroke();
}


// Neue Rechnungsseite beginnen
function addInvoicePage(doc) {

    drawFooter(doc);

    doc.addPage();

    doc
        .fontSize(16)
        .font('Helvetica-Bold')
        .fillColor('#000000')
        .text(
            `${SHOP_NAME} – Rechnung`,
            50,
            50
        );
}


// PDF-Rechnung erzeugen
function createInvoicePdf({
    orderNumber,
    invoiceNumber,
    fullName,
    street,
    postalCode,
    city,
    items,
    total,
    paymentMethod
}) {

    return new Promise((resolve, reject) => {

        try {

            const doc =
                new PDFDocument({
                    size: 'A4',
                    margin: 50
                });


            const chunks = [];


            doc.on('data', chunk => {
                chunks.push(chunk);
            });


            doc.on('end', () => {

                resolve(
                    Buffer.concat(chunks)
                );
            });


            doc.on('error', reject);


            const invoiceDate =
                new Date();


            // Kopfbereich
            doc
                .fontSize(22)
                .font('Helvetica-Bold')
                .text(
                    SHOP_NAME,
                    50,
                    50
                );


            // Unternehmensdaten
            doc
                .fontSize(10)
                .font('Helvetica')
                .text(
                    COMPANY_NAME,
                    50,
                    82
                )
                .text(COMPANY_STREET)
                .text(COMPANY_CITY)
                .text(COMPANY_COUNTRY)
                .text(
                    `E-Mail: ${COMPANY_EMAIL}`
                )
                .text(
                    `Telefon: ${COMPANY_PHONE}`
                );


            // Rechnungsadresse
            doc
                .fontSize(10)
                .font('Helvetica-Bold')
                .text(
                    'Rechnungsadresse',
                    50,
                    175
                );


            doc
                .font('Helvetica')
                .text(fullName)
                .text(street)
                .text(
                    `${postalCode} ${city}`
                );


            // Rechnungsüberschrift
            doc
                .fontSize(20)
                .font('Helvetica-Bold')
                .text(
                    'Rechnung',
                    50,
                    245
                );


            // Rechnungsinformationen
            doc
                .fontSize(10)
                .font('Helvetica')
                .text(
                    `Rechnungsnummer: ${invoiceNumber}`,
                    50,
                    280
                )
                .text(
                    `Bestellnummer: ${orderNumber}`
                )
                .text(
                    `Rechnungsdatum: ${formatDate(invoiceDate)}`
                );


            // Produkttabelle
            const quantityX = 50;
            const productX = 100;
            const unitPriceX = 340;
            const totalPriceX = 450;

            const tableHeaderY = 340;

            drawTableHeader(
                doc,
                tableHeaderY,
                quantityX,
                productX,
                unitPriceX,
                totalPriceX
            );


            let currentY =
                tableHeaderY + 30;


            // Produkte
            for (const item of items) {

                // Vor dem Footer auf eine neue Seite wechseln
                if (currentY + 24 > 700) {

                    addInvoicePage(doc);

                    const newTableHeaderY = 90;

                    drawTableHeader(
                        doc,
                        newTableHeaderY,
                        quantityX,
                        productX,
                        unitPriceX,
                        totalPriceX
                    );

                    currentY =
                        newTableHeaderY + 30;
                }


                const quantity =
                    Number(item.quantity);

                const unitPrice =
                    Number(item.unitPrice);

                const itemTotal =
                    quantity * unitPrice;


                doc
                    .font('Helvetica')
                    .fontSize(10)
                    .fillColor('#000000');


                doc.text(
                    String(quantity),
                    quantityX,
                    currentY,
                    {
                        width: 40
                    }
                );


                doc.text(
                    item.name,
                    productX,
                    currentY,
                    {
                        width: 220
                    }
                );


                doc.text(
                    formatEuro(unitPrice),
                    unitPriceX,
                    currentY,
                    {
                        width: 80,
                        align: 'right'
                    }
                );


                doc.text(
                    formatEuro(itemTotal),
                    totalPriceX,
                    currentY,
                    {
                        width: 95,
                        align: 'right'
                    }
                );


                currentY += 24;
            }


            // Platz für Gesamtbetrag sicherstellen
            if (currentY + 55 > 700) {

                addInvoicePage(doc);

                currentY = 90;
            }


            // Linie über Gesamtbetrag
            doc
                .strokeColor('#cccccc')
                .lineWidth(0.5)
                .moveTo(
                    340,
                    currentY
                )
                .lineTo(
                    545,
                    currentY
                )
                .stroke();


            currentY += 12;


            // Gesamtbetrag
            doc
                .font('Helvetica-Bold')
                .fontSize(12)
                .fillColor('#000000')
                .text(
                    `Gesamtbetrag: ${formatEuro(total)}`,
                    340,
                    currentY,
                    {
                        width: 205,
                        align: 'right'
                    }
                );


            currentY += 40;


            // Benötigten Platz für Zahlungsinformationen prüfen
            const requiredPaymentSpace =
                paymentMethod === 'invoice'
                    ? 190
                    : 70;


            if (currentY + requiredPaymentSpace > 700) {

                addInvoicePage(doc);

                currentY = 90;
            }


            // Zahlungsinformationen
            doc
                .fontSize(11)
                .font('Helvetica-Bold')
                .fillColor('#000000')
                .text(
                    'Zahlungsinformationen',
                    50,
                    currentY
                );


            currentY += 22;


            if (paymentMethod === 'invoice') {

                doc
                    .fontSize(10)
                    .font('Helvetica')
                    .text(
                        'Zahlungsart: Kauf auf Rechnung',
                        50,
                        currentY
                    );


                currentY += 15;


                doc.text(
                    `Zahlungsziel: ${PAYMENT_DAYS} Tage`,
                    50,
                    currentY
                );


                currentY += 24;


                doc.text(
                    'Bitte überweise den Rechnungsbetrag auf folgendes Konto:',
                    50,
                    currentY
                );


                currentY += 20;


                doc.text(
                    `Kontoinhaber: ${ACCOUNT_HOLDER}`,
                    50,
                    currentY
                );


                currentY += 15;


                doc.text(
                    `Bank: ${BANK_NAME}`,
                    50,
                    currentY
                );


                currentY += 15;


                doc.text(
                    `IBAN: ${IBAN}`,
                    50,
                    currentY
                );


                currentY += 15;


                doc.text(
                    `BIC: ${BIC}`,
                    50,
                    currentY
                );


                currentY += 23;


                doc
                    .font('Helvetica-Bold')
                    .text(
                        `Verwendungszweck: ${orderNumber} / ${invoiceNumber}`,
                        50,
                        currentY
                    );


                currentY += 20;


                doc
                    .font('Helvetica')
                    .text(
                        'Die weitere Bearbeitung bzw. der Versand erfolgt nach Eingang der Zahlung.',
                        50,
                        currentY,
                        {
                            width: 495
                        }
                    );

            } else {

                // PayPal-Rechnung
                doc
                    .fontSize(10)
                    .font('Helvetica')
                    .text(
                        'Zahlungsart: PayPal',
                        50,
                        currentY
                    );


                currentY += 15;


                doc.text(
                    'Zahlungsstatus: Bezahlt',
                    50,
                    currentY
                );
            }


            // Footer auf der letzten Seite
            drawFooter(doc);


            doc.end();

        } catch (error) {

            reject(error);
        }
    });
}


module.exports = {
    createInvoicePdf
};
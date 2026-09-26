// Einheitliches Design für Kundenmails

// KONFIGURATION: Shopname vor Inbetriebnahme anpassen
const SHOP_NAME = 'MusterShop';


// HTML-Zeichen absichern
function escapeHtml(value = '') {

    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}


// Gemeinsame Kundenmail erstellen
function createCustomerMail({
    title,
    greeting,
    intro,
    content = '',
    notice = '',
    buttonText = '',
    buttonUrl = ''
}) {

    const safeTitle =
        escapeHtml(title);

    const safeGreeting =
        escapeHtml(greeting);

    const safeIntro =
        escapeHtml(intro);

    const safeNotice =
        escapeHtml(notice);

    const safeButtonText =
        escapeHtml(buttonText);

    const safeButtonUrl =
        escapeHtml(buttonUrl);


    // Optionaler Button
    const button =
        buttonText && buttonUrl
            ? `
                <div style="
                    margin: 28px 0 8px;
                    text-align: center;
                ">
                    <a
                        href="${safeButtonUrl}"
                        style="
                            display: inline-block;
                            background: #111111;
                            color: #ffffff;
                            text-decoration: none;
                            padding: 12px 22px;
                            border-radius: 8px;
                            font-size: 14px;
                            font-weight: 700;
                        "
                    >
                        ${safeButtonText}
                    </a>
                </div>
            `
            : '';


    // Optionale Hinweisbox
    const noticeBox =
        notice
            ? `
                <div style="
                    margin-top: 24px;
                    padding: 15px 18px;
                    background: #f6f6f6;
                    border: 1px solid #e5e5e5;
                    border-radius: 8px;
                    color: #333333;
                    font-size: 14px;
                    line-height: 1.6;
                ">
                    ${safeNotice}
                </div>
            `
            : '';


    // HTML der E-Mail
    return `
<!doctype html>

<html lang="de">

<body
    style="
        margin: 0;
        padding: 0;
        background: #ffffff;
        color: #111111;
        font-family: Arial, Helvetica, sans-serif;
    "
>

    <table
        role="presentation"
        width="100%"
        cellspacing="0"
        cellpadding="0"
        style="
            width: 100%;
            background: #ffffff;
        "
    >

        <tr>

            <td
                align="center"
                style="
                    padding: 32px 16px;
                "
            >

                <table
                    role="presentation"
                    width="600"
                    cellspacing="0"
                    cellpadding="0"
                    style="
                        width: 100%;
                        max-width: 600px;
                        background: #ffffff;
                        border: 1px solid #e7e7e7;
                        border-radius: 12px;
                    "
                >

                    <!-- Inhalt -->
                    <tr>

                        <td
                            style="
                                padding: 30px 34px 34px;
                            "
                        >

                            <h1
                                style="
                                    margin: 8px 0 24px;
                                    text-align: center;
                                    color: #111111;
                                    font-size: 25px;
                                    line-height: 1.25;
                                "
                            >
                                ${safeTitle}
                            </h1>


                            <p
                                style="
                                    margin: 0 0 12px;
                                    color: #111111;
                                    font-size: 15px;
                                    line-height: 1.6;
                                "
                            >
                                ${safeGreeting}
                            </p>


                            <p
                                style="
                                    margin: 0 0 22px;
                                    color: #333333;
                                    font-size: 15px;
                                    line-height: 1.6;
                                "
                            >
                                ${safeIntro}
                            </p>


                            ${content}

                            ${button}

                            ${noticeBox}


                            <p
                                style="
                                    margin: 30px 0 0;
                                    color: #333333;
                                    font-size: 14px;
                                    line-height: 1.6;
                                "
                            >
                                Viele Grüße
                                <br>

                                <strong>
                                    Dein ${SHOP_NAME}-Team
                                </strong>
                            </p>

                        </td>

                    </tr>


                    <!-- Footer -->
                    <tr>

                        <td
                            style="
                                padding: 18px 34px;
                                border-top: 1px solid #eeeeee;
                                text-align: center;
                                color: #777777;
                                font-size: 11px;
                                line-height: 1.5;
                            "
                        >
                            Diese E-Mail wurde automatisch von ${SHOP_NAME} versendet.
                        </td>

                    </tr>

                </table>

            </td>

        </tr>

    </table>

</body>

</html>
    `;
}


module.exports = {
    SHOP_NAME,
    escapeHtml,
    createCustomerMail
};
// PayPal Access Token holen
async function getPayPalAccessToken() {

    // WICHTIGE KONFIGURATION:
    // PAYPAL_CLIENT_ID und PAYPAL_CLIENT_SECRET müssen in der
    // .env-Datei hinterlegt werden.
    // Den PayPal Client Secret niemals direkt im Quellcode speichern.
    const auth = Buffer.from(
        `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
    ).toString('base64');


    // WICHTIGE KONFIGURATION:
    // PAYPAL_BASE_URL muss in der .env-Datei passend zur verwendeten
    // PayPal-Umgebung festgelegt werden (Sandbox oder Live-Betrieb).
    const response = await fetch(
        `${process.env.PAYPAL_BASE_URL}/v1/oauth2/token`,
        {
            method: 'POST',

            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            },

            body: 'grant_type=client_credentials'
        }
    );


    if (!response.ok) {

        const errorText =
            await response.text();


        throw new Error(
            `PayPal Auth fehlgeschlagen: ${errorText}`
        );
    }


    const data =
        await response.json();


    return data.access_token;
}


module.exports = {
    getPayPalAccessToken
};
// Funktionen für Checkout und Zahlungsarten

let approvedPayPalOrderId = null;


// Checkout-Eingaben prüfen
function validateCheckoutForm() {

    const fullName =
        document.getElementById('full-name')?.value.trim();

    const street =
        document.getElementById('street')?.value.trim();

    const postalCode =
        document.getElementById('postal-code')?.value.trim();

    const city =
        document.getElementById('city')?.value.trim();

    const email =
        document.getElementById('checkout-email')
            ?.value
            .trim()
            .toLowerCase();


    if (
        fullName === undefined ||
        street === undefined ||
        postalCode === undefined ||
        city === undefined ||
        email === undefined
    ) {
        return true;
    }


    // KONFIGURATION:
    // Vorgaben für Name und Adressdaten im Checkout.
    if (
        fullName.length < 3 ||
        !fullName.includes(' ')
    ) {
        showToast(
            'Bitte gib deinen Vor- und Nachnamen ein.',
            'error'
        );

        return false;
    }


    if (
        street.length < 3 ||
        !/[a-zA-ZäöüÄÖÜß]/.test(street) ||
        !/\d/.test(street)
    ) {
        showToast(
            'Bitte gib eine gültige Straße mit Hausnummer ein.',
            'error'
        );

        return false;
    }


    // KONFIGURATION:
    // Die Prüfung ist auf fünfstellige deutsche Postleitzahlen ausgelegt.
    if (!/^\d{5}$/.test(postalCode)) {
        showToast(
            'Die PLZ muss aus genau 5 Ziffern bestehen.',
            'error'
        );

        return false;
    }


    if (
        city.length < 2 ||
        !/[a-zA-ZäöüÄÖÜß]/.test(city)
    ) {
        showToast(
            'Bitte gib einen gültigen Ort ein.',
            'error'
        );

        return false;
    }


    const emailRegex =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


    if (!emailRegex.test(email)) {
        showToast(
            'Bitte gib eine gültige E-Mail-Adresse ein.',
            'error'
        );

        return false;
    }


    const legalCheckbox =
        document.getElementById(
            'checkout-legal-checkbox'
        );


    if (
        legalCheckbox &&
        !legalCheckbox.checked
    ) {
        showToast(
            'Bitte stimme den AGB und der Widerrufsbelehrung zu.',
            'info'
        );

        return false;
    }


    return true;
}


// Lieferdaten auslesen
function getCheckoutData() {

    return {
        fullName:
            document.getElementById('full-name').value.trim(),

        street:
            document.getElementById('street').value.trim(),

        postalCode:
            document.getElementById('postal-code').value.trim(),

        city:
            document.getElementById('city').value.trim(),

        email:
            document.getElementById('checkout-email')
                .value
                .trim()
                .toLowerCase()
    };
}


// Checkout-Felder nach PayPal-Bestätigung sperren
function lockCheckoutFields() {

    const fieldIds = [
        'full-name',
        'street',
        'postal-code',
        'city',
        'checkout-email',
        'checkout-legal-checkbox'
    ];


    fieldIds.forEach(id => {

        const element =
            document.getElementById(id);


        if (element) {
            element.disabled = true;
        }
    });


    document
        .querySelectorAll(
            'input[name="payment-method"]'
        )
        .forEach(input => {
            input.disabled = true;
        });
}


// Warenkorb aus MySQL laden
async function getCartItems() {

    const response =
        await fetch(
            `${API_BASE_URL}/api/cart`,
            {
                credentials: 'include'
            }
        );


    const cart =
        await response.json();


    if (!response.ok) {
        throw new Error(
            cart.message ||
            'Warenkorb konnte nicht geladen werden.'
        );
    }


    return cart.map(item => ({
        productId: item.id,
        quantity: item.quantity
    }));
}


// Checkout-Zugriff prüfen und Bestellübersicht laden
async function loadCheckoutSummary() {

    const summaryContainer =
        document.getElementById(
            'checkout-summary-items'
        );

    const totalElement =
        document.getElementById(
            'checkout-summary-total'
        );

    const checkoutContent =
        document.getElementById(
            'checkout-content'
        );

    const loginState =
        document.getElementById(
            'checkout-login-state'
        );

    const directState =
        document.getElementById(
            'checkout-direct-state'
        );


    if (
        !summaryContainer ||
        !totalElement ||
        !checkoutContent
    ) {
        return;
    }


    try {

        const response =
            await fetch(
                `${API_BASE_URL}/api/cart`,
                {
                    credentials: 'include'
                }
            );


        const cart =
            await response.json();


        if (response.status === 401) {

            checkoutContent.style.display =
                'none';


            if (directState) {
                directState.style.display =
                    'none';
            }


            if (loginState) {
                loginState.style.display =
                    'flex';
            }


            return;
        }


        if (!response.ok) {

            checkoutContent.style.display =
                'none';

            summaryContainer.innerHTML =
                '<p>Checkout konnte nicht geladen werden.</p>';

            totalElement.textContent =
                '– €';

            return;
        }


        const checkoutAccess =
            sessionStorage.getItem(
                'checkoutAccessGranted'
            );


        if (checkoutAccess !== 'true') {

            checkoutContent.style.display =
                'none';


            if (loginState) {
                loginState.style.display =
                    'none';
            }


            if (directState) {
                directState.style.display =
                    'flex';
            }


            return;
        }


        sessionStorage.removeItem(
            'checkoutAccessGranted'
        );


        if (cart.length === 0) {

            checkoutContent.style.display =
                'none';


            if (loginState) {
                loginState.style.display =
                    'none';
            }


            if (directState) {
                directState.style.display =
                    'flex';
            }


            return;
        }


        if (loginState) {
            loginState.style.display =
                'none';
        }


        if (directState) {
            directState.style.display =
                'none';
        }


        checkoutContent.style.display =
            'block';


        summaryContainer.innerHTML =
            '';


        let total = 0;


        cart.forEach(item => {

            const price =
                Number(item.price);

            const quantity =
                Number(item.quantity);

            const itemTotal =
                price * quantity;


            total +=
                itemTotal;


            const summaryItem =
                document.createElement('div');


            summaryItem.classList.add(
                'checkout-summary-item'
            );


            summaryItem.innerHTML = `
                <img
                    src="${item.image}"
                    alt="${item.name}"
                >

                <div class="checkout-summary-item-info">
                    <strong>
                        ${item.name}
                    </strong>

                    <span>
                        Menge: ${quantity}
                    </span>
                </div>

                <div class="checkout-summary-item-price">
                    ${formatPrice(itemTotal)} €
                </div>
            `;


            summaryContainer.appendChild(
                summaryItem
            );
        });


        totalElement.textContent =
            `${formatPrice(total)} €`;


    } catch (error) {

        console.error(error);


        checkoutContent.style.display =
            'none';

        summaryContainer.innerHTML =
            '<p>Checkout konnte nicht geladen werden.</p>';

        totalElement.textContent =
            '– €';
    }
}


// Bestellübersicht laden
loadCheckoutSummary();



// Zahlungsart wechseln
const paymentMethodInputs =
    document.querySelectorAll(
        'input[name="payment-method"]'
    );

const paypalPaymentSection =
    document.getElementById(
        'paypal-payment-section'
    );

const invoicePaymentSection =
    document.getElementById(
        'invoice-payment-section'
    );

const finalOrderSection =
    document.getElementById(
        'final-order-section'
    );


paymentMethodInputs.forEach(input => {

    input.addEventListener(
        'change',
        () => {

            const paymentMethod =
                document.querySelector(
                    'input[name="payment-method"]:checked'
                )?.value;


            if (paymentMethod === 'invoice') {

                if (paypalPaymentSection) {
                    paypalPaymentSection.style.display =
                        'none';
                }


                if (invoicePaymentSection) {
                    invoicePaymentSection.style.display =
                        'block';
                }


                if (finalOrderSection) {
                    finalOrderSection.style.display =
                        'none';
                }

            } else {

                if (paypalPaymentSection) {
                    paypalPaymentSection.style.display =
                        'block';
                }


                if (invoicePaymentSection) {
                    invoicePaymentSection.style.display =
                        'none';
                }


                if (
                    finalOrderSection &&
                    approvedPayPalOrderId
                ) {
                    finalOrderSection.style.display =
                        'block';
                }
            }
        }
    );
});



// PayPal-Zahlung vorbereiten
const paypalContainer =
    document.getElementById(
        'paypal-button-container'
    );

const finalOrderButton =
    document.getElementById(
        'final-order-button'
    );


if (
    paypalContainer &&
    typeof paypal !== 'undefined'
) {

    paypal.Buttons({

        onClick: (data, actions) => {

            if (!validateCheckoutForm()) {
                return actions.reject();
            }


            return actions.resolve();
        },


        createOrder: async () => {

            try {

                const items =
                    await getCartItems();


                if (items.length === 0) {

                    showToast(
                        'Dein Warenkorb ist leer.',
                        'info'
                    );


                    throw new Error(
                        'Warenkorb leer'
                    );
                }


                const response =
                    await fetch(
                        `${API_BASE_URL}/api/paypal/create-order`,
                        {
                            method: 'POST',
                            credentials: 'include',

                            headers: {
                                'Content-Type':
                                    'application/json'
                            },

                            body: JSON.stringify({
                                items
                            })
                        }
                    );


                const data =
                    await response.json();


                if (!response.ok) {

                    showToast(
                        data.message,
                        'error'
                    );


                    throw new Error(
                        data.message
                    );
                }


                return data.paypalOrderId;


            } catch (error) {

                console.error(error);

                throw error;
            }
        },


        onApprove: async (data) => {

            approvedPayPalOrderId =
                data.orderID;


            lockCheckoutFields();


            paypalContainer.style.display =
                'none';


            if (finalOrderSection) {
                finalOrderSection.style.display =
                    'block';
            }


            showToast(
                'PayPal wurde bestätigt. Schließe jetzt deine Bestellung ab.',
                'success'
            );
        },


        onCancel: () => {

            approvedPayPalOrderId =
                null;


            showToast(
                'PayPal-Zahlung wurde abgebrochen.',
                'info'
            );
        },


        onError: error => {

            approvedPayPalOrderId =
                null;


            console.error(
                'PayPal Fehler:',
                error
            );


            showToast(
                'Bei PayPal ist ein Fehler aufgetreten.',
                'error'
            );
        }

    }).render(
        '#paypal-button-container'
    );
}



// PayPal-Bestellung abschließen
if (finalOrderButton) {

    finalOrderButton.addEventListener(
        'click',
        async () => {

            if (!approvedPayPalOrderId) {

                showToast(
                    'Bitte bestätige zuerst PayPal.',
                    'info'
                );

                return;
            }


            finalOrderButton.disabled =
                true;

            finalOrderButton.textContent =
                'Bestellung wird abgeschlossen...';


            try {

                const checkoutData =
                    getCheckoutData();

                const items =
                    await getCartItems();


                if (items.length === 0) {

                    showToast(
                        'Dein Warenkorb ist leer.',
                        'error'
                    );

                    return;
                }


                const captureResponse =
                    await fetch(
                        `${API_BASE_URL}/api/paypal/capture-order`,
                        {
                            method: 'POST',
                            credentials: 'include',

                            headers: {
                                'Content-Type':
                                    'application/json'
                            },

                            body: JSON.stringify({
                                orderId:
                                    approvedPayPalOrderId
                            })
                        }
                    );


                const captureData =
                    await captureResponse.json();


                if (!captureResponse.ok) {

                    showToast(
                        captureData.message ||
                        'PayPal-Zahlung konnte nicht abgeschlossen werden.',
                        'error'
                    );

                    return;
                }


                const orderResponse =
                    await fetch(
                        `${API_BASE_URL}/api/orders`,
                        {
                            method: 'POST',
                            credentials: 'include',

                            headers: {
                                'Content-Type':
                                    'application/json'
                            },

                            body: JSON.stringify({
                                items,

                                fullName:
                                    checkoutData.fullName,

                                street:
                                    checkoutData.street,

                                postalCode:
                                    checkoutData.postalCode,

                                city:
                                    checkoutData.city,

                                email:
                                    checkoutData.email,

                                paypalOrderId:
                                    approvedPayPalOrderId,

                                paymentMethod:
                                    'paypal'
                            })
                        }
                    );


                const orderData =
                    await orderResponse.json();


                if (!orderResponse.ok) {

                    console.error(
                        'Bestellung konnte nach PayPal-Zahlung nicht gespeichert werden:',
                        orderData
                    );


                    showToast(
                        orderData.message ||
                        'Die Zahlung war erfolgreich, aber die Bestellung konnte nicht gespeichert werden. Bitte kontaktiere den Support.',
                        'error'
                    );

                    return;
                }


                showToast(
                    `Bestellung erfolgreich!\n` +
                    `Bestellnummer: ${orderData.orderNumber}`,
                    'success'
                );


                window.location.href =
                    'bestellungen.html';


            } catch (error) {

                console.error(error);


                showToast(
                    'Die Bestellung konnte nicht abgeschlossen werden.',
                    'error'
                );


            } finally {

                finalOrderButton.disabled =
                    false;

                finalOrderButton.textContent =
                    'Zahlungspflichtig bestellen';
            }
        }
    );
}



// Rechnungskauf abschließen
const invoiceOrderButton =
    document.getElementById(
        'invoice-order-button'
    );


if (invoiceOrderButton) {

    invoiceOrderButton.addEventListener(
        'click',
        async () => {

            if (!validateCheckoutForm()) {
                return;
            }


            invoiceOrderButton.disabled =
                true;

            invoiceOrderButton.textContent =
                'Bestellung wird abgeschlossen...';


            try {

                const checkoutData =
                    getCheckoutData();

                const items =
                    await getCartItems();


                if (items.length === 0) {

                    showToast(
                        'Dein Warenkorb ist leer.',
                        'error'
                    );

                    return;
                }


                const response =
                    await fetch(
                        `${API_BASE_URL}/api/orders`,
                        {
                            method: 'POST',
                            credentials: 'include',

                            headers: {
                                'Content-Type':
                                    'application/json'
                            },

                            body: JSON.stringify({
                                items,

                                fullName:
                                    checkoutData.fullName,

                                street:
                                    checkoutData.street,

                                postalCode:
                                    checkoutData.postalCode,

                                city:
                                    checkoutData.city,

                                email:
                                    checkoutData.email,

                                paymentMethod:
                                    'invoice'
                            })
                        }
                    );


                const data =
                    await response.json();


                if (!response.ok) {

                    showToast(
                        data.message ||
                        'Bestellung konnte nicht erstellt werden.',
                        'error'
                    );

                    return;
                }


                showToast(
                    `Bestellung erfolgreich!\n` +
                    `Bestellnummer: ${data.orderNumber}`,
                    'success'
                );


                window.location.href =
                    'bestellungen.html';


            } catch (error) {

                console.error(error);


                showToast(
                    'Die Bestellung konnte nicht abgeschlossen werden.',
                    'error'
                );


            } finally {

                invoiceOrderButton.disabled =
                    false;

                invoiceOrderButton.textContent =
                    'Zahlungspflichtig bestellen';
            }
        }
    );
}
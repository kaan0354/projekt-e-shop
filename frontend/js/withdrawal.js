// Funktionen für das elektronische Widerrufsformular

const withdrawalForm =
    document.getElementById(
        'withdrawal-form'
    );


// Widerrufsformular nur auf der entsprechenden Seite initialisieren
if (withdrawalForm) {

    withdrawalForm.addEventListener(
        'submit',
        async (event) => {

            event.preventDefault();


            const fullName =
                document.getElementById(
                    'withdrawal-name'
                ).value.trim();


            const email =
                document.getElementById(
                    'withdrawal-email'
                ).value.trim();


            const orderNumber =
                document.getElementById(
                    'withdrawal-order-number'
                ).value.trim();


            const message =
                document.getElementById(
                    'withdrawal-message'
                ).value.trim();


            const submitButton =
                withdrawalForm.querySelector(
                    'button[type="submit"]'
                );


            // Pflichtfelder prüfen
            if (
                !fullName ||
                !email ||
                !orderNumber
            ) {

                showToast(
                    'Bitte fülle alle Pflichtfelder aus.',
                    'info'
                );

                return;
            }


            // E-Mail-Adresse prüfen
            const emailRegex =
                /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


            if (!emailRegex.test(email)) {

                showToast(
                    'Bitte gib eine gültige E-Mail-Adresse ein.',
                    'error'
                );

                return;
            }


            if (submitButton) {

                submitButton.disabled =
                    true;

                submitButton.textContent =
                    'Widerruf wird übermittelt...';
            }


            try {

                const response =
                    await fetch(
                        `${API_BASE_URL}/api/withdrawals`,
                        {
                            method: 'POST',

                            headers: {
                                'Content-Type':
                                    'application/json'
                            },

                            body: JSON.stringify({
                                fullName,
                                email,
                                orderNumber,
                                message
                            })
                        }
                    );


                const data =
                    await response.json();


                if (!response.ok) {

                    showToast(
                        data.message ||
                        'Widerruf konnte nicht übermittelt werden.',
                        'error'
                    );


                    if (submitButton) {

                        submitButton.disabled =
                            false;

                        submitButton.textContent =
                            'Widerruf absenden';
                    }


                    return;
                }


                showToast(
                    data.message ||
                    'Widerruf wurde erfolgreich übermittelt.',
                    'success'
                );


                withdrawalForm.reset();


                if (submitButton) {

                    submitButton.disabled =
                        true;

                    submitButton.textContent =
                        'Widerruf erfolgreich übermittelt';
                }


            } catch (error) {

                console.error(error);


                showToast(
                    'Widerruf konnte nicht übermittelt werden.',
                    'error'
                );


                if (submitButton) {

                    submitButton.disabled =
                        false;

                    submitButton.textContent =
                        'Widerruf absenden';
                }
            }
        }
    );
}
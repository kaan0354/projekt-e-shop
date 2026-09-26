// Warenkorbfunktionen für Laden, Ändern, Entfernen und Checkout-Weiterleitung

// Accountgebundenen Warenkorb aus MySQL laden und auf warenkorb.html anzeigen
async function renderCart() {
    const cartTable =
        document.getElementById('cart-items');

    const totalEl =
        document.getElementById('Gesamtpreis');

    // Nur auf der Warenkorbseite ausführen
    if (!cartTable) {
        return;
    }

    try {
        const response = await fetch(
            `${API_BASE_URL}/api/cart`,
            {
                method: 'GET',
                credentials: 'include'
            }
        );


        // Ausgeloggten Benutzer im Warenkorb abfangen
        if (!response.ok) {
            const data =
                await response.json();

            const emptyCart =
                document.getElementById(
                    'empty-cart'
                );

            const cartTableElement =
                document.querySelector(
                    '#warenkorb table'
                );

            const cartFooter =
                document.getElementById(
                    'warenkorb-hinzufügen'
                );

            if (cartTableElement) {
                cartTableElement.style.display =
                    'none';
            }

            if (cartFooter) {
                cartFooter.style.display =
                    'none';
            }

            if (emptyCart) {
                emptyCart.style.display =
                    'flex';

                emptyCart.innerHTML = `
                    <h2>Du bist nicht angemeldet</h2>

                    <p>
                        Melde dich an, um deinen Warenkorb zu sehen
                        und deine ausgewählten Produkte zu verwalten.
                    </p>

                    <a
                        href="login.html"
                        class="btn-primary"
                    >
                        Zum Login
                    </a>

                    <p class="cart-login-register">
                        Noch kein Konto?
                        <a href="register.html">
                            Jetzt registrieren
                        </a>
                    </p>
                `;
            }

            if (totalEl) {
                totalEl.innerHTML = '';
            }

            return;
        }


        const cart =
            await response.json();

        const emptyCart =
            document.getElementById(
                'empty-cart'
            );

        const cartTableElement =
            document.querySelector(
                '#warenkorb table'
            );

        const cartFooter =
            document.getElementById(
                'warenkorb-hinzufügen'
            );


        // Leeren Warenkorb anzeigen
        if (cart.length === 0) {

            if (emptyCart) {
                emptyCart.style.display =
                    'flex';
            }

            if (cartTableElement) {
                cartTableElement.style.display =
                    'none';
            }

            if (cartFooter) {
                cartFooter.style.display =
                    'none';
            }

            return;
        }


        // Normale Warenkorbansicht anzeigen
        if (emptyCart) {
            emptyCart.style.display =
                'none';
        }

        if (cartTableElement) {
            cartTableElement.style.display =
                'table';
        }

        if (cartFooter) {
            cartFooter.style.display =
                'block';
        }


        cartTable.innerHTML = '';

        let total = 0;

        let hasUnavailableProduct =
            false;


        // KONFIGURATION:
        // Zahlen- und Währungsformat für den Warenkorb.
        const fmt = (value) =>
            new Intl.NumberFormat(
                'de-DE',
                {
                    style: 'currency',
                    currency: 'EUR'
                }
            ).format(value);


        cart.forEach(item => {

            const isAvailable =
                Boolean(
                    item.is_available
                );

            const isArchived =
                Boolean(
                    item.is_archived
                );

            const stock =
                Number(
                    item.stock
                );

            const quantity =
                Number(
                    item.quantity
                );


            // Produkt kann nicht gekauft werden
            const cannotPurchase =
                isArchived ||
                !isAvailable ||
                quantity > stock;


            if (cannotPurchase) {
                hasUnavailableProduct =
                    true;
            }


            const unitPrice =
                Number(
                    item.price
                );

            const itemTotal =
                unitPrice * quantity;

            total +=
                itemTotal;


            // Meldung für nicht kaufbare Produkte bestimmen
            let availabilityMessage = '';

            if (isArchived) {

                availabilityMessage =
                    'Dieses Produkt ist nicht mehr verfügbar';

            } else if (!isAvailable) {

                availabilityMessage =
                    'Momentan nicht verfügbar';

            } else if (quantity > stock) {

                availabilityMessage =
                    `Nur noch ${stock} Stück verfügbar`;
            }


            // Warenkorbzeile erstellen
            cartTable.innerHTML += `
                <tr class="${
                    cannotPurchase
                        ? 'cart-item-unavailable'
                        : ''
                }">

                    <td>
                        <a
                            href="#"
                            onclick="
                                removeFromCart(${item.id});
                                return false;
                            "
                        >
                            <i class="far fa-times-circle"></i>
                        </a>
                    </td>

                    <td>
                        <img
                            src="${item.image}"
                            alt="${item.name}"
                            width="50"
                            height="50"
                            style="object-fit: contain;"
                        >
                    </td>

                    <td>
                        ${item.name}

                        ${
                            availabilityMessage
                                ? `
                                    <br>

                                    <strong class="cart-unavailable-message">
                                        ${availabilityMessage}
                                    </strong>
                                  `
                                : ''
                        }
                    </td>

                    <td>
                        ${fmt(unitPrice)}
                    </td>

                    <td>

                        <div class="cart-quantity-control">

                            <input
                                type="number"
                                value="${quantity}"
                                min="1"
                                max="${stock}"
                                ${
                                    isArchived ||
                                    !isAvailable
                                        ? 'disabled'
                                        : ''
                                }
                                onchange="
                                    updateQuantity(
                                        ${item.id},
                                        this.value
                                    )
                                "
                            >

                            ${
                                !isArchived
                                    ? `
                                        <small class="cart-stock">
                                            ${stock} verfügbar
                                        </small>
                                      `
                                    : ''
                            }

                        </div>

                    </td>

                    <td>
                        ${fmt(itemTotal)}
                    </td>

                </tr>
            `;
        });


        // Gesamtpreis anzeigen
        if (totalEl) {
            totalEl.innerHTML = `
                <h3>
                    Gesamtpreis:
                    ${fmt(total)}
                </h3>
            `;
        }


        // Checkout sperren, wenn mindestens
        // ein Produkt nicht gekauft werden kann
        const checkoutBtn =
            document.getElementById(
                'checkoutBtn'
            );

        if (checkoutBtn) {

            checkoutBtn.disabled =
                cart.length === 0 ||
                hasUnavailableProduct;
        }


    } catch (error) {

        console.error(error);

        showToast(
            'Warenkorb konnte nicht geladen werden.',
            'error'
        );
    }
}


// Produkt aus dem accountgebundenen Warenkorb entfernen
async function removeFromCart(productId) {

    try {
        const response = await fetch(
            `${API_BASE_URL}/api/cart/${productId}`,
            {
                method: 'DELETE',
                credentials: 'include'
            }
        );

        const data =
            await response.json();


        if (!response.ok) {

            showToast(
                data.message,
                'error'
            );

            return;
        }


        showToast(
            'Produkt wurde aus dem Warenkorb entfernt.',
            'success'
        );

        await renderCart();


    } catch (error) {

        console.error(error);

        showToast(
            'Produkt konnte nicht entfernt werden.',
            'error'
        );
    }
}


// Produktmenge im accountgebundenen Warenkorb ändern
async function updateQuantity(
    productId,
    quantity
) {

    quantity =
        Number(quantity);


    if (
        !Number.isInteger(quantity) ||
        quantity < 1
    ) {

        showToast(
            'Ungültige Menge.',
            'error'
        );

        await renderCart();

        return;
    }


    try {
        const response = await fetch(
            `${API_BASE_URL}/api/cart/${productId}`,
            {
                method: 'PATCH',
                credentials: 'include',

                headers: {
                    'Content-Type':
                        'application/json'
                },

                body: JSON.stringify({
                    quantity: quantity
                })
            }
        );

        const data =
            await response.json();


        // Bei ungültiger Menge den gespeicherten Warenkorb wieder anzeigen
        if (!response.ok) {

            showToast(
                data.message,
                'error'
            );

            await renderCart();

            return;
        }


        await renderCart();


    } catch (error) {

        console.error(error);

        showToast(
            'Menge konnte nicht geändert werden.',
            'error'
        );
    }
}


// Checkout nur freigeben, wenn er über den Warenkorb gestartet wird
const checkoutBtn =
    document.getElementById(
        'checkoutBtn'
    );

if (checkoutBtn) {

    checkoutBtn.addEventListener(
        'click',
        () => {

            // Deaktivierter Checkout darf nicht gestartet werden
            if (checkoutBtn.disabled) {
                return;
            }

            sessionStorage.setItem(
                'checkoutAccessGranted',
                'true'
            );

            window.location.href =
                'checkout.html';
        }
    );
}


// Warenkorb beim Laden der Warenkorbseite anzeigen
renderCart();
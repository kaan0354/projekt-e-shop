// Funktionen für Kundenbestellungen und das Stornieren eigener Bestellungen

// Bestellstatus lesbar anzeigen
function formatOrderStatus(status) {

    const statusLabels = {
        offen:
            'Offen',

        in_bearbeitung:
            'In Bearbeitung',

        versendet:
            'Versendet',

        abgeschlossen:
            'Abgeschlossen',

        storniert:
            'Storniert'
    };


    return (
        statusLabels[status] ??
        status
    );
}


// Eigene Bestellungen laden
async function loadOrders() {

    const ordersList =
        document.getElementById(
            'orders-list'
        );


    const orderSearch =
        document.getElementById(
            'order-search'
        );


    const ordersHeader =
        document.querySelector(
            '.orders-header'
        );


    const loginState =
        document.getElementById(
            'orders-login-state'
        );


    if (!ordersList) {
        return;
    }


    try {

        const response =
            await fetch(
                `${API_BASE_URL}/api/orders`,
                {
                    method:
                        'GET',

                    credentials:
                        'include'
                }
            );


        const data =
            await response.json();


        if (response.status === 401) {

            if (ordersHeader) {
                ordersHeader.style.display =
                    'none';
            }


            ordersList.style.display =
                'none';


            if (loginState) {
                loginState.style.display =
                    'flex';
            }


            return;
        }


        if (!response.ok) {

            ordersList.innerHTML = `
                <p>
                    ${
                        data.message ||
                        'Bestellungen konnten nicht geladen werden.'
                    }
                </p>
            `;


            return;
        }


        if (ordersHeader) {
            ordersHeader.style.display =
                '';
        }


        ordersList.style.display =
            '';


        if (loginState) {
            loginState.style.display =
                'none';
        }


        if (data.length === 0) {

            ordersList.innerHTML =
                '<p>Du hast noch keine Bestellungen.</p>';

            return;
        }


        const groupedOrders =
            {};


        data.forEach(item => {

            if (!groupedOrders[item.id]) {

                groupedOrders[item.id] = {
                    id:
                        item.id,

                    orderNumber:
                        item.order_number,

                    invoiceNumber:
                        item.invoice_number,

                    total:
                        item.total,

                    status:
                        item.status,

                    createdAt:
                        item.created_at,

                    paymentMethod:
                        item.payment_method,

                    paymentStatus:
                        item.payment_status,

                    items: []
                };
            }


            groupedOrders[item.id].items.push({
                name:
                    item.product_name,

                image:
                    item.product_image,

                quantity:
                    item.quantity,

                unitPrice:
                    item.unit_price
            });
        });


        const orders =
            Object.values(
                groupedOrders
            ).sort(
                (a, b) =>
                    new Date(b.createdAt) -
                    new Date(a.createdAt)
            );


        // Bestellungen darstellen
const INITIAL_ORDER_LIMIT = 5;

let showAllOrders = false;


function renderOrders(
    searchValue = ''
) {

    ordersList.innerHTML =
        '';


    const normalizedSearch =
        searchValue
            .trim()
            .toLowerCase();


    const filteredOrders =
        orders.filter(order => {

            if (!normalizedSearch) {
                return true;
            }


            const searchedOrderNumber =
                `ord-${normalizedSearch}`;


            return order.orderNumber
                .toLowerCase()
                .startsWith(
                    searchedOrderNumber
                );
        });


    if (filteredOrders.length === 0) {

        ordersList.innerHTML =
            '<p>Keine passende Bestellung gefunden.</p>';

        return;
    }


    // Bei einer Suche immer alle Treffer anzeigen
    const visibleOrders =
        normalizedSearch || showAllOrders
            ? filteredOrders
            : filteredOrders.slice(
                0,
                INITIAL_ORDER_LIMIT
            );


    visibleOrders.forEach(order => {

        const orderElement =
            document.createElement(
                'div'
            );


        orderElement.classList.add(
            'order-card'
        );


        // KONFIGURATION:
        // Datumsformat für Bestellungen.
        const date =
            new Date(
                order.createdAt
            ).toLocaleString(
                'de-DE'
            );


        const previewItems =
            order.items.slice(
                0,
                3
            );


        const previewImages =
            previewItems
                .map(item => `
                    <img
                        src="${item.image}"
                        alt="${item.name}"
                        class="order-preview-image"
                    >
                `)
                .join('');


        const remainingProducts =
            order.items.length -
            previewItems.length;


        let productsHtml =
            '';


        order.items.forEach(item => {

            productsHtml += `
                <div class="order-product">

                    <img
                        src="${item.image}"
                        alt="${item.name}"
                    >

                    <div>

                        <strong>
                            ${item.name}
                        </strong>

                        <p>
                            Menge:
                            ${item.quantity}
                        </p>

                        <p>
                            Einzelpreis:
                            ${formatPrice(
                                item.unitPrice
                            )} €
                        </p>

                    </div>

                </div>
            `;
        });


        const paymentMethodText =
            order.paymentMethod === 'invoice'
                ? 'Kauf auf Rechnung'
                : 'PayPal';


        let paymentStatusText;


        if (
            order.status === 'storniert' &&
            order.paymentStatus === 'pending'
        ) {

            paymentStatusText =
                'Storniert – keine Zahlung erforderlich';

        } else if (
            order.paymentStatus === 'paid'
        ) {

            paymentStatusText =
                'Bezahlt';

        } else {

            paymentStatusText =
                'Zahlung offen';
        }


        orderElement.innerHTML = `

            <div class="order-summary">

                <div class="order-summary-left">

                    <div class="order-preview">

                        ${previewImages}

                        ${
                            remainingProducts > 0
                                ? `
                                    <span class="order-preview-more">
                                        +${remainingProducts}
                                    </span>
                                `
                                : ''
                        }

                    </div>


                    <div class="order-summary-info">

                        <h3>
                            Bestellung
                            ${order.orderNumber}
                        </h3>

                        <p>
                            ${date}
                        </p>

                    </div>

                </div>


                <div class="order-summary-right">

                    <p class="order-status">
                        ${formatOrderStatus(
                            order.status
                        )}
                    </p>

                    <strong>
                        ${formatPrice(
                            order.total
                        )} €
                    </strong>

                </div>

            </div>


            <button
                type="button"
                class="order-toggle"
            >
                Details anzeigen ↓
            </button>


            <div class="order-details">

                ${productsHtml}


                <p class="order-invoice-number">
                    Rechnungsnummer:
                    <strong>
                        ${order.invoiceNumber || '–'}
                    </strong>
                </p>


                <div class="order-payment-info">

                    <p>
                        Zahlungsart:
                        <strong>
                            ${paymentMethodText}
                        </strong>
                    </p>

                    <p>
                        Zahlungsstatus:
                        <strong>
                            ${paymentStatusText}
                        </strong>
                    </p>

                </div>


                <h4 class="order-total">
                    Gesamt:
                    ${formatPrice(
                        order.total
                    )} €
                </h4>


                ${
                    order.status === 'offen'
                        ? `
                            <button
                                type="button"
                                class="cancel-order-btn"
                                onclick="cancelOrder(${order.id})"
                            >
                                Bestellung stornieren
                            </button>
                        `
                        : ''
                }

            </div>
        `;


        const toggleButton =
            orderElement.querySelector(
                '.order-toggle'
            );


        const details =
            orderElement.querySelector(
                '.order-details'
            );


        toggleButton.addEventListener(
            'click',
            () => {

                const isOpen =
                    details.classList.toggle(
                        'show'
                    );


                toggleButton.textContent =
                    isOpen
                        ? 'Details ausblenden ↑'
                        : 'Details anzeigen ↓';
            }
        );


        ordersList.appendChild(
            orderElement
        );
    });


    // Frühere Bestellungen ein- oder ausblenden
    if (
        !normalizedSearch &&
        filteredOrders.length > INITIAL_ORDER_LIMIT
    ) {

        const showMoreButton =
            document.createElement(
                'button'
            );


        showMoreButton.type =
            'button';


        showMoreButton.classList.add(
            'orders-show-more'
        );


        showMoreButton.textContent =
            showAllOrders
                ? 'Weniger Bestellungen anzeigen'
                : 'Frühere Bestellungen ansehen';


        showMoreButton.addEventListener(
            'click',
            () => {

                showAllOrders =
                    !showAllOrders;

                renderOrders();
            }
        );


        ordersList.appendChild(
            showMoreButton
        );
    }
}


renderOrders();


        if (orderSearch) {

            orderSearch.oninput = () => {

                orderSearch.value =
                    orderSearch.value.replace(
                        /[^0-9-]/g,
                        ''
                    );


                renderOrders(
                    orderSearch.value
                );
            };
        }


    } catch (error) {

        console.error(error);


        ordersList.innerHTML =
            '<p>Bestellungen konnten nicht geladen werden.</p>';
    }
}


// Bestellung stornieren
async function cancelOrder(orderId) {

    const modal =
        document.getElementById(
            'cancel-order-modal'
        );


    const confirmButton =
        document.getElementById(
            'cancel-order-confirm'
        );


    const backButton =
        document.getElementById(
            'cancel-order-back'
        );


    if (
        !modal ||
        !confirmButton ||
        !backButton
    ) {
        return;
    }


    modal.style.display =
        'flex';


    backButton.onclick =
        () => {

            modal.style.display =
                'none';
        };


    confirmButton.onclick =
        async () => {

            modal.style.display =
                'none';


            try {

                const response =
                    await fetch(
                        `${API_BASE_URL}/api/orders/${orderId}/cancel`,
                        {
                            method:
                                'PATCH',

                            credentials:
                                'include'
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
                    'Bestellung wurde storniert.',
                    'success'
                );


                loadOrders();


            } catch (error) {

                console.error(error);


                showToast(
                    'Bestellung konnte nicht storniert werden.',
                    'error'
                );
            }
        };
}


// Bestellungen laden
loadOrders();
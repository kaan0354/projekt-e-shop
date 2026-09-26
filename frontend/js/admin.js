// Funktionen für Admin-Bestellungen, Statusänderungen und Produktverwaltung

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

// Admin-Bestellungen laden, filtern, durchsuchen und aufklappbar darstellen
async function loadProductionOrders() {

    const container =
        document.getElementById('production-orders');

    const orderSearch =
        document.getElementById('admin-order-search');

    const filterButtons =
        document.querySelectorAll('.admin-filter');


    if (!container) {
        return;
    }


    try {

        const response =
            await fetch(
                `${API_BASE_URL}/api/admin/orders`,
                {
                    credentials: 'include'
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            container.innerHTML =
                `<p>${data.message}</p>`;

            return;
        }


        const groupedOrders = {};


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

                    fullName:
                        item.full_name,

                    street:
                        item.street,

                    postalCode:
                        item.postal_code,

                    city:
                        item.city,

                    email:
                        item.email,

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


        let activeFilter =
    'all';


// Anzahl der zunächst angezeigten Bestellungen
const INITIAL_ADMIN_ORDER_LIMIT = 5;

let showAllProductionOrders =
    false;


// Bestellungen anzeigen
function renderProductionOrders() {

    container.innerHTML =
        '';


    const searchValue =
        orderSearch
            ? orderSearch.value
                .trim()
                .toLowerCase()
            : '';


    const filteredOrders =
        orders.filter(order => {

            // Bestellungen nach Bestell- oder Zahlungsstatus filtern
            let matchesFilter = true;


            if (activeFilter === 'payment_pending') {

                matchesFilter =
                    order.paymentStatus === 'pending' &&
                    order.status !== 'storniert';

            } else if (activeFilter === 'payment_paid') {

                matchesFilter =
                    order.paymentStatus === 'paid';

            } else if (activeFilter !== 'all') {

                matchesFilter =
                    order.status === activeFilter;
            }


            let matchesSearch =
                true;


            if (searchValue) {

                const searchedOrderNumber =
                    `ord-${searchValue}`;


                matchesSearch =
                    order.orderNumber
                        .toLowerCase()
                        .startsWith(
                            searchedOrderNumber
                        );
            }


            return (
                matchesFilter &&
                matchesSearch
            );
        });


    if (filteredOrders.length === 0) {

        container.innerHTML =
            '<p>Keine passenden Bestellungen gefunden.</p>';

        return;
    }


    // Bei einer Suche immer alle Treffer anzeigen
    const visibleOrders =
        searchValue || showAllProductionOrders
            ? filteredOrders
            : filteredOrders.slice(
                0,
                INITIAL_ADMIN_ORDER_LIMIT
            );


    visibleOrders.forEach(order => {

        const card =
            document.createElement(
                'div'
            );


        card.classList.add(
            'order-card'
        );


        // KONFIGURATION:
        // Datumsformat im Adminbereich.
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


        let productsHTML =
            '';


        order.items.forEach(item => {

            productsHTML += `
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


        card.innerHTML = `

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

                <div class="admin-order-details-grid">

                    <div>

                        <h4>Produkte</h4>

                        ${productsHTML}

                    </div>


                    <div>

                        <h4>Lieferadresse</h4>

                        <p>
                            ${
                                order.fullName ??
                                'Keine Adresse vorhanden'
                            }
                            <br>

                            ${order.street ?? ''}
                            <br>

                            ${order.postalCode ?? ''}
                            ${order.city ?? ''}
                        </p>

                        <p class="admin-order-email">
                            <strong>E-Mail:</strong>
                            ${order.email ?? '-'}
                        </p>

                    </div>

                </div>


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


                ${
                    order.paymentMethod === 'invoice' &&
                    order.status !== 'storniert'
                        ? `
                            <button
                                type="button"
                                class="admin-payment-paid-btn"
                                onclick="changePaymentStatus(
                                    ${order.id},
                                    '${
                                        order.paymentStatus === 'paid'
                                            ? 'pending'
                                            : 'paid'
                                    }'
                                )"
                            >
                                ${
                                    order.paymentStatus === 'paid'
                                        ? 'Als Zahlung offen markieren'
                                        : 'Als bezahlt markieren'
                                }
                            </button>
                        `
                        : ''
                }


                <h4 class="order-total">
                    Gesamt:
                    ${formatPrice(
                        order.total
                    )} €
                </h4>


                <div class="admin-status-section">

                    <h4>
                        Bestellstatus ändern
                    </h4>


                    <div class="admin-status-buttons">

                        <button
                            type="button"
                            class="admin-status-btn"
                            onclick="updateOrderStatus(${order.id}, 'offen')"
                        >
                            Offen
                        </button>

                        <button
                            type="button"
                            class="admin-status-btn"
                            onclick="updateOrderStatus(${order.id}, 'in_bearbeitung')"
                        >
                            In Bearbeitung
                        </button>

                        <button
                            type="button"
                            class="admin-status-btn"
                            onclick="updateOrderStatus(${order.id}, 'versendet')"
                        >
                            Versendet
                        </button>

                        <button
                            type="button"
                            class="admin-status-btn"
                            onclick="updateOrderStatus(${order.id}, 'abgeschlossen')"
                        >
                            Abgeschlossen
                        </button>

                        <button
                            type="button"
                            class="admin-status-btn admin-status-cancel"
                            onclick="updateOrderStatus(${order.id}, 'storniert')"
                        >
                            Storniert
                        </button>

                    </div>

                </div>

            </div>
        `;


        const toggleButton =
            card.querySelector(
                '.order-toggle'
            );


        const details =
            card.querySelector(
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


        container.appendChild(
            card
        );
    });


    // Frühere Bestellungen ein- oder ausblenden
    if (
        !searchValue &&
        filteredOrders.length > INITIAL_ADMIN_ORDER_LIMIT
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
            showAllProductionOrders
                ? 'Weniger Bestellungen anzeigen'
                : 'Frühere Bestellungen ansehen';


        showMoreButton.addEventListener(
            'click',
            () => {

                showAllProductionOrders =
                    !showAllProductionOrders;

                renderProductionOrders();
            }
        );


        container.appendChild(
            showMoreButton
        );
    }
}


renderProductionOrders();


        // Suche nach Bestellnummer
        if (orderSearch) {

            orderSearch.addEventListener(
                'input',
                () => {

                    orderSearch.value =
                        orderSearch.value.replace(
                            /[^0-9-]/g,
                            ''
                        );


                    renderProductionOrders();
                }
            );
        }


        // Bestellfilter
        filterButtons.forEach(button => {

            button.addEventListener(
                'click',
                () => {

                    filterButtons.forEach(
                        filterButton => {

                            filterButton.classList.remove(
                                'active'
                            );
                        }
                    );


                    button.classList.add(
                        'active'
                    );


                    activeFilter =
                    button.dataset.filter;


                // Beim Filterwechsel wieder nur die neuesten anzeigen
                showAllProductionOrders =
                    false;


                renderProductionOrders();
                }
            );
        });


    } catch (error) {

        console.error(error);


        container.innerHTML =
            '<p>Bestellungen konnten nicht geladen werden.</p>';
    }
}


// Bestellstatus ändern
async function updateOrderStatus(
    orderId,
    status
) {

    try {

        const response =
            await fetch(
                `${API_BASE_URL}/api/orders/${orderId}/status`,
                {
                    method: 'PATCH',

                    credentials: 'include',

                    headers: {
                        'Content-Type':
                            'application/json'
                    },

                    body:
                        JSON.stringify({
                            status
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

            return;
        }


        showToast(
            'Bestellstatus wurde aktualisiert.',
            'success'
        );


        loadProductionOrders();


    } catch (error) {

        console.error(error);


        showToast(
            'Bestellstatus konnte nicht geändert werden.',
            'error'
        );
    }
}


// Zahlungsstatus einer Rechnungsbestellung ändern
async function changePaymentStatus(
    orderId,
    paymentStatus
) {

    try {

        const response =
            await fetch(
                `${API_BASE_URL}/api/admin/orders/${orderId}/payment-status`,
                {
                    method: 'PATCH',

                    credentials: 'include',

                    headers: {
                        'Content-Type':
                            'application/json'
                    },

                    body:
                        JSON.stringify({
                            paymentStatus
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

            return;
        }


        showToast(
            data.message,
            'success'
        );


        loadProductionOrders();


    } catch (error) {

        console.error(error);


        showToast(
            'Zahlungsstatus konnte nicht geändert werden.',
            'error'
        );
    }
}

// Adminseite schützen
async function protectProductionPage() {

    const productionPage =
        document.getElementById(
            'production-orders'
        );


    if (!productionPage) {
        return;
    }


    try {

        const response =
            await fetch(
                `${API_BASE_URL}/api/me`,
                {
                    credentials:
                        'include'
                }
            );


        if (!response.ok) {

            window.location.href =
                'login.html';

            return;
        }


        const data =
            await response.json();


        if (data.user.role !== 'admin') {

            showToast(
                'Keine Berechtigung für die Produktionsseite.',
                'info'
            );


            window.location.href =
                'index.html';
        }


    } catch (error) {

        console.error(error);


        window.location.href =
            'login.html';
    }
}


// Produkte übersichtlich und aufklappbar anzeigen
async function loadAdminProducts() {

    const container =
        document.getElementById(
            'admin-product-list'
        );


    if (!container) {
        return;
    }


    try {

        const response =
            await fetch(
                `${API_BASE_URL}/api/admin/products`,
                {
                    credentials:
                        'include'
                }
            );


        const products =
            await response.json();


        if (!response.ok) {

            showToast(
                products.message,
                'error'
            );

            return;
        }


        container.innerHTML =
            '';


        if (products.length === 0) {

            container.innerHTML =
                '<p>Keine Produkte vorhanden.</p>';

            return;
        }


        const activeProducts =
            products.filter(
                product =>
                    !Boolean(
                        product.is_archived
                    )
            );


        const archivedProducts =
            products.filter(
                product =>
                    Boolean(
                        product.is_archived
                    )
            );


        // Produktkarte erstellen
        function createProductCard(
            product,
            isArchived
        ) {

            const productElement =
                document.createElement(
                    'div'
                );


            productElement.classList.add(
                'admin-product-card'
            );


            if (isArchived) {

                productElement.classList.add(
                    'admin-product-archived'
                );
            }


            const isAvailable =
                Boolean(
                    product.is_available
                );


            const showOnHomepage =
                Boolean(
                    product.show_on_homepage
                );


            const homepagePosition =
                product.homepage_position === null
                    ? null
                    : Number(
                        product.homepage_position
                    );


            productElement.innerHTML = `

                <div class="admin-product-summary">

                    <div class="admin-product-summary-left">

                        <img
                            src="${product.image}"
                            alt="${product.name}"
                            class="admin-product-image"
                        >

                        <div class="admin-product-summary-text">

                            <h3>
                                ${product.name}
                            </h3>

                            ${
                                isArchived
                                    ? `
                                        <span class="admin-product-mini-status archived">
                                            Archiviert
                                        </span>
                                    `
                                    : `
                                        <span
                                            class="
                                                admin-product-mini-status
                                                ${
                                                    isAvailable
                                                        ? 'available'
                                                        : 'unavailable'
                                                }
                                            "
                                        >
                                            ${
                                                isAvailable
                                                    ? 'Verfügbar'
                                                    : 'Nicht verfügbar'
                                            }
                                        </span>
                                    `
                            }

                            ${
                                showOnHomepage &&
                                !isArchived
                                    ? `
                                        <span class="admin-product-home-position">
                                            Startseite · Position ${homepagePosition}
                                        </span>
                                    `
                                    : ''
                            }

                        </div>

                    </div>


                    <button
                        type="button"
                        class="admin-product-details-toggle"
                    >
                        Details anzeigen
                        <span>↓</span>
                    </button>

                </div>


                <div class="admin-product-details">

                    <div class="admin-product-details-content">

                        <div class="admin-product-edit">

                            <label>
                                Name

                                <input
                                    type="text"
                                    class="admin-product-name"
                                    value="${product.name}"
                                    ${isArchived ? 'disabled' : ''}
                                >
                            </label>


                            <label>
                                Beschreibung

                                <textarea
                                    class="admin-product-description"
                                    ${isArchived ? 'disabled' : ''}
                                >${product.description}</textarea>
                            </label>


                            <div class="admin-product-edit-row">

                                <label>
                                    Preis

                                    <input
                                        type="number"
                                        class="admin-product-price"
                                        value="${product.price}"
                                        min="0"
                                        step="0.01"
                                        ${isArchived ? 'disabled' : ''}
                                    >
                                </label>


                                <label>
                                    Bestand

                                    <input
                                        type="number"
                                        class="admin-product-stock"
                                        value="${product.stock}"
                                        min="0"
                                        step="1"
                                        ${isArchived ? 'disabled' : ''}
                                    >
                                </label>

                            </div>


                            <label>
                                Hauptbild

                                <input
                                    type="text"
                                    class="admin-product-image-input"
                                    value="${product.image}"
                                    ${isArchived ? 'disabled' : ''}
                                >
                            </label>


                            <label>
                                Zusätzliche Bilder

                                <textarea
                                    class="admin-product-additional-images"
                                    placeholder="Ein Bildpfad pro Zeile"
                                    ${isArchived ? 'disabled' : ''}
                                ></textarea>
                            </label>


                            ${
                                !isArchived
                                    ? `
                                        <button
                                            type="button"
                                            class="admin-product-save"
                                        >
                                            Änderungen speichern
                                        </button>
                                    `
                                    : ''
                            }

                        </div>


                        <div class="admin-product-detail-actions">

                            ${
                                !isArchived
                                    ? `
                                        <div class="admin-homepage-control">

                                            <label>
                                                Startseite

                                                <select
                                                    class="admin-homepage-position"
                                                >

                                                    <option
                                                        value=""
                                                        ${
                                                            !showOnHomepage
                                                                ? 'selected'
                                                                : ''
                                                        }
                                                    >
                                                        Nicht anzeigen
                                                    </option>

                                                    <option
                                                        value="1"
                                                        ${
                                                            homepagePosition === 1
                                                                ? 'selected'
                                                                : ''
                                                        }
                                                    >
                                                        Position 1
                                                    </option>

                                                    <option
                                                        value="2"
                                                        ${
                                                            homepagePosition === 2
                                                                ? 'selected'
                                                                : ''
                                                        }
                                                    >
                                                        Position 2
                                                    </option>

                                                    <option
                                                        value="3"
                                                        ${
                                                            homepagePosition === 3
                                                                ? 'selected'
                                                                : ''
                                                        }
                                                    >
                                                        Position 3
                                                    </option>

                                                </select>

                                            </label>

                                        </div>


                                        <button
                                            type="button"
                                            class="
                                                admin-product-toggle
                                                ${
                                                    isAvailable
                                                        ? 'deactivate'
                                                        : 'activate'
                                                }
                                            "
                                        >
                                            ${
                                                isAvailable
                                                    ? 'Deaktivieren'
                                                    : 'Aktivieren'
                                            }
                                        </button>


                                        <button
                                            type="button"
                                            class="admin-product-archive"
                                        >
                                            Produkt archivieren
                                        </button>
                                    `
                                    : `
                                        <button
                                            type="button"
                                            class="admin-product-restore"
                                        >
                                            Wiederherstellen
                                        </button>
                                    `
                            }

                        </div>

                    </div>

                </div>
            `;


            const detailsToggle =
                productElement.querySelector(
                    '.admin-product-details-toggle'
                );


            const details =
                productElement.querySelector(
                    '.admin-product-details'
                );


            detailsToggle.addEventListener(
                'click',
                () => {

                    const isOpen =
                        details.classList.toggle(
                            'show'
                        );


                    detailsToggle.innerHTML =
                        isOpen
                            ? 'Details ausblenden <span>↑</span>'
                            : 'Details anzeigen <span>↓</span>';
                }
            );


            if (isArchived) {

                const restoreButton =
                    productElement.querySelector(
                        '.admin-product-restore'
                    );


                restoreButton.addEventListener(
                    'click',
                    () => {

                        restoreProduct(
                            product.id
                        );
                    }
                );


                return productElement;
            }


            const homepageSelect =
                productElement.querySelector(
                    '.admin-homepage-position'
                );


            homepageSelect.addEventListener(
                'change',
                () => {

                    const position =
                        homepageSelect.value === ''
                            ? null
                            : Number(
                                homepageSelect.value
                            );


                    updateHomepageProduct(
                        product.id,
                        position
                    );
                }
            );


            const toggleButton =
                productElement.querySelector(
                    '.admin-product-toggle'
                );


            toggleButton.addEventListener(
                'click',
                () => {

                    updateProductAvailability(
                        product.id,
                        !isAvailable
                    );
                }
            );


            const archiveButton =
                productElement.querySelector(
                    '.admin-product-archive'
                );


            archiveButton.addEventListener(
                'click',
                () => {

                    archiveProduct(
                        product.id
                    );
                }
            );


            const nameInput =
                productElement.querySelector(
                    '.admin-product-name'
                );

            const descriptionInput =
                productElement.querySelector(
                    '.admin-product-description'
                );

            const priceInput =
                productElement.querySelector(
                    '.admin-product-price'
                );

            const stockInput =
                productElement.querySelector(
                    '.admin-product-stock'
                );

            const imageInput =
                productElement.querySelector(
                    '.admin-product-image-input'
                );

            // Zusätzliche Bilder und Speichern-Button des Produkts
            const additionalImagesInput =
                productElement.querySelector(
                    '.admin-product-additional-images'
                );

            const saveButton =
                productElement.querySelector(
                    '.admin-product-save'
                );


            // Zusatzbilder laden
            fetch(
                `${API_BASE_URL}/api/products/${product.id}`
            )
                .then(response =>
                    response.json()
                )
                .then(productDetails => {

                    if (
                        Array.isArray(
                            productDetails.additional_images
                        )
                    ) {

                        additionalImagesInput.value =
                            productDetails.additional_images
                                .map(
                                    image =>
                                        image.image_url
                                )
                                .join('\n');
                    }
                })
                .catch(error => {
                    console.error(error);
                });


            saveButton.addEventListener(
                'click',
                () => {

                    const additionalImages =
                        additionalImagesInput.value
                            .split('\n')
                            .map(
                                image =>
                                    image.trim()
                            )
                            .filter(
                                image =>
                                    image.length > 0
                            );


                    updateProduct(
                        product.id,
                        {
                            name:
                                nameInput.value,

                            description:
                                descriptionInput.value,

                            price:
                                priceInput.value,

                            stock:
                                stockInput.value,

                            image:
                                imageInput.value,

                            additionalImages:
                                additionalImages
                        }
                    );
                }
            );


            return productElement;
        }


        const activeSection =
            document.createElement(
                'div'
            );


        activeSection.classList.add(
            'admin-active-products'
        );


        if (activeProducts.length === 0) {

            activeSection.innerHTML =
                '<p>Keine aktiven Produkte vorhanden.</p>';

        } else {

            activeProducts.forEach(product => {

                activeSection.appendChild(
                    createProductCard(
                        product,
                        false
                    )
                );
            });
        }


        container.appendChild(
            activeSection
        );


        if (archivedProducts.length > 0) {

            const archiveSection =
                document.createElement(
                    'div'
                );


            archiveSection.classList.add(
                'admin-archive-section'
            );


            archiveSection.innerHTML = `

                <button
                    type="button"
                    class="admin-archive-section-toggle"
                >
                    <div>
                        <strong>
                            Archivierte Produkte
                        </strong>

                        <span class="admin-archive-count">
                            ${archivedProducts.length}
                        </span>
                    </div>

                    <span class="admin-archive-arrow">
                        ↓
                    </span>
                </button>


                <div class="admin-archive-products"></div>
            `;


            const archiveToggle =
                archiveSection.querySelector(
                    '.admin-archive-section-toggle'
                );

            const archiveContainer =
                archiveSection.querySelector(
                    '.admin-archive-products'
                );

            const archiveArrow =
                archiveSection.querySelector(
                    '.admin-archive-arrow'
                );


            archivedProducts.forEach(product => {

                archiveContainer.appendChild(
                    createProductCard(
                        product,
                        true
                    )
                );
            });


            archiveToggle.addEventListener(
                'click',
                () => {

                    const isOpen =
                        archiveContainer.classList.toggle(
                            'show'
                        );


                    archiveArrow.textContent =
                        isOpen
                            ? '↑'
                            : '↓';
                }
            );


            container.appendChild(
                archiveSection
            );
        }


    } catch (error) {

        console.error(error);


        showToast(
            'Produkte konnten nicht geladen werden.',
            'error'
        );
    }
}


// Startseitenposition eines Produkts ändern
async function updateHomepageProduct(
    productId,
    position
) {

    try {

        const response =
            await fetch(
                `${API_BASE_URL}/api/admin/products/${productId}/homepage`,
                {
                    method:
                        'PATCH',

                    credentials:
                        'include',

                    headers: {
                        'Content-Type':
                            'application/json'
                    },

                    body:
                        JSON.stringify({
                            position:
                                position
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


            loadAdminProducts();

            return;
        }


        showToast(
            data.message,
            'success'
        );


        loadAdminProducts();


    } catch (error) {

        console.error(error);


        showToast(
            'Startseitenposition konnte nicht geändert werden.',
            'error'
        );


        loadAdminProducts();
    }
}


// Produkt archivieren
async function archiveProduct(productId) {

    try {

        const response =
            await fetch(
                `${API_BASE_URL}/api/admin/products/${productId}/archive`,
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
            'Produkt wurde archiviert.',
            'success'
        );


        loadAdminProducts();


    } catch (error) {

        console.error(error);


        showToast(
            'Produkt konnte nicht archiviert werden.',
            'error'
        );
    }
}


// Archiviertes Produkt wiederherstellen
async function restoreProduct(productId) {

    try {

        const response =
            await fetch(
                `${API_BASE_URL}/api/admin/products/${productId}/restore`,
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
            'Produkt wurde wiederhergestellt.',
            'success'
        );


        loadAdminProducts();


    } catch (error) {

        console.error(error);


        showToast(
            'Produkt konnte nicht wiederhergestellt werden.',
            'error'
        );
    }
}


// Verfügbarkeit eines Produkts ändern
async function updateProductAvailability(
    productId,
    isAvailable
) {

    try {

        const response =
            await fetch(
                `${API_BASE_URL}/api/admin/products/${productId}/availability`,
                {
                    method:
                        'PATCH',

                    credentials:
                        'include',

                    headers: {
                        'Content-Type':
                            'application/json'
                    },

                    body:
                        JSON.stringify({
                            isAvailable:
                                isAvailable
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

            return;
        }


        showToast(
            'Produktverfügbarkeit wurde geändert.',
            'success'
        );


        loadAdminProducts();


    } catch (error) {

        console.error(error);


        showToast(
            'Produktverfügbarkeit konnte nicht geändert werden.',
            'error'
        );
    }
}

// Produktdaten bearbeiten
async function updateProduct(
    productId,
    productData
) {

    const price =
        Number(
            productData.price
        );

    const stock =
        Number(
            productData.stock
        );


    if (
        !productData.name.trim() ||
        !productData.description.trim() ||
        !productData.image.trim() ||
        !Number.isFinite(price) ||
        price < 0 ||
        !Number.isInteger(stock) ||
        stock < 0
    ) {

        showToast(
            'Bitte alle Produktdaten gültig eingeben.',
            'error'
        );

        return;
    }


    try {

        const response =
            await fetch(
                `${API_BASE_URL}/api/admin/products/${productId}`,
                {
                    method:
                        'PATCH',

                    credentials:
                        'include',

                    headers: {
                        'Content-Type':
                            'application/json'
                    },

                    body:
                        JSON.stringify({
                            name:
                                productData.name.trim(),

                            description:
                                productData.description.trim(),

                            price:
                                price,

                            stock:
                                stock,

                            image:
                                productData.image.trim()
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

            return;
        }


        // Zusätzliche Produktbilder speichern
        const imagesResponse =
            await fetch(
                `${API_BASE_URL}/api/admin/products/${productId}/images`,
                {
                    method:
                        'PATCH',

                    credentials:
                        'include',

                    headers: {
                        'Content-Type':
                            'application/json'
                    },

                    body:
                        JSON.stringify({
                            images:
                                productData.additionalImages
                        })
                }
            );


        const imagesData =
            await imagesResponse.json();


        if (!imagesResponse.ok) {

            showToast(
                imagesData.message,
                'error'
            );

            return;
        }


        showToast(
            'Produkt wurde aktualisiert.',
            'success'
        );


        loadAdminProducts();


    } catch (error) {

        console.error(error);


        showToast(
            'Produkt konnte nicht aktualisiert werden.',
            'error'
        );
    }
}


// Produktbestand ändern
async function updateProductStock(
    productId,
    stock
) {

    stock =
        Number(stock);


    if (
        !Number.isInteger(stock) ||
        stock < 0
    ) {

        showToast(
            'Bitte einen gültigen Bestand eingeben.',
            'error'
        );

        return;
    }


    try {

        const response =
            await fetch(
                `${API_BASE_URL}/api/admin/products/${productId}/stock`,
                {
                    method:
                        'PATCH',

                    credentials:
                        'include',

                    headers: {
                        'Content-Type':
                            'application/json'
                    },

                    body:
                        JSON.stringify({
                            stock:
                                stock
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

            return;
        }


        showToast(
            'Produktbestand wurde aktualisiert.',
            'success'
        );


        loadAdminProducts();


    } catch (error) {

        console.error(error);


        showToast(
            'Produktbestand konnte nicht geändert werden.',
            'error'
        );
    }
}


// Neues Produkt anlegen
async function createProduct() {

    const name =
        document.getElementById(
            'new-product-name'
        ).value.trim();


    const description =
        document.getElementById(
            'new-product-description'
        ).value.trim();


    const price =
        Number(
            document.getElementById(
                'new-product-price'
            ).value
        );


    const stock =
        Number(
            document.getElementById(
                'new-product-stock'
            ).value
        );


    const image =
        document.getElementById(
            'new-product-image'
        ).value.trim();


    if (
        !name ||
        !description ||
        !image ||
        !Number.isFinite(price) ||
        price < 0 ||
        !Number.isInteger(stock) ||
        stock < 0
    ) {

        showToast(
            'Bitte alle Produktdaten gültig eingeben.',
            'error'
        );

        return;
    }


    try {

        const response =
            await fetch(
                `${API_BASE_URL}/api/admin/products`,
                {
                    method:
                        'POST',

                    credentials:
                        'include',

                    headers: {
                        'Content-Type':
                            'application/json'
                    },

                    body:
                        JSON.stringify({
                            name,
                            description,
                            price,
                            stock,
                            image
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

            return;
        }


        showToast(
            'Produkt wurde hinzugefügt.',
            'success'
        );


        document.getElementById(
            'new-product-name'
        ).value = '';


        document.getElementById(
            'new-product-description'
        ).value = '';


        document.getElementById(
            'new-product-price'
        ).value = '';


        document.getElementById(
            'new-product-stock'
        ).value = '';


        document.getElementById(
            'new-product-image'
        ).value = '';


        loadAdminProducts();


    } catch (error) {

        console.error(error);


        showToast(
            'Produkt konnte nicht hinzugefügt werden.',
            'error'
        );
    }
}


// Button zum Anlegen eines Produkts
const createProductButton =
    document.getElementById(
        'admin-create-product'
    );


if (createProductButton) {

    createProductButton.addEventListener(
        'click',
        createProduct
    );
}


// Adminfunktionen starten
protectProductionPage();
loadProductionOrders();
loadAdminProducts();
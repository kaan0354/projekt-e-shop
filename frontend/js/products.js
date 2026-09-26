// Produktfunktionen für Startseite, Shop und Produktdetailseite

let currentProduct = null;


// Produkte auf der Shopseite laden
async function loadProducts() {
    try {
        const response = await fetch(
            `${API_BASE_URL}/api/products`
        );

        if (!response.ok) {
            throw new Error(
                'Produkte konnten nicht geladen werden'
            );
        }

        const products = await response.json();

        const productList =
            document.getElementById('product-list');

        // Nur auf der Shopseite ausführen
        if (!productList) {
            return;
        }

        productList.innerHTML = '';

        products.forEach(product => {

            const productCard =
                document.createElement('div');

            productCard.classList.add('produkt1');

            // Nicht verfügbare Produkte kennzeichnen
            if (
                !product.is_available ||
                product.stock <= 0
            ) {
                productCard.classList.add(
                    'product-unavailable'
                );
            }

            productCard.addEventListener(
                'click',
                () => {
                    window.location.href =
                        `produkt.html?id=${product.id}`;
                }
            );

            const image =
                document.createElement('img');

            image.src = product.image;
            image.alt = product.name;

            const description =
                document.createElement('div');

            description.classList.add(
                'beschreibung'
            );

            const productText =
                document.createElement('span');

            productText.textContent =
                product.description;

            const name =
                document.createElement('h5');

            name.textContent =
                product.name;

            const price =
                document.createElement('h4');

            price.textContent =
                `${formatPrice(product.price)} €`;

            // Verfügbarkeitsstatus anzeigen
            if (
                !product.is_available ||
                product.stock <= 0
            ) {
                const availability =
                    document.createElement('p');

                availability.textContent =
                    'Momentan nicht verfügbar';

                availability.classList.add(
                    'availability-message'
                );

                description.appendChild(
                    availability
                );
            }

            description.appendChild(productText);
            description.appendChild(name);
            description.appendChild(price);

            productCard.appendChild(image);
            productCard.appendChild(description);

            productList.appendChild(productCard);
        });

    } catch (error) {
        console.error(
            'Fehler beim Laden der Produkte:',
            error
        );
    }
}

loadProducts();


// Fehlerzustand auf der Produktseite anzeigen
function showProductError(title, message) {

    const productContent =
        document.querySelector(
            '[data-product-content]'
        );

    const errorState =
        document.getElementById(
            'product-error-state'
        );

    const errorTitle =
        document.getElementById(
            'product-error-title'
        );

    const errorMessage =
        document.getElementById(
            'product-error-message'
        );

    if (productContent) {
        productContent.style.display =
            'none';
    }

    if (errorTitle) {
        errorTitle.textContent =
            title;
    }

    if (errorMessage) {
        errorMessage.textContent =
            message;
    }

    if (errorState) {
        errorState.style.display =
            'flex';
    }
}


// Einzelnes Produkt auf der Produktdetailseite laden
async function loadProductDetails() {

    const productName =
        document.getElementById(
            'product-name'
        );

    // Nur auf produkt.html ausführen
    if (!productName) {
        return;
    }

    try {
        const params =
            new URLSearchParams(
                window.location.search
            );

        const productId =
            params.get('id');

        if (
            !productId ||
            !/^\d+$/.test(productId)
        ) {
            showProductError(
                'Ungültiges Produkt',
                'Das gewünschte Produkt konnte nicht gefunden werden.'
            );

            return;
        }


        // Produkt laden
        const response = await fetch(
            `${API_BASE_URL}/api/products/${productId}`
        );

        if (response.status === 404) {
            showProductError(
                'Produkt nicht gefunden',
                'Dieses Produkt existiert nicht oder wurde entfernt.'
            );

            return;
        }

        if (!response.ok) {
            throw new Error(
                'Produkt konnte nicht geladen werden'
            );
        }

        const product =
            await response.json();

        currentProduct =
            product;


        // Kaufbereich vorbereiten
        const addToCartButton =
            document.getElementById(
                'add-to-cart'
            );

        const quantityInput =
            document.getElementById(
                'product-quantity'
            );

        const unavailableMessage =
            document.getElementById(
                'product-unavailable-message'
            );

        const loginButton =
            document.getElementById(
                'product-login-button'
            );


        // Kaufbereich je nach Verfügbarkeit
        // und Login-Status anzeigen
        if (
            !product.is_available ||
            product.stock <= 0
        ) {

            if (addToCartButton) {
                addToCartButton.style.display =
                    'none';
            }

            if (quantityInput) {
                quantityInput.style.display =
                    'none';
            }

            if (loginButton) {
                loginButton.style.display =
                    'none';
            }

            if (unavailableMessage) {
                unavailableMessage.style.display =
                    'block';
            }

        } else {

            try {
                const meResponse =
                    await fetch(
                        `${API_BASE_URL}/api/me`,
                        {
                            credentials:
                                'include'
                        }
                    );

                if (!meResponse.ok) {

                    if (addToCartButton) {
                        addToCartButton.style.display =
                            'none';
                    }

                    if (quantityInput) {
                        quantityInput.style.display =
                            'none';
                    }

                    if (loginButton) {
                        loginButton.style.display =
                            'inline-block';
                    }

                } else {

                    if (addToCartButton) {
                        addToCartButton.style.display =
                            '';
                    }

                    if (quantityInput) {
                        quantityInput.style.display =
                            '';
                    }

                    if (loginButton) {
                        loginButton.style.display =
                            'none';
                    }
                }

            } catch (error) {
                console.error(error);
            }
        }


        // Produktdaten anzeigen
        document.getElementById(
            'product-name'
        ).textContent =
            product.name;

        document.getElementById(
            'product-price'
        ).textContent =
            `${formatPrice(product.price)} €`;

        document.getElementById(
            'product-description'
        ).textContent =
            product.description;

        document.getElementById(
            'product-image'
        ).src =
            product.image;

        document.getElementById(
            'product-image'
        ).alt =
            product.name;


        // Zusätzliche Produktbilder anzeigen
        const mainImage =
            document.getElementById(
                'product-image'
            );

        const thumbnails =
            document.getElementById(
                'product-thumbnails'
            );

        if (mainImage && thumbnails) {

            const productImages = [
                product.image,
                ...(
                    product.additional_images || []
                ).map(
                    image =>
                        image.image_url
                )
            ];

            thumbnails.innerHTML = '';

            productImages.forEach(
                (imagePath, index) => {

                    const thumbnail =
                        document.createElement(
                            'img'
                        );

                    thumbnail.src =
                        imagePath;

                    thumbnail.alt =
                        `${product.name} Bild ${index + 1}`;

                    thumbnail.classList.add(
                        'product-thumbnail'
                    );

                    if (index === 0) {
                        thumbnail.classList.add(
                            'active'
                        );
                    }


                    // Großes Produktbild wechseln
                    thumbnail.addEventListener(
                        'click',
                        () => {

                            mainImage.src =
                                imagePath;

                            thumbnails
                                .querySelectorAll(
                                    '.product-thumbnail'
                                )
                                .forEach(image => {

                                    image.classList.remove(
                                        'active'
                                    );
                                });

                            thumbnail.classList.add(
                                'active'
                            );
                        }
                    );


                    thumbnails.appendChild(
                        thumbnail
                    );
                }
            );
        }


        // Verfügbaren Produktbestand anzeigen
        const productStock =
            document.getElementById(
                'product-stock'
            );

        if (productStock) {

            if (
                product.is_available &&
                product.stock > 0
            ) {

                productStock.textContent =
                    `Noch ${product.stock} Stück verfügbar`;

                productStock.style.display =
                    '';

            } else {

                productStock.textContent =
                    '';

                productStock.style.display =
                    'none';
            }
        }


    } catch (error) {

        console.error(error);

        showProductError(
            'Produkt konnte nicht geladen werden',
            'Beim Laden des Produkts ist ein Fehler aufgetreten. Bitte versuche es später erneut.'
        );

        return;
    }


    // Produkt in den accountgebundenen Warenkorb legen
    const addToCartButton =
        document.getElementById(
            'add-to-cart'
        );

    if (addToCartButton) {

        addToCartButton.addEventListener(
            'click',
            async () => {

                try {

                    const meResponse =
                        await fetch(
                            `${API_BASE_URL}/api/me`,
                            {
                                credentials:
                                    'include'
                            }
                        );

                    if (!meResponse.ok) {

                        showToast(
                            'Bitte melde dich zuerst an, um Produkte in den Warenkorb zu legen.',
                            'info'
                        );

                        return;
                    }


                    if (!currentProduct) {

                        showToast(
                            'Produkt konnte nicht geladen werden.',
                            'error'
                        );

                        return;
                    }


                    const quantityInput =
                        document.getElementById(
                            'product-quantity'
                        );


                    // Menge auf den vorhandenen Bestand begrenzen
                    if (quantityInput) {
                        quantityInput.max =
                            currentProduct.stock;
                    }


                    const quantity =
                        parseInt(
                            quantityInput.value
                        );


                    const response =
                        await fetch(
                            `${API_BASE_URL}/api/cart`,
                            {
                                method: 'POST',

                                credentials:
                                    'include',

                                headers: {
                                    'Content-Type':
                                        'application/json'
                                },

                                body:
                                    JSON.stringify({
                                        productId:
                                            currentProduct.id,

                                        quantity:
                                            quantity
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
                        `${currentProduct.name} wurde zum Warenkorb hinzugefügt.`,
                        'success'
                    );


                } catch (error) {

                    console.error(error);

                    showToast(
                        'Warenkorb konnte nicht aktualisiert werden.',
                        'error'
                    );
                }
            }
        );
    }
}

loadProductDetails();


// Produkte auf der Startseite laden
async function loadHomeProducts() {

    const container =
        document.getElementById(
            'home-product-list'
        );

    if (!container) {
        return;
    }

    try {

        const response = await fetch(
            `${API_BASE_URL}/api/products`
        );

        if (!response.ok) {
            throw new Error(
                'Produkte konnten nicht geladen werden.'
            );
        }


        const products =
            await response.json();


        // Startseitenprodukte nach ihrer festgelegten Position sortieren
        const homeProducts =
            products
                .filter(
                    product =>
                        Boolean(
                            product.show_on_homepage
                        )
                )
                .sort(
                    (a, b) =>
                        Number(a.homepage_position) -
                        Number(b.homepage_position)
                );


        container.innerHTML = '';


        homeProducts.forEach(product => {

            const card =
                document.createElement('div');

            card.classList.add(
                'home-product-card'
            );


            // Nicht verfügbare Produkte kennzeichnen
            if (
                !product.is_available ||
                product.stock <= 0
            ) {
                card.classList.add(
                    'product-unavailable'
                );
            }


            card.addEventListener(
                'click',
                () => {

                    window.location.href =
                        `produkt.html?id=${product.id}`;
                }
            );


            card.innerHTML = `
                <img
                    src="${product.image}"
                    alt="${product.name}"
                >

                <h4>
                    ${product.name}
                </h4>

                <p>
                    ${formatPrice(product.price)} €
                </p>

                ${
                    !product.is_available ||
                    product.stock <= 0
                        ? `
                            <p class="availability-message">
                                Momentan nicht verfügbar
                            </p>
                          `
                        : ''
                }
            `;


            container.appendChild(
                card
            );
        });


    } catch (error) {

        console.error(
            'Fehler beim Laden der Startseitenprodukte:',
            error
        );
    }
}

loadHomeProducts();
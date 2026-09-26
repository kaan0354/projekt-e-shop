// Allgemeine Funktionen, die auf mehreren Seiten des Shops verwendet werden

// WICHTIGE KONFIGURATION:
// Adresse des Backends.
// Für die lokale Entwicklung wird Port 3000 verwendet.
// Bei einer Serverbereitstellung durch die tatsächliche Backend-Adresse ersetzen.
const API_BASE_URL = 'http://127.0.0.1:3000';


// Prüfen, ob das Backend erreichbar ist und bei Ausfall eine Fehlerseite anzeigen
async function checkServerAvailability() {
    try {
        const response = await fetch(
            `${API_BASE_URL}/api/me`,
            {
                credentials: 'include'
            }
        );

        // 401 ist okay: Server lebt, User ist nur nicht eingeloggt
        if (response.status === 401 || response.ok) {
            return;
        }

        throw new Error('Server nicht verfügbar');

    } catch (error) {

        // Server-Ausfall mit Offline-Logo anzeigen
        document.body.innerHTML = `
            <main style="
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                text-align: center;
                padding: 40px;
            ">
                <div>

                    <img
                        src="img/fisch dead.png"
                        alt="Server nicht verfügbar"
                        style="
                            width: 150px;
                            height: auto;
                            margin-bottom: 25px;
                        "
                    >

                    <h1>
                        Unsere Seite ist derzeit nicht verfügbar.
                    </h1>

                    <p>
                        Bitte versuche es später erneut.
                    </p>

                </div>
            </main>
        `;
    }
}

checkServerAvailability();


// Toast-Nachrichten anzeigen
function showToast(message, type = 'success') {
    const toast =
        document.getElementById('toast');

    if (!toast) {
        return;
    }

    toast.textContent =
        message;

    toast.className = '';
    toast.classList.add(type);
    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}


// Header je nach Login-Status anpassen
async function updateHeaderForLoginState() {

    const ordersNav =
        document.getElementById('orders-nav');

    const cartNav =
        document.getElementById('cart-nav');

    // Konto-Link vorbereiten
    const accountLink =
        document.getElementById('account-name');

    const adminDropdownLink =
        document.getElementById('admin-dropdown-link');

    const loggedInElements =
        document.querySelectorAll('.logged-in-only');

    const loggedOutElements =
        document.querySelectorAll('.logged-out-only');

    const headerUsername =
        document.getElementById('header-username');

    try {

        const response = await fetch(
            `${API_BASE_URL}/api/me`,
            {
                credentials: 'include'
            }
        );

        const isLoggedIn =
            response.ok;

        // Konto-Link je nach Login-Status setzen
        if (accountLink) {
            accountLink.href =
                isLoggedIn
                    ? 'konto.html'
                    : 'login.html';
        }

        let data = null;

        if (isLoggedIn) {
            data =
                await response.json();
        }

        // Benutzername im Header anzeigen
        if (headerUsername) {

            if (isLoggedIn) {

                headerUsername.textContent =
                    `Angemeldet als: ${data.user.username}`;

                headerUsername.style.display =
                    'block';

            } else {

                headerUsername.textContent =
                    '';

                headerUsername.style.display =
                    'none';
            }
        }

        // Admin-Link nur für Admins anzeigen
        if (adminDropdownLink) {

            if (
                isLoggedIn &&
                data.user.role === 'admin'
            ) {

                adminDropdownLink.style.display =
                    'list-item';

            } else {

                adminDropdownLink.style.display =
                    'none';
            }
        }

        // Loginabhängige Dropdown-Einträge anzeigen
        loggedInElements.forEach(element => {

            element.style.display =
                isLoggedIn
                    ? 'list-item'
                    : 'none';
        });

        loggedOutElements.forEach(element => {

            element.style.display =
                isLoggedIn
                    ? 'none'
                    : 'list-item';
        });

        // Bestellungen anzeigen
        if (ordersNav) {

            ordersNav.style.display =
                isLoggedIn
                    ? 'list-item'
                    : 'none';
        }

        // Warenkorb anzeigen
        if (cartNav) {

            cartNav.style.display =
                isLoggedIn
                    ? 'list-item'
                    : 'none';
        }

    } catch (error) {

        console.error(error);

        if (ordersNav) {
            ordersNav.style.display =
                'none';
        }

        if (cartNav) {
            cartNav.style.display =
                'none';
        }
    }
}

updateHeaderForLoginState();


// Benutzer ausloggen
const logoutLink =
    document.getElementById('logout-link');

if (logoutLink) {

    logoutLink.addEventListener(
        'click',
        async (event) => {

            event.preventDefault();

            try {

                const response = await fetch(
                    `${API_BASE_URL}/api/logout`,
                    {
                        method: 'POST',
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
                    data.message,
                    'info'
                );

                window.location.href =
                    'index.html';

            } catch (error) {

                console.error(error);

                showToast(
                    'Logout fehlgeschlagen.',
                    'error'
                );
            }
        }
    );
}

// Konto-Dropdown auf Touch-Geräten öffnen
const accountDropdown =
    document.querySelector('.konto-dropdown');

const accountDropdownLink =
    document.getElementById('account-name');

if (accountDropdown && accountDropdownLink) {

    accountDropdownLink.addEventListener('click', (event) => {

        // Auf Geräten ohne Hover das Dropdown per Touch öffnen
        if (window.matchMedia('(hover: none)').matches) {

            event.preventDefault();

            accountDropdown.classList.toggle('touch-open');
        }
    });

    // Dropdown schließen, wenn außerhalb getippt wird
    document.addEventListener('click', (event) => {

        if (!accountDropdown.contains(event.target)) {
            accountDropdown.classList.remove('touch-open');
        }
    });
}

// Preise im deutschen Format anzeigen
function formatPrice(price) {

    // KONFIGURATION:
    // Zahlenformat für Preisangaben im Shop.
    return Number(price).toLocaleString(
        'de-DE',
        {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }
    );
}
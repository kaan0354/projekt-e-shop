// Funktionen für Registrierung, Login, E-Mail-Verifizierung und Passwort-Reset

// Registrierung validieren und neues Benutzerkonto an das Backend senden
const registerForm =
    document.getElementById('register-form');

if (registerForm) {

    registerForm.addEventListener(
        'submit',
        async (event) => {

            event.preventDefault();

            const username =
                document
                    .getElementById('new-username')
                    .value
                    .trim();

            const email =
                document
                    .getElementById('new-email')
                    .value
                    .trim()
                    .toLowerCase();

            const password =
                document
                    .getElementById('new-password')
                    .value;


            // KONFIGURATION:
            // Muss zu den Vorgaben im Backend passen.
            if (
                username.length < 3 ||
                username.length > 30
            ) {
                showToast(
                    'Der Benutzername muss zwischen 3 und 30 Zeichen lang sein.',
                    'error'
                );

                return;
            }


            // E-Mail-Format prüfen
            const emailRegex =
                /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            if (!emailRegex.test(email)) {
                showToast(
                    'Bitte gib eine gültige E-Mail-Adresse ein.',
                    'error'
                );

                return;
            }


            // KONFIGURATION:
            // Muss zur Mindestlänge im Backend passen.
            if (password.length < 8) {
                showToast(
                    'Das Passwort muss mindestens 8 Zeichen lang sein.',
                    'error'
                );

                return;
            }


            try {
                const response = await fetch(
                    `${API_BASE_URL}/api/register`,
                    {
                        method: 'POST',

                        headers: {
                            'Content-Type':
                                'application/json'
                        },

                        body: JSON.stringify({
                            username,
                            email,
                            password
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

                setTimeout(() => {
                    window.location.href =
                        'login.html';
                }, 1000);

            } catch (error) {
                console.error(error);

                showToast(
                    'Verbindung zum Server fehlgeschlagen.',
                    'error'
                );
            }
        }
    );
}


// Erfolgsmeldung nach bestätigter E-Mail-Adresse anzeigen
const urlParams =
    new URLSearchParams(
        window.location.search
    );

if (urlParams.get('verified') === '1') {

    showToast(
        'E-Mail-Adresse erfolgreich bestätigt. Du kannst dich jetzt anmelden.',
        'success'
    );

    // Parameter entfernen, damit der Toast beim Neuladen nicht erneut erscheint
    window.history.replaceState(
        {},
        document.title,
        window.location.pathname
    );
}


// Benutzer anmelden
const loginForm =
    document.getElementById('login-form');

if (loginForm) {

    loginForm.addEventListener(
        'submit',
        async (event) => {

            event.preventDefault();

            const email =
                document
                    .getElementById('email')
                    .value;

            const password =
                document
                    .getElementById('password')
                    .value;

            try {
                const response = await fetch(
                    `${API_BASE_URL}/api/login`,
                    {
                        method: 'POST',
                        credentials: 'include',

                        headers: {
                            'Content-Type':
                                'application/json'
                        },

                        body: JSON.stringify({
                            email,
                            password
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

                window.location.href =
                    'index.html';

            } catch (error) {
                console.error(error);

                showToast(
                    'Verbindung zum Server fehlgeschlagen.',
                    'error'
                );
            }
        }
    );
}


// Passwort-Reset-Link anfordern
const forgotPasswordForm =
    document.getElementById(
        'forgot-password-form'
    );

if (forgotPasswordForm) {

    forgotPasswordForm.addEventListener(
        'submit',
        async (event) => {

            event.preventDefault();

            const email =
                document
                    .getElementById('forgot-email')
                    .value
                    .trim();

            if (!email) {
                showToast(
                    'Bitte gib deine E-Mail-Adresse ein.',
                    'info'
                );

                return;
            }

            try {
                const response = await fetch(
                    `${API_BASE_URL}/api/forgot-password`,
                    {
                        method: 'POST',

                        headers: {
                            'Content-Type':
                                'application/json'
                        },

                        body: JSON.stringify({
                            email: email
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

                forgotPasswordForm.reset();

            } catch (error) {
                console.error(error);

                showToast(
                    'Der Reset-Link konnte momentan nicht angefordert werden.',
                    'error'
                );
            }
        }
    );
}


// Neues Passwort über Reset-Link setzen
const resetPasswordForm =
    document.getElementById(
        'reset-password-form'
    );

if (resetPasswordForm) {

    resetPasswordForm.addEventListener(
        'submit',
        async (event) => {

            event.preventDefault();

            const password =
                document
                    .getElementById('new-password')
                    .value;

            const confirmPassword =
                document
                    .getElementById('confirm-password')
                    .value;


            // Beide neuen Passwörter müssen identisch sein
            if (password !== confirmPassword) {
                showToast(
                    'Die Passwörter stimmen nicht überein.',
                    'error'
                );

                return;
            }


            const params =
                new URLSearchParams(
                    window.location.search
                );

            const token =
                params.get('token');

            if (!token) {
                showToast(
                    'Der Reset-Link ist ungültig.',
                    'error'
                );

                return;
            }


            try {
                const response = await fetch(
                    `${API_BASE_URL}/api/reset-password`,
                    {
                        method: 'POST',

                        headers: {
                            'Content-Type':
                                'application/json'
                        },

                        body: JSON.stringify({
                            token: token,
                            password: password
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
                    'Passwort erfolgreich geändert. Du kannst dich jetzt anmelden.',
                    'success'
                );

                setTimeout(() => {
                    window.location.href =
                        'login.html';
                }, 1500);

            } catch (error) {
                console.error(error);

                showToast(
                    'Passwort konnte nicht geändert werden.',
                    'error'
                );
            }
        }
    );
}


// Passwort-Reset-Link beim Öffnen der Seite prüfen
async function validatePasswordResetLink() {

    const resetForm =
        document.getElementById(
            'reset-password-form'
        );

    const messageElement =
        document.getElementById(
            'reset-link-message'
        );

    const pageTitle =
        document.getElementById(
            'reset-page-title'
        );

    const pageDescription =
        document.getElementById(
            'reset-page-description'
        );


    // Nur auf reset-password.html ausführen
    if (!resetForm || !messageElement) {
        return;
    }


    const params =
        new URLSearchParams(
            window.location.search
        );

    const token =
        params.get('token');


    // Formular zunächst verstecken,
    // bis der Token geprüft wurde
    resetForm.style.display = 'none';


    // Fehlerzustand der Reset-Seite vorbereiten
    function showInvalidResetState() {

        if (pageTitle) {
            pageTitle.style.display = 'none';
        }

        if (pageDescription) {
            pageDescription.style.display = 'none';
        }
    }


    // Kein Token vorhanden
    if (!token) {

        showInvalidResetState();

        messageElement.style.display =
            'block';

        messageElement.innerHTML = `
            <div class="reset-invalid-state">

                <h3>
                    Reset-Link ungültig
                </h3>

                <p>
                    Dieser Link kann nicht zum
                    Zurücksetzen deines Passworts
                    verwendet werden.
                </p>

                <a
                    href="passwort-vergessen.html"
                    class="btn-primary"
                >
                    Neuen Link anfordern
                </a>

            </div>
        `;

        return;
    }


    try {
        const response = await fetch(
            `${API_BASE_URL}/api/reset-password/validate?token=${encodeURIComponent(token)}`
        );

        const data =
            await response.json();


        // Token ungültig oder abgelaufen
        if (!response.ok) {

            showInvalidResetState();

            messageElement.style.display =
                'block';

            messageElement.innerHTML = `
                <div class="reset-invalid-state">

                    <h3>
                        Reset-Link nicht mehr gültig
                    </h3>

                    <p>
                        ${data.message}
                    </p>

                    <a
                        href="passwort-vergessen.html"
                        class="btn-primary"
                    >
                        Neuen Link anfordern
                    </a>

                </div>
            `;

            return;
        }


        // Token gültig: Formular anzeigen
        resetForm.style.display =
            'block';

    } catch (error) {
        console.error(error);

        showInvalidResetState();

        messageElement.style.display =
            'block';

        messageElement.innerHTML = `
            <div class="reset-invalid-state">

                <h3>
                    Link konnte nicht überprüft werden
                </h3>

                <p>
                    Der Reset-Link konnte momentan
                    nicht überprüft werden.
                    Bitte versuche es später erneut.
                </p>

                <a
                    href="passwort-vergessen.html"
                    class="btn-primary"
                >
                    Neuen Link anfordern
                </a>

            </div>
        `;
    }
}


// Reset-Link beim Öffnen der Reset-Seite prüfen
validatePasswordResetLink();
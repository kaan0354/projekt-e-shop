// Funktionen für Kontoinformationen, Passwortänderung und Kontolöschung

// Kontoseite: Daten des aktuell angemeldeten Benutzers laden
async function loadAccountInformation() {

    const usernameElement =
        document.getElementById('konto-username');

    const emailElement =
        document.getElementById('konto-email');

    const accountContent =
        document.getElementById('account-content');

    const loginState =
        document.getElementById('account-login-state');

    // Nur auf konto.html ausführen
    if (!usernameElement || !emailElement) {
        return;
    }

    try {
        const response = await fetch(
            `${API_BASE_URL}/api/me`,
            {
                credentials: 'include'
            }
        );

        // Ausgeloggten Zustand anzeigen
        if (!response.ok) {

            if (accountContent) {
                accountContent.style.display = 'none';
            }

            if (loginState) {
                loginState.style.display = 'flex';
            }

            return;
        }

        // Normale Kontoseite anzeigen
        if (accountContent) {
            accountContent.style.display = '';
        }

        if (loginState) {
            loginState.style.display = 'none';
        }

        const data =
            await response.json();

        usernameElement.textContent =
            data.user.username;

        emailElement.textContent =
            data.user.email;

    } catch (error) {
        console.error(error);

        showToast(
            'Kontoinformationen konnten nicht geladen werden.',
            'error'
        );
    }
}


// Passwort über die Mein-Konto-Seite ändern
const changePasswordForm =
    document.getElementById('change-password-form');

if (changePasswordForm) {

    changePasswordForm.addEventListener(
        'submit',
        async (event) => {

            event.preventDefault();

            const currentPassword =
                document.getElementById(
                    'current-password'
                ).value;

            const newPassword =
                document.getElementById(
                    'account-new-password'
                ).value;

            const confirmPassword =
                document.getElementById(
                    'account-confirm-password'
                ).value;


            // Prüfen, ob die neuen Passwörter übereinstimmen
            if (newPassword !== confirmPassword) {
                showToast(
                    'Die neuen Passwörter stimmen nicht überein.',
                    'error'
                );

                return;
            }

            try {
                const response = await fetch(
                    `${API_BASE_URL}/api/change-password`,
                    {
                        method: 'POST',
                        credentials: 'include',

                        headers: {
                            'Content-Type':
                                'application/json'
                        },

                        body: JSON.stringify({
                            currentPassword,
                            newPassword
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
                    'Passwort wurde erfolgreich geändert.',
                    'success'
                );

                changePasswordForm.reset();

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


// Zugriff auf die Kontolöschung prüfen
async function checkDeleteAccountAccess() {

    const deleteContent =
        document.getElementById('delete-account-content');

    // Nur auf delete-konto.html ausführen
    if (!deleteContent) {
        return;
    }

    try {
        const response = await fetch(
            `${API_BASE_URL}/api/me`,
            {
                credentials: 'include'
            }
        );

        // Nicht angemeldete Benutzer zum Login schicken
        if (response.status === 401) {
            window.location.href =
                'login.html';

            return;
        }

        if (!response.ok) {
            return;
        }

        const data =
            await response.json();

        // Löschseite freigeben
        deleteContent.style.display = '';

    } catch (error) {
        console.error(error);
    }
}


// Benutzerkonto löschen
const deleteAccountForm =
    document.getElementById('delete-account-form');

if (deleteAccountForm) {

    deleteAccountForm.addEventListener(
        'submit',
        async (event) => {

            event.preventDefault();

            const email =
                document.getElementById(
                    'delete-email'
                ).value.trim();

            const password =
                document.getElementById(
                    'delete-password'
                ).value;

            const confirmPassword =
                document.getElementById(
                    'delete-password-confirm'
                ).value;


            // Beide Passworteingaben müssen identisch sein
            if (password !== confirmPassword) {
                showToast(
                    'Die eingegebenen Passwörter stimmen nicht überein.',
                    'error'
                );

                return;
            }

            try {
                const response = await fetch(
                    `${API_BASE_URL}/api/delete-account`,
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
                    'Dein Konto wurde erfolgreich gelöscht.',
                    'success'
                );

                setTimeout(() => {
                    window.location.href =
                        'index.html';
                }, 1500);

            } catch (error) {
                console.error(error);

                showToast(
                    'Das Konto konnte nicht gelöscht werden.',
                    'error'
                );
            }
        }
    );
}


// Kontoinformationen beim Laden der Kontoseite anzeigen
loadAccountInformation();

// Geschützte Kontolöschseite prüfen
checkDeleteAccountAccess();
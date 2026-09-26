# Projekt E-Shop

Dieses Projekt umfasst einen funktionsfähigen E-Shop, welcher mit Frontend, Backend und einer MySQL-Datenbank ausgestattet ist.

## Über das Projekt

Das Projekt wurde im Rahmen der Projektarbeit im Studiengang Wirtschaftsinformatik B.Sc. an der Universität des Saarlandes unter Betreuung von Professor Dr. Fettke entwickelt. 

Der Shop ermöglicht unter anderem die Verwaltung von Benutzerkonten, die Anzeige und Verwaltung von Produkten, die Nutzung eines Warenkorbs sowie die Durchführung und Verwaltung von Bestellungen. 

Darüber hinaus wurden weitere Funktionen wie die E-Mail-Verifizierung, die Zahlungsabwicklung über die PayPal-Sandbox und ein Administrationsbereich integriert.

Der E-Shop dient dabei als digitale Schnittstelle zwischen der Produktion und den Kunden, indem produzierte Produkte bereitgestellt und anschließend über den Shop angeboten und verkauft werden können.

Diese technische Dokumentation beschreibt die notwendigen Voraussetzungen sowie die Einrichtung, Konfiguration und Ausführung des Projekts.

## Inhaltsverzeichnis

- [Voraussetzungen](#voraussetzungen)
- [Projektstruktur](#projektstruktur)
- [Installation und Einrichtung](#installation-und-einrichtung)
  - [1. Projekt herunterladen](#1-projekt-herunterladen)
  - [2. Datenbank einrichten](#2-datenbank-einrichten)
  - [3. Node.js und npm installieren](#3-nodejs-und-npm-installieren)
  - [4. Umgebungsvariablen konfigurieren](#4-umgebungsvariablen-konfigurieren)
  - [5. Abhängigkeiten installieren](#5-abhängigkeiten-installieren)
- [Konfiguration und Anpassung](#konfiguration-und-anpassung)
  - [Firmenlogo anpassen](#firmenlogo-anpassen)
  - [AGB und Widerrufsbelehrung anpassen](#agb-und-widerrufsbelehrung-anpassen)
  - [Weitere Shop-Inhalte anpassen](#weitere-shop-inhalte-anpassen)
  - [Datenbankverwaltung mit MySQL Workbench](#datenbankverwaltung-mit-mysql-workbench)
  - [Benutzerkonten anzeigen](#benutzerkonten-anzeigen)
  - [Benutzer zum Administrator machen](#benutzer-zum-administrator-machen)
  - [Verwaltung über den Administrationsbereich](#verwaltung-über-den-administrationsbereich)
  - [Archivierte Produkte endgültig löschen](#archivierte-produkte-endgültig-löschen)
  - [Produktbilder hinzufügen](#produktbilder-hinzufügen)
  - [Design anpassen](#design-anpassen)
- [Projekt starten](#projekt-starten)
  - [Backend starten](#backend-starten)
  - [Frontend starten](#frontend-starten)
  - [Verbindung zwischen Frontend und Backend](#verbindung-zwischen-frontend-und-backend)
  - [Online-Bereitstellung](#online-bereitstellung)
- [Autor](#autor)

## Voraussetzungen

Für die Einrichtung und Ausführung des Projekts werden folgende Programme bzw. Komponenten benötigt:

- **Node.js und npm** – zur Ausführung des Backends und zur Installation der benötigten Node.js-Abhängigkeiten
- **MySQL Server** – zur Bereitstellung und Speicherung der Datenbank
- **MySQL Workbench oder ein vergleichbares MySQL-Verwaltungstool** – zur Einrichtung und Verwaltung der MySQL-Datenbank
- **Code-Editor bzw. Entwicklungsumgebung** – zum Öffnen und Bearbeiten des Projekts; empfohlen wird Visual Studio Code
- **Lokaler Webserver für das Frontend** – beispielsweise die Erweiterung Live Server für Visual Studio Code
- Ein aktueller **Webbrowser** zur Nutzung des E-Shops

Für die vollständige Nutzung aller Funktionen werden zusätzlich Zugangsdaten für einen E-Mail-Dienst sowie für die PayPal-Sandbox benötigt. Die Einrichtung wird im weiteren Verlauf dieser technischen Dokumentation beschrieben.

## Projektstruktur

Das Projekt ist in ein Frontend und ein Backend aufgeteilt. Dadurch werden die Benutzeroberfläche und die serverseitige Anwendungslogik voneinander getrennt.

Die grundlegende Projektstruktur sieht folgendermaßen aus:

    Projekt-E-Shop/
    │
    ├── frontend/
    │   ├── img/
    │   ├── js/
    │   ├── design.css
    │   └── *.html
    │
    ├── backend/
    │   ├── documents/
    │   ├── middleware/
    │   ├── routes/
    │   ├── services/
    │   ├── .env.vorlage
    │   ├── .gitignore
    │   ├── database.sql
    │   ├── db.js
    │   ├── package-lock.json
    │   ├── package.json
    │   └── server.js
    │
    └── README.md

Der Ordner `frontend` enthält die Benutzeroberfläche des E-Shops. Die verschiedenen HTML-Dateien (`*.html`) bilden die einzelnen Seiten des Shops ab. Das zentrale Styling befindet sich in `design.css`. Im Ordner `js` befinden sich die für das Frontend benötigten JavaScript-Dateien, während `img` die verwendeten Bilder und Grafiken enthält.

Der Ordner `backend` enthält die serverseitige Anwendungslogik des E-Shops. Die API-Endpunkte sind im Ordner `routes` organisiert. Wiederverwendbare Dienste und Funktionen befinden sich in `services`, während `middleware` die verwendeten Middleware-Funktionen enthält. Der Ordner `documents` enthält Dokumente, die vom Backend benötigt werden.

Die Datei `server.js` dient als zentraler Einstiegspunkt des Backends und startet den Express-Server. Über `db.js` wird die Verbindung zur MySQL-Datenbank hergestellt. Die benötigten Node.js-Abhängigkeiten und deren Versionen werden über `package.json` und `package-lock.json` verwaltet.

Die Datei `database.sql` enthält die vollständige Struktur der benötigten MySQL-Datenbank sowie die mitgelieferten Beispielprodukte und kann zur Neueinrichtung der Datenbank verwendet werden.

Die Datei `.env.vorlage` enthält eine Vorlage für die benötigten Umgebungsvariablen. Für die lokale Einrichtung wird daraus eine eigene `.env` erstellt, in der anschließend die persönlichen Zugangsdaten und Konfigurationswerte eingetragen werden.

Die Datei `README.md` im Hauptverzeichnis enthält die vorliegende technische Dokumentation.

## Installation und Einrichtung

### 1. Projekt herunterladen

Das Projekt wird über ein GitHub-Repository bereitgestellt und muss zunächst auf den lokalen Computer heruntergeladen werden.

Hierfür kann das Projekt direkt über GitHub als ZIP-Datei heruntergeladen werden:

1. Das bereitgestellte GitHub-Repository öffnen.
2. Auf **Code** klicken.
3. **Download ZIP** auswählen.
4. Die heruntergeladene ZIP-Datei vollständig entpacken.
5. Den entpackten Projektordner anschließend beispielsweise in Visual Studio Code öffnen.

Alternativ kann das Repository bei installiertem Git über ein Terminal geklont werden:

    git clone https://github.com/kaan0354/projekt-e-shop.git

Anschließend kann der heruntergeladene bzw. geklonte Projektordner für die weitere Einrichtung verwendet werden.

Die nachfolgenden Schritte beschreiben die vollständige lokale Einrichtung des Projekts.

### 2. Datenbank einrichten

Für den Betrieb des E-Shops wird eine MySQL-Datenbank benötigt. Die vollständige Datenbankstruktur wird bereits über die Datei `backend/database.sql` bereitgestellt.

#### MySQL installieren

Falls MySQL noch nicht auf dem Computer installiert ist, können der MySQL Server und MySQL Workbench über den MySQL Installer eingerichtet werden.

Für die lokale Ausführung des Projekts werden der **MySQL Server** sowie **MySQL Workbench** benötigt. Weitere Komponenten wie MySQL Shell oder MySQL Router sind für die Ausführung dieses Projekts nicht erforderlich.

Bei Verwendung des MySQL Installers kann folgendermaßen vorgegangen werden:

1. Den MySQL Installer herunterladen und starten.
2. Als Setup-Art **Custom** auswählen.
3. In der Auswahl der verfügbaren Produkte bei **MySQL Servers** auf das **Pluszeichen (+)** klicken, bis die verfügbaren Versionen angezeigt werden.
4. Die gewünschte MySQL-Server-Version auswählen. Für eine neue Installation empfiehlt es sich, die aktuellste angebotene Version zu verwenden und diese über den Pfeil zur Installationsauswahl hinzuzufügen.
5. Anschließend bei **Applications** bzw. **MySQL Workbench** ebenfalls über das **Pluszeichen (+)** die verfügbaren Versionen anzeigen lassen.
6. Die aktuellste angebotene Version von **MySQL Workbench** auswählen und ebenfalls zur Installationsauswahl hinzufügen.
7. Anschließend mit **Next** fortfahren und die ausgewählten Komponenten installieren.
8. Bei der Konfiguration des MySQL Servers als Konfigurationstyp **Development Computer** verwenden.
9. Die TCP/IP-Verbindung aktiviert lassen und den standardmäßigen MySQL-Port `3306` verwenden.
10. Die empfohlene starke Passwortverschlüsselung verwenden.
11. Für den MySQL-Benutzer `root` ein eigenes Passwort festlegen und dieses aufbewahren.
12. Für dieses Projekt muss kein zusätzlicher MySQL-Benutzer angelegt werden.
13. MySQL als Windows-Dienst einrichten und den automatischen Start des Dienstes aktiviert lassen.
14. Die Konfiguration abschließen.

Das für `root` festgelegte Passwort wird später in der Datei `backend/.env` als `DB_PASSWORD` eingetragen.

#### Verbindung zum MySQL Server herstellen

Nach der Installation kann MySQL Workbench geöffnet werden.

1. MySQL Workbench starten.
2. Unter **MySQL Connections** eine neue Verbindung erstellen oder eine bereits vorhandene lokale Verbindung verwenden.
3. Als Host kann bei einer lokalen Installation in der Regel `localhost` verwendet werden.
4. Den bei der MySQL-Installation eingerichteten Benutzernamen und das zugehörige Passwort verwenden.
5. Die Verbindung testen und anschließend öffnen.

Die dabei verwendeten Verbindungsdaten werden später ebenfalls in der Datei `backend/.env` eingetragen.

#### Datenbankstruktur importieren

Nachdem die Verbindung zum MySQL Server hergestellt wurde, kann die mitgelieferte Datenbank eingerichtet werden:

1. In MySQL Workbench die Datei `backend/database.sql` öffnen.
2. Das geöffnete SQL-Skript vollständig ausführen.
3. Das Skript erstellt automatisch die Datenbank `webshop`.
4. Anschließend werden alle für den E-Shop benötigten Tabellen und Beziehungen angelegt.
5. Zusätzlich werden die mitgelieferten Beispielprodukte automatisch in die Datenbank eingefügt.

Nach erfolgreicher Ausführung sollte in MySQL Workbench die Datenbank `webshop` sichtbar sein. Falls sie nicht direkt angezeigt wird, kann im Bereich **Schemas** die Anzeige aktualisiert werden.

Unter `webshop` → **Tables** sollten anschließend folgende neun Tabellen vorhanden sein:

- `cart_items`
- `email_verification_tokens`
- `order_items`
- `orders`
- `password_reset_tokens`
- `product_images`
- `products`
- `users`
- `withdrawals`

Die Datei `database.sql` enthält die benötigte Datenbankstruktur sowie die für die Demonstration des Shops vorgesehenen Beispielprodukte. Benutzerkonten, Bestellungen, Warenkorbinhalte, Verifizierungsdaten oder sonstige persönliche Nutzerdaten werden nicht mitgeliefert.

#### Verbindung mit dem Backend

Damit das Backend anschließend auf die neu eingerichtete Datenbank zugreifen kann, müssen die verwendeten MySQL-Zugangsdaten in `backend/.env` eingetragen werden.

Beispiel:

    DB_HOST=localhost
    DB_USER=root
    DB_PASSWORD=DEIN_MYSQL_PASSWORT
    DB_NAME=webshop

`DB_HOST` bezeichnet den verwendeten MySQL-Server. Bei einer lokalen Installation kann hier `localhost` verwendet werden. `DB_USER` und `DB_PASSWORD` entsprechen den zuvor eingerichteten Zugangsdaten. `DB_NAME` bezeichnet die vom SQL-Skript erstellte Datenbank und muss daher `webshop` entsprechen.

> **Hinweis:** Die vorgegebene Tabellenstruktur sollte nicht ohne entsprechende Anpassungen des Backends verändert werden, da das Backend auf die definierten Tabellen, Spalten und Beziehungen zugreift.

### 3. Node.js und npm installieren

Für die Ausführung des Backends wird Node.js benötigt. Bei der Installation von Node.js wird gleichzeitig der Paketmanager npm installiert, über den anschließend die benötigten Abhängigkeiten des Projekts eingerichtet werden.

#### Node.js installieren

1. Die offizielle Node.js-Webseite aufrufen.
2. Die aktuelle **LTS-Version (Long Term Support)** von Node.js herunterladen. Diese Version wird für eine stabile Nutzung empfohlen.
3. Die heruntergeladene Installationsdatei ausführen.
4. Die Installation mit den vorgeschlagenen Standardeinstellungen durchführen.
5. Nach Abschluss der Installation ein neues Terminal öffnen.

Anschließend kann überprüft werden, ob Node.js und npm korrekt installiert wurden. Dazu werden nacheinander folgende Befehle in einem neu geöffneten Terminal ausgeführt:

    node --version
    npm --version

Werden bei beiden Befehlen Versionsnummern angezeigt, wurden Node.js und npm erfolgreich installiert.

Unter Windows kann es bei Verwendung von PowerShell im Terminal von Visual Studio Code vorkommen, dass der Befehl `npm` aufgrund der PowerShell-Ausführungsrichtlinie nicht ausgeführt werden kann. In diesem Fall muss die Ausführungsrichtlinie nicht geändert werden.

Falls `npm` nicht ausgeführt werden kann, kann stattdessen `npm.cmd` verwendet werden:

    npm.cmd --version

### 4. Umgebungsvariablen konfigurieren

Das Backend verwendet die Datei `backend/.env`, um wichtige Einstellungen und Zugangsdaten zu speichern. Dazu gehören die Verbindung zur MySQL-Datenbank, die lokalen Adressen von Frontend und Backend sowie die Zugangsdaten für den E-Mail-Versand und die PayPal-Zahlungsabwicklung.

Aus Sicherheitsgründen wird keine fertig konfigurierte `.env` mit persönlichen Zugangsdaten bereitgestellt. Stattdessen befindet sich im Backend die Datei `.env.vorlage`.

Für die Einrichtung muss zunächst diese Datei in

    .env

umbenannt werden.

Anschließend werden die benötigten eigenen Zugangsdaten und Konfigurationswerte in die umbenannte `.env` eingetragen.

Die `.env` ist über die `.gitignore` vom Git-Repository ausgeschlossen, damit darin gespeicherte Passwörter, Session-Schlüssel und andere geheime Zugangsdaten nicht versehentlich veröffentlicht werden.

#### MySQL-Datenbank

Die Zugangsdaten müssen mit dem zuvor eingerichteten MySQL Server übereinstimmen:

    DB_HOST=localhost
    DB_USER=root
    DB_PASSWORD=
    DB_NAME=webshop

- `DB_HOST`: Adresse des MySQL Servers. Bei einer lokalen Installation kann `localhost` verwendet werden.
- `DB_USER`: Benutzername des MySQL-Benutzers, beispielsweise `root`.
- `DB_PASSWORD`: Das bei der Einrichtung von MySQL festgelegte Passwort.
- `DB_NAME`: Name der Datenbank. Bei Verwendung der mitgelieferten `database.sql` lautet dieser `webshop`.

Das MySQL-Passwort wird hinter `DB_PASSWORD=` eingetragen.

Die angegebenen Werte sind für eine lokale Installation vorgesehen. Wird die Datenbank später auf einem externen Server betrieben, müssen insbesondere `DB_HOST`, `DB_USER`, `DB_PASSWORD` und gegebenenfalls `DB_NAME` durch die Zugangsdaten der dort eingerichteten MySQL-Datenbank ersetzt werden.

#### Backend und URLs

Für die lokale Ausführung sind folgende Werte vorgesehen:

    PORT=3000

    FRONTEND_URL=http://127.0.0.1:5500
    BACKEND_URL=http://127.0.0.1:3000

`PORT` legt fest, auf welchem Port das Backend gestartet wird. Standardmäßig wird für die lokale Entwicklung Port `3000` verwendet.

`FRONTEND_URL` enthält die Adresse, unter der das Frontend erreichbar ist. Bei der in dieser technischen Dokumentation beschriebenen lokalen Ausführung über Live Server wird Port `5500` verwendet.

`BACKEND_URL` enthält entsprechend die Adresse des Backends.

Diese Adressen sind für die lokale Nutzung des Projekts vorgesehen. Wird der E-Shop später online auf einem Server bereitgestellt, müssen an diesen Stellen die tatsächlichen Adressen bzw. Domains von Frontend und Backend eingetragen werden, beispielsweise `https://shop.example.de` anstelle einer lokalen `127.0.0.1`-Adresse.

#### Session-Schlüssel

Für die Verwaltung angemeldeter Benutzer benötigt das Backend einen geheimen Session-Schlüssel:

    SESSION_SECRET=

Für die lokale Einrichtung kann ein sicherer zufälliger Schlüssel direkt mit Node.js erzeugt werden.

Dazu kann ein beliebiges Terminal geöffnet werden. Sofern Node.js installiert ist, wird dort folgender Befehl ausgeführt:

    node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

Node.js erzeugt daraufhin automatisch eine lange zufällige Zeichenfolge. Diese wird vollständig kopiert und hinter `SESSION_SECRET=` eingefügt.

Beispiel:

    SESSION_SECRET=HIER_DEN_ERZEUGTEN_SCHLUESSEL_EINFUEGEN

Der Session-Schlüssel sollte geheim gehalten und nicht veröffentlicht werden. Für eine spätere Online-Bereitstellung sollte ebenfalls ein eigener sicherer und geheimer Session-Schlüssel verwendet werden.

#### E-Mail-Versand

Der E-Shop versendet automatisch E-Mails, beispielsweise für Bestellbestätigungen, die E-Mail-Verifizierung oder das Zurücksetzen eines Passworts.

Dafür wird ein E-Mail-Konto benötigt, das als Absender des Shops verwendet wird. Ein separates Gmail-Konto für den Shop bietet sich hierfür an. Grundsätzlich kann jedoch auch ein anderer geeigneter E-Mail-Anbieter verwendet werden, sofern dieser die für die Anwendung benötigte Authentifizierung, beispielsweise über ein App-Passwort, unterstützt.

In der `.env` werden folgende Werte eingetragen:

    MAIL_USER=
    MAIL_PASSWORD=
    PRODUCTION_EMAIL=

`MAIL_USER` ist die E-Mail-Adresse des Shops. Über dieses Konto werden die automatischen E-Mails des E-Shops versendet.

`MAIL_PASSWORD` enthält das für den Zugriff verwendete App-Passwort. Bei Gmail sollte hier nicht das normale Passwort des Google-Kontos eingetragen werden.

`PRODUCTION_EMAIL` ist die E-Mail-Adresse des Shopbetreibers. An diese Adresse können für den Betreiber bestimmte Informationen gesendet werden, beispielsweise Informationen zu eingegangenen Bestellungen mit den entsprechenden Käufer- und Produktdaten.

##### Gmail und App-Passwort einrichten

Für die Verwendung von Gmail wird ein Google-Konto benötigt. Es empfiehlt sich, hierfür ein separates Konto für den E-Shop zu verwenden.

1. Ein Google-Konto erstellen bzw. ein vorhandenes Konto verwenden.
2. In den Sicherheitseinstellungen des Google-Kontos die **Bestätigung in zwei Schritten** aktivieren.
3. Anschließend in den Einstellungen des Google-Kontos den Bereich **App-Passwörter** öffnen.
4. Ein neues App-Passwort für den E-Shop erstellen.
5. Google erzeugt daraufhin ein eigenes App-Passwort.
6. Dieses Passwort kopieren und in der `.env` hinter `MAIL_PASSWORD=` eintragen.
7. Die Gmail-Adresse selbst hinter `MAIL_USER=` eintragen.

Beispiel:

    MAIL_USER=shop@example.com
    MAIL_PASSWORD=HIER_DAS_APP_PASSWORT_EINFUEGEN
    PRODUCTION_EMAIL=betreiber@example.com

Das App-Passwort sollte genauso wie ein normales Passwort geheim gehalten werden.

#### PayPal

Für die Zahlungsabwicklung verwendet das Projekt neben der Zahlung auf Rechnung auch PayPal. Für die lokale Nutzung verwendet man die PayPal-Sandbox. Dabei handelt es sich um eine Testumgebung von PayPal, in der Zahlungen simuliert werden können, ohne echtes Geld zu übertragen.

Für die Einrichtung wird ein PayPal-Konto benötigt.

In der `.env` befinden sich dafür folgende Werte:

    PAYPAL_CLIENT_ID=
    PAYPAL_CLIENT_SECRET=
    PAYPAL_BASE_URL=https://api-m.sandbox.paypal.com

##### PayPal-Sandbox einrichten

1. Ein PayPal-Konto erstellen bzw. ein vorhandenes PayPal-Konto verwenden.
2. Das **PayPal Developer Dashboard** öffnen und sich mit dem PayPal-Konto anmelden.
3. Im Dashboard den Bereich **Apps & Credentials** öffnen.
4. Darauf achten, dass die **Sandbox-Umgebung** ausgewählt ist.
5. Eine vorhandene Sandbox-App auswählen oder über **Create App** eine neue Anwendung für den E-Shop erstellen.
6. Für die Anwendung stellt PayPal eine **Client ID** und ein **Client Secret** bereit.
7. Beide Werte kopieren und in die `.env` eintragen.

Beispiel:

    PAYPAL_CLIENT_ID=HIER_DIE_CLIENT_ID_EINFUEGEN
    PAYPAL_CLIENT_SECRET=HIER_DAS_CLIENT_SECRET_EINFUEGEN
    PAYPAL_BASE_URL=https://api-m.sandbox.paypal.com

Zum Testen einer vollständigen Zahlung können im PayPal Developer Dashboard außerdem Sandbox-Testkonten verwendet werden. PayPal stellt hierfür unter **Testing Tools → Sandbox Accounts** unter anderem Testkonten für Käufer und Verkäufer zur Verfügung. Mit einem persönlichen Sandbox-Testkonto kann anschließend ein Kauf im E-Shop durchgeführt werden, ohne echtes Geld zu verwenden.

Die `PAYPAL_BASE_URL` verweist ausdrücklich auf die Testumgebung und ist daher für die lokale Entwicklung und das Testen des Projekts vorgesehen.

Soll der E-Shop später produktiv mit echten PayPal-Zahlungen betrieben werden, dürfen die Sandbox-Zugangsdaten nicht weiterverwendet werden. Im PayPal Developer Dashboard kann unter **Apps & Credentials** von **Sandbox** auf **Live** gewechselt werden. Dort können die entsprechende Live Client ID und das Live Client Secret abgerufen und anschließend in der `.env` bei `PAYPAL_CLIENT_ID` und `PAYPAL_CLIENT_SECRET` eingetragen werden. Zusätzlich muss die `PAYPAL_BASE_URL` von der Sandbox-Adresse auf die produktive PayPal-Adresse geändert werden.

    PAYPAL_BASE_URL=https://api-m.paypal.com

Damit werden die PayPal-Anfragen nicht mehr an die Testumgebung, sondern an die produktive PayPal-Umgebung gesendet. Für die Live-Nutzung gelten zusätzlich die Voraussetzungen und Freigaben von PayPal.

> **Wichtig:** Die `.env` kann sensible Zugangsdaten enthalten. MySQL-Passwörter, Session-Schlüssel, App-Passwörter und PayPal-Zugangsdaten sollten niemals veröffentlicht oder an Dritte weitergegeben werden. Die mit dem Projekt bereitgestellte `.env.vorlage` enthält daher keine persönlichen Zugangsdaten. Die daraus erstellte und individuell konfigurierte `.env` darf nicht veröffentlicht oder in das Git-Repository aufgenommen werden.

### 5. Abhängigkeiten installieren

Das Backend verwendet verschiedene Node.js-Pakete. Dazu gehören unter anderem Express für die Bereitstellung des Servers, MySQL2 für die Datenbankverbindung, Nodemailer für den E-Mail-Versand und bcrypt für die Verarbeitung von Passwörtern.

Alle benötigten Pakete sind bereits unter `dependencies` in der Datei `backend/package.json` hinterlegt und müssen daher nicht einzeln installiert werden.

Für die Installation wird empfohlen, den gesamten Projektordner in Visual Studio Code zu öffnen. Dazu kann in Visual Studio Code über **File → Open Folder** der Ordner `Projekt-E-Shop` ausgewählt werden.

Anschließend wird über **Terminal → New Terminal** ein Terminal geöffnet. Das Terminal befindet sich in der Regel zunächst im Hauptverzeichnis des geöffneten Projekts.

Mit folgendem Befehl wird in den Backend-Ordner gewechselt:

    cd backend

Danach wird folgender Befehl ausgeführt:

    npm install

Falls der Befehl `npm install` im Terminal von Visual Studio Code aufgrund der PowerShell-Ausführungsrichtlinie nicht ausgeführt werden kann, kann stattdessen folgender Befehl verwendet werden:

    npm.cmd install

npm liest dabei die vorhandenen Dateien `package.json` und `package-lock.json` aus und installiert automatisch alle benötigten Abhängigkeiten.

Nach erfolgreicher Installation wird im Backend der Ordner `node_modules` erstellt. Dieser enthält die installierten Node.js-Pakete.

## Konfiguration und Anpassung

Der E-Shop enthält verschiedene Einstellungen und Inhalte, die an den jeweiligen Betreiber und dessen Anforderungen angepasst werden können.

Entsprechende Stellen sind im Quellcode durch Kommentare mit `KONFIGURATION:` bzw. `WICHTIGE KONFIGURATION:` gekennzeichnet.

- `WICHTIGE KONFIGURATION:` kennzeichnet insbesondere Einstellungen, die für den technischen Betrieb des E-Shops relevant sind, beispielsweise URLs, Ports, Datenbankzugänge oder Zugangsdaten externer Dienste.
- `KONFIGURATION:` kennzeichnet weitere anpassbare Werte und Inhalte des Shops, beispielsweise Bezeichnungen, Texte oder andere betreiberspezifische Einstellungen.

Die wichtigsten technischen Einstellungen in der `.env` wurden bereits im Abschnitt **Installation und Einrichtung** beschrieben.

### Firmenlogo anpassen

Das im E-Shop verwendete Firmenlogo kann ohne Änderungen an den einzelnen HTML-Seiten ausgetauscht werden.

Dazu muss das gewünschte Logo im Ordner `frontend/img` unter dem Dateinamen `fishlogo.png` abgelegt werden. Die bereits vorhandene Datei kann dabei durch das neue Logo ersetzt werden.

    frontend/
    └── img/
        └── fishlogo.png

Da die entsprechenden Seiten des E-Shops auf diesen einheitlichen Dateipfad zugreifen, wird das neue Logo anschließend automatisch an den vorgesehenen Stellen verwendet.

Für den Fall, dass der Server nicht erreichbar ist, wird zusätzlich ein alternatives Logo verwendet. Dieses muss unter dem Dateinamen `fisch dead.png` ebenfalls im Ordner `frontend/img` abgelegt werden.

### AGB und Widerrufsbelehrung anpassen

Im Ordner `backend/documents` befinden sich die PDF-Dateien für die AGB und die Widerrufsbelehrung:

    backend/
    └── documents/
        ├── AGB.pdf
        └── Widerrufsbelehrung.pdf

Die mit dem Projekt bereitgestellten Dokumente dienen lediglich als Muster und müssen bei einer tatsächlichen Nutzung des E-Shops durch die für den jeweiligen Betreiber geltenden Dokumente ersetzt werden.

Hierfür können die vorhandenen PDF-Dateien durch eigene Dateien ersetzt werden. Damit das Backend die Dokumente weiterhin automatisch verwenden kann, müssen die Dateinamen unverändert bleiben:

- `AGB.pdf`
- `Widerrufsbelehrung.pdf`

Die Dokumente werden vom Backend bei den entsprechenden Bestellbestätigungen verwendet. Werden die vorhandenen Dateien ersetzt, werden anschließend automatisch die neuen PDF-Dokumente verwendet.

### Weitere Shop-Inhalte anpassen

Weitere betreiberspezifische Inhalte können direkt in den entsprechenden Dateien des Frontends bzw. Backends angepasst werden.

Um solche Stellen leichter zu finden, wurden anpassbare Werte im Quellcode mit `KONFIGURATION:` gekennzeichnet. Über die Suchfunktion des verwendeten Code-Editors kann projektweit nach diesem Begriff gesucht werden.

In Visual Studio Code kann die projektweite Suche beispielsweise über **Strg + Shift + F** geöffnet werden. Wird dort nach

    KONFIGURATION:

gesucht, werden die entsprechend markierten Stellen des Projekts angezeigt.

Dadurch können betreiberspezifische Werte gezielt angepasst werden, ohne sämtliche Dateien des Projekts manuell durchsuchen zu müssen.

Bei Änderungen sollte darauf geachtet werden, dass zusammengehörige Werte weiterhin übereinstimmen. Dies gilt insbesondere für Einstellungen, die sowohl im Frontend als auch im Backend verwendet werden.

### Datenbankverwaltung mit MySQL Workbench

Die Daten des E-Shops können über MySQL Workbench eingesehen und bei Bedarf administrativ bearbeitet werden.

SQL-Befehle können über den SQL-Tab eingegeben und anschließend über das Blitzsymbol ausgeführt werden. 

### Benutzerkonten anzeigen

Die registrierten Benutzer des E-Shops werden in der Tabelle `users` gespeichert.

Eine Übersicht der Benutzerkonten kann beispielsweise mit folgendem SQL-Befehl angezeigt werden:

    USE webshop;
    SELECT id, username, email, role, email_verified
    FROM users;

Dabei können unter anderem die Benutzer-ID, der Benutzername, die E-Mail-Adresse, die Benutzerrolle und der Status der E-Mail-Verifizierung eingesehen werden.

### Benutzer zum Administrator machen

Neue Benutzerkonten werden grundsätzlich als normale Kunden angelegt. Soll ein Benutzer Zugriff auf den Administrationsbereich des E-Shops erhalten, kann seine Benutzerrolle über MySQL Workbench geändert werden.

Zunächst sollte das gewünschte Benutzerkonto über seine E-Mail-Adresse identifiziert werden:

    USE webshop;
    SELECT id, username, email, role
    FROM users
    WHERE email = 'E-MAIL-DES-BENUTZERS';

Anschließend kann die Rolle des Benutzers auf `admin` geändert werden:

    USE webshop;
    UPDATE users
    SET role = 'admin'
    WHERE email = 'E-MAIL-DES-BENUTZERS';

Danach kann die Änderung kontrolliert werden:

    USE webshop;
    SELECT id, username, email, role
    FROM users
    WHERE email = 'E-MAIL-DES-BENUTZERS';

In der Spalte `role` sollte nun `admin` angezeigt werden. Das entsprechende Benutzerkonto besitzt damit die im E-Shop vorgesehenen Administratorrechte.

Administratorrechte sollten ausschließlich vertrauenswürdigen Benutzerkonten zugewiesen werden.

Soll einem Benutzer die Administratorrolle wieder entzogen werden, kann die Rolle wieder auf `customer` gesetzt werden:

    USE webshop;
    UPDATE users
    SET role = 'customer'
    WHERE email = 'E-MAIL-DES-BENUTZERS';

### Verwaltung über den Administrationsbereich

Nach der Vergabe der Administratorrolle kann sich der entsprechende Benutzer regulär im E-Shop anmelden und den Administrationsbereich aufrufen.

Die laufende Verwaltung des Shops erfolgt anschließend über die Benutzeroberfläche des Administrationsbereichs. Dort können insbesondere Produkte erstellt und bearbeitet, Lagerbestände verwaltet sowie Bestellungen eingesehen und bearbeitet werden.

Für diese Aufgaben ist daher keine direkte Bearbeitung der Datenbank über MySQL Workbench erforderlich.

### Archivierte Produkte endgültig löschen

Produkte können über den Administrationsbereich archiviert werden. Dadurch bleiben die entsprechenden Daten zunächst in der Datenbank erhalten.

Soll ein bereits archiviertes Produkt endgültig aus der Datenbank entfernt werden, kann dies bei Bedarf über MySQL Workbench erfolgen.

Zunächst können die archivierten Produkte angezeigt werden:

    USE webshop;
    SELECT id, name
    FROM products
    WHERE is_archived = 1;

Anschließend kann das gewünschte archivierte Produkt anhand seiner ID endgültig gelöscht werden:

    USE webshop;
    DELETE FROM products
    WHERE id = PRODUKT_ID
    AND is_archived = 1;

`PRODUKT_ID` muss dabei durch die ID des zu löschenden Produkts ersetzt werden.

Ein archiviertes Produkt kann nur dann endgültig gelöscht werden, wenn es noch nicht Bestandteil einer Bestellung war. Wurde das Produkt bereits bestellt, besteht weiterhin eine Verknüpfung mit den entsprechenden Bestelldaten. In diesem Fall verhindert die Datenbank das endgültige Löschen und das Produkt verbleibt archiviert in der Datenbank. Dadurch bleiben bereits vorhandene Bestellungen weiterhin vollständig nachvollziehbar.

> **Achtung:** Das Löschen über MySQL Workbench ist endgültig und kann nicht über den Administrationsbereich rückgängig gemacht werden. Vor der Ausführung sollte daher überprüft werden, ob die richtige Produkt-ID ausgewählt wurde.

### Produktbilder hinzufügen

Die für die Produkte verwendeten Bilder werden im Ordner `frontend/img` gespeichert.

Neue Produktbilder sollten daher ebenfalls in diesem Ordner abgelegt werden:

    frontend/
    └── img/
        ├── fishlogo.png
        ├── blau.png
        ├── rot.png
        ├── weiß.png
        └── ...

Die bereits vorhandenen Produktbilder `blau.png`, `rot.png` und `weiß.png` dienen lediglich als Beispielbilder für die mitgelieferten Beispielprodukte und können durch eigene Produktbilder ergänzt bzw. ersetzt werden.

Beim Anlegen oder Bearbeiten eines Produkts im Administrationsbereich kann anschließend das entsprechende Produktbild verwendet werden.

### Design anpassen

Das grundlegende Erscheinungsbild des Frontends wird über die Datei `frontend/design.css` gesteuert.

Bei Bedarf können dort beispielsweise Farben, Abstände, Schriftgrößen oder weitere gestalterische Eigenschaften des E-Shops angepasst werden.

Bei Änderungen sollte jedoch darauf geachtet werden, bestehende Klassen- und ID-Namen nicht ohne entsprechende Anpassungen in den übrigen Dateien umzubenennen oder zu entfernen. Die HTML- und JavaScript-Dateien greifen teilweise über diese Bezeichnungen auf die entsprechenden Elemente zu.

Rein gestalterische Eigenschaften innerhalb der bestehenden CSS-Regeln können dagegen angepasst werden, ohne die grundsätzliche Funktionsweise des E-Shops zu verändern.

## Projekt starten

Nachdem die Datenbank eingerichtet, die `.env` konfiguriert und die benötigten Node.js-Abhängigkeiten installiert wurden, können Backend und Frontend des E-Shops gestartet werden.

Für die lokale Nutzung müssen sowohl das Backend als auch das Frontend ausgeführt werden.

### Backend starten

Zunächst wird der gesamte Projektordner beispielsweise in Visual Studio Code geöffnet.

Anschließend wird über **Terminal → New Terminal** ein Terminal geöffnet und in den Backend-Ordner gewechselt:

    cd backend

Das Backend kann anschließend mit folgendem Befehl gestartet werden:

    node server.js

Bei erfolgreichem Start läuft der Express-Server standardmäßig auf Port `3000`.

Das Terminal muss während der Nutzung des E-Shops geöffnet bleiben. Wird der laufende Prozess beendet oder das Terminal geschlossen, ist das Backend nicht mehr erreichbar.

Soll das Backend beendet werden, kann im entsprechenden Terminal **Strg + C** verwendet werden.

> **Hinweis:** Der verwendete Port wird über `PORT` in der Datei `backend/.env` festgelegt. Wird dort ein anderer Port eingestellt, muss darauf geachtet werden, dass die für das Backend verwendeten URLs im Projekt ebenfalls entsprechend angepasst werden.

### Frontend starten

Für die lokale Ausführung des Frontends kann beispielsweise die Visual-Studio-Code-Erweiterung **Live Server** verwendet werden.

Falls Live Server noch nicht installiert ist:

1. In Visual Studio Code den Bereich **Extensions** öffnen.
2. Nach **Live Server** suchen.
3. Die Erweiterung installieren.

Anschließend kann das Frontend gestartet werden:

1. Im Ordner `frontend` die Datei `index.html` öffnen.
2. Mit der rechten Maustaste in die Datei klicken.
3. **Open with Live Server** auswählen.

Das Frontend wird anschließend im Webbrowser geöffnet. Bei der in diesem Projekt vorgesehenen lokalen Konfiguration ist das Frontend unter einer Adresse mit Port `5500` erreichbar, beispielsweise:

    http://127.0.0.1:5500

Damit das Frontend mit dem Backend kommunizieren kann, muss das Backend weiterhin parallel über `node server.js` ausgeführt werden.

### Verbindung zwischen Frontend und Backend

Das Frontend sendet Anfragen an das Backend. Für die lokale Nutzung ist die Backend-Adresse im Frontend standardmäßig auf folgende Adresse eingestellt:

    http://127.0.0.1:3000

Diese Adresse muss mit der tatsächlich verwendeten Adresse und dem Port des Backends übereinstimmen.

Wird der Backend-Port oder die Adresse geändert, muss daher auch die entsprechende Backend-Adresse im Frontend angepasst werden. Die zentrale Einstellung befindet sich in der gemeinsamen JavaScript-Konfiguration des Frontends und ist im Quellcode mit `WICHTIGE KONFIGURATION:` gekennzeichnet.

### Online-Bereitstellung

Die zuvor beschriebene Vorgehensweise ist für die lokale Ausführung des Projekts vorgesehen.

Bei einer Online-Bereitstellung wird das Backend auf einem Server mit Node.js ausgeführt und das Frontend über einen Webserver bzw. Hosting-Anbieter bereitgestellt. Anstelle der lokalen Adressen wie `127.0.0.1` müssen dann die tatsächlichen Domains bzw. Serveradressen verwendet werden.

Auch die in der `.env` hinterlegten Datenbank- und URL-Einstellungen müssen an die jeweilige Serverumgebung angepasst werden.

Die grundlegende Aufteilung des Projekts in Frontend, Backend und MySQL-Datenbank bleibt dabei bestehen.

## Autor

Kaan Uslu

Studiengang Wirtschaftsinformatik B.Sc.  
Universität des Saarlandes
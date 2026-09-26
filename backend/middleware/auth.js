// Login- und Admin-Prüfung
function requireLogin(req, res, next) {
    if (!req.session.user) {
        return res.status(401).json({
            message: 'Bitte zuerst einloggen.'
        });
    }

    next();
}

function requireAdmin(req, res, next) {
    if (!req.session.user) {
        return res.status(401).json({
            message: 'Bitte zuerst einloggen.'
        });
    }

    if (req.session.user.role !== 'admin') {
        return res.status(403).json({
            message: 'Keine Berechtigung.'
        });
    }

    next();
}

module.exports = {
    requireLogin,
    requireAdmin
};
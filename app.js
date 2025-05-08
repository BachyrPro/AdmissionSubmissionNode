const express = require('express');
const path = require('path');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const admissionsRouter = require('./src/routes/admissions');

// Création de l'application Express
const app = express();

// Configuration des variables d'environnement
require('dotenv').config();

// Configuration des middlewares de sécurité et utilitaires
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", 'data:', 'https:'],
        },
    },
}));
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuration des fichiers statiques
// Assurez-vous que les chemins correspondent à votre structure de dossiers
app.use(express.static(path.join(__dirname, 'views'))); // Pour les fichiers HTML
app.use('/js', express.static(path.join(__dirname, 'public', 'js')));
app.use('/css', express.static(path.join(__dirname, 'public', 'css')));

// Configuration des routes
app.use('/api', admissionsRouter);

// Route principale servant l'application frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// Middleware de gestion des erreurs 404
app.use((req, res, next) => {
    res.status(404).json({
        success: false,
        message: 'Route non trouvée'
    });
});

// Middleware de gestion globale des erreurs
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({
        success: false,
        message: process.env.NODE_ENV === 'development' 
            ? err.message 
            : 'Une erreur interne est survenue'
    });
});

// Configuration du port
const PORT = process.env.PORT || 3000;

// Démarrage du serveur
app.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
});

module.exports = app;
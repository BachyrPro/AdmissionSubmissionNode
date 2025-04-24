// config/database.js
const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
    host: 'localhost', // Utilisation de 'localhost' au lieu de '127.0.0.1'
    user: 'root',
    password: '', // Mot de passe par défaut de XAMPP
    database: 'admissions',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    port: 3308,
    // Ajout des paramètres spécifiques pour XAMPP
    socketPath: process.platform === 'win32' ? null : '/xampp/mysql/tmp/mysql.sock'
};

console.log('Tentative de connexion avec les paramètres:', {
    ...dbConfig,
    password: '****' // On masque le mot de passe dans les logs
});

const pool = mysql.createPool(dbConfig);

// Fonction pour tester la connexion
const testConnection = async () => {
    try {
        const connection = await pool.getConnection();
        console.log('✓ Connexion à la base de données établie avec succès');
        
        // Vérifier si la table program existe
        const [tables] = await connection.query(
            'SHOW TABLES LIKE "program"'
        );
        
        if (tables.length === 0) {
            console.log('⚠ La table "program" n\'existe pas. Création en cours...');
            await createProgramTable(connection);
        }
        
        connection.release();
    } catch (error) {
        console.error('✗ Erreur de connexion à la base de données:', error);
        throw error;
    }
};

// Fonction pour créer la table program
const createProgramTable = async (connection) => {
    try {
        await connection.query(`
            CREATE TABLE IF NOT EXISTS program (
                program_code VARCHAR(10) PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                department VARCHAR(100) NOT NULL,
                duration INT NOT NULL
            )
        `);
        
        // Insérer des données de test
        await connection.query(`
            INSERT INTO program (program_code, name, department, duration) VALUES 
            ('INFO101', 'Informatique', 'Sciences', 3),
            ('MATH101', 'Mathématiques', 'Sciences', 3),
            ('BIO101', 'Biologie', 'Sciences', 4)
        `);
        
        console.log('✓ Table "program" créée avec succès avec des données de test');
    } catch (error) {
        console.error('✗ Erreur lors de la création de la table:', error);
        throw error;
    }
};

// Exécuter le test de connexion au démarrage
testConnection().catch(error => {
    console.error('Impossible de démarrer l\'application:', error);
    process.exit(1);
});

module.exports = pool;
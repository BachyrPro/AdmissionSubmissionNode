// src/routes/admissions.js
const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { validateAdmissionData } = require('../middleware/validation');

// Récupérer tous les programmes

// Récupérer tous les programmes
// src/routes/admissions.js
const { sendStatusEmail } = require('../services/emailServices');

// ... autres routes existantes ...

// Mettre à jour le statut d'une candidature
router.put('/applications/:id/status', async (req, res) => {
    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        const { id } = req.params;
        const { status, message } = req.body;

        if (!['ACCEPTED', 'REJECTED'].includes(status)) {
            throw new Error('Statut invalide');
        }

        // Récupérer les informations du candidat
        const [applicant] = await connection.query(`
            SELECT a.name, a.email 
            FROM application ap 
            JOIN applicant a ON ap.applicant_id = a.id 
            WHERE ap.id = ?
        `, [id]);

        if (!applicant[0]) {
            throw new Error('Candidature non trouvée');
        }

        // Mettre à jour le statut
        await connection.query(
            'UPDATE application SET status = ? WHERE id = ?',
            [status, id]
        );

        // Envoyer l'email
        await sendStatusEmail(
            applicant[0].email,
            applicant[0].name,
            status,
            message
        );

        await connection.commit();
        res.json({
            success: true,
            message: 'Statut mis à jour et email envoyé avec succès'
        });
    } catch (error) {
        if (connection) await connection.rollback();
        res.status(500).json({
            success: false,
            message: error.message
        });
    } finally {
        if (connection) connection.release();
    }
});
router.get('/programs', async (req, res) => {
    let connection;
    try {
        connection = await pool.getConnection();
        const [programs] = await connection.query(`
            SELECT 
                program_code,
                name,
                department,
                duration
            FROM program
            ORDER BY name ASC
        `);
        
        return res.json({
            success: true,
            programs: programs || []
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des programmes:', error);
        return res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des programmes'
        });
    } finally {
        if (connection) {
            try {
                connection.release();
            } catch (error) {
                console.error('Erreur lors de la libération de la connexion:', error);
            }
        }
    }
});
// Soumettre une candidature
router.post('/submit', validateAdmissionData, async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const { name, email, contact_number, date_of_birth, program_code } = req.body;

        // Vérifier si l'email existe déjà
        const [existingApplicant] = await connection.query(
            'SELECT id FROM applicant WHERE email = ?',
            [email]
        );

        if (existingApplicant.length > 0) {
            throw new Error('Cette adresse email est déjà utilisée');
        }

        // Insérer le candidat
        const [applicantResult] = await connection.query(
            'INSERT INTO applicant (name, email, phone, birthdate) VALUES (?, ?, ?, ?)',
            [name, email, contact_number, date_of_birth]
        );

        // Insérer l'application
        const [applicationResult] = await connection.query(
            'INSERT INTO application (applicant_id, program_code, application_date, status) VALUES (?, ?, CURRENT_DATE, "PENDING")',
            [applicantResult.insertId, program_code]
        );

        // Créer une notification
        await connection.query(
            'INSERT INTO notification (application_id, message) VALUES (?, ?)',
            [applicationResult.insertId, `Nouvelle candidature reçue pour ${name}`]
        );

        await connection.commit();
        res.status(201).json({
            success: true,
            message: 'Candidature soumise avec succès'
        });
    } catch (error) {
        await connection.rollback();
        res.status(400).json({
            success: false,
            message: error.message
        });
    } finally {
        connection.release();
    }
});

// Récupérer toutes les candidatures avec filtrage par statut
router.get('/applications', async (req, res) => {
    try {
        const { status } = req.query;
        let query = `
            SELECT 
                a.id as application_id,
                ap.name,
                ap.email,
                ap.phone,
                p.name as program_name,
                a.status,
                a.application_date
            FROM application a
            JOIN applicant ap ON a.applicant_id = ap.id
            JOIN program p ON a.program_code = p.program_code
        `;
        
        const params = [];
        if (status) {
            query += ' WHERE a.status = ?';
            params.push(status);
        }
        
        const [applications] = await pool.query(query, params);
        res.json({ success: true, applications });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des candidatures'
        });
    }
});

// Mettre à jour le statut d'une candidature
router.put('/applications/:id/status', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const { id } = req.params;
        const { status, message } = req.body;

        if (!['PENDING', 'ACCEPTED', 'REJECTED'].includes(status)) {
            throw new Error('Statut invalide');
        }

        await connection.query(
            'UPDATE application SET status = ? WHERE id = ?',
            [status, id]
        );

        // Créer une notification pour le changement de statut
        await connection.query(
            'INSERT INTO notification (application_id, message) VALUES (?, ?)',
            [id, message || `Statut de la candidature mis à jour: ${status}`]
        );

        await connection.commit();
        res.json({
            success: true,
            message: 'Statut mis à jour avec succès'
        });
    } catch (error) {
        await connection.rollback();
        res.status(400).json({
            success: false,
            message: error.message
        });
    } finally {
        connection.release();
    }
});

module.exports = router;
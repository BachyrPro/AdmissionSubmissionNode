const validateAdmissionData = (req, res, next) => {
    const { name, email, contact_number, date_of_birth, program_code } = req.body;
    
    const errors = [];

    // Validation du nom
    if (!name || name.trim().length < 2) {
        return res.status(400).json({ success: false, message: "Nom invalide" });
    }

    // Validation de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
        return res.status(400).json({ success: false, message: "Email invalide" });
    }

    // Validation du numéro de contact
    const phoneRegex = /^\+?[\d\s-]{8,}$/;
    if (!contact_number || !phoneRegex.test(contact_number)) {
        return res.status(400).json({ success: false, message: "Numéro de téléphone invalide"});
    }

    // Validation de la date de naissance
    const birthDate = new Date(date_of_birth);
    const today = new Date();
    if (!date_of_birth || birthDate >= today) {
        errors.push('Date de naissance invalide');
    }

    // Validation du code de programme
    if (!program_code) {
        errors.push('Veuillez sélectionner un programme');
    }

    if (errors.length > 0) {
        return res.status(400).json({ 
            success: false,
            errors: errors 
        });
    }

    next();
};

module.exports = { validateAdmissionData };
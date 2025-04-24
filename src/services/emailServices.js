// src/services/emailService.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

const sendStatusEmail = async (email, name, status, message) => {
    const subject = status === 'ACCEPTED' ? 
        'Félicitations ! Votre candidature a été acceptée' : 
        'Réponse concernant votre candidature';

    const htmlContent = `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>Cher(e) ${name},</h2>
            <p>${status === 'ACCEPTED' ? 
                'Nous avons le plaisir de vous informer que votre candidature a été acceptée.' :
                'Nous vous remercions cet intérêt que vous portez à notre établissement. Malheureusement, nous ne pouvons pas donner suite à votre candidature.'
            }</p>
            <p><strong>Message :</strong> ${message}</p>
            <p>Cordialement,<br>L'équipe d'admission</p>
        </div>`;
    

    try {
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: subject,
            html: htmlContent
        });
        console.log('Email envoyé avec succès');
        return true;
    } catch (error) {
        console.error('Erreur d\'envoi d\'email:', error);
        throw error;
    }
};

module.exports = { sendStatusEmail };
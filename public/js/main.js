// // public/js/main.js
document.addEventListener('DOMContentLoaded', () => {
    // Gestionnaire des onglets
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.dataset.tab;
            
            // Mettre à jour les classes actives
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            btn.classList.add('active');
            document.getElementById(tabId).classList.add('active');

            // Recharger les données si nécessaire
            if (tabId === 'applications') {
                loadApplications();
            }
        });
    });

    // Initialisation
    loadPrograms();
    initializeFormValidation();
    
    // Gestionnaire de filtrage
    document.getElementById('statusFilter')?.addEventListener('change', loadApplications);
});

// Fonction pour afficher les messages d'erreur
function showError(elementId, message) {
    const errorDiv = document.getElementById(`${elementId}-error`);
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
    }
}

// Fonction pour cacher les messages d'erreur
function hideError(elementId) {
    const errorDiv = document.getElementById(`${elementId}-error`);
    if (errorDiv) {
        errorDiv.style.display = 'none';
    }
}

// Validation du formulaire
function validateForm(formData) {
    let isValid = true;

    // Validation du nom
    if (!formData.get('name') || formData.get('name').trim().length < 2) {
        showError('name', 'Le nom doit contenir au moins 2 caractères');
        isValid = false;
    } else {
        hideError('name');
    }

    // Validation de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.get('email'))) {
        showError('email', 'Email invalide');
        isValid = false;
    } else {
        hideError('email');
    }

    // Validation du numéro de téléphone
    const phoneRegex = /^\+?[\d\s-]{8,}$/;
    if (!phoneRegex.test(formData.get('contact_number'))) {
        showError('contact', 'Numéro de téléphone invalide');
        isValid = false;
    } else {
        hideError('contact');
    }

    // Validation de la date de naissance
    const birthDate = new Date(formData.get('date_of_birth'));
    const today = new Date();
    if (!formData.get('date_of_birth') || birthDate >= today) {
        showError('birth', 'Date de naissance invalide');
        isValid = false;
    } else {
        hideError('birth');
    }

    // Validation du programme
    if (!formData.get('program_code')) {
        showError('program', 'Veuillez sélectionner un programme');
        isValid = false;
    } else {
        hideError('program');
    }

    return isValid;
}

// public/js/main.js
// ... (garder le code existant)

// Chargement des programmes
async function loadPrograms() {
    try {
        const response = await fetch('/api/programs');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.message);
        }
        
        const select = document.getElementById('program_code');
        if (!select) {
            throw new Error('Élément select non trouvé');
        }

        select.innerHTML = '<option value="">Sélectionnez un programme</option>';
        
        if (!data.programs || data.programs.length === 0) {
            throw new Error('Aucun programme disponible');
        }
        
        data.programs.forEach(program => {
            const option = document.createElement('option');
            option.value = program.program_code;
            option.textContent = `${program.name} (${program.department} - ${program.duration} ans)`;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Erreur loadPrograms:', error);
        const errorMessage = error.message || 'Erreur lors du chargement des programmes';
        showError('program', errorMessage);
        
        // Afficher l'erreur dans la console pour le débogage
        if (process.env.NODE_ENV === 'development') {
            console.error('Détails de l\'erreur:', error);
        }
    }
}

// Initialisation de la validation du formulaire
function initializeFormValidation() {
    const form = document.getElementById('admissionForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(form);

        if (!validateForm(formData)) {
            return;
        }

        const submitButton = form.querySelector('button[type="submit"]');
        const originalButtonText = submitButton.textContent;
        submitButton.disabled = true;
        submitButton.textContent = 'Envoi en cours...';

        try {
            const response = await fetch('/api/submit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(Object.fromEntries(formData))
            });

            const data = await response.json();

            if (data.success) {
                document.getElementById('successMessage').textContent = data.message;
                document.getElementById('successMessage').style.display = 'block';
                document.getElementById('errorMessage').style.display = 'none';
                form.reset();
                loadApplications(); // Recharger la liste des candidatures
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            document.getElementById('errorMessage').textContent = error.message;
            document.getElementById('errorMessage').style.display = 'block';
            document.getElementById('successMessage').style.display = 'none';
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = originalButtonText;
        }
    });
}

// Chargement des candidatures
async function loadApplications() {
    try {
        const status = document.getElementById('statusFilter').value;
        const response = await fetch(`/api/applications${status ? `?status=${status}` : ''}`);
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.message);
        }
        
        const tbody = document.getElementById('applicationsTableBody');
        tbody.innerHTML = '';
        
        data.applications.forEach(app => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${app.name}</td>
                <td>${app.email}</td>
                <td>${app.program_name}</td>
                <td>${getStatusBadge(app.status)}</td>
                <td>${new Date(app.application_date).toLocaleDateString()}
                </td>
                <td>
                    ${app.status === 'PENDING' ? `
                        <button onclick="updateStatus(${app.application_id}, 'ACCEPTED')" class="btn btn-success">Accepter</button>
                        <button onclick="updateStatus(${app.application_id}, 'REJECTED')" class="btn btn-danger">Rejeter</button>
                    ` : ''}
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        console.error('Erreur:', error);
        const errorMessage = document.getElementById('errorMessage');
        errorMessage.textContent = 'Erreur lors du chargement des candidatures';
        errorMessage.style.display = 'block';
    }
}

// Fonction pour générer le badge de statut
function getStatusBadge(status) {
    const statusMap = {
        'PENDING': { text: 'En attente', class: 'badge-warning' },
        'ACCEPTED': { text: 'Accepté', class: 'badge-success' },
        'REJECTED': { text: 'Rejeté', class: 'badge-danger' }
    };

    const statusInfo = statusMap[status] || { text: status, class: 'badge-secondary' };
    return `<span class="badge ${statusInfo.class}">${statusInfo.text}</span>`;
}

// Mise à jour du statut
async function updateStatus(applicationId, newStatus) {
    try {
        const message = prompt(`Entrez un message pour ${newStatus === 'ACCEPTED' ? 'l\'acceptation' : 'le rejet'} de la candidature :`);
        if (message === null) return; // L'utilisateur a annulé

        const response = await fetch(`/api/applications/${applicationId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                status: newStatus,
                message: message
            })
        });

        const data = await response.json();
        
        if (data.success) {
            const successMessage = document.getElementById('successMessage');
            successMessage.textContent = 'Statut mis à jour avec succès';
            successMessage.style.display = 'block';
            setTimeout(() => {
                successMessage.style.display = 'none';
            }, 3000);
            loadApplications(); // Recharger la liste
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        console.error('Erreur:', error);
        const errorMessage = document.getElementById('errorMessage');
        errorMessage.textContent = error.message || 'Erreur lors de la mise à jour du statut';
        errorMessage.style.display = 'block';
    }
}
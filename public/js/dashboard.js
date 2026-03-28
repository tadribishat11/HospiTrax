// Real-time dashboard updates for patient queue
let socket;
let refreshTimer;

// Initialize dashboard
function initDashboard() {
    loadQueueStatus();
    startAutoRefresh();
}

// Load current queue status
function loadQueueStatus() {
    const patientId = getPatientId();
    if (!patientId) return;

    fetch(`/appointments/live-queue/${patientId}`)
        .then(response => response.json())
        .then(data => {
            updateQueueDisplay(data);
        })
        .catch(error => {
            console.error('Error loading queue status:', error);
        });
}

// Update UI with queue data
function updateQueueDisplay(data) {
    if (data.hasAppointment) {
        document.getElementById('queueNumber').textContent = data.queueNumber;
        document.getElementById('estimatedTime').textContent = formatTime(data.estimatedWaitingTime);
        document.getElementById('patientsAhead').textContent = data.patientsAhead;
        
        // Show waiting time warning
        if (data.estimatedWaitingTime > 60) {
            showWarning('Long wait time expected. Please be patient.');
        }
    } else {
        document.getElementById('queueNumber').textContent = 'No Appt';
        document.getElementById('estimatedTime').textContent = 'Book now';
        document.getElementById('patientsAhead').textContent = '0';
    }
}

// Format time in minutes
function formatTime(minutes) {
    if (minutes < 60) {
        return `${minutes} minutes`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
}

// Show warning message
function showWarning(message) {
    const warningDiv = document.getElementById('warningMessage');
    if (warningDiv) {
        warningDiv.textContent = message;
        warningDiv.style.display = 'block';
        setTimeout(() => {
            warningDiv.style.display = 'none';
        }, 5000);
    }
}

// Start auto-refresh timer
function startAutoRefresh() {
    if (refreshTimer) clearInterval(refreshTimer);
    refreshTimer = setInterval(() => {
        loadQueueStatus();
        loadAppointments();
    }, 10000); // Refresh every 10 seconds
}

// Get patient ID from session
function getPatientId() {
    const patientIdElement = document.querySelector('[data-patient-id]');
    return patientIdElement ? patientIdElement.dataset.patientId : null;
}

// Load appointments for patient
function loadAppointments() {
    const patientId = getPatientId();
    if (!patientId) return;

    fetch(`/appointments/patient/${patientId}`)
        .then(response => response.json())
        .then(appointments => {
            updateAppointmentsTable(appointments);
        })
        .catch(error => {
            console.error('Error loading appointments:', error);
        });
}

// Update appointments table
function updateAppointmentsTable(appointments) {
    const tableBody = document.querySelector('#appointmentsTable tbody');
    if (!tableBody) return;

    if (!appointments || appointments.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7" class="no-appointments">No appointments found</td></tr>';
        return;
    }

    tableBody.innerHTML = appointments.map(app => `
        <tr>
            <td>${app.doctor_name || `Dr. ${app.doctor_id}`}</td>
            <td>${app.specialization || 'General'}</td>
            <td>${new Date(app.date).toLocaleDateString()}</td>
            <td>${app.time}</td>
            <td>${app.queue_number || '—'}</td>
            <td class="status-${app.status}">${app.status}</td>
            <td>
                ${app.status !== 'cancelled' && app.status !== 'completed' ? 
                    `<button onclick="cancelAppointment(${app.id})">Cancel</button>` : 
                    '—'}
            </td>
        </tr>
    `).join('');
}

// Cancel appointment
function cancelAppointment(id) {
    if (!confirm('Are you sure you want to cancel this appointment?')) return;

    fetch(`/appointments/cancel/${id}`, { method: 'PUT' })
        .then(() => {
            alert('Appointment cancelled successfully');
            loadAppointments();
            loadQueueStatus();
        })
        .catch(error => {
            console.error('Error cancelling appointment:', error);
            alert('Failed to cancel appointment');
        });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', initDashboard);
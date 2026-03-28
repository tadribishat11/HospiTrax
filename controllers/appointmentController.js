const db = require("../config/db");
const Appointment = require("../models/appointment");
const Doctor = require("../models/doctor");

/* ================= BOOK APPOINTMENT WITH QUEUE ================= */
exports.bookAppointment = async (req, res) => {
    const { patient_id, doctor_id, date, time, priority } = req.body;

    try {
        // Validate input
        if (!patient_id || !doctor_id || !date || !time) {
            return res.status(400).json({ error: "All fields are required" });
        }

        // Check if doctor is available at this time
        const doctorSchedule = await Doctor.getSchedule(doctor_id, date);
        const timeConflict = doctorSchedule.some(app => app.time === time && app.status !== 'cancelled');
        
        if (timeConflict) {
            return res.status(400).json({ error: "Doctor is not available at this time" });
        }

        // Get doctor's average consultation time
        const doctor = await Doctor.getById(doctor_id);
        const avgConsultTime = doctor.average_consultation_time || 15;

        // Calculate queue number
        let queueNumber = 1;
        const existingAppointments = await Appointment.getTodayQueue(doctor_id, date);
        
        if (existingAppointments.length > 0) {
            const maxQueue = Math.max(...existingAppointments.map(a => a.queue_number));
            queueNumber = maxQueue + 1;
        }

        // Emergency patients get priority (move to front)
        let finalQueueNumber = queueNumber;
        if (priority === "emergency" && existingAppointments.length > 0) {
            finalQueueNumber = 1;
            // Re-queue existing appointments
            for (let i = 0; i < existingAppointments.length; i++) {
                await Appointment.updateQueueNumber(existingAppointments[i].id, existingAppointments[i].queue_number + 1);
            }
        }

        // Calculate estimated waiting time
        let patientsAhead = existingAppointments.filter(a => a.queue_number < finalQueueNumber).length;
        let estimatedTime = patientsAhead * avgConsultTime;
        
        // Emergency patients have priority (0 wait)
        if (priority === "emergency") {
            estimatedTime = 0;
        }

        // Create appointment
        const result = await Appointment.create({
            patient_id,
            doctor_id,
            date,
            time,
            priority,
            status: "scheduled",
            queue_number: finalQueueNumber,
            estimated_waiting_time: estimatedTime
        });

        // Update queue status
        await Appointment.updateQueueStatus(doctor_id, date, finalQueueNumber);

        res.status(201).json({
            message: "Appointment booked successfully",
            appointmentId: result.insertId,
            queueNumber: finalQueueNumber,
            estimatedWaitingTime: estimatedTime,
            patientsAhead: patientsAhead
        });

    } catch (error) {
        console.error("Booking error:", error);
        res.status(500).json({ error: "Failed to book appointment" });
    }
};

/* ================= GET PATIENT APPOINTMENTS ================= */
exports.getPatientAppointments = async (req, res) => {
    const { patient_id } = req.params;

    try {
        const sql = `
            SELECT a.*, d.id as doctor_id, u.name as doctor_name, 
                   d.specialization, d.average_consultation_time,
                   COUNT(a2.id) as patients_ahead
            FROM appointments a
            JOIN doctors d ON a.doctor_id = d.id
            JOIN users u ON d.user_id = u.id
            LEFT JOIN appointments a2 ON a2.doctor_id = a.doctor_id 
                AND a2.date = a.date 
                AND a2.queue_number < a.queue_number
                AND a2.status NOT IN ('cancelled', 'completed')
            WHERE a.patient_id = ? AND a.date >= CURDATE()
            GROUP BY a.id
            ORDER BY a.date ASC, a.queue_number ASC
        `;
        
        db.query(sql, [patient_id], (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: "Database error" });
            }
            res.json(result);
        });
    } catch (error) {
        console.error("Error fetching appointments:", error);
        res.status(500).json({ error: "Failed to fetch appointments" });
    }
};

/* ================= GET LIVE QUEUE STATUS ================= */
exports.getLiveQueueStatus = async (req, res) => {
    const { patient_id } = req.params;

    try {
        const queueInfo = await Appointment.getLiveQueue(patient_id);
        
        if (!queueInfo) {
            return res.json({ 
                hasAppointment: false,
                message: "No upcoming appointments"
            });
        }

        // Calculate remaining waiting time
        let remainingTime = queueInfo.estimated_waiting_time;
        if (queueInfo.waiting_time_remaining) {
            remainingTime = queueInfo.waiting_time_remaining;
        } else if (queueInfo.patients_ahead) {
            const doctor = await Doctor.getById(queueInfo.doctor_id);
            const avgTime = doctor.average_consultation_time || 15;
            remainingTime = queueInfo.patients_ahead * avgTime;
        }

        res.json({
            hasAppointment: true,
            queueNumber: queueInfo.queue_number,
            patientsAhead: queueInfo.patients_ahead || 0,
            estimatedWaitingTime: remainingTime,
            status: queueInfo.status,
            doctorName: queueInfo.doctor_name,
            doctorSpecialization: queueInfo.specialization,
            appointmentDate: queueInfo.date,
            appointmentTime: queueInfo.time
        });

    } catch (error) {
        console.error("Error fetching queue status:", error);
        res.status(500).json({ error: "Failed to fetch queue status" });
    }
};

/* ================= CANCEL APPOINTMENT ================= */
exports.cancelAppointment = (req, res) => {
    const { id } = req.params;

    db.query(
        "UPDATE appointments SET status='cancelled' WHERE id=?",
        [id],
        (err) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: "Failed to cancel appointment" });
            }
            res.json({ message: "Appointment cancelled successfully" });
        }
    );
};

/* ================= UPDATE APPOINTMENT STATUS (DOCTOR) ================= */
exports.updateAppointmentStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    try {
        await Appointment.updateStatus(id, status);
        
        // If marking as completed, update queue
        if (status === 'completed' || status === 'in-progress') {
            const appointment = await Appointment.getQueuePosition(id);
            if (appointment) {
                await Appointment.updateQueueStatus(appointment.doctor_id, appointment.date, appointment.queue_number);
            }
        }
        
        res.json({ message: "Status updated successfully" });
    } catch (error) {
        console.error("Error updating status:", error);
        res.status(500).json({ error: "Failed to update status" });
    }
};

/* ================= GET DOCTOR'S TODAY QUEUE ================= */
exports.getDoctorTodayQueue = async (req, res) => {
    const { doctor_id } = req.params;
    const today = new Date().toISOString().split('T')[0];

    try {
        const queue = await Appointment.getTodayQueue(doctor_id, today);
        
        // Calculate waiting times for each patient
        const queueWithWaiting = queue.map((patient, index) => {
            const estimatedTime = patient.estimated_waiting_time;
            return {
                ...patient,
                position: index + 1,
                estimatedTimeRemaining: estimatedTime - (patient.waiting_elapsed || 0)
            };
        });
        
        res.json(queueWithWaiting);
    } catch (error) {
        console.error("Error fetching queue:", error);
        res.status(500).json({ error: "Failed to fetch queue" });
    }
};
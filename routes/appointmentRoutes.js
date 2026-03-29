const express = require("express");
const router = express.Router();
const appointmentController = require("../controllers/appointmentController");
const db = require("../config/db");

// FIX: Your db.js uses createConnection, not createPool.
// createConnection does NOT support getConnection() or transactions.
// All routes below use db.promise().query() directly which works with createConnection.

// =============================================================
// FEATURE 1: APPOINTMENT BOOKING
// =============================================================
router.post("/book", async (req, res) => {
    try {
        const { patient_id, doctor_id, date, time, priority } = req.body;

        if (!patient_id || !doctor_id || !date || !time) {
            return res.status(400).json({ error: "patient_id, doctor_id, date and time are required." });
        }

        const isEmergency = priority === "emergency";
        let assignedQueueNumber;

        if (isEmergency) {
            // Shift all existing active appointments up by 1
            await db.promise().query(
                `UPDATE appointments
                 SET queue_number = queue_number + 1
                 WHERE doctor_id = ? AND date = ?
                   AND status IN ('scheduled', 'confirmed')`,
                [doctor_id, date]
            );

            // Keep queue_status in sync
            await db.promise().query(
                `UPDATE queue_status
                 SET current_queue_number = current_queue_number + 1
                 WHERE doctor_id = ? AND date = ?`,
                [doctor_id, date]
            );

            assignedQueueNumber = 1;

        } else {
            // Normal booking — get next queue number
            const [[queueRow]] = await db.promise().query(
                `SELECT COALESCE(MAX(queue_number), 0) + 1 AS next_queue
                 FROM appointments
                 WHERE doctor_id = ? AND date = ?
                   AND status IN ('scheduled', 'confirmed')`,
                [doctor_id, date]
            );
            assignedQueueNumber = queueRow.next_queue;
        }

        // Get doctor's avg consultation time for estimated wait
        const [[doctorRow]] = await db.promise().query(
            `SELECT average_consultation_time FROM doctors WHERE id = ?`,
            [doctor_id]
        );
        const avgTime = (doctorRow && doctorRow.average_consultation_time) || 15;
        const estimatedWait = (assignedQueueNumber - 1) * avgTime;

        // Insert the appointment
        const [result] = await db.promise().query(
            `INSERT INTO appointments
                (patient_id, doctor_id, date, time, status, priority, queue_number, estimated_waiting_time)
             VALUES (?, ?, ?, ?, 'scheduled', ?, ?, ?)`,
            [patient_id, doctor_id, date, time,
             isEmergency ? "emergency" : "normal",
             assignedQueueNumber, estimatedWait]
        );

        // Upsert queue_status for this doctor+date
        await db.promise().query(
            `INSERT INTO queue_status (doctor_id, date, current_queue_number)
             VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE last_updated = CURRENT_TIMESTAMP`,
            [doctor_id, date, assignedQueueNumber]
        );

        return res.status(201).json({
            success: true,
            message: isEmergency
                ? "Emergency appointment booked. You are at the front of the queue."
                : "Appointment booked successfully.",
            queueNumber: assignedQueueNumber,
            estimatedWaitingTime: estimatedWait,
            appointment: {
                id: result.insertId,
                queue_number: assignedQueueNumber,
                priority: isEmergency ? "emergency" : "normal",
                estimated_waiting_time: estimatedWait
            }
        });

    } catch (err) {
        console.error("Book appointment error:", err);
        return res.status(500).json({ error: "Server error while booking appointment." });
    }
});

// =============================================================
// GET PATIENT APPOINTMENTS
// =============================================================
router.get("/patient/:patient_id", async (req, res) => {
    try {
        const [rows] = await db.promise().query(
            `SELECT a.*, u.name AS doctor_name, d.specialization
             FROM appointments a
             JOIN doctors d ON d.id = a.doctor_id
             JOIN users u ON u.id = d.user_id
             WHERE a.patient_id = ?
             ORDER BY a.date DESC, a.queue_number ASC`,
            [req.params.patient_id]
        );
        return res.json(rows);
    } catch (err) {
        console.error("Get patient appointments error:", err);
        return res.status(500).json({ error: "Server error." });
    }
});

// =============================================================
// LIVE QUEUE STATUS
// =============================================================
router.get("/live-queue/:patient_id", appointmentController.getLiveQueueStatus);

// =============================================================
// CANCEL APPOINTMENT
// =============================================================
router.put("/cancel/:id", appointmentController.cancelAppointment);

// =============================================================
// UPDATE APPOINTMENT STATUS (doctor use — Start / Done buttons)
// =============================================================
router.put("/status/:id", appointmentController.updateAppointmentStatus);

// =============================================================
// DOCTOR'S TODAY QUEUE
// =============================================================
router.get("/doctor/:doctorId", async (req, res) => {
    try {
        const today = new Date().toISOString().split("T")[0];
        const [rows] = await db.promise().query(
            `SELECT a.*, u.name AS patient_name, p.age, p.gender
             FROM appointments a
             JOIN patients p ON p.id = a.patient_id
             JOIN users u ON u.id = p.user_id
             WHERE a.doctor_id = ? AND a.date = ?
               AND a.status IN ('scheduled', 'confirmed', 'in-progress')
             ORDER BY
               CASE a.priority WHEN 'emergency' THEN 0 ELSE 1 END ASC,
               a.queue_number ASC`,
            [req.params.doctorId, today]
        );
        return res.json({ success: true, queue: rows });
    } catch (err) {
        console.error("Get doctor queue error:", err);
        return res.status(500).json({ error: "Server error." });
    }
});

// Keep old route as alias so existing code still works
router.get("/doctor-queue/:doctor_id", appointmentController.getDoctorTodayQueue);

module.exports = router;
// controllers/vitalsController.js
// FEATURE — Patient Vital Signs Visualization

const db = require("../config/db");

/* ─────────────────────────────────────────────────────────────
   POST /vitals/record
   Doctor records vital signs for a patient.

   Body:
   {
     patient_id, doctor_id, appointment_id (optional),
     blood_pressure_systolic, blood_pressure_diastolic,
     heart_rate, temperature, blood_glucose, weight, notes
   }
───────────────────────────────────────────────────────────── */
exports.recordVitals = async (req, res) => {
    const {
        patient_id, doctor_id, appointment_id,
        blood_pressure_systolic, blood_pressure_diastolic,
        heart_rate, temperature, blood_glucose, weight, notes
    } = req.body;

    if (!patient_id || !doctor_id) {
        return res.status(400).json({ error: "patient_id and doctor_id are required." });
    }

    try {
        const [result] = await db.promise().query(
            `INSERT INTO vital_signs
                (patient_id, doctor_id, appointment_id,
                 blood_pressure_systolic, blood_pressure_diastolic,
                 heart_rate, temperature, blood_glucose, weight, notes)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                patient_id, doctor_id, appointment_id || null,
                blood_pressure_systolic || null, blood_pressure_diastolic || null,
                heart_rate || null, temperature || null,
                blood_glucose || null, weight || null, notes || null
            ]
        );

        return res.status(201).json({
            success: true,
            message: "Vital signs recorded successfully.",
            vitals_id: result.insertId
        });

    } catch (err) {
        console.error("recordVitals error:", err);
        return res.status(500).json({ error: "Failed to record vital signs." });
    }
};

/* ─────────────────────────────────────────────────────────────
   GET /vitals/patient/:patient_id
   Returns all vital sign records for a patient (newest first).
───────────────────────────────────────────────────────────── */
exports.getPatientVitals = async (req, res) => {
    const { patient_id } = req.params;

    try {
        const [rows] = await db.promise().query(
            `SELECT
                v.*,
                u_doc.name AS doctor_name,
                d.specialization
             FROM vital_signs v
             JOIN doctors d      ON d.id  = v.doctor_id
             JOIN users u_doc    ON u_doc.id = d.user_id
             WHERE v.patient_id = ?
             ORDER BY v.recorded_at ASC`,
            [patient_id]
        );
        return res.json({ success: true, vitals: rows });

    } catch (err) {
        console.error("getPatientVitals error:", err);
        return res.status(500).json({ error: "Failed to fetch vital signs." });
    }
};

/* ─────────────────────────────────────────────────────────────
   GET /vitals/patient/:patient_id/latest
   Returns only the most recent vitals entry for a patient.
───────────────────────────────────────────────────────────── */
exports.getLatestVitals = async (req, res) => {
    const { patient_id } = req.params;

    try {
        const [rows] = await db.promise().query(
            `SELECT
                v.*,
                u_doc.name AS doctor_name
             FROM vital_signs v
             JOIN doctors d   ON d.id  = v.doctor_id
             JOIN users u_doc ON u_doc.id = d.user_id
             WHERE v.patient_id = ?
             ORDER BY v.recorded_at DESC
             LIMIT 1`,
            [patient_id]
        );

        if (!rows.length) {
            return res.status(404).json({ error: "No vitals recorded for this patient." });
        }
        return res.json({ success: true, vitals: rows[0] });

    } catch (err) {
        console.error("getLatestVitals error:", err);
        return res.status(500).json({ error: "Failed to fetch latest vitals." });
    }
};

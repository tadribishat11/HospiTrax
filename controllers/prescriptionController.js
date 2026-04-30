
// FEATURE 2 — Doctor updates patient prescriptions

const db = require("../config/db");

/* ─────────────────────────────────────────────────────────────
   POST /prescriptions/save
   Doctor adds or updates a prescription for an appointment.

   Body:
   {
     appointment_id : number,
     details        : string,       // free-text notes
     medicines      : [             // optional structured list
       { name: "Paracetamol", dosage: "500mg", frequency: "3x daily", duration: "5 days" }
     ]
   }
───────────────────────────────────────────────────────────── */
exports.savePrescription = async (req, res) => {
    const { appointment_id, details, medicines } = req.body;

    if (!appointment_id || !details) {
        return res.status(400).json({ error: "appointment_id and details are required." });
    }

    try {
        // Resolve doctor_id and patient_id from the appointment
        const [[appt]] = await db.promise().query(
            `SELECT doctor_id, patient_id FROM appointments WHERE id = ?`,
            [appointment_id]
        );

        if (!appt) {
            return res.status(404).json({ error: "Appointment not found." });
        }

        const medicinesJson = medicines ? JSON.stringify(medicines) : null;

        // Upsert: update if a prescription already exists, otherwise insert
        const [[existing]] = await db.promise().query(
            `SELECT id FROM prescriptions WHERE appointment_id = ?`,
            [appointment_id]
        );

        if (existing) {
            await db.promise().query(
                `UPDATE prescriptions
                 SET details    = ?,
                     medicines  = ?,
                     doctor_id  = ?,
                     patient_id = ?
                 WHERE appointment_id = ?`,
                [details, medicinesJson, appt.doctor_id, appt.patient_id, appointment_id]
            );
            return res.json({ success: true, message: "Prescription updated successfully." });
        } else {
            const [result] = await db.promise().query(
                `INSERT INTO prescriptions
                    (appointment_id, details, medicines, doctor_id, patient_id)
                 VALUES (?, ?, ?, ?, ?)`,
                [appointment_id, details, medicinesJson, appt.doctor_id, appt.patient_id]
            );
            return res.status(201).json({
                success: true,
                message: "Prescription saved.",
                prescription_id: result.insertId
            });
        }

    } catch (err) {
        console.error("savePrescription error:", err);
        return res.status(500).json({ error: "Failed to save prescription." });
    }
};

/* ─────────────────────────────────────────────────────────────
   GET /prescriptions/appointment/:appointment_id
   Returns the prescription for a specific appointment.
   Used by the doctor dashboard "View Prescription" button.
───────────────────────────────────────────────────────────── */
exports.getByAppointment = (req, res) => {
    const { appointment_id } = req.params;

    db.query(
        `SELECT
            p.id,
            p.appointment_id,
            p.details,
            p.medicines,
            p.updated_at,
            u_doc.name  AS doctor_name,
            u_pat.name  AS patient_name,
            a.date      AS appointment_date,
            a.time      AS appointment_time
         FROM prescriptions p
         JOIN appointments a ON a.id  = p.appointment_id
         JOIN doctors d      ON d.id  = p.doctor_id
         JOIN users u_doc    ON u_doc.id = d.user_id
         JOIN patients pt    ON pt.id = p.patient_id
         JOIN users u_pat    ON u_pat.id = pt.user_id
         WHERE p.appointment_id = ?`,
        [appointment_id],
        (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            if (!rows.length)
                return res.status(404).json({ error: "No prescription found for this appointment." });

            const row = rows[0];
            // Parse stored JSON medicines safely
            if (row.medicines && typeof row.medicines === "string") {
                try { row.medicines = JSON.parse(row.medicines); }
                catch { row.medicines = []; }
            }
            res.json({ success: true, prescription: row });
        }
    );
};

/* ─────────────────────────────────────────────────────────────
   GET /prescriptions/patient/:patient_id
   Returns all prescriptions for a patient (newest first).
   Used on the patient dashboard "My Prescriptions" tab.
───────────────────────────────────────────────────────────── */
exports.getByPatient = (req, res) => {
    const { patient_id } = req.params;

    db.query(
        `SELECT
            p.id,
            p.appointment_id,
            p.details,
            p.medicines,
            p.updated_at,
            u_doc.name AS doctor_name,
            d.specialization,
            a.date     AS appointment_date
         FROM prescriptions p
         JOIN appointments a ON a.id  = p.appointment_id
         JOIN doctors d      ON d.id  = p.doctor_id
         JOIN users u_doc    ON u_doc.id = d.user_id
         WHERE p.patient_id = ?
         ORDER BY p.updated_at DESC`,
        [patient_id],
        (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });

            rows.forEach(r => {
                if (r.medicines && typeof r.medicines === "string") {
                    try { r.medicines = JSON.parse(r.medicines); }
                    catch { r.medicines = []; }
                }
            });

            res.json({ success: true, prescriptions: rows });
        }
    );
};

/* ─────────────────────────────────────────────────────────────
   GET /prescriptions/doctor/:doctor_id
   Returns all prescriptions written by this doctor.
   Used on the doctor dashboard history panel.
───────────────────────────────────────────────────────────── */
exports.getByDoctor = (req, res) => {
    const { doctor_id } = req.params;

    db.query(
        `SELECT
            p.id,
            p.appointment_id,
            p.details,
            p.medicines,
            p.updated_at,
            u_pat.name AS patient_name,
            a.date     AS appointment_date
         FROM prescriptions p
         JOIN appointments a ON a.id  = p.appointment_id
         JOIN patients pt    ON pt.id = p.patient_id
         JOIN users u_pat    ON u_pat.id = pt.user_id
         WHERE p.doctor_id = ?
         ORDER BY p.updated_at DESC`,
        [doctor_id],
        (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });

            rows.forEach(r => {
                if (r.medicines && typeof r.medicines === "string") {
                    try { r.medicines = JSON.parse(r.medicines); }
                    catch { r.medicines = []; }
                }
            });

            res.json({ success: true, prescriptions: rows });
        }
    );
};

/* ─────────────────────────────────────────────────────────────
   DELETE /prescriptions/:prescription_id
   Hard-delete a prescription record (admin / doctor only).
───────────────────────────────────────────────────────────── */
exports.deletePrescription = (req, res) => {
    const { prescription_id } = req.params;

    db.query(
        "DELETE FROM prescriptions WHERE id = ?",
        [prescription_id],
        (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            if (result.affectedRows === 0)
                return res.status(404).json({ error: "Prescription not found." });
            res.json({ success: true, message: "Prescription deleted." });
        }
    );
};
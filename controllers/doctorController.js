const db = require("../config/db");

/* ================= ADD / UPDATE PRESCRIPTION ================= */
exports.updatePrescription = (req, res) => {
    const { appointment_id, details } = req.body;

    if (!appointment_id || !details) {
        return res.status(400).json({ error: "All fields are required" });
    }

    db.query(
        "SELECT * FROM prescriptions WHERE appointment_id=?",
        [appointment_id],
        (err, result) => {
            if (err) return res.status(500).json({ error: err.message });

            if (result.length > 0) {
                db.query(
                    "UPDATE prescriptions SET details=? WHERE appointment_id=?",
                    [details, appointment_id],
                    (err) => {
                        if (err) return res.status(500).json({ error: err.message });
                        res.json({ success: true, message: "Prescription Updated" });
                    }
                );
            } else {
                db.query(
                    "INSERT INTO prescriptions (appointment_id, details) VALUES (?, ?)",
                    [appointment_id, details],
                    (err) => {
                        if (err) return res.status(500).json({ error: err.message });
                        res.json({ success: true, message: "Prescription Added" });
                    }
                );
            }
        }
    );
};


/* ================= SET DOCTOR AVAILABILITY ================= */
exports.setAvailability = (req, res) => {
    const { doctor_id, availability } = req.body;

    if (!doctor_id || !availability) {
        return res.status(400).json({ error: "All fields required" });
    }

    db.query(
        "UPDATE doctors SET availability=? WHERE id=?",
        [availability, doctor_id],
        (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, message: "Availability Updated" });
        }
    );
};


/* ================= GET ALL DOCTORS (for patient dashboard) ================= */
exports.getAllDoctors = (req, res) => {
    db.query(
        `SELECT d.id, d.specialization, d.availability, u.name
         FROM doctors d
         JOIN users u ON d.user_id = u.id`,
        (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(result);
        }
    );
};


/* ================= GET DOCTOR ID BY USER ID ================= */
// Used by doctor-dashboard on load to resolve userId → doctorId
exports.getDoctorByUserId = (req, res) => {
    const { user_id } = req.params;
    db.query(
        `SELECT d.id AS doctor_id, d.specialization, d.availability, u.name
         FROM doctors d
         JOIN users u ON d.user_id = u.id
         WHERE d.user_id = ?`,
        [user_id],
        (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            if (!result || result.length === 0)
                return res.status(404).json({ error: "Doctor not found" });
            res.json({ success: true, doctor: result[0] });
        }
    );
};


/* ================= GET DOCTOR APPOINTMENTS ================= */
// FIX: Removed JOIN to non-existent `queue` table.
// queue_number and estimated_waiting_time live directly in appointments table.
exports.getDoctorAppointments = (req, res) => {
    const { doctor_id } = req.params;

    db.query(
        `SELECT
            a.id,
            a.date,
            a.time,
            a.status,
            a.priority,
            a.queue_number,
            a.estimated_waiting_time,
            p.id AS patient_id,
            u.name AS patient_name
         FROM appointments a
         LEFT JOIN patients p ON a.patient_id = p.id
         LEFT JOIN users u ON p.user_id = u.id
         WHERE a.doctor_id = ?
         ORDER BY a.date DESC, a.queue_number ASC`,
        [doctor_id],
        (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(result);
        }
    );
};


/* ================= GET TODAY'S QUEUE ================= */
// FIX: Removed JOIN to non-existent `queue` table.
// Uses appointments.queue_number and appointments.estimated_waiting_time directly.
exports.getTodayQueue = (req, res) => {
    const { doctor_id } = req.params;

    db.query(
        `SELECT
            a.id,
            a.queue_number,
            a.estimated_waiting_time,
            a.status,
            a.priority,
            a.time,
            u.name AS patient_name,
            p.age,
            p.gender
         FROM appointments a
         JOIN patients p ON a.patient_id = p.id
         JOIN users u ON p.user_id = u.id
         WHERE a.doctor_id = ?
           AND a.date = CURDATE()
           AND a.status NOT IN ('cancelled', 'completed')
         ORDER BY
            CASE a.priority WHEN 'emergency' THEN 0 ELSE 1 END ASC,
            a.queue_number ASC`,
        [doctor_id],
        (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(result);
        }
    );
};


/* ================= TEAMMATE FEATURE 1: GET RATINGS / COMMENTS ================= */
// GET /doctor/ratings/:doctor_id
exports.getDoctorRatings = (req, res) => {
    const { doctor_id } = req.params;

    db.query(
        `SELECT
            r.id,
            r.rating,
            r.comment,
            u.name AS patient_name
         FROM ratings r
         JOIN patients p ON r.patient_id = p.id
         JOIN users u ON p.user_id = u.id
         WHERE r.doctor_id = ?
         ORDER BY r.id DESC`,
        [doctor_id],
        (err, result) => {
            if (err) {
                console.error("getDoctorRatings error:", err);
                return res.status(500).json({ error: "Failed to fetch ratings" });
            }
            res.json({ success: true, ratings: result });
        }
    );
};


/* ================= TEAMMATE FEATURE 2: DAILY PATIENT COUNT ================= */
// GET /doctor/stats/daily/:doctor_id
exports.getDailyPatientCount = (req, res) => {
    const { doctor_id } = req.params;

    db.query(
        `SELECT COUNT(*) AS daily_count
         FROM appointments
         WHERE doctor_id = ?
           AND date = CURDATE()
           AND status NOT IN ('cancelled')`,
        [doctor_id],
        (err, result) => {
            if (err) {
                console.error("getDailyPatientCount error:", err);
                return res.status(500).json({ error: "Failed to fetch daily count" });
            }
            res.json({ success: true, daily_count: result[0].daily_count });
        }
    );
};


/* ================= TEAMMATE FEATURE 3: AVERAGE PATIENT COUNT PER DAY ================= */
// GET /doctor/stats/average/:doctor_id
exports.getAveragePatientCount = (req, res) => {
    const { doctor_id } = req.params;

    db.query(
        `SELECT
            COUNT(*) AS total_appointments,
            COUNT(DISTINCT date) AS active_days
         FROM appointments
         WHERE doctor_id = ?
           AND status NOT IN ('cancelled')`,
        [doctor_id],
        (err, result) => {
            if (err) {
                console.error("getAveragePatientCount error:", err);
                return res.status(500).json({ error: "Failed to fetch average count" });
            }

            const { total_appointments, active_days } = result[0];
            const average = active_days > 0
                ? (total_appointments / active_days).toFixed(1)
                : 0;

            res.json({
                success: true,
                total_appointments,
                active_days,
                average_per_day: parseFloat(average)
            });
        }
    );
};
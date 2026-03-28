const db = require("../config/db");

/* ================= ADD / UPDATE PRESCRIPTION ================= */
exports.updatePrescription = (req, res) => {
    const { appointment_id, details } = req.body;

    if (!appointment_id || !details) {
        return res.send("All fields are required");
    }

    // Check if already exists
    db.query(
        "SELECT * FROM prescriptions WHERE appointment_id=?",
        [appointment_id],
        (err, result) => {
            if (err) return res.send(err);

            // ✅ UPDATE if exists
            if (result.length > 0) {
                db.query(
                    "UPDATE prescriptions SET details=? WHERE appointment_id=?",
                    [details, appointment_id],
                    (err) => {
                        if (err) return res.send(err);
                        res.send("Prescription Updated");
                    }
                );
            } 
            // ✅ INSERT if not exists
            else {
                db.query(
                    "INSERT INTO prescriptions (appointment_id, details) VALUES (?, ?)",
                    [appointment_id, details],
                    (err) => {
                        if (err) return res.send(err);
                        res.send("Prescription Added");
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
        return res.send("All fields required");
    }

    db.query(
        "UPDATE doctors SET availability=? WHERE id=?",
        [availability, doctor_id],
        (err) => {
            if (err) return res.send(err);
            res.send("Availability Updated");
        }
    );
};


/* ================= GET ALL DOCTORS (FOR PATIENT DASHBOARD) ================= */
exports.getAllDoctors = (req, res) => {
    db.query(
        `SELECT 
            d.id,
            d.specialization,
            d.availability,
            u.name
         FROM doctors d
         JOIN users u ON d.user_id = u.id`,
        (err, result) => {
            if (err) return res.send(err);
            res.json(result);
        }
    );
};


/* ================= GET DOCTOR APPOINTMENTS ================= */
exports.getDoctorAppointments = (req, res) => {
    const { doctor_id } = req.params;

    db.query(
        `SELECT 
            a.id,
            a.date,
            a.time,
            a.status,
            q.queue_number,
            q.estimated_time,
            p.id AS patient_id,
            u.name AS patient_name
         FROM appointments a
         LEFT JOIN queue q ON a.id = q.appointment_id
         LEFT JOIN patients p ON a.patient_id = p.id
         LEFT JOIN users u ON p.user_id = u.id
         WHERE a.doctor_id=?
         ORDER BY a.date DESC, q.queue_number ASC`,
        [doctor_id],
        (err, result) => {
            if (err) return res.send(err);
            res.json(result);
        }
    );
};


/* ================= GET TODAY QUEUE ================= */
exports.getTodayQueue = (req, res) => {
    const { doctor_id } = req.params;

    db.query(
        `SELECT 
            q.queue_number,
            q.estimated_time,
            u.name AS patient_name
         FROM queue q
         JOIN appointments a ON q.appointment_id = a.id
         JOIN patients p ON a.patient_id = p.id
         JOIN users u ON p.user_id = u.id
         WHERE a.doctor_id=? AND a.date = CURDATE()
         ORDER BY q.queue_number ASC`,
        [doctor_id],
        (err, result) => {
            if (err) return res.send(err);
            res.json(result);
        }
    );
};
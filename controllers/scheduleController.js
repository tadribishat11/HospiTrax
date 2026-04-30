const db = require("../config/db");
/* ─────────────────────────────────────────────────────────────
   GET /schedule/doctor/:doctor_id
   Returns all active slots for the given doctor.
   Used by the public patient-dashboard calendar view.
───────────────────────────────────────────────────────────── */
exports.getDoctorSchedule = (req, res) => {
    const { doctor_id } = req.params;
 
    db.query(
        `SELECT
            s.id,
            s.day_of_week,
            s.start_time,
            s.end_time,
            s.is_active,
            d.specialization,
            u.name AS doctor_name
         FROM doctor_schedule_slots s
         JOIN doctors d ON d.id = s.doctor_id
         JOIN users   u ON u.id = d.user_id
         WHERE s.doctor_id = ? AND s.is_active = 1
         ORDER BY
            FIELD(s.day_of_week,
                'Monday','Tuesday','Wednesday','Thursday',
                'Friday','Saturday','Sunday'),
            s.start_time ASC`,
        [doctor_id],
        (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, schedule: rows });
        }
    );
};

/* ─────────────────────────────────────────────────────────────
   GET /schedule/all
   Returns availability slots for every doctor.
   Patient dashboard calls this to show the weekly grid.
───────────────────────────────────────────────────────────── */
exports.getAllDoctorSchedules = (req, res) => {
    db.query(
        `SELECT
            s.id,
            s.doctor_id,
            s.day_of_week,
            s.start_time,
            s.end_time,
            d.specialization,
            u.name AS doctor_name
         FROM doctor_schedule_slots s
         JOIN doctors d ON d.id = s.doctor_id
         JOIN users   u ON u.id = d.user_id
         WHERE s.is_active = 1
         ORDER BY
            FIELD(s.day_of_week,
                'Monday','Tuesday','Wednesday','Thursday',
                'Friday','Saturday','Sunday'),
            s.start_time ASC`,
        (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, schedule: rows });
        }
    );
};
 
/* ─────────────────────────────────────────────────────────────
   POST /schedule/slot
   Doctor adds a new availability slot.
   Body: { doctor_id, day_of_week, start_time, end_time }
───────────────────────────────────────────────────────────── */
exports.addSlot = (req, res) => {
    const { doctor_id, day_of_week, start_time, end_time } = req.body;
 
    if (!doctor_id || !day_of_week || !start_time || !end_time) {
        return res.status(400).json({ error: "All fields are required." });
    }
 
    if (start_time >= end_time) {
        return res.status(400).json({ error: "start_time must be before end_time." });
    }
 
    // Conflict check — no overlapping slots on the same day
    db.query(
        `SELECT id FROM doctor_schedule_slots
         WHERE doctor_id = ?
           AND day_of_week = ?
           AND is_active   = 1
           AND start_time  < ?
           AND end_time    > ?`,
        [doctor_id, day_of_week, end_time, start_time],
        (err, existing) => {
            if (err) return res.status(500).json({ error: err.message });
 
            if (existing.length > 0) {
                return res.status(409).json({
                    error: "This slot overlaps with an existing availability window."
                });
            }
 
            db.query(
                `INSERT INTO doctor_schedule_slots
                    (doctor_id, day_of_week, start_time, end_time)
                 VALUES (?, ?, ?, ?)`,
                [doctor_id, day_of_week, start_time, end_time],
                (err, result) => {
                    if (err) return res.status(500).json({ error: err.message });
                    res.status(201).json({
                        success: true,
                        message: "Slot added.",
                        slot_id: result.insertId
                    });
                }
            );
        }
    );
};
 
/* ─────────────────────────────────────────────────────────────
   DELETE /schedule/slot/:slot_id
   Doctor soft-deletes (deactivates) a slot.
───────────────────────────────────────────────────────────── */
exports.removeSlot = (req, res) => {
    const { slot_id } = req.params;
 
    db.query(
        "UPDATE doctor_schedule_slots SET is_active = 0 WHERE id = ?",
        [slot_id],
        (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            if (result.affectedRows === 0)
                return res.status(404).json({ error: "Slot not found." });
            res.json({ success: true, message: "Slot removed." });
        }
    );
};
 
/* ─────────────────────────────────────────────────────────────
   PUT /schedule/slot/:slot_id
   Doctor edits an existing slot's times.
   Body: { start_time, end_time }
───────────────────────────────────────────────────────────── */
exports.updateSlot = (req, res) => {
    const { slot_id } = req.params;
    const { start_time, end_time } = req.body;
 
    if (!start_time || !end_time) {
        return res.status(400).json({ error: "start_time and end_time are required." });
    }
    if (start_time >= end_time) {
        return res.status(400).json({ error: "start_time must be before end_time." });
    }
 
    db.query(
        `UPDATE doctor_schedule_slots
         SET start_time = ?, end_time = ?
         WHERE id = ? AND is_active = 1`,
        [start_time, end_time, slot_id],
        (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            if (result.affectedRows === 0)
                return res.status(404).json({ error: "Slot not found." });
            res.json({ success: true, message: "Slot updated." });
        }
    );
};
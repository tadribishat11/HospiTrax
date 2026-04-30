// controllers/slotReassignController.js
// FEATURE 3 — Automatically Reassign Unused / Cancelled Slots
//
// Flow:
//  1. Patient joins the waitlist  →  POST /slots/waitlist
//  2. When an appointment is cancelled, the cancel endpoint calls
//     triggerReassignment() which checks if anyone on the waitlist
//     wants that slot and auto-books it.
//  3. Doctor / admin can also manually trigger a scan  →  POST /slots/reassign-now
//  4. Waitlist entries older than the preferred_date are auto-expired
//     on every trigger run.

const db = require("../config/db");

/* ─────────────────────────────────────────────────────────────
   INTERNAL HELPER — called after any appointment cancellation.
   Finds the best waitlist match for the freed slot and books it.
───────────────────────────────────────────────────────────── */
async function triggerReassignment(cancelled_appointment_id) {
    try {
        // 1. Get the cancelled appointment's details
        const [[cancelled]] = await db.promise().query(
            `SELECT doctor_id, date, time FROM appointments WHERE id = ?`,
            [cancelled_appointment_id]
        );
        if (!cancelled) return;

        const { doctor_id, date, time } = cancelled;

        // 2. Expire stale waitlist entries
        await db.promise().query(
            `UPDATE slot_waitlist
             SET status = 'expired'
             WHERE status = 'waiting' AND preferred_date < CURDATE()`
        );

        // 3. Find the earliest waiting patient for this doctor/date
        //    Priority: exact time preference first, then "any time"
        const [[match]] = await db.promise().query(
            `SELECT * FROM slot_waitlist
             WHERE doctor_id   = ?
               AND preferred_date = ?
               AND status = 'waiting'
             ORDER BY
                -- Exact time match wins; NULL preferred_time = flexible
                CASE WHEN preferred_time = ? THEN 0
                     WHEN preferred_time IS NULL THEN 1
                     ELSE 2 END ASC,
                created_at ASC
             LIMIT 1`,
            [doctor_id, date, time]
        );

        if (!match) return;   // nobody waiting — slot stays free

        // 4. Get the doctor's average consultation time for wait calc
        const [[doc]] = await db.promise().query(
            `SELECT average_consultation_time FROM doctors WHERE id = ?`,
            [doctor_id]
        );
        const avgTime = (doc && doc.average_consultation_time) || 15;

        // 5. Assign queue number (take the smallest gap, or end of queue)
        const [[queueRow]] = await db.promise().query(
            `SELECT COALESCE(MAX(queue_number), 0) + 1 AS next_q
             FROM appointments
             WHERE doctor_id = ? AND date = ?
               AND status IN ('scheduled', 'confirmed')`,
            [doctor_id, date]
        );
        const queueNum    = queueRow.next_q;
        const estimatedWait = (queueNum - 1) * avgTime;

        // 6. Book the appointment for the waitlist patient
        const [inserted] = await db.promise().query(
            `INSERT INTO appointments
                (patient_id, doctor_id, date, time,
                 status, priority, queue_number, estimated_waiting_time)
             VALUES (?, ?, ?, ?, 'scheduled', 'normal', ?, ?)`,
            [match.patient_id, doctor_id, date, time, queueNum, estimatedWait]
        );

        // 7. Mark waitlist entry as assigned
        await db.promise().query(
            `UPDATE slot_waitlist SET status = 'assigned' WHERE id = ?`,
            [match.id]
        );

        // 8. Log the reassignment for audit
        await db.promise().query(
            `INSERT INTO slot_reassignments
                (original_appt_id, new_appt_id, waitlist_id)
             VALUES (?, ?, ?)`,
            [cancelled_appointment_id, inserted.insertId, match.id]
        );

        console.log(
            `[SlotReassign] Appointment ${cancelled_appointment_id} slot` +
            ` reassigned → new appt ${inserted.insertId}` +
            ` for patient ${match.patient_id}`
        );

    } catch (err) {
        // Non-fatal — log but don't crash the cancel endpoint
        console.error("[SlotReassign] triggerReassignment error:", err);
    }
}

module.exports.triggerReassignment = triggerReassignment;


/* ─────────────────────────────────────────────────────────────
   POST /slots/waitlist
   Patient joins the waitlist for a doctor on a specific date.

   Body:
   {
     patient_id      : number,
     doctor_id       : number,
     preferred_date  : "YYYY-MM-DD",
     preferred_time  : "HH:MM"   (optional — null = any time)
   }
───────────────────────────────────────────────────────────── */
exports.joinWaitlist = async (req, res) => {
    const { patient_id, doctor_id, preferred_date, preferred_time } = req.body;

    if (!patient_id || !doctor_id || !preferred_date) {
        return res.status(400).json({
            error: "patient_id, doctor_id, and preferred_date are required."
        });
    }

    try {
        // Prevent duplicate waitlist entries for the same slot
        const [[dup]] = await db.promise().query(
            `SELECT id FROM slot_waitlist
             WHERE patient_id    = ?
               AND doctor_id     = ?
               AND preferred_date = ?
               AND status = 'waiting'`,
            [patient_id, doctor_id, preferred_date]
        );
        if (dup) {
            return res.status(409).json({
                error: "You are already on the waitlist for this doctor on this date."
            });
        }

        const [result] = await db.promise().query(
            `INSERT INTO slot_waitlist
                (patient_id, doctor_id, preferred_date, preferred_time)
             VALUES (?, ?, ?, ?)`,
            [patient_id, doctor_id, preferred_date, preferred_time || null]
        );

        return res.status(201).json({
            success: true,
            message: "You have been added to the waitlist. We will auto-book you if a slot opens.",
            waitlist_id: result.insertId
        });

    } catch (err) {
        console.error("joinWaitlist error:", err);
        return res.status(500).json({ error: "Failed to join waitlist." });
    }
};

/* ─────────────────────────────────────────────────────────────
   GET /slots/waitlist/patient/:patient_id
   Returns all active waitlist entries for a patient.
───────────────────────────────────────────────────────────── */
exports.getPatientWaitlist = async (req, res) => {
    const { patient_id } = req.params;

    try {
        const [rows] = await db.promise().query(
            `SELECT
                w.id,
                w.preferred_date,
                w.preferred_time,
                w.status,
                w.created_at,
                u.name        AS doctor_name,
                d.specialization
             FROM slot_waitlist w
             JOIN doctors d ON d.id = w.doctor_id
             JOIN users   u ON u.id = d.user_id
             WHERE w.patient_id = ?
             ORDER BY w.preferred_date ASC`,
            [patient_id]
        );
        return res.json({ success: true, waitlist: rows });

    } catch (err) {
        console.error("getPatientWaitlist error:", err);
        return res.status(500).json({ error: "Failed to fetch waitlist." });
    }
};

/* ─────────────────────────────────────────────────────────────
   DELETE /slots/waitlist/:waitlist_id
   Patient removes themselves from the waitlist.
───────────────────────────────────────────────────────────── */
exports.leaveWaitlist = async (req, res) => {
    const { waitlist_id } = req.params;

    try {
        const [result] = await db.promise().query(
            `DELETE FROM slot_waitlist WHERE id = ? AND status = 'waiting'`,
            [waitlist_id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Waitlist entry not found or already processed." });
        }
        return res.json({ success: true, message: "Removed from waitlist." });

    } catch (err) {
        console.error("leaveWaitlist error:", err);
        return res.status(500).json({ error: "Failed to remove from waitlist." });
    }
};

/* ─────────────────────────────────────────────────────────────
   POST /slots/reassign-now
   Admin / cron endpoint — scans ALL cancelled appointments
   and attempts reassignment for any that haven't been matched yet.
───────────────────────────────────────────────────────────── */
exports.manualReassignAll = async (req, res) => {
    try {
        // Find cancelled appointments for today or future that have
        // no reassignment record yet
        const [cancelled] = await db.promise().query(
            `SELECT a.id
             FROM appointments a
             LEFT JOIN slot_reassignments sr ON sr.original_appt_id = a.id
             WHERE a.status = 'cancelled'
               AND a.date  >= CURDATE()
               AND sr.id   IS NULL`
        );

        let processed = 0;
        for (const { id } of cancelled) {
            await triggerReassignment(id);
            processed++;
        }

        return res.json({
            success: true,
            message: `Scanned ${processed} cancelled appointment(s) for reassignment.`
        });

    } catch (err) {
        console.error("manualReassignAll error:", err);
        return res.status(500).json({ error: "Reassignment scan failed." });
    }
};

/* ─────────────────────────────────────────────────────────────
   GET /slots/reassignments
   Returns the audit log of all reassignments (admin view).
───────────────────────────────────────────────────────────── */
exports.getReassignmentLog = async (req, res) => {
    try {
        const [rows] = await db.promise().query(
            `SELECT
                sr.id,
                sr.original_appt_id,
                sr.new_appt_id,
                sr.waitlist_id,
                sr.reassigned_at,
                u_pat.name  AS patient_name,
                u_doc.name  AS doctor_name,
                a_new.date  AS appointment_date,
                a_new.time  AS appointment_time
             FROM slot_reassignments sr
             JOIN appointments a_new ON a_new.id = sr.new_appt_id
             JOIN patients  pt   ON pt.id   = a_new.patient_id
             JOIN users  u_pat   ON u_pat.id = pt.user_id
             JOIN doctors d      ON d.id     = a_new.doctor_id
             JOIN users  u_doc   ON u_doc.id = d.user_id
             ORDER BY sr.reassigned_at DESC
             LIMIT 100`
        );
        return res.json({ success: true, reassignments: rows });

    } catch (err) {
        console.error("getReassignmentLog error:", err);
        return res.status(500).json({ error: "Failed to fetch reassignment log." });
    }
};

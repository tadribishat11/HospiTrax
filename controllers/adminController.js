// controllers/adminController.js
// ADMIN COMMAND CENTER — All backend logic for the four pillars:
//   A. Governance (User Lifecycle & Control)
//   B. Operational Oversight (Real-Time Control)
//   C. Performance Analytics (Bottleneck Detection)
//   D. Data & Security (Audit Logging)

const db = require("../config/db");
const bcrypt = require("bcryptjs");

/* ─────────────────────────────────────────────────────────────
   AUDIT LOGGER — reusable helper for all mutating operations
───────────────────────────────────────────────────────────── */
function logAudit(userId, userName, action, targetType, targetId, details) {
    db.query(
        `INSERT INTO audit_log (user_id, user_name, action, target_type, target_id, details)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [userId, userName, action, targetType, targetId, details || null],
        (err) => {
            if (err) console.error("[AuditLog] Failed to write:", err.message);
        }
    );
}

// ═══════════════════════════════════════════════════════════════
// A. GOVERNANCE — User Lifecycle & Control
// ═══════════════════════════════════════════════════════════════

/* ── GET /admin/api/users ──────────────────────────────────── */
// List all users with role info, verification status for doctors
exports.getAllUsers = async (req, res) => {
    try {
        const [users] = await db.promise().query(
            `SELECT
                u.id, u.name, u.email, u.role, u.created_at,
                p.id AS patient_id, p.age, p.gender,
                d.id AS doctor_id, d.specialization, d.availability, d.is_verified
             FROM users u
             LEFT JOIN patients p ON p.user_id = u.id
             LEFT JOIN doctors  d ON d.user_id = u.id
             ORDER BY u.created_at DESC`
        );
        return res.json({ success: true, users });
    } catch (err) {
        console.error("getAllUsers error:", err);
        return res.status(500).json({ error: "Failed to fetch users." });
    }
};

/* ── GET /admin/api/users/:id ─────────────────────────────── */
exports.getUserById = async (req, res) => {
    try {
        const [rows] = await db.promise().query(
            `SELECT
                u.id, u.name, u.email, u.role, u.created_at,
                p.id AS patient_id, p.age, p.gender,
                d.id AS doctor_id, d.specialization, d.availability, d.is_verified
             FROM users u
             LEFT JOIN patients p ON p.user_id = u.id
             LEFT JOIN doctors  d ON d.user_id = u.id
             WHERE u.id = ?`,
            [req.params.id]
        );
        if (!rows.length) return res.status(404).json({ error: "User not found." });
        return res.json({ success: true, user: rows[0] });
    } catch (err) {
        console.error("getUserById error:", err);
        return res.status(500).json({ error: "Failed to fetch user." });
    }
};

/* ── PUT /admin/api/users/:id ─────────────────────────────── */
// Update user name and/or email
exports.updateUser = async (req, res) => {
    const { name, email } = req.body;
    const userId = req.params.id;

    if (!name && !email) {
        return res.status(400).json({ error: "Provide name or email to update." });
    }

    try {
        const fields = [];
        const values = [];
        if (name)  { fields.push("name = ?");  values.push(name);  }
        if (email) { fields.push("email = ?"); values.push(email); }
        values.push(userId);

        await db.promise().query(
            `UPDATE users SET ${fields.join(", ")} WHERE id = ?`,
            values
        );

        // Audit
        const adminId = req.body.admin_user_id;
        const adminName = req.body.admin_user_name || "Admin";
        logAudit(adminId, adminName, "UPDATE_USER", "user", parseInt(userId),
            `Updated: ${fields.map(f => f.split(" =")[0]).join(", ")}`);

        return res.json({ success: true, message: "User updated successfully." });
    } catch (err) {
        console.error("updateUser error:", err);
        return res.status(500).json({ error: "Failed to update user." });
    }
};

/* ── DELETE /admin/api/users/:id ──────────────────────────── */
// Delete user and cascade: cancel future appointments, remove profile rows
exports.deleteUser = async (req, res) => {
    const userId = req.params.id;

    try {
        // Get user info first for audit
        const [[user]] = await db.promise().query(
            "SELECT id, name, role FROM users WHERE id = ?", [userId]
        );
        if (!user) return res.status(404).json({ error: "User not found." });

        // Prevent deleting admin accounts
        if (user.role === "admin") {
            return res.status(403).json({ error: "Cannot delete admin accounts." });
        }

        if (user.role === "patient") {
            // Get patient ID
            const [[patient]] = await db.promise().query(
                "SELECT id FROM patients WHERE user_id = ?", [userId]
            );
            if (patient) {
                // Cancel future appointments
                await db.promise().query(
                    `UPDATE appointments SET status = 'cancelled'
                     WHERE patient_id = ? AND date >= CURDATE() AND status IN ('scheduled','confirmed')`,
                    [patient.id]
                );
                // Remove waitlist entries
                await db.promise().query(
                    "DELETE FROM slot_waitlist WHERE patient_id = ?", [patient.id]
                );
                // Delete patient profile
                await db.promise().query(
                    "DELETE FROM patients WHERE id = ?", [patient.id]
                );
            }
        }

        if (user.role === "doctor") {
            const [[doctor]] = await db.promise().query(
                "SELECT id FROM doctors WHERE user_id = ?", [userId]
            );
            if (doctor) {
                // Cancel future appointments
                await db.promise().query(
                    `UPDATE appointments SET status = 'cancelled'
                     WHERE doctor_id = ? AND date >= CURDATE() AND status IN ('scheduled','confirmed')`,
                    [doctor.id]
                );
                // Remove schedule slots
                await db.promise().query(
                    "UPDATE doctor_schedule_slots SET is_active = 0 WHERE doctor_id = ?",
                    [doctor.id]
                );
                // Delete doctor profile
                await db.promise().query(
                    "DELETE FROM doctors WHERE id = ?", [doctor.id]
                );
            }
        }

        // Delete the user record
        await db.promise().query("DELETE FROM users WHERE id = ?", [userId]);

        // Audit
        const adminId = req.body.admin_user_id;
        const adminName = req.body.admin_user_name || "Admin";
        logAudit(adminId, adminName, "DELETE_USER", "user", parseInt(userId),
            `Deleted ${user.role}: ${user.name}`);

        return res.json({ success: true, message: `User "${user.name}" deleted successfully.` });
    } catch (err) {
        console.error("deleteUser error:", err);
        return res.status(500).json({ error: "Failed to delete user." });
    }
};

/* ── PUT /admin/api/users/:id/reset-password ──────────────── */
exports.resetPassword = async (req, res) => {
    const userId = req.params.id;
    const { new_password } = req.body;

    if (!new_password || new_password.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters." });
    }

    try {
        const hashed = await bcrypt.hash(new_password, 10);
        await db.promise().query(
            "UPDATE users SET password = ? WHERE id = ?",
            [hashed, userId]
        );

        const adminId = req.body.admin_user_id;
        const adminName = req.body.admin_user_name || "Admin";
        logAudit(adminId, adminName, "RESET_PASSWORD", "user", parseInt(userId),
            "Password was reset by admin");

        return res.json({ success: true, message: "Password reset successfully." });
    } catch (err) {
        console.error("resetPassword error:", err);
        return res.status(500).json({ error: "Failed to reset password." });
    }
};

/* ── PUT /admin/api/doctors/:id/verify ────────────────────── */
// Toggle doctor verification status
exports.verifyDoctor = async (req, res) => {
    const doctorId = req.params.id;
    const { is_verified } = req.body;

    try {
        await db.promise().query(
            "UPDATE doctors SET is_verified = ? WHERE id = ?",
            [is_verified ? 1 : 0, doctorId]
        );

        const adminId = req.body.admin_user_id;
        const adminName = req.body.admin_user_name || "Admin";
        logAudit(adminId, adminName,
            is_verified ? "VERIFY_DOCTOR" : "UNVERIFY_DOCTOR",
            "doctor", parseInt(doctorId),
            is_verified ? "Doctor account approved" : "Doctor account suspended");

        return res.json({
            success: true,
            message: is_verified ? "Doctor verified and activated." : "Doctor verification revoked."
        });
    } catch (err) {
        console.error("verifyDoctor error:", err);
        return res.status(500).json({ error: "Failed to update verification status." });
    }
};


// ═══════════════════════════════════════════════════════════════
// B. OPERATIONAL OVERSIGHT — Real-Time Control
// ═══════════════════════════════════════════════════════════════

/* ── GET /admin/api/overview ──────────────────────────────── */
// Global dashboard stats
exports.getOverview = async (req, res) => {
    try {
        const [[counts]] = await db.promise().query(
            `SELECT
                (SELECT COUNT(*) FROM users WHERE role='patient') AS total_patients,
                (SELECT COUNT(*) FROM users WHERE role='doctor')  AS total_doctors,
                (SELECT COUNT(*) FROM appointments WHERE date = CURDATE() AND status != 'cancelled') AS today_appointments,
                (SELECT COUNT(*) FROM appointments WHERE date = CURDATE() AND status IN ('scheduled','confirmed','in-progress')) AS active_queues,
                (SELECT COUNT(*) FROM appointments WHERE status = 'scheduled' OR status = 'confirmed') AS pending_appointments,
                (SELECT COUNT(*) FROM doctors WHERE is_verified = 0) AS pending_verifications`
        );
        return res.json({ success: true, overview: counts });
    } catch (err) {
        console.error("getOverview error:", err);
        return res.status(500).json({ error: "Failed to fetch overview." });
    }
};

/* ── GET /admin/api/live-queues ───────────────────────────── */
// All active queues across all doctors today
exports.getLiveQueues = async (req, res) => {
    try {
        const [queues] = await db.promise().query(
            `SELECT
                d.id AS doctor_id,
                u.name AS doctor_name,
                d.specialization,
                COUNT(a.id) AS patients_in_queue,
                SUM(CASE WHEN a.status = 'in-progress' THEN 1 ELSE 0 END) AS in_progress,
                SUM(CASE WHEN a.status IN ('scheduled','confirmed') THEN 1 ELSE 0 END) AS waiting,
                SUM(CASE WHEN a.priority = 'emergency' THEN 1 ELSE 0 END) AS emergencies
             FROM doctors d
             JOIN users u ON d.user_id = u.id
             LEFT JOIN appointments a ON a.doctor_id = d.id
                AND a.date = CURDATE()
                AND a.status IN ('scheduled','confirmed','in-progress')
             WHERE d.is_verified = 1
             GROUP BY d.id
             ORDER BY patients_in_queue DESC`
        );
        return res.json({ success: true, queues });
    } catch (err) {
        console.error("getLiveQueues error:", err);
        return res.status(500).json({ error: "Failed to fetch live queues." });
    }
};

/* ── GET /admin/api/appointments ──────────────────────────── */
// All appointments with optional filters
exports.getAllAppointments = async (req, res) => {
    try {
        const { status, doctor_id, date_from, date_to } = req.query;

        let sql = `
            SELECT
                a.id, a.date, a.time, a.status, a.priority,
                a.queue_number, a.estimated_waiting_time,
                u_pat.name AS patient_name,
                u_doc.name AS doctor_name,
                d.specialization
            FROM appointments a
            JOIN patients p    ON p.id  = a.patient_id
            JOIN users u_pat   ON u_pat.id = p.user_id
            JOIN doctors d     ON d.id  = a.doctor_id
            JOIN users u_doc   ON u_doc.id = d.user_id
            WHERE 1=1`;
        const params = [];

        if (status) {
            sql += " AND a.status = ?";
            params.push(status);
        }
        if (doctor_id) {
            sql += " AND a.doctor_id = ?";
            params.push(doctor_id);
        }
        if (date_from) {
            sql += " AND a.date >= ?";
            params.push(date_from);
        }
        if (date_to) {
            sql += " AND a.date <= ?";
            params.push(date_to);
        }

        sql += " ORDER BY a.date DESC, a.time ASC LIMIT 500";

        const [rows] = await db.promise().query(sql, params);
        return res.json({ success: true, appointments: rows });
    } catch (err) {
        console.error("getAllAppointments error:", err);
        return res.status(500).json({ error: "Failed to fetch appointments." });
    }
};

/* ── PUT /admin/api/appointments/:id/cancel ───────────────── */
// Admin force-cancel a single appointment
exports.adminCancelAppointment = async (req, res) => {
    const appointmentId = req.params.id;

    try {
        const [result] = await db.promise().query(
            "UPDATE appointments SET status = 'cancelled' WHERE id = ? AND status != 'cancelled'",
            [appointmentId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Appointment not found or already cancelled." });
        }

        const adminId = req.body.admin_user_id;
        const adminName = req.body.admin_user_name || "Admin";
        logAudit(adminId, adminName, "CANCEL_APPOINTMENT", "appointment",
            parseInt(appointmentId), "Admin force-cancelled appointment");

        // Trigger slot reassignment
        try {
            const { triggerReassignment } = require("./slotReassignController");
            triggerReassignment(parseInt(appointmentId));
        } catch (e) { /* non-fatal */ }

        return res.json({ success: true, message: "Appointment cancelled." });
    } catch (err) {
        console.error("adminCancelAppointment error:", err);
        return res.status(500).json({ error: "Failed to cancel appointment." });
    }
};

/* ── PUT /admin/api/doctor/:id/bulk-cancel ────────────────── */
// Bulk-cancel all future appointments for a doctor (doctor unavailable)
exports.bulkCancelByDoctor = async (req, res) => {
    const doctorId = req.params.id;

    try {
        const [result] = await db.promise().query(
            `UPDATE appointments SET status = 'cancelled'
             WHERE doctor_id = ? AND date >= CURDATE()
               AND status IN ('scheduled','confirmed')`,
            [doctorId]
        );

        const adminId = req.body.admin_user_id;
        const adminName = req.body.admin_user_name || "Admin";
        logAudit(adminId, adminName, "BULK_CANCEL", "doctor", parseInt(doctorId),
            `Bulk-cancelled ${result.affectedRows} future appointment(s)`);

        return res.json({
            success: true,
            message: `${result.affectedRows} appointment(s) cancelled.`,
            cancelled_count: result.affectedRows
        });
    } catch (err) {
        console.error("bulkCancelByDoctor error:", err);
        return res.status(500).json({ error: "Failed to bulk cancel." });
    }
};


// ═══════════════════════════════════════════════════════════════
// C. PERFORMANCE ANALYTICS — Bottleneck Detection
// ═══════════════════════════════════════════════════════════════

/* ── GET /admin/api/analytics/wait-times ──────────────────── */
// Average estimated wait time per doctor
exports.getWaitTimeAnalytics = async (req, res) => {
    try {
        const [rows] = await db.promise().query(
            `SELECT
                d.id AS doctor_id,
                u.name AS doctor_name,
                d.specialization,
                ROUND(AVG(a.estimated_waiting_time), 1) AS avg_estimated_wait,
                COUNT(a.id) AS total_appointments,
                d.average_consultation_time AS avg_consultation_time
             FROM doctors d
             JOIN users u ON d.user_id = u.id
             LEFT JOIN appointments a ON a.doctor_id = d.id AND a.status != 'cancelled'
             WHERE d.is_verified = 1
             GROUP BY d.id
             ORDER BY avg_estimated_wait DESC`
        );
        return res.json({ success: true, wait_times: rows });
    } catch (err) {
        console.error("getWaitTimeAnalytics error:", err);
        return res.status(500).json({ error: "Failed to fetch wait time analytics." });
    }
};

/* ── GET /admin/api/analytics/specializations ─────────────── */
// Appointment count grouped by specialization
exports.getSpecializationAnalytics = async (req, res) => {
    try {
        const [rows] = await db.promise().query(
            `SELECT
                d.specialization,
                COUNT(a.id) AS total_appointments,
                SUM(CASE WHEN a.status = 'completed' THEN 1 ELSE 0 END) AS completed,
                SUM(CASE WHEN a.status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled,
                COUNT(DISTINCT d.id) AS doctor_count
             FROM doctors d
             LEFT JOIN appointments a ON a.doctor_id = d.id
             WHERE d.is_verified = 1
             GROUP BY d.specialization
             ORDER BY total_appointments DESC`
        );
        return res.json({ success: true, specializations: rows });
    } catch (err) {
        console.error("getSpecializationAnalytics error:", err);
        return res.status(500).json({ error: "Failed to fetch specialization analytics." });
    }
};

/* ── GET /admin/api/analytics/kpi ─────────────────────────── */
// Key Performance Indicators
exports.getKPIAnalytics = async (req, res) => {
    try {
        const [[kpi]] = await db.promise().query(
            `SELECT
                COUNT(*) AS total_appointments,
                SUM(CASE WHEN status = 'completed'  THEN 1 ELSE 0 END) AS completed,
                SUM(CASE WHEN status = 'cancelled'  THEN 1 ELSE 0 END) AS cancelled,
                SUM(CASE WHEN status = 'scheduled'  THEN 1 ELSE 0 END) AS scheduled,
                SUM(CASE WHEN status = 'confirmed'  THEN 1 ELSE 0 END) AS confirmed,
                SUM(CASE WHEN status = 'in-progress' THEN 1 ELSE 0 END) AS in_progress,
                SUM(CASE WHEN priority = 'emergency' THEN 1 ELSE 0 END) AS total_emergencies,
                ROUND(AVG(estimated_waiting_time), 1) AS avg_wait_time
             FROM appointments`
        );

        // Completion rate
        const completable = (kpi.completed || 0) + (kpi.cancelled || 0);
        kpi.completion_rate = completable > 0
            ? ((kpi.completed / completable) * 100).toFixed(1)
            : "0.0";

        return res.json({ success: true, kpi });
    } catch (err) {
        console.error("getKPIAnalytics error:", err);
        return res.status(500).json({ error: "Failed to fetch KPI analytics." });
    }
};


// ═══════════════════════════════════════════════════════════════
// D. DATA & SECURITY — Audit Logging
// ═══════════════════════════════════════════════════════════════

/* ── GET /admin/api/audit-log ─────────────────────────────── */
// Paginated audit log with optional filters
exports.getAuditLog = async (req, res) => {
    try {
        const { action, user_id, limit } = req.query;
        const maxRows = Math.min(parseInt(limit) || 100, 500);

        let sql = `SELECT * FROM audit_log WHERE 1=1`;
        const params = [];

        if (action) {
            sql += " AND action = ?";
            params.push(action);
        }
        if (user_id) {
            sql += " AND user_id = ?";
            params.push(user_id);
        }

        sql += " ORDER BY created_at DESC LIMIT ?";
        params.push(maxRows);

        const [rows] = await db.promise().query(sql, params);
        return res.json({ success: true, logs: rows });
    } catch (err) {
        console.error("getAuditLog error:", err);
        return res.status(500).json({ error: "Failed to fetch audit log." });
    }
};

const db = require("../config/db");

const Appointment = {

    create: (data) => {
        return new Promise((resolve, reject) => {
            const sql = `
                INSERT INTO appointments 
                (patient_id, doctor_id, date, time, status, priority, queue_number, estimated_waiting_time)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `;
            db.query(
                sql,
                [
                    data.patient_id,
                    data.doctor_id,
                    data.date,
                    data.time,
                    data.status || "scheduled",
                    data.priority || "normal",
                    data.queue_number,
                    data.estimated_waiting_time
                ],
                (err, result) => {
                    if (err) reject(err);
                    else resolve(result);
                }
            );
        });
    },

    // FIX: This method was called in appointmentController (emergency re-queue logic)
    // but was completely missing from the model, causing emergency bookings to crash
    updateQueueNumber: (appointmentId, newQueueNumber) => {
        return new Promise((resolve, reject) => {
            const sql = "UPDATE appointments SET queue_number = ? WHERE id = ?";
            db.query(sql, [newQueueNumber, appointmentId], (err, result) => {
                if (err) reject(err);
                else resolve(result);
            });
        });
    },

    getQueuePosition: (appointmentId) => {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT a.queue_number, a.doctor_id, a.date, 
                       COUNT(a2.id) as ahead_count,
                       a.estimated_waiting_time
                FROM appointments a
                LEFT JOIN appointments a2 ON a2.doctor_id = a.doctor_id 
                    AND a2.date = a.date 
                    AND a2.queue_number < a.queue_number
                    AND a2.status NOT IN ('cancelled', 'completed')
                WHERE a.id = ?
                GROUP BY a.id
            `;
            db.query(sql, [appointmentId], (err, result) => {
                if (err) reject(err);
                else resolve(result[0]);
            });
        });
    },

    getTodayQueue: (doctorId, date) => {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT a.id, a.queue_number, a.status, a.priority, 
                       u.name as patient_name,
                       a.estimated_waiting_time,
                       TIMESTAMPDIFF(MINUTE, a.created_at, NOW()) as waiting_elapsed
                FROM appointments a
                JOIN patients p ON a.patient_id = p.id
                JOIN users u ON p.user_id = u.id
                WHERE a.doctor_id = ? AND a.date = ? 
                  AND a.status NOT IN ('cancelled', 'completed')
                ORDER BY a.queue_number ASC
            `;
            db.query(sql, [doctorId, date], (err, result) => {
                if (err) reject(err);
                else resolve(result);
            });
        });
    },

    updateStatus: (id, status) => {
        return new Promise((resolve, reject) => {
            const sql = "UPDATE appointments SET status = ? WHERE id = ?";
            db.query(sql, [status, id], (err, result) => {
                if (err) reject(err);
                else resolve(result);
            });
        });
    },

    updateWaitingTime: (id, remainingTime) => {
        return new Promise((resolve, reject) => {
            const sql = "UPDATE appointments SET waiting_time_remaining = ? WHERE id = ?";
            db.query(sql, [remainingTime, id], (err, result) => {
                if (err) reject(err);
                else resolve(result);
            });
        });
    },

    getLiveQueue: (patientId) => {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT a.id, a.queue_number, a.estimated_waiting_time, 
                       a.waiting_time_remaining, a.status, a.date, a.time,
                       d.id as doctor_id, u.name as doctor_name, d.specialization,
                       COUNT(a2.id) as patients_ahead
                FROM appointments a
                JOIN doctors d ON a.doctor_id = d.id
                JOIN users u ON d.user_id = u.id
                LEFT JOIN appointments a2 ON a2.doctor_id = a.doctor_id 
                    AND a2.date = a.date 
                    AND a2.queue_number < a.queue_number
                    AND a2.status NOT IN ('cancelled', 'completed')
                WHERE a.patient_id = ? AND a.date >= CURDATE() 
                  AND a.status NOT IN ('cancelled', 'completed')
                GROUP BY a.id
                ORDER BY a.date ASC, a.queue_number ASC
                LIMIT 1
            `;
            db.query(sql, [patientId], (err, result) => {
                if (err) reject(err);
                else resolve(result[0]);
            });
        });
    },

    updateQueueStatus: (doctorId, date, currentNumber) => {
        return new Promise((resolve, reject) => {
            const sql = `
                INSERT INTO queue_status (doctor_id, date, current_queue_number)
                VALUES (?, ?, ?)
                ON DUPLICATE KEY UPDATE 
                current_queue_number = VALUES(current_queue_number),
                last_updated = CURRENT_TIMESTAMP
            `;
            db.query(sql, [doctorId, date, currentNumber], (err, result) => {
                if (err) reject(err);
                else resolve(result);
            });
        });
    }
};

module.exports = Appointment;
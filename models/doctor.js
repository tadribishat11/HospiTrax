const db = require("../config/db");

const Doctor = {
    create: (data) => {
        return new Promise((resolve, reject) => {
            const sql = "INSERT INTO doctors (user_id, specialization, availability, is_verified) VALUES (?, ?, ?, ?)";
            const values = [data.user_id, data.specialization, data.availability, data.is_verified !== undefined ? data.is_verified : 1];
            db.query(sql, values, (err, result) => {
                if (err) reject(err);
                else resolve(result);
            });
        });
    },

    getAll: () => {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT d.*, u.name, u.email 
                FROM doctors d
                JOIN users u ON d.user_id = u.id
            `;
            db.query(sql, (err, result) => {
                if (err) reject(err);
                else resolve(result);
            });
        });
    },

    getById: (id) => {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT d.*, u.name, u.email 
                FROM doctors d
                JOIN users u ON d.user_id = u.id
                WHERE d.id = ?
            `;
            db.query(sql, [id], (err, result) => {
                if (err) reject(err);
                else resolve(result[0]);
            });
        });
    },

    getSchedule: (doctorId, date) => {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT a.id, a.time, a.status, a.queue_number,
                       u.name as patient_name
                FROM appointments a
                JOIN patients p ON a.patient_id = p.id
                JOIN users u ON p.user_id = u.id
                WHERE a.doctor_id = ? AND a.date = ?
                ORDER BY a.time ASC
            `;
            db.query(sql, [doctorId, date], (err, result) => {
                if (err) reject(err);
                else resolve(result);
            });
        });
    }
};

module.exports = Doctor;
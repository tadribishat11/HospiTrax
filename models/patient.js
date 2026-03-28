const db = require("../config/db");

const Patient = {
    create: (data) => {
        return new Promise((resolve, reject) => {
            const sql = "INSERT INTO patients SET ?";
            db.query(sql, data, (err, result) => {
                if (err) reject(err);
                else resolve(result);
            });
        });
    },

    getById: (id) => {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT p.*, u.name, u.email 
                FROM patients p
                JOIN users u ON p.user_id = u.id
                WHERE p.id = ?
            `;
            db.query(sql, [id], (err, result) => {
                if (err) reject(err);
                else resolve(result[0]);
            });
        });
    },

    getByUserId: (userId) => {
        return new Promise((resolve, reject) => {
            const sql = "SELECT * FROM patients WHERE user_id = ?";
            db.query(sql, [userId], (err, result) => {
                if (err) reject(err);
                else resolve(result[0]);
            });
        });
    }
};

module.exports = Patient;
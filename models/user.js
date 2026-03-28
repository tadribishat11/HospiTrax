const db = require("../config/db");

const User = {
    create: (data, callback) => {
        const sql = "INSERT INTO users SET ?";
        db.query(sql, data, callback);
    },

    findByEmail: (email, callback) => {
        db.query("SELECT * FROM users WHERE email = ?", [email], callback);
    }
};

module.exports = User;
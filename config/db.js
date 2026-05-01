const mysql = require("mysql2");

const db = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "hospitrax",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Add promise-based query method if not already present
if (!db.promise) {
    db.promise = () => ({
        query: (sql, values) => {
            return new Promise((resolve, reject) => {
                db.query(sql, values, (err, results) => {
                    if (err) reject(err);
                    else resolve([results, null]);
                });
            });
        }
    });
}

// Validate the connection early, but do not crash with an uncaught exception.
db.getConnection((err, connection) => {
    if (err) {
        console.error("MySQL connection error:", err.message);
        console.error("Please verify that the database exists and the credentials are correct.");
        return;
    }
    console.log("MySQL Connected...");
    connection.release();
});

module.exports = db;

const User = require("../models/user");
const Patient = require("../models/patient");
const Doctor = require("../models/doctor");
const bcrypt = require("bcryptjs");
const db = require("../config/db");

/* ================= REGISTER ================= */
exports.register = async (req, res) => {
    const { name, email, password, role, age, gender, specialization, availability } = req.body;

    try {
        const hashed = await bcrypt.hash(password, 10);

        db.query(
            "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
            [name, email, hashed, role],
            async (err, result) => {
                if (err) return res.send("Registration failed");

                const userId = result.insertId;

                try {
                    if (role === "patient") {
                        await Patient.create({ user_id: userId, age, gender });
                    }

                    if (role === "doctor") {
                        await Doctor.create({ user_id: userId, specialization, availability });
                    }

                    res.redirect("/login");
                } catch (err) {
                    res.send("Role data insertion failed");
                }
            }
        );
    } catch (error) {
        res.send("Error occurred");
    }
};


/* ================= LOGIN ================= */
// FIX: Returns JSON instead of res.redirect() so the fetch() in login.html works correctly
exports.login = (req, res) => {
    const { email, password } = req.body;

    User.findByEmail(email, async (err, result) => {
        if (err) return res.status(500).json({ error: "Error occurred" });
        if (!result || result.length === 0) return res.status(404).json({ error: "User not found" });

        const user = result[0];
        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.status(401).json({ error: "Wrong password" });

        // Role-based JSON response
        if (user.role === "patient") {
            db.query(
                "SELECT id FROM patients WHERE user_id = ?",
                [user.id],
                (err, patientResult) => {
                    if (err || patientResult.length === 0) {
                        return res.status(404).json({ error: "Patient not found" });
                    }

                    const patientId = patientResult[0].id;

                    // FIX: Send JSON back so login.html fetch() can read it and redirect
                    return res.json({
                        success: true,
                        role: user.role,
                        userId: user.id,
                        patientId: patientId
                    });
                }
            );
        } else if (user.role === "doctor") {
            return res.json({
                success: true,
                role: user.role,
                userId: user.id
            });
        } else {
            return res.json({
                success: true,
                role: user.role,
                userId: user.id
            });
        }
    });
};
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
exports.login = (req, res) => {
    const { email, password } = req.body;

    User.findByEmail(email, async (err, result) => {
        if (err) return res.status(500).json({ error: "Error occurred" });
        if (!result || result.length === 0) return res.status(404).json({ error: "User not found" });

        const user = result[0];
        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.status(401).json({ error: "Wrong password" });

        if (user.role === "patient") {
            db.query(
                "SELECT id FROM patients WHERE user_id = ?",
                [user.id],
                (err, patientResult) => {
                    if (err || patientResult.length === 0)
                        return res.status(404).json({ error: "Patient not found" });

                    return res.json({
                        success: true,
                        role: user.role,
                        userId: user.id,
                        patientId: patientResult[0].id
                    });
                }
            );

        } else if (user.role === "doctor") {
            // FIX: Also return doctorId so login.html can store it in sessionStorage
            // and doctor-dashboard can use it without an extra fetch
            db.query(
                "SELECT id FROM doctors WHERE user_id = ?",
                [user.id],
                (err, doctorResult) => {
                    if (err || doctorResult.length === 0)
                        return res.status(404).json({ error: "Doctor not found" });

                    return res.json({
                        success: true,
                        role: user.role,
                        userId: user.id,
                        doctorId: doctorResult[0].id
                    });
                }
            );

        } else {
            return res.json({
                success: true,
                role: user.role,
                userId: user.id
            });
        }
    });
};
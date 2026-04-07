const db = require("../config/db"); // FIX: was completely missing

/* ================= ADD RATING ================= */
// POST /ratings/add
// Patient rates a doctor after a completed appointment
exports.addRating = (req, res) => {
    const { doctor_id, patient_id, rating, comment } = req.body;

    if (!doctor_id || !patient_id || !rating) {
        return res.status(400).json({ error: "doctor_id, patient_id and rating are required." });
    }

    if (rating < 1 || rating > 5) {
        return res.status(400).json({ error: "Rating must be between 1 and 5." });
    }

    // Check patient has a completed appointment with this doctor
    db.query(
        `SELECT id FROM appointments
         WHERE patient_id = ? AND doctor_id = ? AND status = 'completed'
         LIMIT 1`,
        [patient_id, doctor_id],
        (err, result) => {
            if (err) return res.status(500).json({ error: "Database error." });
            if (result.length === 0) {
                return res.status(403).json({
                    error: "You can only rate a doctor after a completed appointment."
                });
            }

            // Check if patient already rated this doctor
            db.query(
                `SELECT id FROM ratings WHERE patient_id = ? AND doctor_id = ?`,
                [patient_id, doctor_id],
                (err, existing) => {
                    if (err) return res.status(500).json({ error: "Database error." });

                    if (existing.length > 0) {
                        // Update existing rating
                        db.query(
                            `UPDATE ratings SET rating = ?, comment = ? WHERE patient_id = ? AND doctor_id = ?`,
                            [rating, comment || null, patient_id, doctor_id],
                            (err) => {
                                if (err) return res.status(500).json({ error: "Failed to update rating." });
                                res.json({ success: true, message: "Rating updated successfully." });
                            }
                        );
                    } else {
                        // Insert new rating
                        db.query(
                            `INSERT INTO ratings (doctor_id, patient_id, rating, comment) VALUES (?, ?, ?, ?)`,
                            [doctor_id, patient_id, rating, comment || null],
                            (err) => {
                                if (err) return res.status(500).json({ error: "Failed to submit rating." });
                                res.json({ success: true, message: "Rating submitted successfully." });
                            }
                        );
                    }
                }
            );
        }
    );
};

/* ================= GET RATINGS FOR A DOCTOR ================= */
// GET /ratings/doctor/:doctor_id
// Returns all ratings + avg for a doctor — visible to all patients
exports.getRatingsByDoctor = (req, res) => {
    const { doctor_id } = req.params;

    db.query(
        `SELECT
            r.id,
            r.rating,
            r.comment,
            u.name AS patient_name
         FROM ratings r
         JOIN patients p ON r.patient_id = p.id
         JOIN users u ON p.user_id = u.id
         WHERE r.doctor_id = ?
         ORDER BY r.id DESC`,
        [doctor_id],
        (err, result) => {
            if (err) return res.status(500).json({ error: "Failed to fetch ratings." });

            const avg = result.length > 0
                ? (result.reduce((sum, r) => sum + r.rating, 0) / result.length).toFixed(1)
                : null;

            res.json({
                success: true,
                average_rating: avg ? parseFloat(avg) : null,
                total_ratings: result.length,
                ratings: result
            });
        }
    );
};

/* ================= GET ALL DOCTOR AVERAGES ================= */
// GET /ratings/averages
// Returns avg rating per doctor — used to show stars on patient dashboard doctor cards
exports.getAllAverages = (req, res) => {
    db.query(
        `SELECT
            doctor_id,
            ROUND(AVG(rating), 1) AS average_rating,
            COUNT(*) AS total_ratings
         FROM ratings
         GROUP BY doctor_id`,
        (err, result) => {
            if (err) return res.status(500).json({ error: "Failed to fetch averages." });
            res.json({ success: true, averages: result });
        }
    );
};
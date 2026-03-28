exports.addRating = (req, res) => {
    const { doctor_id, patient_id, rating, comment } = req.body;

    db.query(
        "INSERT INTO ratings (doctor_id, patient_id, rating, comment) VALUES (?, ?, ?, ?)",
        [doctor_id, patient_id, rating, comment],
        () => res.send("Rating Submitted")
    );
};
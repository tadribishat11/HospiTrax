const express = require("express");
const router = express.Router();
const ratingController = require("../controllers/ratingController");

// POST /ratings/add — patient submits a rating for a doctor
router.post("/add", ratingController.addRating);

// GET /ratings/doctor/:doctor_id — get all ratings for a specific doctor
router.get("/doctor/:doctor_id", ratingController.getRatingsByDoctor);

// GET /ratings/averages — get avg rating for all doctors (for doctor cards)
router.get("/averages", ratingController.getAllAverages);

module.exports = router;
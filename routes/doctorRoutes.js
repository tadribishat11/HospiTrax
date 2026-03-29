const express = require("express");
const router = express.Router();
const doctorController = require("../controllers/doctorController");

// ── Existing routes ───────────────────────────────────────────

// Get all doctors (used by patient dashboard)
router.get("/list", doctorController.getAllDoctors);

// FIX: New route — resolve userId → doctorId for doctor dashboard on load
// doctor-dashboard calls GET /doctor/me/:user_id using userId from sessionStorage
router.get("/me/:user_id", doctorController.getDoctorByUserId);

// Get doctor appointments
router.get("/appointments/:doctor_id", doctorController.getDoctorAppointments);

// Get today's queue
router.get("/queue/:doctor_id", doctorController.getTodayQueue);

// Update prescription
router.post("/prescription", doctorController.updatePrescription);

// Set availability
router.post("/availability", doctorController.setAvailability);

// ── Teammate's new feature routes ────────────────────────────

// TEAMMATE FEATURE 1: Ratings and comments for a doctor
router.get("/ratings/:doctor_id", doctorController.getDoctorRatings);

// TEAMMATE FEATURE 2: Today's patient count
router.get("/stats/daily/:doctor_id", doctorController.getDailyPatientCount);

// TEAMMATE FEATURE 3: Average patients per day
router.get("/stats/average/:doctor_id", doctorController.getAveragePatientCount);

module.exports = router;
const express = require("express");
const router = express.Router();
const doctorController = require("../controllers/doctorController");

// Get all doctors
router.get("/list", doctorController.getAllDoctors);

// Get doctor appointments
router.get("/appointments/:doctor_id", doctorController.getDoctorAppointments);

// Get today's queue
router.get("/queue/:doctor_id", doctorController.getTodayQueue);

// Update prescription
router.post("/prescription", doctorController.updatePrescription);

// Set availability
router.post("/availability", doctorController.setAvailability);

module.exports = router;
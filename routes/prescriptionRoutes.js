// routes/prescriptionRoutes.js
// FEATURE 2 — Prescription Routes

const express                = require("express");
const router                 = express.Router();
const prescriptionController = require("../controllers/prescriptionController");

// Save (create or update) — called from doctor dashboard
router.post("/save",                              prescriptionController.savePrescription);

// Fetch for a single appointment — doctor "View" button
router.get("/appointment/:appointment_id",        prescriptionController.getByAppointment);

// Fetch all prescriptions for a patient — patient dashboard
router.get("/patient/:patient_id",                prescriptionController.getByPatient);

// Fetch all prescriptions written by a doctor — doctor history panel
router.get("/doctor/:doctor_id",                  prescriptionController.getByDoctor);

// Delete (optional admin capability)
router.delete("/:prescription_id",                prescriptionController.deletePrescription);

module.exports = router;

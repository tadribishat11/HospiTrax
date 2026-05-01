// routes/vitalsRoutes.js
const express = require("express");
const router  = express.Router();
const ctrl    = require("../controllers/vitalsController");

// Doctor records vitals for a patient
router.post("/record", ctrl.recordVitals);

// Get all vitals for a patient (for charts)
router.get("/patient/:patient_id", ctrl.getPatientVitals);

// Get only the latest vitals entry
router.get("/patient/:patient_id/latest", ctrl.getLatestVitals);

module.exports = router;

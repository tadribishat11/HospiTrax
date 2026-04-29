// routes/scheduleRoutes.js
// FEATURE 1 — Doctor Availability Schedule Routes
 
const express          = require("express");
const router           = express.Router();
const scheduleController = require("../controllers/scheduleController");
 
// Public — patient dashboard reads all doctors' schedules
router.get("/all",                scheduleController.getAllDoctorSchedules);
 
// Per-doctor — used on the doctor dashboard and by patients filtering one doctor
router.get("/doctor/:doctor_id",  scheduleController.getDoctorSchedule);
 
// Doctor manages their own slots
router.post("/slot",              scheduleController.addSlot);
router.put("/slot/:slot_id",      scheduleController.updateSlot);
router.delete("/slot/:slot_id",   scheduleController.removeSlot);
 
module.exports = router;


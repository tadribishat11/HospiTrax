// routes/slotRoutes.js
// FEATURE 3 — Slot Reassignment Routes

const express               = require("express");
const router                = express.Router();
const slotReassignController = require("../controllers/slotReassignController");

// Patient joins/leaves the waitlist
router.post("/waitlist",                      slotReassignController.joinWaitlist);
router.get("/waitlist/patient/:patient_id",   slotReassignController.getPatientWaitlist);
router.delete("/waitlist/:waitlist_id",       slotReassignController.leaveWaitlist);

// Admin / cron: manual full-scan reassignment
router.post("/reassign-now",                  slotReassignController.manualReassignAll);

// Admin: view reassignment audit log
router.get("/reassignments",                  slotReassignController.getReassignmentLog);

module.exports = router;

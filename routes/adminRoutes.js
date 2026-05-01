// routes/adminRoutes.js
// ADMIN COMMAND CENTER — Route definitions

const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");

// ── A. Governance (User Lifecycle & Control) ─────────────────
router.get("/api/users",                   adminController.getAllUsers);
router.get("/api/users/:id",               adminController.getUserById);
router.put("/api/users/:id",               adminController.updateUser);
router.delete("/api/users/:id",            adminController.deleteUser);
router.put("/api/users/:id/reset-password", adminController.resetPassword);
router.put("/api/doctors/:id/verify",      adminController.verifyDoctor);

// ── B. Operational Oversight (Real-Time Control) ─────────────
router.get("/api/overview",                adminController.getOverview);
router.get("/api/live-queues",             adminController.getLiveQueues);
router.get("/api/appointments",            adminController.getAllAppointments);
router.put("/api/appointments/:id/cancel", adminController.adminCancelAppointment);
router.put("/api/doctor/:id/bulk-cancel",  adminController.bulkCancelByDoctor);

// ── C. Performance Analytics ─────────────────────────────────
router.get("/api/analytics/wait-times",      adminController.getWaitTimeAnalytics);
router.get("/api/analytics/specializations", adminController.getSpecializationAnalytics);
router.get("/api/analytics/kpi",             adminController.getKPIAnalytics);

// ── D. Data & Security ───────────────────────────────────────
router.get("/api/audit-log",               adminController.getAuditLog);

module.exports = router;

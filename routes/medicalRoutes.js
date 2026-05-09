// ============================================================
// FILE TO CREATE: routes/medicalRoutes.js
// Handles Medical Records (Feature 1) and Lab Reports (Feature 2)
// ============================================================

const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const db = require("../config/db"); // adjust path if your db config differs

// ─────────────────────────────────────────────
// MULTER SETUP — Lab Report Image Uploads
// Saves to /public/uploads/lab-reports/
// Unique filename: Date.now() + original extension
// Only allows jpg, jpeg, png
// ─────────────────────────────────────────────

const uploadDir = path.join(__dirname, "../public/uploads/lab-reports");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        const uniqueName = `labreport_${Date.now()}${ext}`;
        cb(null, uniqueName);
    },
});

const fileFilter = (req, file, cb) => {
    const allowed = [".jpg", ".jpeg", ".png", ".pdf"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
        cb(null, true);
    } else {
        cb(new Error("Only JPG, PNG, and PDF files are allowed."), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
});

// ─────────────────────────────────────────────
// FEATURE 2 — POST /api/upload-report
// Patient uploads a lab report image.
// Body: patient_id (int), report_type (string, optional)
// File field name: "labReport"
// ─────────────────────────────────────────────

router.post("/upload-report", upload.single("labReport"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: "No file uploaded." });
        }

        const { patient_id, report_type, uploaded_by_user_id } = req.body;

        if (!patient_id || !uploaded_by_user_id) {
            return res.status(400).json({ success: false, message: "patient_id and uploaded_by_user_id are required." });
        }

        // Public URL path (served via express static)
        const image_url = `/uploads/lab-reports/${req.file.filename}`;

        const [result] = await db.query(
            `INSERT INTO lab_reports (patient_id, uploaded_by_user_id, image_url, original_filename, report_type)
             VALUES (?, ?, ?, ?, ?)`,
            [patient_id, uploaded_by_user_id, image_url, req.file.originalname, report_type || null]
        );

        return res.status(201).json({
            success: true,
            message: "Lab report uploaded successfully.",
            report: {
                id: result.insertId,
                image_url,
                original_filename: req.file.originalname,
                report_type: report_type || null,
            },
        });
    } catch (err) {
        console.error("Upload error:", err);
        return res.status(500).json({ success: false, message: "Server error during upload." });
    }
});

// ─────────────────────────────────────────────
// FEATURE 2 — GET /api/reports/:patientId
// Doctor retrieves all lab report images for a patient.
// ─────────────────────────────────────────────

router.get("/reports/:patientId", async (req, res) => {
    try {
        const { patientId } = req.params;

        const [reports] = await db.query(
            `SELECT lr.id, lr.image_url, lr.original_filename, lr.report_type, lr.upload_date,
                    u.name AS uploaded_by
             FROM lab_reports lr
             JOIN users u ON u.id = lr.uploaded_by_user_id
             WHERE lr.patient_id = ?
             ORDER BY lr.upload_date DESC`,
            [patientId]
        );

        return res.json({ success: true, reports });
    } catch (err) {
        console.error("Fetch reports error:", err);
        return res.status(500).json({ success: false, message: "Server error." });
    }
});

// ─────────────────────────────────────────────
// FEATURE 1 — POST /api/medical-records
// Doctor saves a medical record for a patient.
// Body: patient_id, doctor_id, appointment_id (optional),
//       diagnosis, treatment, notes (optional), date
// ─────────────────────────────────────────────

router.post("/medical-records", async (req, res) => {
    try {
        const { patient_id, doctor_id, appointment_id, diagnosis, treatment, notes, date } = req.body;

        if (!patient_id || !doctor_id || !diagnosis || !treatment) {
            return res.status(400).json({
                success: false,
                message: "patient_id, doctor_id, diagnosis, and treatment are required.",
            });
        }

        const [result] = await db.query(
            `INSERT INTO medical_records (patient_id, doctor_id, appointment_id, diagnosis, treatment, notes, date)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [patient_id, doctor_id, appointment_id || null, diagnosis, treatment, notes || null, date || new Date().toISOString().split("T")[0]]
        );

        return res.status(201).json({
            success: true,
            message: "Medical record saved.",
            record_id: result.insertId,
        });
    } catch (err) {
        console.error("Save record error:", err);
        return res.status(500).json({ success: false, message: "Server error." });
    }
});

// ─────────────────────────────────────────────
// FEATURE 1 — GET /api/medical-records/:patientId
// Doctor or patient retrieves full history for a patient.
// ─────────────────────────────────────────────

router.get("/medical-records/:patientId", async (req, res) => {
    try {
        const { patientId } = req.params;

        const [records] = await db.query(
            `SELECT mr.id, mr.diagnosis, mr.treatment, mr.notes, mr.date, mr.created_at,
                    u.name AS doctor_name, d.specialization
             FROM medical_records mr
             JOIN doctors d ON d.id = mr.doctor_id
             JOIN users u ON u.id = d.user_id
             WHERE mr.patient_id = ?
             ORDER BY mr.date DESC`,
            [patientId]
        );

        return res.json({ success: true, records });
    } catch (err) {
        console.error("Fetch records error:", err);
        return res.status(500).json({ success: false, message: "Server error." });
    }
});

module.exports = router;
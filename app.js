const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");

const app = express();
const PORT = 3000;

// ================= MIDDLEWARE =================
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// ================= STATIC FILES =================
app.use("/css",     express.static(path.join(__dirname, "public/css")));
app.use("/js",      express.static(path.join(__dirname, "public/js")));
app.use("/images",  express.static(path.join(__dirname, "public/images")));
// TEAMMATE FEATURE 4 & 5: Serve uploaded lab report files publicly
app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));

// ================= PAGE ROUTES =================
// Must be defined BEFORE app.use("/doctor", doctorRoutes)
// to avoid /doctor-dashboard being swallowed by the API router

app.get("/login", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "login.html"));
});

app.get("/register", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "register.html"));
});

app.get("/patient", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "patient-dashboard.html"));
});

// FEATURE 2: Live queue page (teammate added — serves same patient dashboard)
app.get("/live-queue", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "patient-dashboard.html"));
});

// MERGE FIX: /doctor-dashboard avoids conflict with app.use("/doctor", doctorRoutes)
app.get("/doctor-dashboard", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "doctor-dashboard.html"));
});

app.get("/admin", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "admin-dashboard.html"));
});

// ================= API ROUTES =================
const authRoutes        = require("./routes/authRoutes");
const appointmentRoutes = require("./routes/appointmentRoutes");
const doctorRoutes      = require("./routes/doctorRoutes");
// TEAMMATE FEATURE 4 & 5: Medical records + lab report upload
const medicalRoutes     = require("./routes/medicalRoutes");

app.use("/auth",         authRoutes);
app.use("/appointments", appointmentRoutes);
app.use("/doctor",       doctorRoutes);
// Mounts: /api/upload-report, /api/reports/:id, /api/medical-records
app.use("/api",          medicalRoutes);

// ================= ROOT =================
app.get("/", (req, res) => {
    res.redirect("/login");
});

// ================= 404 =================
app.use((req, res) => {
    res.status(404).send("Page not found");
});

// ================= START SERVER =================
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
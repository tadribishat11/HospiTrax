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
app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));

// ================= PAGE ROUTES =================
app.get("/login", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "login.html"));
});

app.get("/register", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "register.html"));
});

app.get("/patient", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "patient-dashboard.html"));
});

app.get("/live-queue", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "patient-dashboard.html"));
});

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
const medicalRoutes     = require("./routes/medicalRoutes");
const ratingRoutes      = require("./routes/ratingRoutes"); // NEW
const prescriptionRoutes = require("./routes/prescriptionRoutes"); // NEW
const scheduleRoutes    = require("./routes/scheduleRoutes"); // NEW
const slotRoutes        = require("./routes/slotRoutes"); // NEW
const adminRoutes       = require("./routes/adminRoutes"); // ADMIN COMMAND CENTER
const vitalsRoutes      = require("./routes/vitalsRoutes"); // VITAL SIGNS

app.use("/auth",         authRoutes);
app.use("/appointments", appointmentRoutes);
app.use("/doctor",       doctorRoutes);
app.use("/api",          medicalRoutes);
app.use("/ratings",      ratingRoutes); // NEW — /ratings/add, /ratings/doctor/:id, /ratings/averages
app.use("/prescriptions", prescriptionRoutes); // NEW
app.use("/schedule",     scheduleRoutes); // NEW
app.use("/slots",        slotRoutes); // NEW
app.use("/admin",        adminRoutes); // ADMIN COMMAND CENTER
app.use("/vitals",       vitalsRoutes); // VITAL SIGNS

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
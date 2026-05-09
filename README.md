# 🏥 HospiTrax - Hospital Management System

A comprehensive full-stack web application designed to streamline hospital operations, patient flow management, and doctor efficiency. HospiTrax leverages real-time queue management, appointment scheduling, and medical data organization to create a seamless healthcare experience.

**Status**: 🚀 In Active Development

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Installation & Setup](#installation--setup)
- [Usage Guide](#usage-guide)
- [API Documentation](#api-documentation)
- [Database Schema](#database-schema)
- [Core Features Breakdown](#core-features-breakdown)
- [Contributing](#contributing)
- [Future Enhancements](#future-enhancements)
- [License](#license)

---

## 🎯 Overview

HospiTrax is a Hospital Management System that addresses key challenges in healthcare delivery:

- **Patient Wait Times**: Real-time queue management with accurate wait time estimation
- **Doctor Efficiency**: Streamlined patient flow and appointment management
- **Data Management**: Secure storage and retrieval of medical records and lab reports
- **Hospital Operations**: Centralized admin control and analytics

The system supports three user roles: **Patients**, **Doctors**, and **Admins**, each with role-specific dashboards and functionalities.

---

## ✨ Features

### 1. **User Management**
- 👤 Patient registration with age and gender
- 👨‍⚕️ Doctor registration with specialization and availability
- 🔐 Secure role-based login system
- 🛡️ Password encryption using bcryptjs

### 2. **Appointment & Queue System**
- 📅 Easy appointment booking
- 🎫 Live queue number display for waiting patients
- ⏱️ Real-time estimated waiting time calculation
- 🚨 Emergency booking with automatic queue priority handling
- 📊 Queue status tracking and updates

### 3. **Medical Records & Lab Reports**
- 📄 Secure patient medical records storage
- 🖼️ Lab report image uploads (JPG, PNG)
- 🔍 Searchable medical history
- 👨‍⚕️ Doctor access to patient medical data
- 💾 Organized appointment-linked records

### 4. **Doctor Dashboard**
- 👥 View daily patient queue
- ⭐ Patient ratings and feedback
- 📈 Daily patient count and analytics
- 💊 **Enhanced Prescription Management**: Digital prescriptions with structured medicine lists
- 📅 **Weekly Availability Schedule**: Manage recurring time slots for each day of the week
- 📊 **Vital Signs Tracking**: Record and monitor patient health metrics (BP, Heart Rate, etc.)
- 🔔 Real-time appointment updates

### 5. **Patient Dashboard**
- 📋 My appointments overview
- 🎫 Current queue number and position
- ⏳ Estimated waiting time
- 📅 Appointment history
- 🗑️ Cancel appointments
- 📚 Access medical records and lab reports
- ⭐ Rate doctors and leave feedback
- 📈 **My Health Trends**: Visualize vital signs history via interactive charts
- ⏳ **Slot Waitlist**: Join a waitlist for preferred dates/times when slots are full

### 6. **Admin Dashboard (Command Center)**
- 👥 **User Management**: Manage patients and doctors with verification workflow
- 🛡️ **Doctor Verification**: Approve/reject new doctor registrations
- 📊 **Hospital-wide Analytics**: Real-time stats on appointments, users, and ratings
- 🔍 **Audit Logs**: Track system-wide actions for security and accountability
- 🏦 **System Monitoring**: View all appointments and queue statuses across the hospital

---

## 🛠 Tech Stack

### **Frontend**
- HTML5
- CSS3
- Vanilla JavaScript (ES6+)
- Responsive design

### **Backend**
- **Runtime**: Node.js
- **Framework**: Express.js (v5.2.1)
- **Authentication**: bcryptjs, JSONWebToken
- **File Upload**: Multer
- **Validation**: Body-parser

### **Database**
- **DBMS**: MySQL (MariaDB 10.4.32)
- **Driver**: mysql2
- **Version**: 3.20.0

### **Development Tools**
- Nodemon (auto-reload)
- dotenv (environment variables)
- Socket.io (real-time updates - optional)

---

## 📁 Project Structure

```
hospitrax/
├── app.js                          # Express server entry point
├── config/
│   └── db.js                       # MySQL connection
├── controllers/
│   ├── adminController.js          # Admin command center logic
│   ├── appointmentController.js    # Appointment logic
│   ├── authController.js           # Auth & registration
│   ├── doctorController.js         # Doctor operations
│   ├── prescriptionController.js   # Enhanced prescriptions
│   ├── ratingController.js         # Doctor ratings
│   ├── scheduleController.js       # Weekly availability
│   ├── slotController.js           # Slot waitlist & booking
│   ├── slotReassignController.js   # Automatic slot reassignment
│   └── vitalsController.js         # Vital signs tracking
├── models/
│   ├── appointment.js              # Appointment model
│   ├── doctor.js                   # Doctor model
│   ├── patient.js                  # Patient model
│   └── user.js                     # User model
├── routes/
│   ├── adminRoutes.js              # Admin endpoints
│   ├── appointmentRoutes.js        # Appointment endpoints
│   ├── authRoutes.js               # Auth endpoints
│   ├── doctorRoutes.js             # Doctor endpoints
│   ├── medicalRoutes.js            # Medical records & lab reports
│   ├── prescriptionRoutes.js       # Prescription endpoints
│   ├── ratingRoutes.js             # Rating endpoints
│   ├── scheduleRoutes.js           # Schedule endpoints
│   ├── slotRoutes.js               # Slot/Waitlist endpoints
│   └── vitalsRoutes.js             # Vital signs endpoints
├── views/
│   ├── login.html                  # Login page
│   ├── register.html               # Registration page
│   ├── patient-dashboard.html      # Patient dashboard
│   ├── doctor-dashboard.html       # Doctor dashboard
│   └── admin-dashboard.html        # Admin dashboard
├── public/
│   ├── css/
│   │   └── style.css               # Global styles
│   ├── js/
│   │   └── dashboard.js            # Dashboard scripts
│   └── uploads/
│       └── lab-reports/            # Lab report storage
├── package.json
└── hospitrax.sql                   # Updated database schema
```

---

## 🚀 Installation & Setup

### **Prerequisites**
- Node.js (v14 or higher)
- MySQL (v5.7 or higher)
- npm or yarn

### **Step 1: Clone Repository**
```bash
git clone https://github.com/yourusername/hospitrax.git
cd hospitrax
```

### **Step 2: Install Dependencies**
```bash
npm install
```

### **Step 3: Setup Database**

1. Open MySQL CLI:
```bash
mysql -u root -p
```

2. Create database and import schema:
```sql
CREATE DATABASE hospitrax;
USE hospitrax;
SOURCE hospitrax.sql;
```

Or use GUI tools like phpMyAdmin:
- Import `hospitrax.sql` into a new database named `hospitrax`

### **Step 4: Configure Database Connection**

Create a `.env` file in the root directory:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=hospitrax
```

Alternatively, you can update `config/db.js` directly:
```javascript
const db = mysql.createPool({
    host: "localhost",
    user: "root",
    password: "your_password",
    database: "hospitrax"
});
```

### **Step 5: Start Server**
```bash
npm start
```

Or with Nodemon (auto-reload):
```bash
npx nodemon app.js
```

The server will run on `http://localhost:3000`

### **Step 6: Access Application**
- Login page: `http://localhost:3000/login`
- Register: `http://localhost:3000/register`

---

## 💻 Usage Guide

### **For Patients**

1. **Register** as a patient with name, email, password, age, and gender
2. **Login** and access patient dashboard
3. **Book Appointment**:
   - Select a doctor from the available list
   - Choose date and time
   - Optionally mark as emergency for priority
   - Confirm booking
4. **Monitor Queue**:
   - View current queue number
   - Check estimated waiting time
   - See patients ahead in queue
5. **Manage Medical Data**:
   - Upload lab reports (JPG/PNG)
   - View medical records
   - Access appointment history
6. **Rate Doctors**: Leave feedback after appointments

### **For Doctors**

1. **Register** with specialization and availability
2. **Login** to doctor dashboard
3. **View Daily Queue**:
   - See all patients scheduled for today
   - Track queue progression
   - Update appointment status
4. **Manage Patients**:
   - Add/update prescriptions
   - Access patient medical records
   - View patient information
5. **Set Availability**:
   - Update work schedule
   - Manage appointment slots
6. **Monitor Analytics**:
   - Daily patient count
   - Average consultation time
   - Patient feedback and ratings

### **For Admins**

1. **Login** to admin dashboard
2. **User Management**:
   - View all registered patients and doctors
   - Monitor user activity
   - Remove inactive accounts
3. **System Monitoring**:
   - View all appointments
   - Track queue statuses
   - Generate reports
4. **Hospital Analytics**:
   - Total patients and doctors
   - Appointment statistics
   - System usage metrics

---

## 📡 API Documentation

### **Authentication Endpoints**

#### Register User
```
POST /auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "secure_password",
  "role": "patient",
  "age": 30,
  "gender": "Male"
}
```

#### Login
```
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "secure_password"
}

Response:
{
  "success": true,
  "role": "patient",
  "userId": 1,
  "patientId": 1
}
```

### **Appointment Endpoints**

#### Book Appointment
```
POST /appointments/book
Content-Type: application/json

{
  "patient_id": 1,
  "doctor_id": 2,
  "date": "2026-03-30",
  "time": "10:30:00",
  "priority": "normal" | "emergency"
}
```

#### Get Patient Appointments
```
GET /appointments/patient/:patient_id

Response:
[
  {
    "id": 1,
    "patient_id": 1,
    "doctor_id": 2,
    "date": "2026-03-30",
    "time": "10:30:00",
    "status": "scheduled",
    "queue_number": 1,
    "estimated_waiting_time": 15,
    "priority": "normal",
    "doctor_name": "Dr. Ahmed",
    "specialization": "Cardiology"
  }
]
```

#### Get Live Queue Status
```
GET /appointments/live-queue/:patient_id

Response:
{
  "hasAppointment": true,
  "queueNumber": 1,
  "patientsAhead": 0,
  "estimatedWaitingTime": 15,
  "doctorName": "Dr. Ahmed",
  "appointmentDate": "2026-03-30",
  "appointmentTime": "10:30:00"
}
```

#### Cancel Appointment
```
PUT /appointments/cancel/:appointment_id
```

#### Update Appointment Status
```
PUT /appointments/status/:appointment_id
Content-Type: application/json

{
  "status": "completed" | "in-progress" | "cancelled"
}
```

### **Doctor Endpoints**

#### Get All Doctors
```
GET /doctor/list

Response:
[
  {
    "id": 1,
    "name": "Dr. Nazir Ahmed",
    "specialization": "Cardiology",
    "availability": "Monday: 9AM-12PM, 4PM-7PM"
  }
]
```

#### Get Doctor's Queue
```
GET /appointments/doctor/:doctor_id

Response:
{
  "success": true,
  "queue": [
    {
      "id": 1,
      "queue_number": 1,
      "patient_name": "John Doe",
      "status": "scheduled",
      "priority": "normal"
    }
  ]
}
```

#### Update Prescription
```
POST /doctor/prescription
Content-Type: application/json

{
  "appointment_id": 1,
  "details": "Aspirin 100mg twice daily for 7 days"
}
```

#### Set Doctor Availability (Simple)
```
POST /doctor/availability
Content-Type: application/json

{
  "doctor_id": 1,
  "availability": "Monday: 9AM-12PM, Wednesday: 10AM-3PM"
}
```

### **Weekly Schedule & Slots**

#### Save Recurring Slot
```
POST /schedule/slot
{
  "doctor_id": 1,
  "day_of_week": "Monday",
  "start_time": "09:00",
  "end_time": "12:00"
}
```

#### Get Doctor Weekly Calendar
```
GET /schedule/doctor/:doctor_id
```

### **Prescriptions (Enhanced)**

#### Save Digital Prescription
```
POST /prescriptions/save
Content-Type: application/json

{
  "appointment_id": 1,
  "details": "Patient notes",
  "medicines": [
    { "name": "Paracetamol", "dosage": "500mg", "frequency": "3x daily", "duration": "5 days" }
  ]
}
```

#### Get Patient Prescriptions
```
GET /prescriptions/patient/:patient_id
```

### **Vital Signs**

#### Record Vitals
```
POST /vitals/add
{
  "patient_id": 1,
  "doctor_id": 2,
  "appointment_id": 1,
  "blood_pressure_systolic": 120,
  "blood_pressure_diastolic": 80,
  "heart_rate": 72,
  "temperature": 36.6,
  "blood_glucose": 95,
  "weight": 70.5
}
```

#### Get Health Trends
```
GET /vitals/history/:patient_id
```

### **Slot Waitlist**

#### Join Waitlist
```
POST /slots/waitlist/join
{
  "patient_id": 1,
  "doctor_id": 2,
  "preferred_date": "2026-05-15",
  "preferred_time": "10:00"
}
```

### **Admin Command Center**

#### Get Hospital Analytics
```
GET /admin/analytics
```

#### Verify Doctor
```
PUT /admin/verify-doctor/:doctor_id
{ "status": "approved" | "rejected" }
```

### **Medical Records & Lab Reports**

#### Upload Lab Report
```
POST /api/upload-report
Content-Type: multipart/form-data

{
  "labReport": <file>,
  "patient_id": 1,
  "report_type": "Blood Test"
}
```

#### Get Patient's Lab Reports
```
GET /api/reports/:patient_id
```

#### Create Medical Record
```
POST /api/medical-records
Content-Type: application/json

{
  "patient_id": 1,
  "doctor_id": 2,
  "appointment_id": 1,
  "diagnosis": "Hypertension",
  "treatment": "Medication and lifestyle changes",
  "notes": "Follow-up after 2 weeks"
}
```

#### Get Patient's Medical Records
```
GET /api/medical-records/:patient_id
```

---

## 🗄️ Database Schema

### **Users Table**
```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100),
  email VARCHAR(100) UNIQUE,
  password VARCHAR(255),
  role ENUM('patient', 'doctor', 'admin'),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### **Patients Table**
```sql
CREATE TABLE patients (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT,
  age INT,
  gender VARCHAR(10),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### **Doctors Table**
```sql
CREATE TABLE doctors (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT,
  specialization VARCHAR(100),
  availability TEXT,
  average_consultation_time INT DEFAULT 15,
  is_verified TINYINT(1) DEFAULT 1,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### **Appointments Table**
```sql
CREATE TABLE appointments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  patient_id INT,
  doctor_id INT,
  date DATE,
  time TIME,
  status ENUM('scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled'),
  priority ENUM('normal', 'emergency'),
  queue_number INT,
  estimated_waiting_time INT,
  waiting_time_remaining INT,
  actual_start_time DATETIME,
  actual_end_time DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id),
  FOREIGN KEY (doctor_id) REFERENCES doctors(id)
);
```

### **Medical Records Table**
```sql
CREATE TABLE medical_records (
  id INT PRIMARY KEY AUTO_INCREMENT,
  patient_id INT,
  doctor_id INT,
  appointment_id INT,
  diagnosis TEXT,
  treatment TEXT,
  notes TEXT,
  date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id),
  FOREIGN KEY (doctor_id) REFERENCES doctors(id),
  FOREIGN KEY (appointment_id) REFERENCES appointments(id)
);
```

### **Lab Reports Table**
```sql
CREATE TABLE lab_reports (
  id INT PRIMARY KEY AUTO_INCREMENT,
  patient_id INT,
  uploaded_by_user_id INT,
  image_url VARCHAR(500),
  original_filename VARCHAR(255),
  report_type VARCHAR(100),
  upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id),
  FOREIGN KEY (uploaded_by_user_id) REFERENCES users(id)
);
```

### **Ratings Table**
```sql
CREATE TABLE ratings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  doctor_id INT,
  patient_id INT,
  rating INT,
  comment TEXT,
  FOREIGN KEY (doctor_id) REFERENCES doctors(id),
  FOREIGN KEY (patient_id) REFERENCES patients(id)
);
```

### **Queue Status Table**
```sql
CREATE TABLE queue_status (
  id INT PRIMARY KEY AUTO_INCREMENT,
  doctor_id INT,
  date DATE,
  current_queue_number INT DEFAULT 0,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_doctor_date (doctor_id, date),
  FOREIGN KEY (doctor_id) REFERENCES doctors(id)
);
```

### **Vital Signs Table**
```sql
CREATE TABLE vital_signs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  patient_id INT,
  doctor_id INT,
  appointment_id INT,
  blood_pressure_systolic INT,
  blood_pressure_diastolic INT,
  heart_rate INT,
  temperature DECIMAL(4,1),
  blood_glucose INT,
  weight DECIMAL(5,1),
  notes TEXT,
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### **Doctor Schedule Slots Table**
```sql
CREATE TABLE doctor_schedule_slots (
  id INT PRIMARY KEY AUTO_INCREMENT,
  doctor_id INT,
  day_of_week ENUM('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'),
  start_time TIME,
  end_time TIME,
  is_active TINYINT(1) DEFAULT 1
);
```

### **Slot Waitlist Table**
```sql
CREATE TABLE slot_waitlist (
  id INT PRIMARY KEY AUTO_INCREMENT,
  doctor_id INT,
  patient_id INT,
  preferred_date DATE,
  preferred_time TIME,
  status ENUM('waiting','assigned','expired') DEFAULT 'waiting'
);
```

### **Audit Log Table**
```sql
CREATE TABLE audit_log (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT,
  user_name VARCHAR(100),
  action VARCHAR(100),
  target_type VARCHAR(50),
  target_id INT,
  details TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🎯 Core Features Breakdown

### **1. Real-Time Queue Management**

The system calculates queue numbers based on:
- Appointment booking order
- Doctor's average consultation time
- Priority status (emergency gets position 1)

**Algorithm**:
```
queue_number = (existing_appointments + 1)
estimated_wait = (queue_number - 1) × avg_consultation_time
```

### **2. Emergency Priority Handling**

When an emergency appointment is booked:
1. All existing appointments' queue numbers are incremented by 1
2. Emergency appointment gets queue number 1
3. Emergency patient has 0 estimated wait time

### **3. Medical Records Integration**

Doctors can:
- Create appointment-linked medical records
- Access complete patient history
- Upload prescriptions

Patients can:
- View all medical records from doctors
- Upload lab reports
- Access appointment history with notes

### **4. Real-Time Dashboard Updates**

Dashboards refresh every 10 seconds to show:
- Current queue position
- Updated wait times
- New appointments
- Status changes

---

## 🔐 Security Features

- ✅ Password hashing with bcryptjs (10 rounds)
- ✅ Role-based access control
- ✅ SQL injection prevention with parameterized queries
- ✅ File upload validation (JPG, PNG only, 5MB max)
- ✅ Session-based authentication
- ✅ Secure database credentials (use environment variables)

---

## 🚀 Future Enhancements

- [ ] SMS/Email notifications for appointment reminders
- [ ] Video consultation support
- [ ] Insurance integration
- [ ] Prescription delivery/refill system
- [ ] Advanced analytics dashboard
- [ ] Mobile app (React Native/Flutter)
- [ ] Payment gateway integration
- [ ] Telemedicine features
- [ ] Real-time chat between doctors and patients
- [ ] Automated report generation
- [ ] Multi-language support
- [ ] Dark mode UI

---

## 📊 Current Development Status

### ✅ Completed
- User registration and authentication
- Appointment booking system
- Queue management with priority handling
- Patient dashboard with real-time updates
- Doctor dashboard and queue management
- Medical records storage
- Lab report uploads
- Doctor availability management (Simple & Slot-based)
- Rating/feedback system
- **Vital signs tracking and visualization (Health Trends)**
- **Admin Command Center with Audit Logs**
- **Structured Digital Prescriptions**
- **Automated Slot Waitlist & Reassignment**

### 🔄 In Progress
- Doctor dashboard analytics
- Hospital admin panel enhancements
- Real-time notifications

### ⏳ Planned
- Mobile responsiveness improvements
- Advanced search and filtering
- Email notifications
- API rate limiting
- Comprehensive testing suite

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/AmazingFeature`)
3. **Commit** changes (`git commit -m 'Add AmazingFeature'`)
4. **Push** to branch (`git push origin feature/AmazingFeature`)
5. **Open** a Pull Request

### **Code Standards**
- Use meaningful variable names
- Add comments for complex logic
- Follow existing code structure
- Test all changes before submitting

---

## 📝 Git Workflow

```bash
# Clone the repo
git clone https://github.com/yourusername/hospitrax.git

# Create feature branch
git checkout -b feature/your-feature

# Make changes and commit
git add .
git commit -m "Descriptive message about changes"

# Push to remote
git push origin feature/your-feature

# Create Pull Request on GitHub
```

---

## 📞 Support & Issues

Found a bug or have a suggestion? 
- 🐛 **Report Issues**: [GitHub Issues](https://github.com/yourusername/hospitrax/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/yourusername/hospitrax/discussions)
- 📧 **Email**: your-email@example.com

---

## 📄 License

This project is licensed under the **MIT License** - see the LICENSE file for details.

---

## 👨‍💻 Authors

- **Your Name** - Initial development and architecture
- Contributions welcome! Add yourself here.

---

## 🙏 Acknowledgments

- Express.js community for excellent framework
- MySQL documentation and best practices
- All contributors and testers
- Healthcare professionals for requirements gathering

---

## 📈 Project Statistics

- **Total Lines of Code**: ~3000+
- **Database Tables**: 8
- **API Endpoints**: 20+
- **Pages**: 5
- **Development Status**: Active

---

**Last Updated**: March 30, 2026

**Version**: 1.0.0-beta

For the latest updates, visit: [GitHub Repository](https://github.com/yourusername/hospitrax)

---

Made with ❤️ for better hospital management

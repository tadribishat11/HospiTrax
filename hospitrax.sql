-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Apr 20, 2026 at 05:35 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `hospitrax`
--

-- --------------------------------------------------------

--
-- Table structure for table `appointments`
--

CREATE TABLE `appointments` (
  `id` int(11) NOT NULL,
  `patient_id` int(11) DEFAULT NULL,
  `doctor_id` int(11) DEFAULT NULL,
  `date` date DEFAULT NULL,
  `time` time DEFAULT NULL,
  `status` enum('scheduled','confirmed','in-progress','completed','cancelled') DEFAULT 'scheduled',
  `priority` enum('normal','emergency') DEFAULT 'normal',
  `queue_number` int(11) DEFAULT NULL,
  `estimated_waiting_time` int(11) DEFAULT NULL,
  `waiting_time_remaining` int(11) DEFAULT NULL,
  `actual_start_time` datetime DEFAULT NULL,
  `actual_end_time` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `appointments`
--

INSERT INTO `appointments` (`id`, `patient_id`, `doctor_id`, `date`, `time`, `status`, `priority`, `queue_number`, `estimated_waiting_time`, `waiting_time_remaining`, `actual_start_time`, `actual_end_time`, `created_at`) VALUES
(32, 3, 3, '2026-04-08', '10:30:00', 'cancelled', 'normal', 1, 0, NULL, NULL, NULL, '2026-04-07 13:45:26'),
(34, 6, 3, '2026-04-08', '10:30:00', 'completed', 'normal', 1, 0, NULL, NULL, NULL, '2026-04-07 19:22:43'),
(35, 3, 3, '2026-04-08', '10:30:00', 'completed', 'normal', 2, 15, NULL, NULL, NULL, '2026-04-07 19:24:19');

-- --------------------------------------------------------

--
-- Table structure for table `doctors`
--

CREATE TABLE `doctors` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `specialization` varchar(100) DEFAULT NULL,
  `availability` text DEFAULT NULL,
  `average_consultation_time` int(11) DEFAULT 15
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `doctors`
--

INSERT INTO `doctors` (`id`, `user_id`, `specialization`, `availability`, `average_consultation_time`) VALUES
(3, 8, 'Cardiology', 'Monday: 9AM-12PM, 4PM-7PM Wednesday: 10AM-3PM', 15),
(4, 11, 'General Medicine', 'Sunday: 9AM-12PM, 4PM-7PM Tuesday: 10AM-3PM', 15);

-- --------------------------------------------------------

--
-- Table structure for table `lab_reports`
--

CREATE TABLE `lab_reports` (
  `id` int(11) NOT NULL,
  `patient_id` int(11) NOT NULL,
  `uploaded_by_user_id` int(11) NOT NULL,
  `image_url` varchar(500) NOT NULL,
  `original_filename` varchar(255) DEFAULT NULL,
  `report_type` varchar(100) DEFAULT NULL,
  `upload_date` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `medical_records`
--

CREATE TABLE `medical_records` (
  `id` int(11) NOT NULL,
  `patient_id` int(11) NOT NULL,
  `doctor_id` int(11) NOT NULL,
  `appointment_id` int(11) DEFAULT NULL,
  `diagnosis` text NOT NULL,
  `treatment` text NOT NULL,
  `notes` text DEFAULT NULL,
  `date` date NOT NULL DEFAULT curdate(),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `patients`
--

CREATE TABLE `patients` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `age` int(11) DEFAULT NULL,
  `gender` varchar(10) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `patients`
--

INSERT INTO `patients` (`id`, `user_id`, `age`, `gender`) VALUES
(3, 9, 26, 'Male'),
(6, 14, 40, 'Male');

-- --------------------------------------------------------

--
-- Table structure for table `prescriptions`
--

CREATE TABLE `prescriptions` (
  `id` int(11) NOT NULL,
  `appointment_id` int(11) DEFAULT NULL,
  `details` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `queue_status`
--

CREATE TABLE `queue_status` (
  `id` int(11) NOT NULL,
  `doctor_id` int(11) NOT NULL,
  `date` date NOT NULL,
  `current_queue_number` int(11) DEFAULT 0,
  `last_updated` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `queue_status`
--

INSERT INTO `queue_status` (`id`, `doctor_id`, `date`, `current_queue_number`, `last_updated`) VALUES
(27, 3, '2026-04-08', 2, '2026-04-07 19:25:54');

-- --------------------------------------------------------

--
-- Table structure for table `ratings`
--

CREATE TABLE `ratings` (
  `id` int(11) NOT NULL,
  `doctor_id` int(11) DEFAULT NULL,
  `patient_id` int(11) DEFAULT NULL,
  `rating` int(11) DEFAULT NULL,
  `comment` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `ratings`
--

INSERT INTO `ratings` (`id`, `doctor_id`, `patient_id`, `rating`, `comment`) VALUES
(1, 3, 3, 5, 'Very professional, attentive, and provided clear , effective care.'),
(2, 3, 6, 5, 'Very polite and helpful.');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `name` varchar(100) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `role` enum('patient','doctor','admin') DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `password`, `role`, `created_at`) VALUES
(8, 'Nazir Ahmed', 'nazir@gmail.com', '$2b$10$crlimZWGrLT1xFzvzkN0C.mEL6WzBFPYC0KPhHyrvE6CBjLKhHHF6', 'doctor', '2026-03-27 13:39:24'),
(9, 'Rahim Ahmed', 'rahim@gmail.com', '$2b$10$rkS6I2ZEyGfYr/svzYkcfeEDMhmmuBDpQhwnVfFyGw8PL480ei/3K', 'patient', '2026-03-27 13:40:24'),
(11, 'Nazimuddin', 'nazim@gmail.com', '$2b$10$6g54wa3V7qLRhrEaUQn/G.RhUNO1HNCkja2XwkRpz5/88IugfP91m', 'doctor', '2026-03-27 15:40:40'),
(12, 'Tadrib', 'tadrib@gmail.com', '$2b$10$gDF9qWYcypfZtLZmiXShuuViUf3cy/1d/bq8QFz411tO2salqc/eC', 'admin', '2026-03-27 16:43:05'),
(14, 'Karim Ahmed', 'karim@gmail.com', '$2b$10$jHfw4wihEdI1kIs1iHOwNeft5ciAnhWLCrXUmo8imJ6l/p9wPflTa', 'patient', '2026-03-27 17:40:29');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `appointments`
--
ALTER TABLE `appointments`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `doctors`
--
ALTER TABLE `doctors`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `lab_reports`
--
ALTER TABLE `lab_reports`
  ADD PRIMARY KEY (`id`),
  ADD KEY `patient_id` (`patient_id`),
  ADD KEY `uploaded_by_user_id` (`uploaded_by_user_id`);

--
-- Indexes for table `medical_records`
--
ALTER TABLE `medical_records`
  ADD PRIMARY KEY (`id`),
  ADD KEY `patient_id` (`patient_id`),
  ADD KEY `doctor_id` (`doctor_id`),
  ADD KEY `appointment_id` (`appointment_id`);

--
-- Indexes for table `patients`
--
ALTER TABLE `patients`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `prescriptions`
--
ALTER TABLE `prescriptions`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `queue_status`
--
ALTER TABLE `queue_status`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_doctor_date` (`doctor_id`,`date`);

--
-- Indexes for table `ratings`
--
ALTER TABLE `ratings`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `appointments`
--
ALTER TABLE `appointments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=36;

--
-- AUTO_INCREMENT for table `doctors`
--
ALTER TABLE `doctors`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `lab_reports`
--
ALTER TABLE `lab_reports`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `medical_records`
--
ALTER TABLE `medical_records`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `patients`
--
ALTER TABLE `patients`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `prescriptions`
--
ALTER TABLE `prescriptions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `queue_status`
--
ALTER TABLE `queue_status`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=33;

--
-- AUTO_INCREMENT for table `ratings`
--
ALTER TABLE `ratings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `doctors`
--
ALTER TABLE `doctors`
  ADD CONSTRAINT `doctors_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `lab_reports`
--
ALTER TABLE `lab_reports`
  ADD CONSTRAINT `lab_reports_ibfk_1` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`),
  ADD CONSTRAINT `lab_reports_ibfk_2` FOREIGN KEY (`uploaded_by_user_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `medical_records`
--
ALTER TABLE `medical_records`
  ADD CONSTRAINT `medical_records_ibfk_1` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`),
  ADD CONSTRAINT `medical_records_ibfk_2` FOREIGN KEY (`doctor_id`) REFERENCES `doctors` (`id`),
  ADD CONSTRAINT `medical_records_ibfk_3` FOREIGN KEY (`appointment_id`) REFERENCES `appointments` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `patients`
--
ALTER TABLE `patients`
  ADD CONSTRAINT `patients_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;


--Feature :Doctor Schedule Slots(nafi)
CREATE TABLE IF NOT EXISTS `doctor_schedule_slots` (
  `id`          int(11)      NOT NULL AUTO_INCREMENT,
  `doctor_id`   int(11)      NOT NULL,
  `day_of_week` enum('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday') NOT NULL,
  `start_time`  time         NOT NULL,
  `end_time`    time         NOT NULL,
  `is_active`   tinyint(1)   NOT NULL DEFAULT 1,
  `created_at`  timestamp    NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_slot_doctor` (`doctor_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
 
-- Seed sample slots for existing doctors (IDs 3 & 4)
INSERT INTO `doctor_schedule_slots` (`doctor_id`, `day_of_week`, `start_time`, `end_time`) VALUES
  (3, 'Monday',    '09:00:00', '12:00:00'),
  (3, 'Monday',    '16:00:00', '19:00:00'),
  (3, 'Wednesday', '10:00:00', '15:00:00'),
  (4, 'Sunday',    '09:00:00', '12:00:00'),
  (4, 'Sunday',    '16:00:00', '19:00:00'),
  (4, 'Tuesday',   '10:00:00', '15:00:00');
  ------------------------------------------------
  --FEATURE : Enhanced Prescriptions (nafi)

ALTER TABLE `prescriptions`
  ADD COLUMN IF NOT EXISTS `doctor_id`   int(11)   DEFAULT NULL    AFTER `details`,
  ADD COLUMN IF NOT EXISTS `patient_id`  int(11)   DEFAULT NULL    AFTER `doctor_id`,
  ADD COLUMN IF NOT EXISTS `medicines`   JSON      DEFAULT NULL    AFTER `patient_id`,
  ADD COLUMN IF NOT EXISTS `updated_at`  timestamp NOT NULL
      DEFAULT current_timestamp() ON UPDATE current_timestamp()    AFTER `medicines`;
 
UPDATE `prescriptions` p
JOIN   `appointments` a ON a.id = p.appointment_id
SET    p.doctor_id  = a.doctor_id,
       p.patient_id = a.patient_id
WHERE  p.doctor_id IS NULL;
-----------------------------------------------------
--FEATURE : Slot Waitlist & Reassignment Log

CREATE TABLE IF NOT EXISTS `slot_waitlist` (
  `id`             int(11)    NOT NULL AUTO_INCREMENT,
  `doctor_id`      int(11)    NOT NULL,
  `patient_id`     int(11)    NOT NULL,
  `preferred_date` date       NOT NULL,
  `preferred_time` time       DEFAULT NULL,
  `status`         enum('waiting','assigned','expired') NOT NULL DEFAULT 'waiting',
  `created_at`     timestamp  NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_wl_doctor`  (`doctor_id`),
  KEY `idx_wl_patient` (`patient_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
 
CREATE TABLE IF NOT EXISTS `slot_reassignments` (
  `id`               int(11)    NOT NULL AUTO_INCREMENT,
  `original_appt_id` int(11)    NOT NULL,
  `new_appt_id`      int(11)    NOT NULL,
  `waitlist_id`      int(11)    DEFAULT NULL,
  `reassigned_at`    timestamp  NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
-----------------------------------------------------------------
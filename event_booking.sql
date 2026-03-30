-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Mar 30, 2026 at 12:37 PM
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
-- Database: `event_booking`
--

DELIMITER $$
--
-- Procedures
--
CREATE DEFINER=`root`@`localhost` PROCEDURE `GetEventStatistics` (IN `event_id_param` INT)   BEGIN
    SELECT 
        e.title,
        e.total_tickets,
        e.available_tickets,
        (e.total_tickets - e.available_tickets) as sold_tickets,
        COALESCE(SUM(b.total_price), 0) as total_revenue,
        COUNT(DISTINCT b.id) as total_bookings
    FROM events e
    LEFT JOIN bookings b ON e.id = b.event_id AND b.status = 'confirmed'
    WHERE e.id = event_id_param
    GROUP BY e.id;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `GetUserBookingHistory` (IN `user_id_param` INT)   BEGIN
    SELECT 
        b.id as booking_id,
        b.booking_date,
        b.quantity,
        b.total_price,
        b.status as booking_status,
        e.title as event_title,
        e.event_date,
        e.image_url,
        v.name as venue_name,
        v.city
    FROM bookings b
    JOIN events e ON b.event_id = e.id
    JOIN venues v ON e.venue_id = v.id
    WHERE b.user_id = user_id_param
    ORDER BY b.booking_date DESC;
END$$

DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `bookings`
--

CREATE TABLE `bookings` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `event_id` int(11) NOT NULL,
  `quantity` int(11) NOT NULL,
  `total_price` decimal(10,2) NOT NULL,
  `booking_date` timestamp NOT NULL DEFAULT current_timestamp(),
  `status` enum('confirmed','cancelled','pending','approved') DEFAULT 'pending',
  `seats` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`seats`)),
  `approved_at` timestamp NULL DEFAULT NULL,
  `approved_by` int(11) DEFAULT NULL,
  `notes` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `bookings`
--

INSERT INTO `bookings` (`id`, `user_id`, `event_id`, `quantity`, `total_price`, `booking_date`, `status`, `seats`, `approved_at`, `approved_by`, `notes`) VALUES
(16, 7, 16, 1, 2000.00, '2026-03-12 09:26:07', 'approved', '[\"A3\"]', '2026-03-12 09:26:48', 11, 'NGU'),
(17, 1, 12, 1, 0.00, '2026-03-20 04:04:19', 'pending', NULL, NULL, NULL, NULL),
(18, 7, 16, 1, 2000.00, '2026-03-20 04:04:54', 'approved', '[\"A2\"]', '2026-03-20 04:05:20', 11, NULL),
(20, 1, 13, 1, 0.00, '2026-03-20 14:15:52', 'pending', NULL, NULL, NULL, NULL),
(23, 7, 17, 1, 0.00, '2026-03-21 04:29:22', 'approved', '[\"b2\"]', '2026-03-21 04:36:53', 11, '2'),
(24, 7, 18, 1, 90000.00, '2026-03-24 08:39:31', 'approved', '[\"A3\"]', '2026-03-24 08:39:55', 11, NULL),
(25, 7, 17, 1, 0.00, '2026-03-30 09:25:36', 'pending', NULL, NULL, NULL, NULL),
(26, 7, 20, 1, 1000.00, '2026-03-30 10:33:24', 'approved', '[\"2\"]', '2026-03-30 10:33:45', 11, NULL);

--
-- Triggers `bookings`
--
DELIMITER $$
CREATE TRIGGER `after_booking_insert` AFTER INSERT ON `bookings` FOR EACH ROW BEGIN
    UPDATE events 
    SET updated_at = CURRENT_TIMESTAMP 
    WHERE id = NEW.event_id;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `categories`
--

CREATE TABLE `categories` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `slug` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `categories`
--

INSERT INTO `categories` (`id`, `name`, `slug`, `description`, `created_at`) VALUES
(1, 'Nhạc sống', 'nhac-song', 'Các buổi biểu diễn âm nhạc trực tiếp', '2026-01-12 00:10:38'),
(2, 'Festival', 'festival', 'Lễ hội âm nhạc và văn hóa quy mô lớn', '2026-01-12 00:10:38'),
(3, 'Acoustic', 'acoustic', 'Âm nhạc acoustic thân mật', '2026-01-12 00:10:38'),
(4, 'Nhạc trẻ', 'nhac-tre', 'Các bản nhạc trẻ sôi động', '2026-01-12 00:10:38'),
(5, 'Nhạc cổ điển', 'nhac-co-dien', 'Hòa nhạc giao hưởng và nhạc cổ điển', '2026-01-12 00:10:38'),
(6, 'Rock', 'rock', 'Nhạc rock và metal', '2026-01-12 00:10:38'),
(7, 'Jazz', 'jazz', 'Nhạc jazz và blues', '2026-01-12 00:10:38');

-- --------------------------------------------------------

--
-- Table structure for table `contacts`
--

CREATE TABLE `contacts` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `subject` varchar(255) DEFAULT NULL,
  `message` text NOT NULL,
  `status` enum('pending','responded') DEFAULT 'pending',
  `admin_response` text DEFAULT NULL,
  `responded_at` timestamp NULL DEFAULT NULL,
  `responded_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `contacts`
--

INSERT INTO `contacts` (`id`, `user_id`, `name`, `email`, `subject`, `message`, `status`, `admin_response`, `responded_at`, `responded_by`, `created_at`) VALUES
(1, 2, 'Nguyễn Văn A', 'user1@example.com', 'Cần trợ giúp', 'Tôi gặp vấn đề khi đặt vé.', 'pending', NULL, NULL, NULL, '2026-03-12 03:00:00'),
(3, 7, 'tu', 'tu@example.local', 'g', 't', 'responded', 'de', '2026-03-12 02:01:37', 1, '2026-03-12 02:00:54'),
(4, 7, 'tu', 'tu@example.local', 'rtr', 'trtrt', 'responded', 'qwe', '2026-03-30 10:34:02', 1, '2026-03-30 10:32:59');

-- --------------------------------------------------------

--
-- Table structure for table `events`
--

CREATE TABLE `events` (
  `id` int(11) NOT NULL,
  `title` varchar(200) NOT NULL,
  `description` text DEFAULT NULL,
  `event_date` datetime NOT NULL,
  `venue_id` int(11) NOT NULL,
  `total_tickets` int(11) NOT NULL,
  `available_tickets` int(11) NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `image_url` varchar(500) DEFAULT NULL,
  `category_id` int(11) DEFAULT NULL,
  `organizer_id` int(11) DEFAULT NULL,
  `status` enum('pending','approved','rejected','active','cancelled','completed') DEFAULT 'pending',
  `approved_at` timestamp NULL DEFAULT NULL,
  `approved_by` int(11) DEFAULT NULL,
  `rejection_reason` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `events`
--

INSERT INTO `events` (`id`, `title`, `description`, `event_date`, `venue_id`, `total_tickets`, `available_tickets`, `price`, `image_url`, `category_id`, `organizer_id`, `status`, `approved_at`, `approved_by`, `rejection_reason`, `created_at`, `updated_at`) VALUES
(1, 'Hòa nhạc Mùa Xuân 2025', 'Đêm nhạc tuyệt vời với các ca sĩ nổi tiếng. Chương trình đặc sắc với những bản nhạc xuân bất hủ.', '2025-03-15 19:00:00', 1, 500, 498, 500000.00, 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4', 1, 1, 'approved', '2026-01-12 00:10:39', NULL, NULL, '2026-01-12 00:10:39', '2026-03-05 11:20:16'),
(2, 'Festival Âm Nhạc Quốc Tế 2025', 'Lễ hội âm nhạc đa thể loại với nghệ sĩ quốc tế. 3 ngày đêm với hơn 50 nghệ sĩ biểu diễn.', '2025-04-20 18:00:00', 2, 10000, 10000, 800000.00, 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea', 2, 2, 'approved', '2026-01-12 00:10:39', NULL, NULL, '2026-01-12 00:10:39', '2026-03-05 11:20:16'),
(3, 'Đêm Nhạc Acoustic Cuối Tuần', 'Buổi biểu diễn acoustic thân mật tại không gian nhỏ xinh. Thưởng thức cà phê và âm nhạc.', '2025-02-28 20:00:00', 3, 100, 99, 200000.00, 'https://images.unsplash.com/photo-1511735111819-9a3f7709049c', 3, 3, 'approved', '2026-01-12 00:10:39', NULL, NULL, '2026-01-12 00:10:39', '2026-03-05 11:20:16'),
(4, 'Liveshow Nhạc Trẻ - Summer Vibes', 'Đêm nhạc sôi động với các bản hit mới nhất của các ca sĩ trẻ. EDM, Pop, Rap.', '2025-05-10 19:30:00', 4, 2000, 1998, 600000.00, 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3', 4, 3, 'approved', '2026-01-12 00:10:39', NULL, NULL, '2026-01-12 00:10:39', '2026-03-05 11:20:16'),
(5, 'Hòa nhạc Giao hưởng - Beethoven Night', 'Đêm nhạc cổ điển với dàn nhạc giao hưởng. Trình diễn các tác phẩm nổi tiếng của Beethoven.', '2025-06-05 20:00:00', 1, 500, 500, 700000.00, 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6', 5, 2, 'approved', '2026-01-12 00:10:39', NULL, NULL, '2026-01-12 00:10:39', '2026-03-05 11:20:16'),
(6, 'Rock Fest Vietnam 2025', 'Lễ hội nhạc Rock lớn nhất Việt Nam. Tập hợp các ban nhạc rock hàng đầu.', '2025-07-15 16:00:00', 2, 8000, 8000, 900000.00, 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee', 6, 4, 'approved', '2026-01-12 00:10:39', NULL, NULL, '2026-01-12 00:10:39', '2026-03-05 11:20:16'),
(7, 'Jazz Night Under The Stars', 'Đêm nhạc Jazz ngoài trời với không gian lãng mạn. Thưởng thức rượu vang và jazz.', '2025-08-20 19:00:00', 3, 150, 150, 450000.00, 'https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f', 7, 3, 'approved', '2026-01-12 00:10:39', NULL, NULL, '2026-01-12 00:10:39', '2026-03-05 11:20:16'),
(8, 'Đại nhạc hội Tết 2025', 'Chương trình đặc biệt chào đón năm mới với line-up ca sĩ đình đám. Show diễn hoành tráng.', '2025-02-01 20:00:00', 5, 800, 800, 1200000.00, 'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec', 1, 1, 'approved', '2026-01-12 00:10:39', NULL, NULL, '2026-01-12 00:10:39', '2026-03-05 11:20:16'),
(9, 'Indie Music Festival', 'Lễ hội âm nhạc indie với các nghệ sĩ underground. Khám phá âm nhạc độc lập Việt Nam.', '2025-09-10 17:00:00', 4, 1500, 1500, 350000.00, 'https://images.unsplash.com/photo-1506157786151-b8491531f063', 2, 4, 'approved', '2026-01-12 00:10:39', NULL, NULL, '2026-01-12 00:10:39', '2026-03-05 11:20:16'),
(10, 'Piano Concert - Chopin Masterpieces', 'Đêm nhạc piano solo với các tác phẩm kinh điển của Chopin. Nghệ sĩ piano quốc tế biểu diễn.', '2025-10-15 19:30:00', 1, 400, 400, 550000.00, 'https://images.unsplash.com/photo-1520523839897-bd0b52f945a0', 5, 2, 'approved', '2026-01-12 00:10:39', NULL, NULL, '2026-01-12 00:10:39', '2026-03-05 11:20:16'),
(11, 'hom ay', 'th', '2026-07-07 14:02:00', 5, 1, 1, 0.00, NULL, 2, 4, 'approved', '2026-03-05 11:25:15', 1, NULL, '2026-03-05 11:24:56', '2026-03-20 14:20:27'),
(12, 't', 't', '2026-09-09 14:22:00', 5, 123, 122, 0.00, NULL, 2, 4, 'approved', '2026-03-10 19:01:25', 1, NULL, '2026-03-10 19:00:42', '2026-03-20 04:04:19'),
(13, 'ty', 'ty', '2026-06-06 14:22:00', 1, 6, 4, 0.00, NULL, 2, 6, 'approved', '2026-03-10 19:51:16', 1, NULL, '2026-03-10 19:50:58', '2026-03-20 14:20:31'),
(14, 'yt', '2', '2026-07-07 10:54:00', 3, 6, 6, 1000.00, NULL, 1, 7, 'approved', '2026-03-12 08:49:26', 1, NULL, '2026-03-12 08:48:34', '2026-03-12 08:51:35'),
(16, 'tuab', NULL, '2026-09-09 19:07:00', 4, 15, 15, 0.00, NULL, 5, 7, 'approved', '2026-03-12 09:09:21', 1, NULL, '2026-03-12 09:08:03', '2026-03-20 07:40:08'),
(17, 'abc', 'abc', '8888-08-08 20:08:00', 1, 10, 10, 0.00, NULL, 3, 7, 'approved', '2026-03-21 04:29:08', 1, NULL, '2026-03-21 04:29:01', '2026-03-30 09:25:36'),
(18, 'tuan', 'tu', '7444-07-07 01:12:00', 3, 50, 50, 5000.00, NULL, 2, 7, 'approved', '2026-03-24 08:39:12', 1, NULL, '2026-03-24 08:39:04', '2026-03-24 08:39:31'),
(19, 'tu', '123', '2026-12-12 00:00:00', 5, 5, 5, 5000.00, NULL, 2, 7, 'approved', '2026-03-30 09:17:43', 1, NULL, '2026-03-24 08:40:28', '2026-03-30 09:17:43'),
(20, 'concert', 't', '2027-02-22 14:22:00', 5, 6, 6, 1000.00, NULL, 3, 7, 'approved', '2026-03-30 09:27:57', 1, NULL, '2026-03-30 09:27:18', '2026-03-30 10:33:24'),
(21, 'concert', '123', '1970-01-01 00:00:00', 4, 12, 12, 0.00, NULL, 7, 8, 'approved', '2026-03-30 10:32:42', 1, NULL, '2026-03-30 10:32:21', '2026-03-30 10:35:14');

--
-- Triggers `events`
--
DELIMITER $$
CREATE TRIGGER `before_event_update` BEFORE UPDATE ON `events` FOR EACH ROW BEGIN
    IF NEW.available_tickets < 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Available tickets cannot be negative';
    END IF;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `organizers`
--

CREATE TABLE `organizers` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `website` varchar(255) DEFAULT NULL,
  `logo_url` varchar(500) DEFAULT NULL,
  `approval_status` enum('pending','approved','rejected') DEFAULT 'pending',
  `approved_at` timestamp NULL DEFAULT NULL,
  `rejection_reason` text DEFAULT NULL,
  `approved_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `user_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `organizers`
--

INSERT INTO `organizers` (`id`, `name`, `email`, `phone`, `description`, `website`, `logo_url`, `approval_status`, `approved_at`, `rejection_reason`, `approved_by`, `created_at`, `user_id`) VALUES
(1, 'Công ty Tổ chức Sự kiện ABC', 'info@abcevents.vn', '1900 1234', 'Đơn vị tổ chức sự kiện hàng đầu Việt Nam', 'https://abcevents.vn', 'https://abcevents.vn/logo.png', 'approved', '2026-01-12 00:10:39', NULL, NULL, '2026-01-12 00:10:39', NULL),
(2, 'Trung tâm Văn hóa Hà Nội', 'contact@vanhoahanoi.vn', '024 3825 1111', 'Tổ chức các hoạt động văn hóa nghệ thuật', 'https://vanhoahanoi.vn', 'https://vanhoahanoi.vn/logo.png', 'approved', '2026-01-12 00:10:39', NULL, NULL, '2026-01-12 00:10:39', NULL),
(3, 'Công ty Giải trí Sài Gòn', 'events@saigonentertainment.vn', '028 3823 9999', 'Chuyên tổ chức show diễn tại TP.HCM', 'https://saigonentertainment.vn', 'https://saigonentertainment.vn/logo.png', 'approved', '2026-01-12 00:10:39', NULL, NULL, '2026-01-12 00:10:39', NULL),
(4, 'Vietnam Music Entertainment', 'info@vme.vn', '1900 5678', 'Công ty giải trí và tổ chức sự kiện âm nhạc', 'https://vme.vn', 'https://vme.vn/logo.png', 'approved', '2026-01-12 00:10:39', NULL, NULL, '2026-01-12 00:10:39', NULL),
(6, 'tuantienti', 'tuantienti@example.local', '123', NULL, 'https://tuan.vn', NULL, 'approved', '2026-03-10 18:31:59', NULL, 1, '2026-03-10 18:30:59', 13),
(7, 'tinh', 'tinh@example.local', NULL, NULL, NULL, NULL, 'approved', '2026-03-11 00:26:11', NULL, 1, '2026-03-10 19:46:38', 11),
(8, 'tinhtientivi', 'tinhtientivi@example.local', '1231231231', NULL, 'https://tuttttan.vn', NULL, 'approved', '2026-03-30 10:32:37', NULL, 1, '2026-03-30 10:31:42', 15);

-- --------------------------------------------------------

--
-- Table structure for table `ticket_bookings`
--

CREATE TABLE `ticket_bookings` (
  `id` int(11) NOT NULL,
  `booking_id` int(11) NOT NULL,
  `ticket_type_id` int(11) NOT NULL,
  `quantity` int(11) NOT NULL,
  `price_per_ticket` decimal(10,2) NOT NULL,
  `subtotal` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `ticket_bookings`
--

INSERT INTO `ticket_bookings` (`id`, `booking_id`, `ticket_type_id`, `quantity`, `price_per_ticket`, `subtotal`) VALUES
(2, 16, 1, 1, 2000.00, 2000.00),
(3, 18, 1, 1, 2000.00, 2000.00),
(5, 23, 2, 1, 0.00, 0.00),
(6, 24, 3, 1, 90000.00, 90000.00),
(7, 25, 2, 1, 0.00, 0.00),
(8, 26, 4, 1, 1000.00, 1000.00);

-- --------------------------------------------------------

--
-- Table structure for table `ticket_types`
--

CREATE TABLE `ticket_types` (
  `id` int(11) NOT NULL,
  `event_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `price` decimal(10,2) NOT NULL,
  `quantity` int(11) NOT NULL,
  `available_quantity` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `ticket_types`
--

INSERT INTO `ticket_types` (`id`, `event_id`, `name`, `description`, `price`, `quantity`, `available_quantity`, `created_at`) VALUES
(1, 16, 'vip', NULL, 2000.00, 5, 0, '2026-03-12 09:08:03'),
(2, 17, 'thường', 'deo', 0.00, 10, 8, '2026-03-21 04:29:01'),
(3, 18, 'vé thường', NULL, 90000.00, 6, 5, '2026-03-24 08:39:04'),
(4, 20, 'vip', NULL, 1000.00, 5, 4, '2026-03-30 09:27:18'),
(5, 21, 'vip', NULL, 500.00, 9, 9, '2026-03-30 10:32:21');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `full_name` varchar(100) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `role` enum('admin','user','organizer') DEFAULT 'user',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `username`, `email`, `password`, `full_name`, `phone`, `role`, `created_at`) VALUES
(1, 'tuan', 'luquoctuan2006@gmail.com', '$2b$10$s/t2eX7ReHh8mARygrGyjucNQQJhPABuVyRsphAEU4LD12oWj5l2G', 'tuan', '123456789', 'admin', '2026-01-12 00:44:48'),
(2, 'user1', 'user1@example.com', '$2b$10$rQZ9jX1qN5vH8K3mY2L6/.wGZxJ9vKp8LqM3xN4yR5fT6pQ7sU8v2', 'Nguyễn Văn A', '0123456789', 'user', '2026-01-12 00:10:39'),
(3, 'user2', 'user2@example.com', '$2b$10$rQZ9jX1qN5vH8K3mY2L6/.wGZxJ9vKp8LqM3xN4yR5fT6pQ7sU8v2', 'Trần Thị B', '0987654321', 'user', '2026-01-12 00:10:39'),
(4, 'user3', 'user3@example.com', '$2b$10$rQZ9jX1qN5vH8K3mY2L6/.wGZxJ9vKp8LqM3xN4yR5fT6pQ7sU8v2', 'Lê Văn C', '0912345678', 'user', '2026-01-12 00:10:39'),
(7, 'tu', 'tu@example.local', '$2b$10$iV2va4K3K2dKb5tkJA7yGerZs0jZJJo4HnYTK1s1XgHl201G8eaKi', 'tu', NULL, 'user', '2026-01-12 01:07:58'),
(11, 'tinh', 'tinh@example.local', '$2b$10$UtSudHDoxWlFvN1IKebHw.UdK7avw/3hs.6h4Fn2q9CQjzXD6MtH2', 'tinh', NULL, 'organizer', '2026-01-15 00:04:50'),
(12, 'tinht', 'tinhti@example.local', '$2b$10$Ilz5JFAyA6z5jNm2x.sRg.VH.0xJM.C1bmF4xH2ZYUJphhYpyEsI6', 'tinh', NULL, 'organizer', '2026-03-05 11:27:03'),
(13, 'tutien ti', 'tuan@example.local', '$2b$10$mjwwJUqunLLu0qpgEwEIOOPHORX9LU7WSi4vjwgIzohXAwVo2Gl8u', 'tuan', NULL, 'organizer', '2026-03-10 18:30:59'),
(14, 'tuanana', 'tu22an@example.local', '$2b$10$z8qOdl1xEdN1vGBXbVoQ4eeYLtA4Jnft0IlV4uyUMTxFuazMGdq2C', 'tuan', '1', 'user', '2026-03-30 09:17:10'),
(15, 'tinhtienti', 'tinhtien@example.local', '$2b$10$yVPpYbSlkpBF4Dou9Co5Ru23h2JOZk1j02YWVs2NAPoNOILHY8Uqi', 't', '123123123', 'organizer', '2026-03-30 10:31:42'),
(16, 'tutn', 'tuanrtrt@example.local', '$2b$10$hOCcbWCMUT1pUGnNzpZC6O9FVwiWOJEMy7wKqBnfKjxkGP/23tzo2', 't', NULL, 'user', '2026-03-30 10:35:47');

-- --------------------------------------------------------

--
-- Table structure for table `venues`
--

CREATE TABLE `venues` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `address` text NOT NULL,
  `city` varchar(100) DEFAULT NULL,
  `capacity` int(11) DEFAULT NULL,
  `amenities` text DEFAULT NULL,
  `map_url` varchar(500) DEFAULT NULL,
  `contact_phone` varchar(20) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `venues`
--

INSERT INTO `venues` (`id`, `name`, `address`, `city`, `capacity`, `amenities`, `map_url`, `contact_phone`, `created_at`) VALUES
(1, 'Nhà hát Lớn Hà Nội', 'Số 1 Tràng Tiền, Hoàn Kiếm', 'Hà Nội', 500, 'Máy lạnh, Wifi, Chỗ đậu xe', 'https://maps.google.com/nha-hat-lon-ha-noi', '024 3825 4896', '2026-01-12 00:10:38'),
(2, 'Sân vận động Mỹ Đình', 'Đường Lê Đức Thọ, Nam Từ Liêm', 'Hà Nội', 10000, 'Sân cỏ, Ghế ngồi, Hệ thống âm thanh', 'https://maps.google.com/san-van-dong-my-dinh', '024 3765 4321', '2026-01-12 00:10:38'),
(3, 'Cà phê Sân Khấu', '45 Nguyễn Du, Quận 1', 'TP.HCM', 100, 'Không gian mở, Âm thanh chất lượng', 'https://maps.google.com/ca-phe-san-khau', '028 3823 4567', '2026-01-12 00:10:38'),
(4, 'Nhà Văn Hóa Thanh Niên TP.HCM', 'Số 4 Phạm Ngọc Thạch, Quận 1', 'TP.HCM', 2000, 'Máy lạnh, Sân khấu hiện đại', 'https://maps.google.com/nha-van-hoa-thanh-nien', '028 3822 5678', '2026-01-12 00:10:38'),
(5, 'Cung Văn Hóa Lao Động', 'Số 55 Nguyễn Du, Hai Bà Trưng', 'Hà Nội', 800, 'Hội trường lớn, Âm thanh chuyên nghiệp', 'https://maps.google.com/cung-van-hoa-lao-dong', '024 3943 3736', '2026-01-12 00:10:38');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `bookings`
--
ALTER TABLE `bookings`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_bookings_user` (`user_id`),
  ADD KEY `fk_bookings_event` (`event_id`);

--
-- Indexes for table `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `contacts`
--
ALTER TABLE `contacts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_contacts_user` (`user_id`),
  ADD KEY `fk_contacts_responded_by` (`responded_by`);

--
-- Indexes for table `events`
--
ALTER TABLE `events`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_events_venue` (`venue_id`),
  ADD KEY `fk_events_category` (`category_id`),
  ADD KEY `fk_events_organizer` (`organizer_id`),
  ADD KEY `fk_events_approved_by` (`approved_by`);

--
-- Indexes for table `organizers`
--
ALTER TABLE `organizers`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_organizers_user` (`user_id`),
  ADD KEY `fk_organizers_approved_by` (`approved_by`);

--
-- Indexes for table `ticket_bookings`
--
ALTER TABLE `ticket_bookings`
  ADD PRIMARY KEY (`id`),
  ADD KEY `booking_id` (`booking_id`),
  ADD KEY `ticket_type_id` (`ticket_type_id`);

--
-- Indexes for table `ticket_types`
--
ALTER TABLE `ticket_types`
  ADD PRIMARY KEY (`id`),
  ADD KEY `event_id` (`event_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `venues`
--
ALTER TABLE `venues`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `bookings`
--
ALTER TABLE `bookings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=27;

--
-- AUTO_INCREMENT for table `categories`
--
ALTER TABLE `categories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `contacts`
--
ALTER TABLE `contacts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `events`
--
ALTER TABLE `events`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;

--
-- AUTO_INCREMENT for table `organizers`
--
ALTER TABLE `organizers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `ticket_bookings`
--
ALTER TABLE `ticket_bookings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `ticket_types`
--
ALTER TABLE `ticket_types`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT for table `venues`
--
ALTER TABLE `venues`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `bookings`
--
ALTER TABLE `bookings`
  ADD CONSTRAINT `fk_bookings_event` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_bookings_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `contacts`
--
ALTER TABLE `contacts`
  ADD CONSTRAINT `fk_contacts_responded_by` FOREIGN KEY (`responded_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_contacts_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `events`
--
ALTER TABLE `events`
  ADD CONSTRAINT `fk_events_approved_by` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_events_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_events_organizer` FOREIGN KEY (`organizer_id`) REFERENCES `organizers` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_events_venue` FOREIGN KEY (`venue_id`) REFERENCES `venues` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `organizers`
--
ALTER TABLE `organizers`
  ADD CONSTRAINT `fk_organizers_approved_by` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_organizers_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `ticket_bookings`
--
ALTER TABLE `ticket_bookings`
  ADD CONSTRAINT `ticket_bookings_ibfk_1` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `ticket_bookings_ibfk_2` FOREIGN KEY (`ticket_type_id`) REFERENCES `ticket_types` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `ticket_types`
--
ALTER TABLE `ticket_types`
  ADD CONSTRAINT `ticket_types_ibfk_1` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

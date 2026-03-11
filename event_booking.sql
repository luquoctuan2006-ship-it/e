-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Mar 11, 2026 at 02:15 AM
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
        COUNT(DISTINCT b.id) as total_bookings,
        COALESCE(AVG(r.rating), 0) as avg_rating,
        COUNT(DISTINCT r.id) as total_reviews
    FROM events e
    LEFT JOIN bookings b ON e.id = b.event_id AND b.status = 'confirmed'
    LEFT JOIN reviews r ON e.id = r.event_id
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
        v.city,
        p.payment_method,
        p.status as payment_status,
        p.transaction_code,
        tt.name as ticket_type_name,
        tt.price as ticket_type_price
    FROM bookings b
    JOIN events e ON b.event_id = e.id
    JOIN venues v ON e.venue_id = v.id
    LEFT JOIN ticket_types tt ON b.ticket_type_id = tt.id
    LEFT JOIN payments p ON b.id = p.booking_id
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
  `user_id` int(11) NOT NULL,
  `event_id` int(11) NOT NULL,
  `ticket_type_id` int(11) DEFAULT NULL,
  `quantity` int(11) NOT NULL,
  `total_price` decimal(10,2) NOT NULL,
  `booking_date` timestamp NOT NULL DEFAULT current_timestamp(),
  `status` enum('confirmed','cancelled','pending') DEFAULT 'pending'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `bookings`
--

INSERT INTO `bookings` (`id`, `user_id`, `event_id`, `ticket_type_id`, `quantity`, `total_price`, `booking_date`, `status`) VALUES
(1, 2, 1, NULL, 2, 1000000.00, '2025-01-10 07:30:00', 'confirmed'),
(2, 2, 3, NULL, 1, 200000.00, '2025-01-11 03:15:00', 'confirmed'),
(3, 3, 2, NULL, 4, 3200000.00, '2025-01-09 09:45:00', 'pending'),
(4, 3, 4, NULL, 2, 1200000.00, '2025-01-12 02:20:00', 'confirmed'),
(5, 4, 1, NULL, 1, 500000.00, '2025-01-08 04:00:00', 'cancelled'),
(6, 4, 8, NULL, 3, 3600000.00, '2025-01-11 08:30:00', 'confirmed'),
(7, 5, 3, NULL, 2, 400000.00, '2025-01-10 06:45:00', 'confirmed');

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
DELIMITER $$
CREATE TRIGGER `after_booking_insert_ticket` AFTER INSERT ON `bookings` FOR EACH ROW BEGIN
    IF NEW.ticket_type_id IS NOT NULL THEN
        UPDATE ticket_types 
        SET available_tickets = available_tickets - NEW.quantity
        WHERE id = NEW.ticket_type_id;
    ELSE
        UPDATE events 
        SET available_tickets = available_tickets - NEW.quantity
        WHERE id = NEW.event_id;
    END IF;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `after_booking_update_ticket` AFTER UPDATE ON `bookings` FOR EACH ROW BEGIN
    IF OLD.status != 'cancelled' AND NEW.status = 'cancelled' THEN
        IF NEW.ticket_type_id IS NOT NULL THEN
            UPDATE ticket_types 
            SET available_tickets = available_tickets + NEW.quantity
            WHERE id = NEW.ticket_type_id;
        ELSE
            UPDATE events 
            SET available_tickets = available_tickets + NEW.quantity
            WHERE id = NEW.event_id;
        END IF;
    END IF;
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
(11, 'hom ay', 'th', '2026-07-07 14:02:00', 5, 1, 1, 0.00, NULL, 2, 4, 'approved', '2026-03-05 11:25:15', 1, NULL, '2026-03-05 11:24:56', '2026-03-05 11:25:15'),
(12, 't', 't', '2026-09-09 14:22:00', 5, 123, 123, 0.00, NULL, 2, 4, 'approved', '2026-03-10 19:01:25', 1, NULL, '2026-03-10 19:00:42', '2026-03-10 19:01:25'),
(13, 'ty', 'ty', '2026-06-06 14:22:00', 1, 6, 6, 0.00, NULL, 2, 6, 'approved', '2026-03-10 19:51:16', 1, NULL, '2026-03-10 19:50:58', '2026-03-10 19:51:16');

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
(7, 'tinh', 'tinh@example.local', NULL, NULL, NULL, NULL, 'approved', '2026-03-11 00:26:11', NULL, 1, '2026-03-10 19:46:38', 11);

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
(5, 'user4', 'user4@example.com', '$2b$10$rQZ9jX1qN5vH8K3mY2L6/.wGZxJ9vKp8LqM3xN4yR5fT6pQ7sU8v2', 'Phạm Thị D', '0909123456', 'user', '2026-01-12 00:10:39'),
(7, 'tu', 'tu@example.local', '$2b$10$iV2va4K3K2dKb5tkJA7yGerZs0jZJJo4HnYTK1s1XgHl201G8eaKi', 'tu', NULL, 'user', '2026-01-12 01:07:58'),
(11, 'tinh', 'tinh@example.local', '$2b$10$UtSudHDoxWlFvN1IKebHw.UdK7avw/3hs.6h4Fn2q9CQjzXD6MtH2', 'tinh', NULL, 'organizer', '2026-01-15 00:04:50'),
(12, 'tinht', 'tinhti@example.local', '$2b$10$Ilz5JFAyA6z5jNm2x.sRg.VH.0xJM.C1bmF4xH2ZYUJphhYpyEsI6', 'tinh', NULL, 'organizer', '2026-03-05 11:27:03'),
(13, 'tutien ti', 'tuan@example.local', '$2b$10$mjwwJUqunLLu0qpgEwEIOOPHORX9LU7WSi4vjwgIzohXAwVo2Gl8u', 'tuan', NULL, 'organizer', '2026-03-10 18:30:59');

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

-- --------------------------------------------------------

--
-- Stand-in structure for view `view_event_details`
-- (See below for the actual view)
--
CREATE TABLE `view_event_details` (
);

-- --------------------------------------------------------

--
-- Structure for view `view_event_details`
--
DROP TABLE IF EXISTS `view_event_details`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `view_event_details`  AS SELECT `e`.`id` AS `id`, `e`.`title` AS `title`, `e`.`description` AS `description`, `e`.`event_date` AS `event_date`, `e`.`total_tickets` AS `total_tickets`, `e`.`available_tickets` AS `available_tickets`, `e`.`price` AS `price`, `e`.`image_url` AS `image_url`, `e`.`status` AS `status`, `v`.`name` AS `venue_name`, `v`.`address` AS `venue_address`, `v`.`city` AS `city`, `c`.`name` AS `category_name`, `c`.`slug` AS `category_slug`, `o`.`name` AS `organizer_name`, coalesce(avg(`r`.`rating`),0) AS `avg_rating`, count(distinct `r`.`id`) AS `review_count`, count(distinct `b`.`id`) AS `booking_count`, `e`.`created_at` AS `created_at`, `e`.`updated_at` AS `updated_at` FROM (((((`events` `e` left join `venues` `v` on(`e`.`venue_id` = `v`.`id`)) left join `categories` `c` on(`e`.`category_id` = `c`.`id`)) left join `organizers` `o` on(`e`.`organizer_id` = `o`.`id`)) left join `reviews` `r` on(`e`.`id` = `r`.`event_id`)) left join `bookings` `b` on(`e`.`id` = `b`.`event_id` and `b`.`status` = 'confirmed')) GROUP BY `e`.`id` ;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `bookings`
--
ALTER TABLE `bookings`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_bookings_user` (`user_id`),
  ADD KEY `idx_bookings_event` (`event_id`),
  ADD KEY `idx_bookings_status` (`status`),
  ADD KEY `idx_ticket_type` (`ticket_type_id`);

--
-- Indexes for table `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `slug` (`slug`),
  ADD KEY `idx_categories_slug` (`slug`);

--
-- Indexes for table `events`
--
ALTER TABLE `events`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_events_date` (`event_date`),
  ADD KEY `idx_events_venue` (`venue_id`),
  ADD KEY `idx_events_category` (`category_id`),
  ADD KEY `idx_events_organizer` (`organizer_id`),
  ADD KEY `idx_events_status` (`status`);

--
-- Indexes for table `organizers`
--
ALTER TABLE `organizers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_id` (`user_id`),
  ADD KEY `idx_organizers_approval_status` (`approval_status`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `idx_users_email` (`email`),
  ADD KEY `idx_users_username` (`username`);

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `categories`
--
ALTER TABLE `categories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `events`
--
ALTER TABLE `events`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `organizers`
--
ALTER TABLE `organizers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

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
  ADD CONSTRAINT `bookings_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `bookings_ibfk_2` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_bookings_ticket_type` FOREIGN KEY (`ticket_type_id`) REFERENCES `ticket_types` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `events`
--
ALTER TABLE `events`
  ADD CONSTRAINT `events_ibfk_1` FOREIGN KEY (`venue_id`) REFERENCES `venues` (`id`),
  ADD CONSTRAINT `events_ibfk_2` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `events_ibfk_3` FOREIGN KEY (`organizer_id`) REFERENCES `organizers` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `organizers`
--
ALTER TABLE `organizers`
  ADD CONSTRAINT `organizers_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

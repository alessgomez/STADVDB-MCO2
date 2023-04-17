CREATE TABLE `movies` (
  `id` int NOT NULL DEFAULT '0',
  `title` varchar(100) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci DEFAULT NULL,
  `year` int DEFAULT NULL,
  `rating` float DEFAULT NULL,
  `genre` varchar(100) DEFAULT NULL,
  `director` varchar(201) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci DEFAULT NULL,
  `actor` varchar(201) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci DEFAULT NULL,
  `lastUpdated` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
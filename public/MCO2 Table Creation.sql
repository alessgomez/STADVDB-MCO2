CREATE TABLE `movie` (
  `id` int NOT NULL DEFAULT '0',
  `title` varchar(100) CHARACTER SET utf8mb3 DEFAULT NULL,
  `year` int DEFAULT NULL,
  `rating` float DEFAULT NULL,
  `genre` varchar(100) CHARACTER SET utf8mb3 NOT NULL,
  `director` varchar(201) CHARACTER SET utf8mb3 DEFAULT NULL,
  `actor` varchar(201) CHARACTER SET utf8mb3 DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `newmovie` (
  `id` int NOT NULL DEFAULT '0',
  `title` varchar(100) CHARACTER SET utf8mb3 DEFAULT NULL,
  `year` int DEFAULT NULL,
  `rating` float DEFAULT NULL,
  `genre` varchar(100) CHARACTER SET utf8mb3 NOT NULL,
  `director` varchar(201) CHARACTER SET utf8mb3 DEFAULT NULL,
  `actor` varchar(201) CHARACTER SET utf8mb3 DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `oldmovie` (
  `id` int NOT NULL DEFAULT '0',
  `title` varchar(100) CHARACTER SET utf8mb3 DEFAULT NULL,
  `year` int DEFAULT NULL,
  `rating` float DEFAULT NULL,
  `genre` varchar(100) CHARACTER SET utf8mb3 NOT NULL,
  `director` varchar(201) CHARACTER SET utf8mb3 DEFAULT NULL,
  `actor` varchar(201) CHARACTER SET utf8mb3 DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


CREATE TABLE `log` (
  `log_id` int NOT NULL AUTO_INCREMENT,
  `transaction_no` int DEFAULT NULL,
  `row_no` int DEFAULT NULL,
  `col_name` varchar(45) DEFAULT NULL,
  `old_value` varchar(100) DEFAULT NULL,
  `new_value` varchar(100) DEFAULT NULL,
  `query` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`log_id`)
) ENGINE=InnoDB AUTO_INCREMENT=40 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
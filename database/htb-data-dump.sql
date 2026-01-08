DROP SCHEMA IF EXISTS `htb_universe`;
CREATE SCHEMA `htb_universe`;
USE `htb_universe`;

-- MySQL dump 10.13  Distrib 8.0.44, for Linux (x86_64)
--
-- Host: localhost    Database: htb_universe
-- ------------------------------------------------------
-- Server version	8.0.44-0ubuntu0.24.04.2

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `account`
--

DROP TABLE IF EXISTS `account`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `account` (
  `id` varchar(36) NOT NULL,
  `accountId` text NOT NULL,
  `providerId` text NOT NULL,
  `userId` varchar(36) NOT NULL,
  `accessToken` text,
  `refreshToken` text,
  `idToken` text,
  `accessTokenExpiresAt` timestamp(3) NULL DEFAULT NULL,
  `refreshTokenExpiresAt` timestamp(3) NULL DEFAULT NULL,
  `scope` text,
  `password` text,
  `createdAt` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` timestamp(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `account_userId_idx` (`userId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `account`
--

LOCK TABLES `account` WRITE;
/*!40000 ALTER TABLE `account` DISABLE KEYS */;
INSERT INTO `account` VALUES ('4FudEc85Y9FESONpJIq9TidsAgNK0WSh','obWEAb7GHVxQYBajDmfc9zoIt4pBQL0F','credential','obWEAb7GHVxQYBajDmfc9zoIt4pBQL0F',NULL,NULL,NULL,NULL,NULL,NULL,'9aa6fa7b2c98f06e8db2e837dfb7c9ec:31fe206be6dbeda652e04c16e1a97fb2a704b158d7c7aab96de9bd1b0af1f399766c76c4d416c85ba4241d993821bdccd89859b1d70b6204d79b70226ac0e7b2','2026-01-07 21:22:15.206','2026-01-07 21:22:15.206'),('QIIjH5Kbl2vHw0gCdXV5Wrk7V4eRSL89','GqNQlkyjdQRf2HVpOkgwpADTW3UWFr7Y','credential','GqNQlkyjdQRf2HVpOkgwpADTW3UWFr7Y',NULL,NULL,NULL,NULL,NULL,NULL,'cbc49e8986f8d31571088c7e72c06a2f:f9840a79c7a52fb944623de13a2e02e858f7d89e1596d0d0b341a867286db7e126e9c3f839a647746a9c64304440bb8f502762840895937635a184dfcdeeb337','2026-01-07 21:21:02.805','2026-01-07 21:21:02.805');
/*!40000 ALTER TABLE `account` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `exams`
--

DROP TABLE IF EXISTS `exams`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `exams` (
  `id` int NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `logo` varchar(500) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `exams`
--

LOCK TABLES `exams` WRITE;
/*!40000 ALTER TABLE `exams` DISABLE KEYS */;
INSERT INTO `exams` VALUES (1,'HTB Certified Penetration Testing Specialist','https://academy.hackthebox.com/storage/exam_badges/312krCbLBwwnMN1uaOXohoEjSE6Fb8ljaXi7B4zL.png'),(2,'HTB Certified Web Exploitation Specialist','https://academy.hackthebox.com/storage/exam_badges/ocO4em7oa7zpInAA4aUCLFyQU6AZ2GqdPFqoPWRw.png'),(3,'HTB Certified Active Directory Pentesting Expert','https://academy.hackthebox.com/storage/exam_badges/uBW2JZNwaRtkErJKdnFUW7xwU41DNPUm6hPaEtwh.png'),(4,'HTB Certified Defensive Security Analyst','https://academy.hackthebox.com/storage/exam_badges/Ub2I1qAN1BOVsK2de0ujslt4oGjhceaZeWRRicge.png'),(5,'HTB Certified Junior Cybersecurity Associate','https://academy.hackthebox.com/storage/exam_badges/OHKlaJqQ2745gMfWdXJA1zCE5ExAWK4esXugwMxh.png'),(6,'HTB Certified Web Exploitation Expert','https://academy.hackthebox.com/storage/exam_badges/4fD6SYsBGohDZAs5AsAacJlmn1OTtykViXwoi2sx.png');
/*!40000 ALTER TABLE `exams` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `machine_areas_of_interest`
--

DROP TABLE IF EXISTS `machine_areas_of_interest`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `machine_areas_of_interest` (
  `machine_id` int NOT NULL,
  `area_of_interest` varchar(255) NOT NULL,
  PRIMARY KEY (`machine_id`,`area_of_interest`),
  CONSTRAINT `machine_areas_of_interest_ibfk_1` FOREIGN KEY (`machine_id`) REFERENCES `machines` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `machine_areas_of_interest`
--

LOCK TABLES `machine_areas_of_interest` WRITE;
/*!40000 ALTER TABLE `machine_areas_of_interest` DISABLE KEYS */;
INSERT INTO `machine_areas_of_interest` VALUES (1,'Web'),(2,'Network'),(3,'Web'),(4,'Web'),(5,'Web'),(6,'Web'),(7,'Web'),(8,'Web'),(9,'Web'),(10,'Web'),(11,'Web'),(12,'Network'),(13,'Network'),(14,'Network'),(15,'Web'),(16,'Network'),(17,'Web'),(18,'Network'),(19,'Web'),(20,'Network'),(21,'Web'),(22,'Web'),(23,'Web'),(24,'Web'),(25,'Web'),(26,'Web'),(27,'Web'),(28,'Web'),(29,'Web'),(30,'Web');
/*!40000 ALTER TABLE `machine_areas_of_interest` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `machine_languages`
--

DROP TABLE IF EXISTS `machine_languages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `machine_languages` (
  `machine_id` int NOT NULL,
  `language` varchar(255) NOT NULL,
  PRIMARY KEY (`machine_id`,`language`),
  CONSTRAINT `machine_languages_ibfk_1` FOREIGN KEY (`machine_id`) REFERENCES `machines` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `machine_languages`
--

LOCK TABLES `machine_languages` WRITE;
/*!40000 ALTER TABLE `machine_languages` DISABLE KEYS */;
INSERT INTO `machine_languages` VALUES (1,'Bash'),(1,'Python'),(2,'Python'),(3,'C#'),(3,'PowerShell'),(4,'Bash'),(4,'PHP'),(5,'PowerShell'),(6,'PHP'),(6,'PowerShell'),(7,'C++'),(8,'C++'),(9,'Bash'),(9,'PHP'),(10,'Bash'),(10,'PHP'),(11,'Bash'),(11,'Python'),(12,'Python'),(13,'PHP'),(14,'Bash'),(14,'Python'),(15,'Bash'),(15,'JavaScript'),(16,'Bash'),(16,'Python'),(17,'PHP'),(18,'C'),(19,'Bash'),(19,'PHP'),(20,'Bash'),(20,'C'),(21,'PHP'),(21,'Python'),(22,'Bash'),(22,'PHP'),(23,'Bash'),(23,'PHP'),(24,'Bash'),(24,'PHP'),(24,'Python'),(25,'Bash'),(25,'PHP'),(26,'Bash'),(26,'PHP'),(27,'Bash'),(27,'PHP'),(28,'Bash'),(28,'Java'),(29,'PHP'),(29,'PowerShell'),(30,'Bash'),(30,'PHP');
/*!40000 ALTER TABLE `machine_languages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `machine_modules`
--

DROP TABLE IF EXISTS `machine_modules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `machine_modules` (
  `machine_id` int NOT NULL,
  `module_id` int NOT NULL,
  PRIMARY KEY (`machine_id`,`module_id`),
  KEY `module_id` (`module_id`),
  CONSTRAINT `machine_modules_ibfk_1` FOREIGN KEY (`machine_id`) REFERENCES `machines` (`id`),
  CONSTRAINT `machine_modules_ibfk_2` FOREIGN KEY (`module_id`) REFERENCES `modules` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `machine_modules`
--

LOCK TABLES `machine_modules` WRITE;
/*!40000 ALTER TABLE `machine_modules` DISABLE KEYS */;
INSERT INTO `machine_modules` VALUES (1,1),(6,1),(19,1),(21,1),(29,1),(30,1),(22,2),(24,2),(26,2),(27,2),(4,4),(17,4),(23,4),(28,4),(4,5),(11,5),(22,5),(24,5),(25,5),(3,6),(9,6),(10,6),(25,6),(27,6),(15,8),(10,11),(12,11),(13,11),(16,11),(17,11),(18,11),(21,11),(23,11),(28,11),(4,12),(9,12),(10,12),(11,12),(14,12),(15,12),(19,12),(20,12),(22,12),(23,12),(24,12),(25,12),(26,12),(27,12),(28,12),(30,12),(3,13),(5,13),(6,13),(7,13),(8,13),(29,13),(1,14),(2,14),(12,14),(13,14),(14,14),(16,14),(18,14),(20,14);
/*!40000 ALTER TABLE `machine_modules` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `machine_vulnerabilities`
--

DROP TABLE IF EXISTS `machine_vulnerabilities`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `machine_vulnerabilities` (
  `machine_id` int NOT NULL,
  `vulnerability_id` int NOT NULL,
  PRIMARY KEY (`machine_id`,`vulnerability_id`),
  KEY `vulnerability_id` (`vulnerability_id`),
  CONSTRAINT `machine_vulnerabilities_ibfk_1` FOREIGN KEY (`machine_id`) REFERENCES `machines` (`id`),
  CONSTRAINT `machine_vulnerabilities_ibfk_2` FOREIGN KEY (`vulnerability_id`) REFERENCES `vulnerabilities` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `machine_vulnerabilities`
--

LOCK TABLES `machine_vulnerabilities` WRITE;
/*!40000 ALTER TABLE `machine_vulnerabilities` DISABLE KEYS */;
INSERT INTO `machine_vulnerabilities` VALUES (22,1),(24,1),(26,1),(27,1),(1,3),(2,3),(3,3),(5,3),(6,3),(7,3),(8,3),(9,3),(11,3),(13,3),(14,3),(15,3),(19,3),(20,3),(21,3),(25,3),(29,3),(4,4),(17,4),(23,4),(28,4),(4,6),(11,6),(22,6),(24,6),(25,6),(3,7),(9,7),(10,7),(25,7),(27,7),(4,8),(13,8),(16,8),(17,8),(18,8),(30,8),(1,9),(2,9),(3,9),(4,9),(6,9),(7,9),(8,9),(14,9),(19,9),(21,9),(29,9),(30,9),(10,10),(12,10),(18,10),(23,10),(28,10),(12,11),(13,11),(16,12),(17,12),(21,12),(27,12),(15,17),(3,18),(5,18),(7,18),(8,18),(9,18),(10,18),(11,18),(14,18),(15,18),(18,18),(19,18),(20,18),(22,18),(23,18),(24,18),(26,18),(28,18),(30,18),(1,19);
/*!40000 ALTER TABLE `machine_vulnerabilities` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `machines`
--

DROP TABLE IF EXISTS `machines`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `machines` (
  `id` int NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `synopsis` text,
  `difficulty` enum('Easy','Medium','Hard','Insane') DEFAULT NULL,
  `os` enum('Windows','Linux','Android','Solaris','OpenBSD','FreeBSD','Other') DEFAULT NULL,
  `url` varchar(500) DEFAULT NULL,
  `image` varchar(500) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `machines`
--

LOCK TABLES `machines` WRITE;
/*!40000 ALTER TABLE `machines` DISABLE KEYS */;
INSERT INTO `machines` VALUES (1,'Lame','An easy-level machine focusing on SMB enumeration and exploitation.','Easy','Linux','https://app.hackthebox.com/machines/1','https://labs.hackthebox.com/storage/avatars/lame.png'),(2,'Legacy','Classic Windows XP machine vulnerable to MS08-067.','Easy','Windows','https://app.hackthebox.com/machines/2','https://labs.hackthebox.com/storage/avatars/legacy.png'),(3,'Devel','FTP misconfiguration leads to remote code execution.','Easy','Windows','https://app.hackthebox.com/machines/3','https://labs.hackthebox.com/storage/avatars/devel.png'),(4,'Beep','Multiple attack vectors including LFI and command injection.','Easy','Linux','https://app.hackthebox.com/machines/4','https://labs.hackthebox.com/storage/avatars/beep.png'),(5,'Optimum','HTTP File Server exploitation and Windows privilege escalation.','Easy','Windows','https://app.hackthebox.com/machines/5','https://labs.hackthebox.com/storage/avatars/optimum.png'),(6,'Bastard','Drupal CMS exploitation leading to Windows compromise.','Medium','Windows','https://app.hackthebox.com/machines/6','https://labs.hackthebox.com/storage/avatars/bastard.png'),(7,'Grandpa','IIS WebDAV vulnerability exploitation.','Easy','Windows','https://app.hackthebox.com/machines/7','https://labs.hackthebox.com/storage/avatars/grandpa.png'),(8,'Granny','Similar to Grandpa with IIS WebDAV vulnerabilities.','Easy','Windows','https://app.hackthebox.com/machines/8','https://labs.hackthebox.com/storage/avatars/granny.png'),(9,'Popcorn','File upload vulnerability and Linux privilege escalation.','Medium','Linux','https://app.hackthebox.com/machines/9','https://labs.hackthebox.com/storage/avatars/popcorn.png'),(10,'Nibbles','Simple web application with file upload and sudo misconfig.','Easy','Linux','https://app.hackthebox.com/machines/10','https://labs.hackthebox.com/storage/avatars/nibbles.png'),(11,'Shocker','Shellshock vulnerability and privilege escalation.','Easy','Linux','https://app.hackthebox.com/machines/11','https://labs.hackthebox.com/storage/avatars/shocker.png'),(12,'Mirai','IoT device with default credentials.','Easy','Linux','https://app.hackthebox.com/machines/12','https://labs.hackthebox.com/storage/avatars/mirai.png'),(13,'Sense','pfSense firewall with default credentials.','Easy','FreeBSD','https://app.hackthebox.com/machines/13','https://labs.hackthebox.com/storage/avatars/sense.png'),(14,'Solidstate','Email service exploitation and restricted shell escape.','Medium','Linux','https://app.hackthebox.com/machines/14','https://labs.hackthebox.com/storage/avatars/solidstate.png'),(15,'Node','Node.js application with deserialization vulnerability.','Medium','Linux','https://app.hackthebox.com/machines/15','https://labs.hackthebox.com/storage/avatars/node.png'),(16,'Valentine','Heartbleed vulnerability exploitation.','Easy','Linux','https://app.hackthebox.com/machines/16','https://labs.hackthebox.com/storage/avatars/valentine.png'),(17,'Poison','LFI vulnerability and VNC exploitation.','Medium','FreeBSD','https://app.hackthebox.com/machines/17','https://labs.hackthebox.com/storage/avatars/poison.png'),(18,'Sunday','Finger enumeration and password cracking.','Easy','Solaris','https://app.hackthebox.com/machines/18','https://labs.hackthebox.com/storage/avatars/sunday.png'),(19,'Tartarsauce','WordPress plugin vulnerability and tar exploitation.','Medium','Linux','https://app.hackthebox.com/machines/19','https://labs.hackthebox.com/storage/avatars/tartarsauce.png'),(20,'Irked','IRC backdoor and steganography.','Easy','Linux','https://app.hackthebox.com/machines/20','https://labs.hackthebox.com/storage/avatars/irked.png'),(21,'Hawk','OpenSSL decryption and Drupal exploitation.','Medium','Linux','https://app.hackthebox.com/machines/21','https://labs.hackthebox.com/storage/avatars/hawk.png'),(22,'Cronos','SQL injection and Laravel exploitation.','Medium','Linux','https://app.hackthebox.com/machines/22','https://labs.hackthebox.com/storage/avatars/cronos.png'),(23,'Nineveh','LFI, port knocking, and privilege escalation.','Medium','Linux','https://app.hackthebox.com/machines/23','https://labs.hackthebox.com/storage/avatars/nineveh.png'),(24,'Jarvis','SQL injection in booking system and systemctl exploitation.','Medium','Linux','https://app.hackthebox.com/machines/24','https://labs.hackthebox.com/storage/avatars/jarvis.png'),(25,'Networked','File upload bypass and command injection.','Easy','Linux','https://app.hackthebox.com/machines/25','https://labs.hackthebox.com/storage/avatars/networked.png'),(26,'Writeup','CMS Made Simple SQLi and PATH hijacking.','Easy','Linux','https://app.hackthebox.com/machines/26','https://labs.hackthebox.com/storage/avatars/writeup.png'),(27,'Magic','Image upload bypass and database credential extraction.','Medium','Linux','https://app.hackthebox.com/machines/27','https://labs.hackthebox.com/storage/avatars/magic.png'),(28,'Tabby','Tomcat LFI and password reuse.','Easy','Linux','https://app.hackthebox.com/machines/28','https://labs.hackthebox.com/storage/avatars/tabby.png'),(29,'Buff','Gym Management System RCE and port forwarding.','Easy','Windows','https://app.hackthebox.com/machines/29','https://labs.hackthebox.com/storage/avatars/buff.png'),(30,'Academy','Laravel debug mode and sudo exploitation.','Easy','Linux','https://app.hackthebox.com/machines/30','https://labs.hackthebox.com/storage/avatars/academy.png');
/*!40000 ALTER TABLE `machines` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `module_exams`
--

DROP TABLE IF EXISTS `module_exams`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `module_exams` (
  `module_id` int NOT NULL,
  `exam_id` int NOT NULL,
  PRIMARY KEY (`module_id`,`exam_id`),
  KEY `exam_id` (`exam_id`),
  CONSTRAINT `module_exams_ibfk_1` FOREIGN KEY (`module_id`) REFERENCES `modules` (`id`),
  CONSTRAINT `module_exams_ibfk_2` FOREIGN KEY (`exam_id`) REFERENCES `exams` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `module_exams`
--

LOCK TABLES `module_exams` WRITE;
/*!40000 ALTER TABLE `module_exams` DISABLE KEYS */;
INSERT INTO `module_exams` VALUES (1,1),(2,1),(3,1),(4,1),(5,1),(6,1),(7,1),(8,1),(11,1),(12,1),(13,1),(14,1),(15,1),(1,2),(2,2),(3,2),(4,2),(5,2),(6,2),(7,2),(8,2),(15,2),(9,3),(10,3),(11,3),(12,3),(13,3),(14,4),(15,4),(1,5),(2,5),(3,5),(11,5),(14,5),(2,6),(3,6),(4,6),(5,6),(6,6),(7,6),(8,6);
/*!40000 ALTER TABLE `module_exams` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `module_vulnerabilities`
--

DROP TABLE IF EXISTS `module_vulnerabilities`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `module_vulnerabilities` (
  `module_id` int NOT NULL,
  `vulnerability_id` int NOT NULL,
  PRIMARY KEY (`module_id`,`vulnerability_id`),
  KEY `vulnerability_id` (`vulnerability_id`),
  CONSTRAINT `module_vulnerabilities_ibfk_1` FOREIGN KEY (`module_id`) REFERENCES `modules` (`id`),
  CONSTRAINT `module_vulnerabilities_ibfk_2` FOREIGN KEY (`vulnerability_id`) REFERENCES `vulnerabilities` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `module_vulnerabilities`
--

LOCK TABLES `module_vulnerabilities` WRITE;
/*!40000 ALTER TABLE `module_vulnerabilities` DISABLE KEYS */;
INSERT INTO `module_vulnerabilities` VALUES (2,1),(3,2),(5,3),(6,3),(8,3),(4,4),(4,5),(5,6),(12,6),(6,7),(1,8),(2,8),(3,8),(7,8),(9,8),(10,8),(14,8),(15,8),(1,9),(6,9),(9,9),(12,9),(13,9),(14,9),(15,9),(11,10),(11,11),(11,12),(4,13),(10,14),(7,15),(7,16),(8,17),(9,18),(12,18),(13,18),(15,19),(4,20);
/*!40000 ALTER TABLE `module_vulnerabilities` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `modules`
--

DROP TABLE IF EXISTS `modules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `modules` (
  `id` int NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `description` text,
  `difficulty` enum('Easy','Medium','Hard') DEFAULT NULL,
  `url` varchar(500) DEFAULT NULL,
  `image` varchar(500) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `modules`
--

LOCK TABLES `modules` WRITE;
/*!40000 ALTER TABLE `modules` DISABLE KEYS */;
INSERT INTO `modules` VALUES (1,'Introduction to Web Applications','Learn the fundamentals of web application architecture, HTTP protocol, and common web technologies.','Easy','https://academy.hackthebox.com/module/1','https://academy.hackthebox.com/storage/modules/1.jpg'),(2,'SQL Injection Fundamentals','Master SQL injection techniques from basic to advanced exploitation methods.','Easy','https://academy.hackthebox.com/module/2','https://academy.hackthebox.com/storage/modules/2.jpg'),(3,'Cross-Site Scripting (XSS)','Comprehensive guide to identifying and exploiting XSS vulnerabilities.','Easy','https://academy.hackthebox.com/module/3','https://academy.hackthebox.com/storage/modules/3.jpg'),(4,'File Inclusion Vulnerabilities','Explore Local and Remote File Inclusion attacks and their exploitation.','Medium','https://academy.hackthebox.com/module/4','https://academy.hackthebox.com/storage/modules/4.jpg'),(5,'Command Injection','Learn to identify and exploit OS command injection vulnerabilities.','Medium','https://academy.hackthebox.com/module/5','https://academy.hackthebox.com/storage/modules/5.jpg'),(6,'File Upload Attacks','Master file upload vulnerabilities and bypass techniques.','Medium','https://academy.hackthebox.com/module/6','https://academy.hackthebox.com/storage/modules/6.jpg'),(7,'Server-Side Attacks','Advanced server-side vulnerability exploitation including SSRF and XXE.','Hard','https://academy.hackthebox.com/module/7','https://academy.hackthebox.com/storage/modules/7.jpg'),(8,'Deserialization Attacks','Understanding and exploiting insecure deserialization vulnerabilities.','Hard','https://academy.hackthebox.com/module/8','https://academy.hackthebox.com/storage/modules/8.jpg'),(9,'Active Directory Enumeration','Techniques for enumerating Active Directory environments.','Medium','https://academy.hackthebox.com/module/9','https://academy.hackthebox.com/storage/modules/9.jpg'),(10,'LDAP Injection','Exploiting LDAP injection vulnerabilities in authentication systems.','Medium','https://academy.hackthebox.com/module/10','https://academy.hackthebox.com/storage/modules/10.jpg'),(11,'Password Attacks','Comprehensive guide to password cracking and credential attacks.','Easy','https://academy.hackthebox.com/module/11','https://academy.hackthebox.com/storage/modules/11.jpg'),(12,'Linux Privilege Escalation','Methods for escalating privileges on Linux systems.','Medium','https://academy.hackthebox.com/module/12','https://academy.hackthebox.com/storage/modules/12.jpg'),(13,'Windows Privilege Escalation','Techniques for privilege escalation on Windows systems.','Medium','https://academy.hackthebox.com/module/13','https://academy.hackthebox.com/storage/modules/13.jpg'),(14,'Network Enumeration','Learn network scanning and enumeration with industry-standard tools.','Easy','https://academy.hackthebox.com/module/14','https://academy.hackthebox.com/storage/modules/14.jpg'),(15,'Web Service Security','Security testing of APIs and web services.','Medium','https://academy.hackthebox.com/module/15','https://academy.hackthebox.com/storage/modules/15.jpg');
/*!40000 ALTER TABLE `modules` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `session`
--

DROP TABLE IF EXISTS `session`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `session` (
  `id` varchar(36) NOT NULL,
  `expiresAt` timestamp(3) NOT NULL,
  `token` varchar(255) NOT NULL,
  `createdAt` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` timestamp(3) NOT NULL,
  `ipAddress` text,
  `userAgent` text,
  `userId` varchar(36) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `token` (`token`),
  KEY `session_userId_idx` (`userId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `session`
--

LOCK TABLES `session` WRITE;
/*!40000 ALTER TABLE `session` DISABLE KEYS */;
/*!40000 ALTER TABLE `session` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `units`
--

DROP TABLE IF EXISTS `units`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `units` (
  `id` int NOT NULL,
  `module_id` int NOT NULL,
  `sequence_order` int DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `type` enum('Article','Interactive') DEFAULT NULL,
  PRIMARY KEY (`id`,`module_id`),
  KEY `module_id` (`module_id`),
  CONSTRAINT `units_ibfk_1` FOREIGN KEY (`module_id`) REFERENCES `modules` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `units`
--

LOCK TABLES `units` WRITE;
/*!40000 ALTER TABLE `units` DISABLE KEYS */;
INSERT INTO `units` VALUES (1,1,1,'Web Application Architecture','Article'),(1,2,1,'Understanding SQL Injection','Article'),(1,3,1,'XSS Introduction','Article'),(1,4,1,'Understanding File Inclusion','Article'),(1,5,1,'Command Injection Basics','Article'),(1,6,1,'File Upload Basics','Article'),(1,7,1,'SSRF Fundamentals','Article'),(1,8,1,'Serialization Concepts','Article'),(1,9,1,'AD Basics','Article'),(1,10,1,'LDAP Fundamentals','Article'),(1,11,1,'Password Attack Types','Article'),(1,12,1,'Linux PrivEsc Overview','Article'),(1,13,1,'Windows PrivEsc Basics','Article'),(1,14,1,'Nmap Fundamentals','Article'),(1,15,1,'REST API Security','Article'),(2,1,2,'HTTP Protocol Basics','Article'),(2,2,2,'Union-Based SQLi','Interactive'),(2,3,2,'Reflected XSS','Interactive'),(2,4,2,'Local File Inclusion (LFI)','Interactive'),(2,5,2,'Filter Bypass Techniques','Interactive'),(2,6,2,'Bypassing File Type Restrictions','Interactive'),(2,7,2,'SSRF Exploitation','Interactive'),(2,8,2,'Java Deserialization','Interactive'),(2,9,2,'PowerView Usage','Interactive'),(2,10,2,'LDAP Injection Techniques','Interactive'),(2,11,2,'Hashcat Basics','Interactive'),(2,12,2,'SUID Exploitation','Interactive'),(2,13,2,'Token Impersonation','Interactive'),(2,14,2,'Advanced Nmap Techniques','Interactive'),(2,15,2,'GraphQL Vulnerabilities','Interactive'),(3,1,3,'Web Technologies Overview','Interactive'),(3,2,3,'Error-Based SQLi','Interactive'),(3,3,3,'Stored XSS','Interactive'),(3,4,3,'Remote File Inclusion (RFI)','Interactive'),(3,5,3,'Blind Command Injection','Interactive'),(3,6,3,'Exploiting File Uploads','Interactive'),(3,7,3,'XXE Attacks','Interactive'),(3,8,3,'Python Pickle Exploits','Interactive'),(3,9,3,'BloodHound Analysis','Interactive'),(3,11,3,'John the Ripper','Interactive'),(3,12,3,'Kernel Exploits','Interactive'),(3,13,3,'Unquoted Service Paths','Interactive'),(3,14,3,'Service Enumeration','Interactive'),(3,15,3,'SOAP Service Testing','Interactive'),(4,1,4,'Browser DevTools','Interactive'),(4,2,4,'Blind SQLi Techniques','Interactive'),(4,3,4,'DOM-Based XSS','Interactive'),(4,4,4,'LFI to RCE','Interactive'),(4,7,4,'Advanced XXE Techniques','Interactive'),(4,11,4,'Credential Stuffing','Interactive'),(4,12,4,'Cron Jobs and Services','Interactive'),(5,2,5,'Advanced SQLi Payloads','Interactive');
/*!40000 ALTER TABLE `units` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user`
--

DROP TABLE IF EXISTS `user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user` (
  `id` varchar(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `emailVerified` tinyint(1) NOT NULL,
  `image` text,
  `createdAt` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user`
--

LOCK TABLES `user` WRITE;
/*!40000 ALTER TABLE `user` DISABLE KEYS */;
INSERT INTO `user` VALUES ('GqNQlkyjdQRf2HVpOkgwpADTW3UWFr7Y','test','test@test.com',0,NULL,'2026-01-07 21:21:02.800','2026-01-07 21:21:02.800'),('obWEAb7GHVxQYBajDmfc9zoIt4pBQL0F','admin','admin@admin.com',0,NULL,'2026-01-07 21:22:15.203','2026-01-07 21:22:15.203');
/*!40000 ALTER TABLE `user` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_exams`
--

DROP TABLE IF EXISTS `user_exams`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_exams` (
  `user_id` int NOT NULL,
  `exam_id` int NOT NULL,
  `date` bigint DEFAULT NULL,
  PRIMARY KEY (`user_id`,`exam_id`),
  KEY `exam_id` (`exam_id`),
  CONSTRAINT `user_exams_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `user_exams_ibfk_2` FOREIGN KEY (`exam_id`) REFERENCES `exams` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_exams`
--

LOCK TABLES `user_exams` WRITE;
/*!40000 ALTER TABLE `user_exams` DISABLE KEYS */;
/*!40000 ALTER TABLE `user_exams` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_machines`
--

DROP TABLE IF EXISTS `user_machines`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_machines` (
  `user_id` int NOT NULL,
  `machine_id` int NOT NULL,
  `date` bigint DEFAULT NULL,
  `likes` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`user_id`,`machine_id`),
  KEY `machine_id` (`machine_id`),
  CONSTRAINT `user_machines_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `user_machines_ibfk_2` FOREIGN KEY (`machine_id`) REFERENCES `machines` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_machines`
--

LOCK TABLES `user_machines` WRITE;
/*!40000 ALTER TABLE `user_machines` DISABLE KEYS */;
/*!40000 ALTER TABLE `user_machines` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_modules`
--

DROP TABLE IF EXISTS `user_modules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_modules` (
  `user_id` int NOT NULL,
  `module_id` int NOT NULL,
  `date` bigint DEFAULT NULL,
  PRIMARY KEY (`user_id`,`module_id`),
  KEY `module_id` (`module_id`),
  CONSTRAINT `user_modules_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `user_modules_ibfk_2` FOREIGN KEY (`module_id`) REFERENCES `modules` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_modules`
--

LOCK TABLES `user_modules` WRITE;
/*!40000 ALTER TABLE `user_modules` DISABLE KEYS */;
/*!40000 ALTER TABLE `user_modules` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_sync`
--

DROP TABLE IF EXISTS `user_sync`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_sync` (
  `auth_user_id` varchar(36) NOT NULL,
  `custom_user_id` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`auth_user_id`),
  UNIQUE KEY `custom_user_id` (`custom_user_id`),
  KEY `idx_custom_user_id` (`custom_user_id`),
  CONSTRAINT `user_sync_ibfk_1` FOREIGN KEY (`auth_user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE,
  CONSTRAINT `user_sync_ibfk_2` FOREIGN KEY (`custom_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_sync`
--

LOCK TABLES `user_sync` WRITE;
/*!40000 ALTER TABLE `user_sync` DISABLE KEYS */;
INSERT INTO `user_sync` VALUES ('GqNQlkyjdQRf2HVpOkgwpADTW3UWFr7Y',1,'2026-01-07 23:21:02','2026-01-07 23:21:02'),('obWEAb7GHVxQYBajDmfc9zoIt4pBQL0F',2,'2026-01-07 23:22:15','2026-01-07 23:22:15');
/*!40000 ALTER TABLE `user_sync` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL,
  `username` varchar(30) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `role` enum('User','Admin') DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'test','test@test.com','266313a1bc9e85250c42e2d03d5e669153e25fde33697a731f5be47d10fe6273','User'),(2,'admin','admin@admin.com','091e5e2672a5408bae7ccd04e3db28266d9d62eb20dc8da6dc3f86b8f4fb07b0','Admin');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `verification`
--

DROP TABLE IF EXISTS `verification`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `verification` (
  `id` varchar(36) NOT NULL,
  `identifier` varchar(255) NOT NULL,
  `value` text NOT NULL,
  `expiresAt` timestamp(3) NOT NULL,
  `createdAt` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `verification_identifier_idx` (`identifier`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `verification`
--

LOCK TABLES `verification` WRITE;
/*!40000 ALTER TABLE `verification` DISABLE KEYS */;
/*!40000 ALTER TABLE `verification` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vulnerabilities`
--

DROP TABLE IF EXISTS `vulnerabilities`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vulnerabilities` (
  `id` int NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vulnerabilities`
--

LOCK TABLES `vulnerabilities` WRITE;
/*!40000 ALTER TABLE `vulnerabilities` DISABLE KEYS */;
INSERT INTO `vulnerabilities` VALUES (1,'SQL Injection'),(2,'Cross Site Scripting (XSS)'),(3,'Remote Code Execution'),(4,'Local File Inclusion'),(5,'Remote File Inclusion'),(6,'OS Command Injection'),(7,'Arbitrary File Upload'),(8,'Information Disclosure'),(9,'Misconfiguration'),(10,'Weak Credentials'),(11,'Default Credentials'),(12,'Clear Text Credentials'),(13,'Directory Traversal'),(14,'LDAP Injection'),(15,'XML External Entity (XXE)'),(16,'Server-Side Request Forgery (SSRF)'),(17,'Deserialization'),(18,'Weak Permissions'),(19,'Anonymous/Guest Access'),(20,'Arbitrary File Read');
/*!40000 ALTER TABLE `vulnerabilities` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vulnerability_tools`
--

DROP TABLE IF EXISTS `vulnerability_tools`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vulnerability_tools` (
  `vulnerability_id` int NOT NULL,
  `tool` varchar(255) NOT NULL,
  PRIMARY KEY (`vulnerability_id`,`tool`),
  CONSTRAINT `vulnerability_tools_ibfk_1` FOREIGN KEY (`vulnerability_id`) REFERENCES `vulnerabilities` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vulnerability_tools`
--

LOCK TABLES `vulnerability_tools` WRITE;
/*!40000 ALTER TABLE `vulnerability_tools` DISABLE KEYS */;
INSERT INTO `vulnerability_tools` VALUES (1,'Burp Suite'),(1,'sqlmap'),(2,'Burp Suite'),(3,'Metasploit'),(6,'Burp Suite'),(7,'Burp Suite'),(8,'Gobuster'),(8,'Nikto'),(8,'Nmap'),(10,'Hashcat'),(10,'Hydra'),(10,'John the Ripper'),(11,'Hydra');
/*!40000 ALTER TABLE `vulnerability_tools` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-01-08  1:46:09

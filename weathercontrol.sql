-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Gép: 127.0.0.1
-- Létrehozás ideje: 2026. Okt 18. 15:10
-- Kiszolgáló verziója: 10.4.32-MariaDB
-- PHP verzió: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Adatbázis: `weathercontrol`
--
CREATE DATABASE IF NOT EXISTS `weathercontrol` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_hungarian_ci;
USE `weathercontrol`;

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `users`
--

CREATE TABLE `users` (
  `ID` int(11) NOT NULL,
  `name` varchar(100) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `passwd` varchar(40) DEFAULT NULL,
  `role` varchar(5) DEFAULT NULL,
  `status` tinyint(1) DEFAULT NULL,
  `reg` timestamp NOT NULL DEFAULT current_timestamp(),
  `last` timestamp NULL DEFAULT NULL,
  `loginCount` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_hungarian_ci;

--
-- A tábla adatainak kiíratása `users`
--

INSERT INTO `users` (`ID`, `name`, `email`, `passwd`, `role`, `status`, `reg`, `last`, `loginCount`) VALUES
(1, 'admin', 'adminvagyok@gmail.hu', 'cdb4febc02b9be7f685d0eafb2c99d9c819dc57a', 'admin', 1, '2026-10-02 17:27:47', '2026-10-18 13:02:29', 5),
(3, 'example', 'example@gmail.com', '42f08ae7011967d99b82a889967ec4482442e611', 'user', 1, '2026-10-14 21:29:22', '2026-10-18 12:58:43', 4);

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `weather_forecasts`
--

CREATE TABLE `weather_forecasts` (
  `ID` int(11) NOT NULL,
  `date` date NOT NULL,
  `location` varchar(100) NOT NULL,
  `temp_min` decimal(5,2) DEFAULT NULL,
  `temp_max` decimal(5,2) DEFAULT NULL,
  `weather_type` varchar(50) DEFAULT NULL,
  `precipitation` decimal(5,2) DEFAULT NULL,
  `precipitation_probability` decimal(5,2) DEFAULT NULL,
  `wind_speed` decimal(5,2) DEFAULT NULL,
  `wind_direction` varchar(20) DEFAULT NULL,
  `humidity` decimal(5,2) DEFAULT NULL,
  `pressure` decimal(7,2) DEFAULT NULL,
  `uv_index` decimal(4,2) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_hungarian_ci;

--
-- A tábla adatainak kiíratása `weather_forecasts`
--

INSERT INTO `weather_forecasts` (`ID`, `date`, `location`, `temp_min`, `temp_max`, `weather_type`, `precipitation`, `precipitation_probability`, `wind_speed`, `wind_direction`, `humidity`, `pressure`, `uv_index`, `created_at`, `updated_at`) VALUES
(2, '2026-10-15', 'Baja', 9.00, 19.00, 'Felhős', 0.20, 34.00, 17.00, 'West', 15.00, 1016.00, 10.00, '2026-10-15 17:54:10', '2026-10-15 17:54:10'),
(3, '2026-06-11', 'Madaras', 6.00, 18.00, 'Zivatar', 2.00, 76.00, 21.00, 'É', 64.00, 1025.00, 3.00, '2026-10-17 19:38:14', '2026-10-17 19:38:14'),
(4, '2026-10-14', 'Baja', 13.00, 20.00, 'Részben felhős', 0.10, 55.00, 18.00, 'Ny', 43.00, 1018.00, 6.00, '2026-10-17 19:54:47', '2026-10-17 19:54:47');

--
-- Indexek a kiírt táblákhoz
--

--
-- A tábla indexei `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`ID`);

--
-- A tábla indexei `weather_forecasts`
--
ALTER TABLE `weather_forecasts`
  ADD PRIMARY KEY (`ID`);

--
-- A kiírt táblák AUTO_INCREMENT értéke
--

--
-- AUTO_INCREMENT a táblához `users`
--
ALTER TABLE `users`
  MODIFY `ID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT a táblához `weather_forecasts`
--
ALTER TABLE `weather_forecasts`
  MODIFY `ID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

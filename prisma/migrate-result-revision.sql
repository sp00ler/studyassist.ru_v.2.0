-- Миграция: поля для готовых файлов и доработки
ALTER TABLE `Order`
  ADD COLUMN `resultFiles`   TEXT NULL AFTER `adminNote`,
  ADD COLUMN `revisionNote`  TEXT NULL AFTER `resultFiles`,
  ADD COLUMN `revisionFiles` TEXT NULL AFTER `revisionNote`;

-- Миграция: добавление полей контактов гостя в таблицу Order
-- Запустить на сервере: mysql -u studyassist -p studyassist < /var/www/studyassist/prisma/migrate-guest-contacts.sql

ALTER TABLE `Order`
  ADD COLUMN IF NOT EXISTS `clientName`  VARCHAR(191) NULL AFTER `userId`,
  ADD COLUMN IF NOT EXISTS `clientEmail` VARCHAR(191) NULL AFTER `clientName`,
  ADD COLUMN IF NOT EXISTS `clientPhone` VARCHAR(191) NULL AFTER `clientEmail`;

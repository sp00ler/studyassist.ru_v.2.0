-- Миграция: онлайн-чат с поддержкой
-- Применить на VPS: mysql -u studyassist -p studyassist < prisma/migrate-chat.sql

CREATE TABLE IF NOT EXISTS `ChatSession` (
  `id`           VARCHAR(191)  NOT NULL,
  `name`         VARCHAR(191)  NULL,
  `contact`      VARCHAR(191)  NULL,
  `tgGroupMsgId` INT           NULL,
  `status`       VARCHAR(191)  NOT NULL DEFAULT 'open',
  `createdAt`    DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`    DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `ChatSession_status_idx` (`status`),
  INDEX `ChatSession_createdAt_idx` (`createdAt`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `ChatMessage` (
  `id`        VARCHAR(191)  NOT NULL,
  `sessionId` VARCHAR(191)  NOT NULL,
  `text`      LONGTEXT      NOT NULL,
  `fromAdmin` TINYINT(1)    NOT NULL DEFAULT 0,
  `createdAt` DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `ChatMessage_sessionId_idx` (`sessionId`),
  INDEX `ChatMessage_createdAt_idx` (`createdAt`),
  CONSTRAINT `ChatMessage_sessionId_fkey`
    FOREIGN KEY (`sessionId`) REFERENCES `ChatSession` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

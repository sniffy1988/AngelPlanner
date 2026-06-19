-- Existing users already finished onboarding.
ALTER TABLE "User" ADD COLUMN "registrationStep" TEXT NOT NULL DEFAULT 'done';

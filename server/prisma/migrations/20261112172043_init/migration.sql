-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ORGANIZER', 'EXHIBITOR', 'ATTENDEE');

-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'CANCELLED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "RegistrationStatus" AS ENUM ('CONFIRMED', 'CANCELLED', 'WAITLISTED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('NOT_REQUIRED', 'PENDING', 'PAID', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "BoothStatus" AS ENUM ('AVAILABLE', 'ASSIGNED', 'INACTIVE');

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('QR_CHECK_IN', 'QUIZ', 'PHOTO_CHALLENGE', 'TASK');

-- CreateEnum
CREATE TYPE "ActivityStatus" AS ENUM ('DRAFT', 'ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "ParticipationStatus" AS ENUM ('STARTED', 'PENDING_VERIFICATION', 'COMPLETED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ScavengerHuntStatus" AS ENUM ('DRAFT', 'ACTIVE', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ChallengeType" AS ENUM ('PHOTO', 'QR_SCAN', 'QUESTION', 'TASK');

-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "PointSource" AS ENUM ('BOOTH_VISIT', 'ACTIVITY', 'SCAVENGER_CHALLENGE', 'BONUS', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('EVENT_UPDATE', 'EVENT_REMINDER', 'EXHIBITOR_UPDATE', 'ACHIEVEMENT', 'ANNOUNCEMENT', 'SYSTEM');

-- CreateEnum
CREATE TYPE "ExhibitorStatus" AS ENUM ('PENDING', 'ACTIVE', 'REJECTED', 'WITHDRAWN');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "role" "UserRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" UUID NOT NULL,
    "organizerId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "venue" TEXT,
    "startDate" TIMESTAMPTZ(6) NOT NULL,
    "endDate" TIMESTAMPTZ(6) NOT NULL,
    "capacity" INTEGER,
    "status" "EventStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventRegistration" (
    "id" UUID NOT NULL,
    "attendeeId" UUID NOT NULL,
    "eventId" UUID NOT NULL,
    "status" "RegistrationStatus" NOT NULL DEFAULT 'CONFIRMED',
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'NOT_REQUIRED',
    "registeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmedAt" TIMESTAMP(3),

    CONSTRAINT "EventRegistration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventExhibitor" (
    "id" UUID NOT NULL,
    "eventId" UUID NOT NULL,
    "exhibitorId" UUID NOT NULL,
    "status" "ExhibitorStatus" NOT NULL DEFAULT 'PENDING',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventExhibitor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Booth" (
    "id" UUID NOT NULL,
    "eventId" UUID NOT NULL,
    "eventExhibitorId" UUID,
    "boothNumber" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "location" TEXT,
    "status" "BoothStatus" NOT NULL DEFAULT 'AVAILABLE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Booth_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Activity" (
    "id" UUID NOT NULL,
    "boothId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "instructions" TEXT,
    "points" INTEGER NOT NULL DEFAULT 0,
    "type" "ActivityType" NOT NULL,
    "status" "ActivityStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BoothVisit" (
    "id" UUID NOT NULL,
    "attendeeId" UUID NOT NULL,
    "boothId" UUID NOT NULL,
    "scannedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pointsAwarded" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "BoothVisit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityParticipation" (
    "id" UUID NOT NULL,
    "attendeeId" UUID NOT NULL,
    "activityId" UUID NOT NULL,
    "status" "ParticipationStatus" NOT NULL DEFAULT 'STARTED',
    "pointsAwarded" INTEGER NOT NULL DEFAULT 0,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityParticipation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityAttempt" (
    "id" UUID NOT NULL,
    "participationId" UUID NOT NULL,
    "attemptNumber" INTEGER NOT NULL,
    "status" "ParticipationStatus" NOT NULL DEFAULT 'STARTED',
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "ActivityAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScavengerHunt" (
    "id" UUID NOT NULL,
    "eventId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "status" "ScavengerHuntStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScavengerHunt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScavengerChallenge" (
    "id" UUID NOT NULL,
    "huntId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "instructions" TEXT,
    "type" "ChallengeType" NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScavengerChallenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScavengerSubmission" (
    "id" UUID NOT NULL,
    "challengeId" UUID NOT NULL,
    "attendeeId" UUID NOT NULL,
    "submissionUrl" TEXT,
    "answer" TEXT,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'PENDING',
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "ScavengerSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PointTransaction" (
    "id" UUID NOT NULL,
    "attendeeId" UUID NOT NULL,
    "eventId" UUID NOT NULL,
    "points" INTEGER NOT NULL,
    "source" "PointSource" NOT NULL,
    "sourceId" UUID,
    "idempotencyKey" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PointTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Achievement" (
    "id" UUID NOT NULL,
    "eventId" UUID,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "pointsRequired" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Achievement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserAchievement" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "achievementId" UUID NOT NULL,
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserAchievement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FavoriteExhibitor" (
    "id" UUID NOT NULL,
    "attendeeId" UUID NOT NULL,
    "exhibitorId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FavoriteExhibitor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Event_organizerId_idx" ON "Event"("organizerId");

-- CreateIndex
CREATE INDEX "Event_status_idx" ON "Event"("status");

-- CreateIndex
CREATE INDEX "EventRegistration_eventId_status_idx" ON "EventRegistration"("eventId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "EventRegistration_attendeeId_eventId_key" ON "EventRegistration"("attendeeId", "eventId");

-- CreateIndex
CREATE INDEX "EventExhibitor_exhibitorId_idx" ON "EventExhibitor"("exhibitorId");

-- CreateIndex
CREATE UNIQUE INDEX "EventExhibitor_eventId_exhibitorId_key" ON "EventExhibitor"("eventId", "exhibitorId");

-- CreateIndex
CREATE UNIQUE INDEX "Booth_eventExhibitorId_key" ON "Booth"("eventExhibitorId");

-- CreateIndex
CREATE INDEX "Booth_eventExhibitorId_idx" ON "Booth"("eventExhibitorId");

-- CreateIndex
CREATE UNIQUE INDEX "Booth_eventId_boothNumber_key" ON "Booth"("eventId", "boothNumber");

-- CreateIndex
CREATE INDEX "Activity_boothId_idx" ON "Activity"("boothId");

-- CreateIndex
CREATE INDEX "Activity_status_idx" ON "Activity"("status");

-- CreateIndex
CREATE INDEX "BoothVisit_boothId_idx" ON "BoothVisit"("boothId");

-- CreateIndex
CREATE UNIQUE INDEX "BoothVisit_attendeeId_boothId_key" ON "BoothVisit"("attendeeId", "boothId");

-- CreateIndex
CREATE INDEX "ActivityParticipation_activityId_status_idx" ON "ActivityParticipation"("activityId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ActivityParticipation_attendeeId_activityId_key" ON "ActivityParticipation"("attendeeId", "activityId");

-- CreateIndex
CREATE INDEX "ActivityAttempt_participationId_status_idx" ON "ActivityAttempt"("participationId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ActivityAttempt_participationId_attemptNumber_key" ON "ActivityAttempt"("participationId", "attemptNumber");

-- CreateIndex
CREATE INDEX "ScavengerHunt_eventId_idx" ON "ScavengerHunt"("eventId");

-- CreateIndex
CREATE INDEX "ScavengerChallenge_huntId_idx" ON "ScavengerChallenge"("huntId");

-- CreateIndex
CREATE INDEX "ScavengerSubmission_attendeeId_idx" ON "ScavengerSubmission"("attendeeId");

-- CreateIndex
CREATE INDEX "ScavengerSubmission_challengeId_status_idx" ON "ScavengerSubmission"("challengeId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ScavengerSubmission_challengeId_attendeeId_key" ON "ScavengerSubmission"("challengeId", "attendeeId");

-- CreateIndex
CREATE UNIQUE INDEX "PointTransaction_idempotencyKey_key" ON "PointTransaction"("idempotencyKey");

-- CreateIndex
CREATE INDEX "PointTransaction_eventId_attendeeId_idx" ON "PointTransaction"("eventId", "attendeeId");

-- CreateIndex
CREATE INDEX "PointTransaction_eventId_createdAt_idx" ON "PointTransaction"("eventId", "createdAt");

-- CreateIndex
CREATE INDEX "Achievement_eventId_idx" ON "Achievement"("eventId");

-- CreateIndex
CREATE INDEX "UserAchievement_userId_idx" ON "UserAchievement"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserAchievement_userId_achievementId_key" ON "UserAchievement"("userId", "achievementId");

-- CreateIndex
CREATE INDEX "FavoriteExhibitor_exhibitorId_idx" ON "FavoriteExhibitor"("exhibitorId");

-- CreateIndex
CREATE UNIQUE INDEX "FavoriteExhibitor_attendeeId_exhibitorId_key" ON "FavoriteExhibitor"("attendeeId", "exhibitorId");

-- CreateIndex
CREATE INDEX "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");

-- CreateIndex
CREATE INDEX "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventRegistration" ADD CONSTRAINT "EventRegistration_attendeeId_fkey" FOREIGN KEY ("attendeeId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventRegistration" ADD CONSTRAINT "EventRegistration_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventExhibitor" ADD CONSTRAINT "EventExhibitor_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventExhibitor" ADD CONSTRAINT "EventExhibitor_exhibitorId_fkey" FOREIGN KEY ("exhibitorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booth" ADD CONSTRAINT "Booth_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booth" ADD CONSTRAINT "Booth_eventExhibitorId_fkey" FOREIGN KEY ("eventExhibitorId") REFERENCES "EventExhibitor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_boothId_fkey" FOREIGN KEY ("boothId") REFERENCES "Booth"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BoothVisit" ADD CONSTRAINT "BoothVisit_attendeeId_fkey" FOREIGN KEY ("attendeeId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BoothVisit" ADD CONSTRAINT "BoothVisit_boothId_fkey" FOREIGN KEY ("boothId") REFERENCES "Booth"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityParticipation" ADD CONSTRAINT "ActivityParticipation_attendeeId_fkey" FOREIGN KEY ("attendeeId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityParticipation" ADD CONSTRAINT "ActivityParticipation_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityAttempt" ADD CONSTRAINT "ActivityAttempt_participationId_fkey" FOREIGN KEY ("participationId") REFERENCES "ActivityParticipation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScavengerHunt" ADD CONSTRAINT "ScavengerHunt_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScavengerChallenge" ADD CONSTRAINT "ScavengerChallenge_huntId_fkey" FOREIGN KEY ("huntId") REFERENCES "ScavengerHunt"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScavengerSubmission" ADD CONSTRAINT "ScavengerSubmission_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "ScavengerChallenge"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScavengerSubmission" ADD CONSTRAINT "ScavengerSubmission_attendeeId_fkey" FOREIGN KEY ("attendeeId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PointTransaction" ADD CONSTRAINT "PointTransaction_attendeeId_fkey" FOREIGN KEY ("attendeeId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PointTransaction" ADD CONSTRAINT "PointTransaction_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Achievement" ADD CONSTRAINT "Achievement_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAchievement" ADD CONSTRAINT "UserAchievement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAchievement" ADD CONSTRAINT "UserAchievement_achievementId_fkey" FOREIGN KEY ("achievementId") REFERENCES "Achievement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FavoriteExhibitor" ADD CONSTRAINT "FavoriteExhibitor_attendeeId_fkey" FOREIGN KEY ("attendeeId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FavoriteExhibitor" ADD CONSTRAINT "FavoriteExhibitor_exhibitorId_fkey" FOREIGN KEY ("exhibitorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

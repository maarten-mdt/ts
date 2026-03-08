-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'RANGE_OWNER', 'GUNSMITH', 'ADMIN', 'AGENT');

-- CreateEnum
CREATE TYPE "RangeStatus" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED', 'CLOSED');

-- CreateEnum
CREATE TYPE "RangeType" AS ENUM ('PUBLIC', 'PRIVATE', 'CLUB', 'COMMERCIAL', 'MILITARY');

-- CreateEnum
CREATE TYPE "ClaimStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "clerkId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiKey" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'AGENT',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "lastUsed" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Range" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "RangeStatus" NOT NULL DEFAULT 'PENDING',
    "ownerId" TEXT,
    "claimed" BOOLEAN NOT NULL DEFAULT false,
    "claimedAt" TIMESTAMP(3),
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "zip" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'US',
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "googlePlaceId" TEXT,
    "googleRating" DOUBLE PRECISION,
    "googleReviewCount" INTEGER,
    "googleRatingUpdated" TIMESTAMP(3),
    "maxDistanceYards" INTEGER NOT NULL,
    "numberOfLanes" INTEGER,
    "rangeType" "RangeType" NOT NULL DEFAULT 'PUBLIC',
    "surfaceTypes" TEXT[],
    "coveredPositions" BOOLEAN NOT NULL DEFAULT false,
    "proneAllowed" BOOLEAN NOT NULL DEFAULT true,
    "benchRests" BOOLEAN NOT NULL DEFAULT false,
    "numberOfBenches" INTEGER,
    "steelTargetsAllowed" BOOLEAN NOT NULL DEFAULT false,
    "membershipRequired" BOOLEAN NOT NULL DEFAULT false,
    "dayFeeAvailable" BOOLEAN NOT NULL DEFAULT true,
    "dayFeeAmount" DECIMAL(8,2),
    "membershipFeeAnnual" DECIMAL(8,2),
    "rfOfficerRequired" BOOLEAN NOT NULL DEFAULT false,
    "coldRangeOnly" BOOLEAN NOT NULL DEFAULT false,
    "magRestrictions" TEXT,
    "suppressorFriendly" BOOLEAN NOT NULL DEFAULT true,
    "restroomsOnSite" BOOLEAN NOT NULL DEFAULT false,
    "parkingAvailable" BOOLEAN NOT NULL DEFAULT true,
    "roofedShooting" BOOLEAN NOT NULL DEFAULT false,
    "lightingAvailable" BOOLEAN NOT NULL DEFAULT false,
    "targetRentals" BOOLEAN NOT NULL DEFAULT false,
    "ammoAvailable" BOOLEAN NOT NULL DEFAULT false,
    "gunRentals" BOOLEAN NOT NULL DEFAULT false,
    "classesOffered" BOOLEAN NOT NULL DEFAULT false,
    "fflOnSite" BOOLEAN NOT NULL DEFAULT false,
    "hostsMatches" BOOLEAN NOT NULL DEFAULT false,
    "matchTypes" TEXT[],
    "matchScheduleUrl" TEXT,
    "hoursNotes" TEXT,
    "seasonalClosure" BOOLEAN NOT NULL DEFAULT false,
    "seasonalNotes" TEXT,
    "website" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "photos" TEXT[],
    "heroPhoto" TEXT,
    "description" TEXT,
    "adminNotes" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Range_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Claim" (
    "id" TEXT NOT NULL,
    "rangeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "ClaimStatus" NOT NULL DEFAULT 'PENDING',
    "claimantName" TEXT NOT NULL,
    "claimantTitle" TEXT NOT NULL,
    "claimantPhone" TEXT NOT NULL,
    "claimantEmail" TEXT NOT NULL,
    "verificationNote" TEXT,
    "adminNote" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Claim_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "rangeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "body" TEXT NOT NULL,
    "visitDate" TIMESTAMP(3),
    "helpful" INTEGER NOT NULL DEFAULT 0,
    "flagged" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedRange" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rangeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedRange_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_clerkId_key" ON "User"("clerkId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "ApiKey_key_key" ON "ApiKey"("key");

-- CreateIndex
CREATE UNIQUE INDEX "Range_slug_key" ON "Range"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Range_googlePlaceId_key" ON "Range"("googlePlaceId");

-- CreateIndex
CREATE UNIQUE INDEX "Review_rangeId_userId_key" ON "Review"("rangeId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "SavedRange_userId_rangeId_key" ON "SavedRange"("userId", "rangeId");

-- AddForeignKey
ALTER TABLE "ApiKey" ADD CONSTRAINT "ApiKey_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Range" ADD CONSTRAINT "Range_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Claim" ADD CONSTRAINT "Claim_rangeId_fkey" FOREIGN KEY ("rangeId") REFERENCES "Range"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Claim" ADD CONSTRAINT "Claim_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_rangeId_fkey" FOREIGN KEY ("rangeId") REFERENCES "Range"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedRange" ADD CONSTRAINT "SavedRange_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedRange" ADD CONSTRAINT "SavedRange_rangeId_fkey" FOREIGN KEY ("rangeId") REFERENCES "Range"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

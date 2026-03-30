/*
  Warnings:

  - You are about to drop the column `stipend` on the `Job` table. All the data in the column will be lost.
  - The `jobType` column on the `Job` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "JobType" AS ENUM ('FULL_TIME', 'PART_TIME', 'INTERNSHIP', 'CONTRACT');

-- CreateEnum
CREATE TYPE "WorkMode" AS ENUM ('REMOTE', 'HYBRID', 'ONSITE');

-- CreateEnum
CREATE TYPE "ExperienceLevel" AS ENUM ('FRESHER', 'INTERN', 'JUNIOR', 'MID', 'SENIOR');

-- AlterTable
ALTER TABLE "Job" DROP COLUMN "stipend",
ADD COLUMN     "aboutCompany" TEXT,
ADD COLUMN     "duration" TEXT,
ADD COLUMN     "education" TEXT NOT NULL DEFAULT 'Any',
ADD COLUMN     "experienceLevel" "ExperienceLevel" NOT NULL DEFAULT 'FRESHER',
ADD COLUMN     "perks" TEXT[],
ADD COLUMN     "salaryMax" INTEGER,
ADD COLUMN     "salaryMin" INTEGER,
ADD COLUMN     "workMode" "WorkMode" NOT NULL DEFAULT 'ONSITE',
DROP COLUMN "jobType",
ADD COLUMN     "jobType" "JobType" NOT NULL DEFAULT 'FULL_TIME';

-- AlterTable
ALTER TABLE "StudentProfile" ADD COLUMN     "certificationsPublic" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "resumePublic" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "resumeUrl" TEXT,
ADD COLUMN     "socialLinks" TEXT[];

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "name" TEXT;

-- CreateTable
CREATE TABLE "Certification" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Certification_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Certification" ADD CONSTRAINT "Certification_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "rescue_groups" (
    "id" SERIAL NOT NULL,
    "groupId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rescue_groups_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "rescue_groups_groupId_key" ON "rescue_groups"("groupId");

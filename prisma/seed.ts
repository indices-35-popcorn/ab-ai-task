import { AppealCategory, AppealStatus, EnrollmentStatus, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const parent = await prisma.user.upsert({
    where: { email: "parent@example.com" },
    update: {},
    create: { email: "parent@example.com" },
  });

  const currentCenter = await prisma.sportsCenter.create({
    data: {
      name: "Current Center",
      programs: {
        create: {
          sportType: "Football",
          capacity: 10,
        },
      },
    },
    include: { programs: true },
  });

  const targetCenter = await prisma.sportsCenter.create({
    data: {
      name: "Target Center",
      programs: {
        create: {
          sportType: "Basketball",
          capacity: 10,
        },
      },
    },
    include: { programs: true },
  });

  const child = await prisma.athleteProfile.create({
    data: {
      iin: "123456789012",
      enrollments: {
        create: {
          sportsCenterId: currentCenter.id,
          programId: currentCenter.programs[0].id,
          parentId: parent.id,
          status: EnrollmentStatus.APPROVED,
        },
      },
    },
  });

  await prisma.appeal.create({
    data: {
      category: AppealCategory.CHANGE_PROVIDER,
      status: AppealStatus.OPEN,
      message: `Email ваучера: parent@example.com
ID текущего поставщика: ${currentCenter.id}
ID желаемого поставщика: ${targetCenter.id}
Текущий вид спорта: Football
Желаемый вид спорта: Basketball`,
      children: {
        create: {
          childIin: child.iin,
          childName: "Test Child",
        },
      },
    },
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

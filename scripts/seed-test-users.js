const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

const TENANT_SLUG = "gereja-test-kiraserve";
const DEFAULT_PASSWORD = "password123";

async function main() {
  const church = await prisma.church.findUnique({
    where: { slug: TENANT_SLUG },
    include: {
      divisions: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!church) {
    throw new Error(`Church with slug "${TENANT_SLUG}" not found.`);
  }

  let multimedia = church.divisions.find((d) =>
    d.name.toLowerCase().includes("multimedia")
  );

  let worship = church.divisions.find((d) =>
    d.name.toLowerCase().includes("worship")
  );

  if (!multimedia) {
    multimedia = await prisma.churchDivision.create({
      data: {
        churchId: church.id,
        name: "Multimedia",
        picName: "Koordinator Multimedia",
        picPhone: "082222222222",
      },
    });
  }

  if (!worship) {
    worship = await prisma.churchDivision.create({
      data: {
        churchId: church.id,
        name: "Worship",
        picName: "Koordinator Worship",
        picPhone: "081111111111",
      },
    });
  }

  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 12);

  const users = [
    {
      name: "Owner Test",
      email: "owner-test@kiraserve.local",
      phone: "080000000001",
      role: "CHURCH_OWNER",
      memberCode: "TEST-OWNER-001",
    },
    {
      name: "Admin Test",
      email: "admin-test-role@kiraserve.local",
      phone: "080000000002",
      role: "CHURCH_ADMIN",
      memberCode: "TEST-ADMIN-001",
    },
    {
      name: "Coordinator Multimedia Test",
      email: "coordinator-test@kiraserve.local",
      phone: "080000000003",
      role: "SERVANT",
      memberCode: "TEST-COOR-001",
      divisions: [
        {
          divisionId: multimedia.id,
          role: "COORDINATOR",
        },
        {
          divisionId: worship.id,
          role: "MEMBER",
        },
      ],
    },
    {
      name: "Servant Worship Test",
      email: "servant-test@kiraserve.local",
      phone: "080000000004",
      role: "SERVANT",
      memberCode: "TEST-SERV-001",
      divisions: [
        {
          divisionId: worship.id,
          role: "MEMBER",
        },
      ],
    },
    {
      name: "Member Jemaat Test",
      email: "member-test@kiraserve.local",
      phone: "080000000005",
      role: "MEMBER",
      memberCode: "TEST-MEM-001",
    },
  ];

  for (const item of users) {
    const user = await prisma.user.upsert({
      where: { email: item.email },
      update: {
        name: item.name,
        phone: item.phone,
        passwordHash,
      },
      create: {
        name: item.name,
        email: item.email,
        phone: item.phone,
        passwordHash,
      },
    });

    const churchMember = await prisma.churchMember.upsert({
      where: {
        churchId_userId: {
          churchId: church.id,
          userId: user.id,
        },
      },
      update: {
        role: item.role,
        status: "ACTIVE",
        memberCode: item.memberCode,
      },
      create: {
        churchId: church.id,
        userId: user.id,
        role: item.role,
        status: "ACTIVE",
        memberCode: item.memberCode,
      },
    });

    if (item.divisions?.length) {
      for (const divisionAssignment of item.divisions) {
        await prisma.divisionMember.upsert({
          where: {
            divisionId_churchMemberId: {
              divisionId: divisionAssignment.divisionId,
              churchMemberId: churchMember.id,
            },
          },
          update: {
            role: divisionAssignment.role,
          },
          create: {
            churchId: church.id,
            divisionId: divisionAssignment.divisionId,
            churchMemberId: churchMember.id,
            role: divisionAssignment.role,
          },
        });
      }
    }

    console.log(`Seeded: ${item.name} <${item.email}> as ${item.role}`);
  }

  console.log("");
  console.log("Done.");
  console.log(`Tenant: ${TENANT_SLUG}`);
  console.log(`Password for all test users: ${DEFAULT_PASSWORD}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
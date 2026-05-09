const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

const TENANT_SLUG = "gereja-test-kiraserve";
const DEFAULT_PASSWORD = "Demo12345!";

async function ensureChurch() {
  let church = await prisma.church.findUnique({
    where: { slug: TENANT_SLUG },
    include: { divisions: true },
  });

  if (!church) {
    church = await prisma.church.create({
      data: {
        name: "Gereja Test KiraServe",
        slug: TENANT_SLUG,
        picName: "Demo Owner",
        picEmail: "demo.owner@kiraserve.local",
        status: "TRIAL",
        memberCodePrefix: "DEMO",
        memberCodeNextNumber: 100,
      },
      include: { divisions: true },
    });
  }

  let production = church.divisions.find((division) =>
    division.name.toLowerCase().includes("production")
  );
  let worship = church.divisions.find((division) =>
    division.name.toLowerCase().includes("worship")
  );

  if (!production) {
    production = await prisma.churchDivision.create({
      data: {
        churchId: church.id,
        name: "Production",
        picName: "Demo Coordinator",
        picPhone: "080000000100",
      },
    });
  }

  if (!worship) {
    worship = await prisma.churchDivision.create({
      data: {
        churchId: church.id,
        name: "Worship",
        picName: "Demo Worship PIC",
        picPhone: "080000000200",
      },
    });
  }

  return { church, production, worship };
}

async function main() {
  const { church, production, worship } = await ensureChurch();
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 12);

  const accounts = [
    {
      name: "Demo Owner",
      email: "demo.owner@kiraserve.local",
      phone: "080000000001",
      role: "CHURCH_OWNER",
      memberCode: "DEMO-OWNER-001",
      divisions: [],
    },
    {
      name: "Demo Coordinator",
      email: "demo.coordinator@kiraserve.local",
      phone: "080000000002",
      role: "SERVANT",
      memberCode: "DEMO-COOR-001",
      divisions: [{ divisionId: production.id, role: "COORDINATOR" }],
    },
    {
      name: "Demo Member",
      email: "demo.member@kiraserve.local",
      phone: "080000000003",
      role: "MEMBER",
      memberCode: "DEMO-MEM-001",
      divisions: [{ divisionId: worship.id, role: "MEMBER" }],
    },
  ];

  for (const account of accounts) {
    const user = await prisma.user.upsert({
      where: { email: account.email },
      update: {
        name: account.name,
        phone: account.phone,
        passwordHash,
      },
      create: {
        name: account.name,
        email: account.email,
        phone: account.phone,
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
        role: account.role,
        status: "ACTIVE",
        memberCode: account.memberCode,
      },
      create: {
        churchId: church.id,
        userId: user.id,
        role: account.role,
        status: "ACTIVE",
        memberCode: account.memberCode,
      },
    });

    for (const divisionAssignment of account.divisions) {
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

    console.log(`Demo account ready: ${account.email}`);
  }

  console.log("");
  console.log(`Tenant: ${TENANT_SLUG}`);
  console.log(`Password: ${DEFAULT_PASSWORD}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

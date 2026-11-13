import { randomUUID } from "node:crypto";
import prisma from "../src/lib/prisma";

async function main() {
  const email = process.argv[2];
  if (!email) throw new Error("Usage: npx tsx prisma/seed.ts <your-test-user-email>");

  const organizer = await prisma.user.findUnique({ where: { email } });
  if (!organizer) throw new Error(`No User row for ${email}. Create it in Supabase Auth first.`);

  if (await prisma.event.findFirst({ where: { name: "Weng Expo 2026" } })) {
    console.log("Already seeded, skipping.");
    return;
  }

  await prisma.user.update({ where: { id: organizer.id }, data: { role: "ORGANIZER" } });

  // Fake exhibitors (no Supabase login, fine for dev data)
  const [ex1, ex2] = await Promise.all(
    [1, 2].map((n) =>
      prisma.user.create({
        data: {
          id: randomUUID(),
          email: `exhibitor${n}@seed.test`,
          firstName: `Exhibitor${n}`,
          lastName: "Seed",
          role: "EXHIBITOR",
        },
      })
    )
  );

  const event = await prisma.event.create({
    data: {
      organizerId: organizer.id,
      name: "Weng Expo 2026",
      description: "Seeded test event",
      venue: "Main Hall",
      startDate: new Date("2026-12-05T09:00:00+08:00"),
      endDate: new Date("2026-12-05T18:00:00+08:00"),
      capacity: 200,
      status: "PUBLISHED",
    },
  });

  const [ee1, ee2] = await Promise.all(
    [ex1, ex2].map((ex) =>
      prisma.eventExhibitor.create({
        data: { eventId: event.id, exhibitorId: ex.id, status: "ACTIVE" },
      })
    )
  );

  const booth1 = await prisma.booth.create({
    data: { eventId: event.id, eventExhibitorId: ee1.id, boothNumber: "A1", name: "Tech Corner", location: "Hall A", status: "ASSIGNED" },
  });
  const booth2 = await prisma.booth.create({
    data: { eventId: event.id, eventExhibitorId: ee2.id, boothNumber: "A2", name: "Food Stall", location: "Hall A", status: "ASSIGNED" },
  });
  await prisma.booth.create({
    data: { eventId: event.id, boothNumber: "B1", name: "Open Booth", location: "Hall B", status: "AVAILABLE" },
  });

  await prisma.activity.createMany({
    data: [
      { boothId: booth1.id, title: "Scan to check in", type: "QR_CHECK_IN", points: 10, status: "ACTIVE" },
      { boothId: booth1.id, title: "Tech Quiz", type: "QUIZ", points: 30, status: "ACTIVE" },
      { boothId: booth2.id, title: "Taste Challenge", type: "TASK", points: 20, status: "ACTIVE" },
    ],
  });

  const hunt = await prisma.scavengerHunt.create({
    data: { eventId: event.id, title: "Expo Hunt", status: "ACTIVE" },
  });
  await prisma.scavengerChallenge.createMany({
    data: [
      { huntId: hunt.id, title: "Selfie at the entrance", type: "PHOTO", points: 15 },
      { huntId: hunt.id, title: "Find booth A2", type: "QR_SCAN", points: 10 },
    ],
  });

  await prisma.achievement.create({
    data: { eventId: event.id, name: "Explorer", description: "Earn 50 points", pointsRequired: 50 },
  });

  console.log("Seeded event:", event.id);
}

main()

  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
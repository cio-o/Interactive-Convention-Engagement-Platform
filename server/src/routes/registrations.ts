import { Router } from "express";
import prisma from "../lib/prisma";
import { requireAuth, requireRole } from "../middleware/auth";

const router = Router();

// Register for an event (attendees only)
router.post("/events/:id/register", requireAuth, requireRole("ATTENDEE"), async (req, res) => {
  const attendeeId = res.locals.user.id;
  const eventId = req.params.id;

  const result = await prisma.$transaction(
    async (tx) => {
      const event = await tx.event.findUnique({ where: { id: eventId } });
      if (!event || event.status !== "PUBLISHED") return { error: "Event not found", code: 404 };
      if (event.endDate < new Date()) return { error: "Event has ended", code: 400 };

      const existing = await tx.eventRegistration.findUnique({
        where: { attendeeId_eventId: { attendeeId, eventId } },
      });
      if (existing && existing.status !== "CANCELLED")
        return { error: "Already registered", code: 409 };

      const confirmed = await tx.eventRegistration.count({
        where: { eventId, status: "CONFIRMED" },
      });
      const full = event.capacity != null && confirmed >= event.capacity;
      const status = full ? "WAITLISTED" : "CONFIRMED";
      const data = {
        status,
        confirmedAt: full ? null : new Date(),
        registeredAt: new Date(),
      } as const;

      const registration = existing
        ? await tx.eventRegistration.update({ where: { id: existing.id }, data })
        : await tx.eventRegistration.create({ data: { attendeeId, eventId, ...data } });

      return { registration, code: 201 };
    },
    { isolationLevel: "Serializable" }
  );

  if ("error" in result) return res.status(result.code).json({ error: result.error });
  res.status(201).json(result.registration);
});

// Cancel registration (promotes next waitlisted attendee)
router.delete("/events/:id/register", requireAuth, async (req, res) => {
  const attendeeId = res.locals.user.id;
  const eventId = req.params.id;

  const result = await prisma.$transaction(
    async (tx) => {
      const reg = await tx.eventRegistration.findUnique({
        where: { attendeeId_eventId: { attendeeId, eventId } },
      });
      if (!reg || reg.status === "CANCELLED") return { error: "Registration not found" };

      await tx.eventRegistration.update({
        where: { id: reg.id },
        data: { status: "CANCELLED" },
      });

      if (reg.status === "CONFIRMED") {
        const next = await tx.eventRegistration.findFirst({
          where: { eventId, status: "WAITLISTED" },
          orderBy: { registeredAt: "asc" },
        });
        if (next)
          await tx.eventRegistration.update({
            where: { id: next.id },
            data: { status: "CONFIRMED", confirmedAt: new Date() },
          });
      }
      return { ok: true };
    },
    { isolationLevel: "Serializable" }
  );

  if ("error" in result) return res.status(404).json({ error: result.error });
  res.json({ ok: true });
});

// registrations
router.get("/registrations/mine", requireAuth, async (_req, res) => {
  const regs = await prisma.eventRegistration.findMany({
    where: { attendeeId: res.locals.user.id, status: { not: "CANCELLED" } },
    include: { event: true },
    orderBy: { registeredAt: "desc" },
  });
  res.json(regs);
});

// Organizer: attendee list for event
router.get("/events/:id/registrations", requireAuth, requireRole("ORGANIZER"), async (req, res) => {
  const event = await prisma.event.findUnique({ where: { id: req.params.id } });
  if (!event || event.organizerId !== res.locals.user.id)
    return res.status(404).json({ error: "Event not found" });

  const regs = await prisma.eventRegistration.findMany({
    where: { eventId: event.id },
    include: { attendee: { select: { id: true, email: true, firstName: true, lastName: true } } },
    orderBy: { registeredAt: "asc" },
  });
  res.json(regs);
});

export default router;
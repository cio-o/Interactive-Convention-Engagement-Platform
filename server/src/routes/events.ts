import { Router } from "express";
import prisma from "../lib/prisma";
import { requireAuth, requireRole } from "../middleware/auth";

const router = Router();

function parseDates(start: unknown, end: unknown) {
  const s = new Date(start as string);
  const e = new Date(end as string);
  if (isNaN(s.getTime()) || isNaN(e.getTime())) return { error: "Invalid dates" };
  if (e <= s) return { error: "endDate must be after startDate" };
  return { s, e };
}

// Public: published events
router.get("/", async (_req, res) => {
  const events = await prisma.event.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { startDate: "asc" },
  });
  res.json(events);
});

// Organizer: vents
router.get("/mine", requireAuth, requireRole("ORGANIZER"), async (_req, res) => {
  const events = await prisma.event.findMany({
    where: { organizerId: res.locals.user.id },
    orderBy: { createdAt: "desc" },
  });
  res.json(events);
});

// Event detail: published is public, drafts only for the owner
router.get("/:id", requireAuth, async (req, res) => {
  const event = await prisma.event.findUnique({ where: { id: req.params.id } });
  if (!event) return res.status(404).json({ error: "Event not found" });
  const isOwner = event.organizerId === res.locals.user.id;
  if (event.status !== "PUBLISHED" && !isOwner)
    return res.status(404).json({ error: "Event not found" });
  res.json(event);
});

router.post("/", requireAuth, requireRole("ORGANIZER"), async (req, res) => {
  const { name, description, venue, startDate, endDate, capacity } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: "name is required" });
  const d = parseDates(startDate, endDate);
  if ("error" in d) return res.status(400).json({ error: d.error });
  if (capacity != null && (!Number.isInteger(capacity) || capacity < 1))
    return res.status(400).json({ error: "capacity must be a positive integer" });

  const event = await prisma.event.create({
    data: {
      organizerId: res.locals.user.id,
      name: name.trim(),
      description,
      venue,
      startDate: d.s,
      endDate: d.e,
      capacity,
    },
  });
  res.status(201).json(event);
});

router.patch("/:id", requireAuth, requireRole("ORGANIZER"), async (req, res) => {
  const event = await prisma.event.findUnique({ where: { id: req.params.id } });
  if (!event || event.organizerId !== res.locals.user.id)
    return res.status(404).json({ error: "Event not found" });

  const { name, description, venue, startDate, endDate, capacity } = req.body;
  const s = startDate ? new Date(startDate) : event.startDate;
  const e = endDate ? new Date(endDate) : event.endDate;
  if (isNaN(s.getTime()) || isNaN(e.getTime()) || e <= s)
    return res.status(400).json({ error: "Invalid dates" });

  const updated = await prisma.event.update({
    where: { id: event.id },
    data: { name, description, venue, startDate: s, endDate: e, capacity },
  });
  res.json(updated);
});

router.patch("/:id/status", requireAuth, requireRole("ORGANIZER"), async (req, res) => {
  const { status } = req.body;
  if (!["PUBLISHED", "CANCELLED", "COMPLETED"].includes(status))
    return res.status(400).json({ error: "Invalid status" });

  const event = await prisma.event.findUnique({ where: { id: req.params.id } });
  if (!event || event.organizerId !== res.locals.user.id)
    return res.status(404).json({ error: "Event not found" });

  const updated = await prisma.event.update({ where: { id: event.id }, data: { status } });
  res.json(updated);
});

export default router;
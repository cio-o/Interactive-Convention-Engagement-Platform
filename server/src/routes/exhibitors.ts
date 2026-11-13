import { Router } from "express";
import prisma from "../lib/prisma";
import { requireAuth, requireRole } from "../middleware/auth";

const router = Router();

const ownedEvent = async (eventId: string, userId: string) => {
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  return event && event.organizerId === userId ? event : null;
};

const publicExhibitor = { select: { id: true, firstName: true, lastName: true } };

// Exhibitor: request to join an event
router.post("/events/:id/exhibitors/join", requireAuth, requireRole("EXHIBITOR"), async (req, res) => {
  const eventId = req.params.id;
  const exhibitorId = res.locals.user.id;

  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event || event.status !== "PUBLISHED") return res.status(404).json({ error: "Event not found" });

  const existing = await prisma.eventExhibitor.findUnique({
    where: { eventId_exhibitorId: { eventId, exhibitorId } },
  });
  if (existing && existing.status !== "WITHDRAWN")
    return res.status(409).json({ error: `Already ${existing.status.toLowerCase()}` });

  const record = existing
    ? await prisma.eventExhibitor.update({ where: { id: existing.id }, data: { status: "PENDING" } })
    : await prisma.eventExhibitor.create({ data: { eventId, exhibitorId } });
  res.status(201).json(record);
});

// All: approved exhibitors of an event
router.get("/events/:id/exhibitors", requireAuth, async (req, res) => {
  const list = await prisma.eventExhibitor.findMany({
    where: { eventId: req.params.id, status: "ACTIVE" },
    include: { exhibitor: publicExhibitor, assignedBooth: true },
  });
  res.json(list);
});

// Organizer: all join requests for their event
router.get("/events/:id/exhibitor-requests", requireAuth, requireRole("ORGANIZER"), async (req, res) => {
  if (!(await ownedEvent(req.params.id, res.locals.user.id)))
    return res.status(404).json({ error: "Event not found" });
  const list = await prisma.eventExhibitor.findMany({
    where: { eventId: req.params.id },
    include: { exhibitor: { select: { id: true, email: true, firstName: true, lastName: true } } },
    orderBy: { joinedAt: "asc" },
  });
  res.json(list);
});

// Organizer: approve or reject
router.patch("/event-exhibitors/:id/status", requireAuth, requireRole("ORGANIZER"), async (req, res) => {
  const { status } = req.body;
  if (!["ACTIVE", "REJECTED"].includes(status)) return res.status(400).json({ error: "Invalid status" });

  const record = await prisma.eventExhibitor.findUnique({ where: { id: req.params.id } });
  if (!record || !(await ownedEvent(record.eventId, res.locals.user.id)))
    return res.status(404).json({ error: "Not found" });

  res.json(await prisma.eventExhibitor.update({ where: { id: record.id }, data: { status } }));
});

// All: booths of an event
router.get("/events/:id/booths", requireAuth, async (req, res) => {
  const booths = await prisma.booth.findMany({
    where: { eventId: req.params.id },
    include: { eventExhibitor: { include: { exhibitor: publicExhibitor } } },
    orderBy: { boothNumber: "asc" },
  });
  res.json(booths);
});

// Organizer: create booth
router.post("/events/:id/booths", requireAuth, requireRole("ORGANIZER"), async (req, res) => {
  if (!(await ownedEvent(req.params.id, res.locals.user.id)))
    return res.status(404).json({ error: "Event not found" });
  const { boothNumber, name, description, location } = req.body;
  if (!boothNumber?.trim() || !name?.trim())
    return res.status(400).json({ error: "boothNumber and name are required" });

  try {
    const booth = await prisma.booth.create({
      data: { eventId: req.params.id, boothNumber: boothNumber.trim(), name: name.trim(), description, location },
    });
    res.status(201).json(booth);
  } catch (e: any) {
    if (e.code === "P2002") return res.status(409).json({ error: "Booth number already used in this event" });
    throw e;
  }
});

// Organizer: unassign with null or assign an approved exhibitor to a booth
router.patch("/booths/:id/assign", requireAuth, requireRole("ORGANIZER"), async (req, res) => {
  const booth = await prisma.booth.findUnique({ where: { id: req.params.id } });
  if (!booth || !(await ownedEvent(booth.eventId, res.locals.user.id)))
    return res.status(404).json({ error: "Booth not found" });

  const { eventExhibitorId } = req.body;
  if (eventExhibitorId == null) {
    return res.json(
      await prisma.booth.update({ where: { id: booth.id }, data: { eventExhibitorId: null, status: "AVAILABLE" } })
    );
  }

  const ee = await prisma.eventExhibitor.findUnique({ where: { id: eventExhibitorId } });
  if (!ee || ee.eventId !== booth.eventId || ee.status !== "ACTIVE")
    return res.status(400).json({ error: "Exhibitor must be approved for this event" });

  try {
    res.json(
      await prisma.booth.update({ where: { id: booth.id }, data: { eventExhibitorId, status: "ASSIGNED" } })
    );
  } catch (e: any) {
    if (e.code === "P2002") return res.status(409).json({ error: "Exhibitor already has a booth" });
    throw e;
  }
});

// Organizer or the booth's own exhibitor: edit booth info
router.patch("/booths/:id", requireAuth, async (req, res) => {
  const booth = await prisma.booth.findUnique({
    where: { id: req.params.id },
    include: { event: true, eventExhibitor: true },
  });
  if (!booth) return res.status(404).json({ error: "Booth not found" });

  const userId = res.locals.user.id;
  const allowed = booth.event.organizerId === userId || booth.eventExhibitor?.exhibitorId === userId;
  if (!allowed) return res.status(403).json({ error: "Forbidden" });

  const { name, description, location } = req.body;
  res.json(await prisma.booth.update({ where: { id: booth.id }, data: { name, description, location } }));
});

export default router;
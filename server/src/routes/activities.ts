import { Router } from "express";
import prisma from "../lib/prisma";
import { requireAuth } from "../middleware/auth";

const router = Router();

const TYPES = ["QR_CHECK_IN", "QUIZ", "PHOTO_CHALLENGE", "TASK"];
const STATUSES = ["DRAFT", "ACTIVE", "INACTIVE"];

// Returns booth if user is the event's organizer or the booth's exhibitor
async function manageableBooth(boothId: string, userId: string) {
  const booth = await prisma.booth.findUnique({
    where: { id: boothId },
    include: { event: true, eventExhibitor: true },
  });
  if (!booth) return null;
  const ok = booth.event.organizerId === userId || booth.eventExhibitor?.exhibitorId === userId;
  return ok ? booth : null;
}

// List a booth activities (non-managers only see ACTIVE ones)
router.get("/booths/:id/activities", requireAuth, async (req, res) => {
  const manager = await manageableBooth(req.params.id, res.locals.user.id);
  const activities = await prisma.activity.findMany({
    where: { boothId: req.params.id, ...(manager ? {} : { status: "ACTIVE" }) },
    orderBy: { createdAt: "asc" },
  });
  res.json(activities);
});

// Create an activity
router.post("/booths/:id/activities", requireAuth, async (req, res) => {
  if (!(await manageableBooth(req.params.id, res.locals.user.id)))
    return res.status(403).json({ error: "Forbidden" });

  const { title, description, instructions, points, type, status } = req.body;
  if (!title?.trim()) return res.status(400).json({ error: "title is required" });
  if (!TYPES.includes(type)) return res.status(400).json({ error: "Invalid type" });
  if (points != null && (!Number.isInteger(points) || points < 0))
    return res.status(400).json({ error: "points must be a non-negative integer" });
  if (status != null && !STATUSES.includes(status))
    return res.status(400).json({ error: "Invalid status" });

  const activity = await prisma.activity.create({
    data: { boothId: req.params.id, title: title.trim(), description, instructions, points, type, status },
  });
  res.status(201).json(activity);
});

// Edit an activity (status INACTIVE instead of deleting)
router.patch("/activities/:id", requireAuth, async (req, res) => {
  const activity = await prisma.activity.findUnique({ where: { id: req.params.id } });
  if (!activity || !(await manageableBooth(activity.boothId, res.locals.user.id)))
    return res.status(403).json({ error: "Forbidden" });

  const { title, description, instructions, points, type, status } = req.body;
  if (type != null && !TYPES.includes(type)) return res.status(400).json({ error: "Invalid type" });
  if (status != null && !STATUSES.includes(status)) return res.status(400).json({ error: "Invalid status" });
  if (points != null && (!Number.isInteger(points) || points < 0))
    return res.status(400).json({ error: "points must be a non-negative integer" });

  res.json(
    await prisma.activity.update({
      where: { id: activity.id },
      data: { title, description, instructions, points, type, status },
    })
  );
});

export default router;
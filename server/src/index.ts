
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { requireAuth, requireRole } from "./middleware/auth";
import eventsRouter from "./routes/events";
import registrationsRouter from "./routes/registrations";
import exhibitorsRouter from "./routes/exhibitors";
import activitiesRouter from "./routes/activities";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use("/api/events", eventsRouter);
app.use("/api", registrationsRouter);
app.use("/api", exhibitorsRouter);
app.use("/api", activitiesRouter);

app.get("/", (_req, res) => {
  res.json({
    message: "Event Platform API is running!",
  });
});

app.get("/api/health", (_req, res) => {
  res.json({
    success: true,
    message: "Event Platform API is working!",
  });
});

app.get("/api/me", requireAuth, (_req, res) => res.json(res.locals.user));
app.get("/api/organizer-only", requireAuth, requireRole("ORGANIZER"), (_req, res) =>
  res.json({ ok: true })
);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});


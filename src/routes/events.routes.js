import express from "express";
import {
  getPublishedEventById,
  getPublishedEvents,
} from "../controllers/events.public.controller.js";

const router = express.Router();

router.get("/", getPublishedEvents);
router.get("/:id", getPublishedEventById);

export default router;

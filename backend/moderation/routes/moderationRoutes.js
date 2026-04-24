import express from "express";
import { analyzeMessage } from "../controllers/moderationController.js";

const router = express.Router();

router.post("/analyze", analyzeMessage);

export default router;

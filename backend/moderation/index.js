import express from "express";
import dotenv from "dotenv";
import cors from "cors";

import moderationRoutes from "./routes/moderationRoutes.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/v1/moderation", moderationRoutes);

app.get("/", (req, res) => {
  res.send("Moderation Service Running");
});

const PORT = process.env.PORT || 5003;

app.listen(PORT, () => {
  console.log(`✅ Moderation Service running on port ${PORT}`);
});

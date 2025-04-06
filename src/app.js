import express from "express";
import cors from "cors";
import scholarshipRoutes from "./routes/scholarshipRoutes.js";
import connectDB from "./config/db.js";
import dotenv from "dotenv";
import signRoutes from "./routes/signRoutes.js";
import UserDetailRouter from "./routes/detailRoutes.js";
import AIRouter from "./routes/AIRouter.js";
import GeminiRouter from "./routes/GeminiRoutes.js";

dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/scholarships", scholarshipRoutes);
app.use("/api/sign", signRoutes);
app.use("/api/updateCampaign", UserDetailRouter);
app.use("/api/Ai", AIRouter);
app.use("/api/gemini", GeminiRouter);

export default app;

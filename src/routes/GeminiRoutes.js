// routes/geminiRoutes.js
import express from "express";
import { generateGeminiResponse } from "../service/GeminiService.js";

const GeminiRouter = express.Router();

GeminiRouter.post("/chat", async (req, res) => {
    try {
        const userMessage = req.body.message;
        const response = await generateGeminiResponse(userMessage);
        res.json(response);
    } catch (error) {
        res.status(500).json({
            error: "Failed to process chat request",
            details: error.message
        });
    }
});

export default GeminiRouter;
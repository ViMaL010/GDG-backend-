import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import { GoogleAuth } from "google-auth-library";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// Load system instructions from a text file
const SYSTEM_INSTRUCTION_PATH = path.join(__dirname, "instructions.txt");

function getSystemInstructions() {
    try {
        return fs.readFileSync(SYSTEM_INSTRUCTION_PATH, "utf-8").trim();
    } catch (error) {
        return "You are an AI assistant. Provide helpful and concise answers.";
    }
}

// Initialize Google Auth with the service account key
const auth = new GoogleAuth({
    keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS || "C:/Users/suresh/Documents/GitHub/FundED-chatbot/chatbot-backend/key.json", 
    scopes: ["https://www.googleapis.com/auth/cloud-platform"]
});

async function getAccessToken() {
    try {
        const client = await auth.getClient();
        const tokenResponse = await client.getAccessToken();
        
        if (!tokenResponse.token) {
            throw new Error("Received empty token response");
        }
        return tokenResponse.token;
    } catch (error) {
        throw new Error("Failed to retrieve access token");
    }
}

app.post("/chat", async (req, res) => {
    try {
        const userMessage = req.body.message;
        const accessToken = await getAccessToken();
        
        const PROJECT_ID = "amazing-insight-452906-e3";
        const LOCATION_ID = "us-central1";
        const MODEL_ID = "gemini-2.0-flash-001";
        const API_ENDPOINT = `https://us-central1-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION_ID}/publishers/google/models/${MODEL_ID}:generateContent`;
        
        const requestBody = {
            contents: [
                {
                    role: "user",
                    parts: [{ text: userMessage }]
                }
            ],
            systemInstruction: {
                parts: [
                    {
                        text: getSystemInstructions() // Load instructions dynamically
                    }
                ]
            },
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 256,
                topP: 0.95
            }
        };

        const response = await fetch(API_ENDPOINT, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${accessToken}`
            },
            body: JSON.stringify(requestBody)
        });

        const data = await response.json();

        const botMessage = 
            data.candidates?.[0]?.content?.parts?.[0]?.text || 
            data.candidates?.[0]?.text || 
            (data.candidates && data.candidates.length > 0 ? 
                JSON.stringify(data.candidates[0]) : 
                "Sorry, I couldn't understand that.");

        res.json({ message: botMessage });
    } catch (error) {
        res.status(500).json({ 
            error: "Failed to process chat request", 
            details: error.message 
        });
    }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

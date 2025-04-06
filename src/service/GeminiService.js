import dotenv from "dotenv";
import { GoogleAuth } from "google-auth-library";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import os from "os";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load system instructions from a text file
const SYSTEM_INSTRUCTION_PATH = path.join(__dirname, "instructions.txt");
function getSystemInstructions() {
    try {
        return fs.readFileSync(SYSTEM_INSTRUCTION_PATH, "utf-8").trim();
    } catch (error) {
        return "You are an AI assistant. Provide helpful and concise answers.";
    }
}

// Create temp directory path for credentials (using OS temp directory)
const TEMP_CREDENTIALS_PATH = path.join(os.tmpdir(), "temp-google-creds.json");

// Initialize Google Auth directly from credentials JSON if available
let authOptions = {};

if (process.env.GOOGLE_CREDENTIALS) {
    try {
        // Parse the JSON string directly instead of writing to file
        const credentials = process.env.GOOGLE_CREDENTIALS || "/etc/secrets/key.json";
        const parsedCredentials = JSON.parse(credentials);
        authOptions = {
            credentials: parsedCredentials,
            scopes: ["https://www.googleapis.com/auth/cloud-platform"]
        };
        
        console.log("credentials: ",credentials.client_email); 
    } catch (err) {
        // Fallback to writing the file if parsing fails
        try {
            fs.writeFileSync(TEMP_CREDENTIALS_PATH, process.env.GOOGLE_CREDENTIALS);
            authOptions = {
                keyFile: TEMP_CREDENTIALS_PATH,
                scopes: ["https://www.googleapis.com/auth/cloud-platform"]
            };
        } catch (fileErr) {
            console.error("Error handling service account credentials:", fileErr);
            // Final fallback to path-based credentials
            authOptions = {
                keyFile: process.env.GOOGLE_CREDENTIALS_JSON || path.join(__dirname, "key.json"),
                scopes: ["https://www.googleapis.com/auth/cloud-platform"]
            };
        }
    }
} else {
    // Fallback if no credentials in environment
    authOptions = {
        keyFile: process.env.GOOGLE_CREDENTIALS_JSON || path.join(__dirname, "key.json"),
        scopes: ["https://www.googleapis.com/auth/cloud-platform"]
    };
}

const auth = new GoogleAuth(authOptions);

async function getAccessToken() {
    try {
        const client = await auth.getClient();
        const tokenResponse = await client.getAccessToken();
        if (!tokenResponse.token) {
            throw new Error("Received empty token response");
        }
        console.log("Successfully retrieved access token");
        return tokenResponse.token;
    } catch (error) {
        console.error("Auth error details:", error);
        throw new Error(`Failed to retrieve access token: ${error.message}`);
    }
}

export async function generateGeminiResponse(userMessage) {
    try {
        console.log("Requesting access token...");
        const accessToken = await getAccessToken();
        
        const PROJECT_ID = "amazing-insight-452906-e3";
        const LOCATION_ID =  "us-central1";
        const MODEL_ID = "gemini-2.0-flash-001";
        
        console.log(`Using project: ${PROJECT_ID}, location: ${LOCATION_ID}, model: ${MODEL_ID}`);
        
        const API_ENDPOINT = `https://${LOCATION_ID}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION_ID}/publishers/google/models/${MODEL_ID}:generateContent`;
        
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
                        text: getSystemInstructions()
                    }
                ]
            },
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 256,
                topP: 0.95
            }
        };

        console.log(`Sending request to Gemini API: ${API_ENDPOINT}`);
        
        const response = await fetch(API_ENDPOINT, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${accessToken}`
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`API response error (${response.status}): ${errorText}`);
            throw new Error(`API error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        console.log("Received API response:", JSON.stringify(data).substring(0, 200) + "...");
        
        const botMessage =
            data.candidates?.[0]?.content?.parts?.[0]?.text ||
            data.candidates?.[0]?.text ||
            (data.candidates?.length
                ? JSON.stringify(data.candidates[0])
                : "Sorry, I couldn't understand that.");
        
        return { message: botMessage };
    } catch (error) {
        console.error("Gemini API error:", error);
        throw new Error(`Failed to process chat request: ${error.message}`);
    }
}
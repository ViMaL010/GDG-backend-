// import { validateGithubUsername, validateLeetcodeUsername } from "../controllers/AIController";
import express from "express";
import axios from "axios";
import { calculateScore, validateField, validateInputs } from "../controllers/AIController.js";

// Configure axios with a timeout and user agent
axios.defaults.timeout = 10000;
axios.defaults.headers.common['User-Agent'] = 'AI-Score-Validator/1.0';

// Access environment variables
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const LEETCODE_SESSION_TOKEN = process.env.LEETCODE_SESSION_TOKEN;
const UNOFFICIAL_LEETCODE_API_ENDPOINT = process.env.UNOFFICIAL_LEETCODE_API_ENDPOINT;

// Cache for API responses to avoid rate limiting
const apiRequestCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minute cache

const AIRouter = express.Router();

AIRouter.post('/validate-field', validateField); 
AIRouter.post('/validate-inputs', validateInputs); 
AIRouter.post('/calculate-score', calculateScore); 


export default AIRouter;
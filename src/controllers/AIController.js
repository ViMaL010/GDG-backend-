import express from 'express';
import { spawn } from 'child_process';
import axios from 'axios';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

// Define __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure axios with a timeout and user agent
axios.defaults.timeout = 10000;
axios.defaults.headers.common['User-Agent'] = 'AI-Score-Validator/1.0';

// Access environment variables
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const LEETCODE_SESSION_TOKEN = process.env.LEETCODE_SESSION_TOKEN;
const UNOFFICIAL_LEETCODE_API_ENDPOINT = process.env.UNOFFICIAL_LEETCODE_API_ENDPOINT;

// For debugging
//console.log('Environment variables loaded:');
//console.log('- GITHUB_TOKEN available:', !!GITHUB_TOKEN);
//console.log('- LEETCODE_SESSION_TOKEN available:', !!LEETCODE_SESSION_TOKEN);
//console.log('- LEETCODE_API available:', !!UNOFFICIAL_LEETCODE_API_ENDPOINT);

// Cache for API responses to avoid rate limiting
const apiRequestCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minute cache

// Improved GitHub validation that checks the actual website instead of the API
async function validateGithubUsername(username) {
    if (!username) {
        return { valid: false, message: "GitHub username is required" };
    }
    
    // Normalize the username
    username = username.trim();
    
    // Check cache first
    const cacheKey = `github-user-${username}`;
    if (apiRequestCache.has(cacheKey)) {
        const cachedResult = apiRequestCache.get(cacheKey);
        if (Date.now() - cachedResult.timestamp < CACHE_TTL) {
            return cachedResult.result;
        }
    }
    
    try {
        // Try to access the GitHub profile page directly
        const response = await axios.get(`https://github.com/${username}`, {
            validateStatus: function (status) {
                return status < 500; // Accept all responses to check status
            }
        });
        
        const result = { 
            valid: response.status === 200, 
            message: response.status !== 200 ? "GitHub username not found" : "" 
        };
        
        // Cache the result
        apiRequestCache.set(cacheKey, {
            timestamp: Date.now(),
            result: result
        });
        
        return result;
    } catch (error) {
        console.log(`GitHub username validation error: ${error.message}`);
        return { valid: false, message: "Could not validate GitHub username" };
    }
}

// Improved LeetCode validation
async function validateLeetcodeUsername(username) {
    if (!username) {
        return { valid: false, message: "LeetCode username is required" };
    }
    
    // Normalize the username
    username = username.trim();
    
    // Check cache first
    const cacheKey = `leetcode-user-${username}`;
    if (apiRequestCache.has(cacheKey)) {
        const cachedResult = apiRequestCache.get(cacheKey);
        if (Date.now() - cachedResult.timestamp < CACHE_TTL) {
            return cachedResult.result;
        }
    }
    
    try {
        // Try GraphQL API first if credentials are available
        if (UNOFFICIAL_LEETCODE_API_ENDPOINT && LEETCODE_SESSION_TOKEN) {
            try {
                const query = {
                    query: `
                        query userProfile($username: String!) {
                            matchedUser(username: $username) {
                                username
                            }
                        }
                    `,
                    variables: {
                        username: username
                    }
                };
                
                const response = await axios.post(UNOFFICIAL_LEETCODE_API_ENDPOINT, query, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Cookie': `LEETCODE_SESSION=${LEETCODE_SESSION_TOKEN}`
                    }
                });
                
                const result = { 
                    valid: !!response.data?.data?.matchedUser, 
                    message: response.data?.data?.matchedUser ? "" : "LeetCode username not found" 
                };
                
                // Cache the result
                apiRequestCache.set(cacheKey, {
                    timestamp: Date.now(),
                    result: result
                });
                
                return result;
            } catch (graphqlError) {
                console.log(`LeetCode GraphQL validation error: ${graphqlError.message}`);
                // Fall through to the fallback method
            }
        }
        
        // Fallback to checking the user's profile page directly
        const response = await axios.get(`https://leetcode.com/${username}`, {
            validateStatus: function (status) {
                return status < 500; // Accept all responses to check status
            }
        });
        
        const result = { 
            valid: response.status === 200, 
            message: response.status !== 200 ? "LeetCode username not found" : "" 
        };
        
        // Cache the result
        apiRequestCache.set(cacheKey, {
            timestamp: Date.now(),
            result: result
        });
        
        return result;
    } catch (error) {
        console.log(`LeetCode username validation error: ${error.message}`);
        return { valid: false, message: "Could not validate LeetCode username" };
    }
}

// Improved GitHub repository validation
async function validateGithubRepo(repoUrl) {
    if (!repoUrl) {
        return { valid: false, message: "Repository URL is required" };
    }
    
    // Normalize the URL
    repoUrl = repoUrl.trim();
    
    if (!repoUrl.startsWith("https://github.com/")) {
        return { valid: false, message: "URL must be a GitHub repository" };
    }
    
    // Check cache first
    const cacheKey = `github-repo-${repoUrl}`;
    if (apiRequestCache.has(cacheKey)) {
        const cachedResult = apiRequestCache.get(cacheKey);
        if (Date.now() - cachedResult.timestamp < CACHE_TTL) {
            return cachedResult.result;
        }
    }
    
    try {
        // Extract owner/repo from URL
        const urlWithoutGit = repoUrl.endsWith('.git') 
            ? repoUrl.slice(0, -4) 
            : repoUrl;
            
        const parts = urlWithoutGit.replace("https://github.com/", "").split("/");
        if (parts.length < 2 || !parts[0] || !parts[1]) {
            return { valid: false, message: "Invalid repository URL format" };
        }
        
        // Access the repository page directly
        const response = await axios.get(urlWithoutGit, {
            validateStatus: function (status) {
                return status < 500; // Accept all responses to check status
            }
        });
        
        const result = { 
            valid: response.status === 200, 
            message: response.status !== 200 ? "Repository not found" : "" 
        };
        
        // Cache the result
        apiRequestCache.set(cacheKey, {
            timestamp: Date.now(),
            result: result
        });
        
        return result;
    } catch (error) {
        console.log(`GitHub repo validation error: ${error.message}`);
        return { valid: false, message: "Could not validate GitHub repository" };
    }
}

// Endpoint to validate a single field
export const validateField = async (req, res) => {
    const { field, value } = req.body;
    
    if (!field || value === undefined) {
        return res.status(400).json({ 
            success: false, 
            error: "Missing field or value parameter" 
        });
    }
    
    try {
        let result;
        switch (field) {
            case 'github_username':
                result = await validateGithubUsername(value);
                break;
            case 'leetcode_username':
                result = await validateLeetcodeUsername(value);
                break;
            case 'repo_url1':
            case 'repo_url2':
                result = await validateGithubRepo(value);
                break;
            default:
                return res.status(400).json({ 
                    success: false, 
                    error: `Unknown field: ${field}` 
                });
        }
        
        res.json({
            success: result.valid,
            field: field,
            validation: result
        });
    } catch (error) {
        console.error(`Field validation error for ${field}:`, error);
        res.status(500).json({ 
            success: false, 
            field: field,
            error: "Validation service error" 
        });
    }
};

// Endpoint to validate all inputs
export const validateInputs = async (req, res) => {
    const { username, leetcode, repo1, repo2 } = req.body;
    
    try {
        // Run all validations in parallel
        const [githubResult, leetcodeResult, repo1Result, repo2Result] = await Promise.all([
            validateGithubUsername(username),
            validateLeetcodeUsername(leetcode),
            validateGithubRepo(repo1),
            validateGithubRepo(repo2)
        ]);
        
        const validationResults = {
            github_username: githubResult,
            leetcode_username: leetcodeResult,
            repo_url1: repo1Result,
            repo_url2: repo2Result
        };

        console.log({
            github_username: githubResult,
            leetcode_username: leetcodeResult,
            repo_url1: repo1Result,
            repo_url2: repo2Result});
        
        const allValid = Object.values(validationResults).every(result => result.valid);
        
        res.json({
            success: allValid,
            validation: validationResults
        });
    } catch (error) {
        console.error("Validation error:", error);
        res.status(500).json({ 
            success: false, 
            error: "Validation service error" 
        });
    }
};

// Endpoint to calculate the AI score
export const calculateScore =  async (req, res) => {
    const { username, leetcode, repo1, repo2, income } = req.body;

    console.log(`Received request: ${JSON.stringify(req.body)}`);

    try {
        // First validate all inputs
        const [githubResult, leetcodeResult, repo1Result, repo2Result] = await Promise.all([
            validateGithubUsername(username),
            validateLeetcodeUsername(leetcode),
            validateGithubRepo(repo1),
            validateGithubRepo(repo2)
        ]);
        
        const validationResults = {
            github_username: githubResult,
            leetcode_username: leetcodeResult,
            repo_url1: repo1Result,
            repo_url2: repo2Result
        };
        
        const allValid = Object.values(validationResults).every(result => result.valid);
        
        if (!allValid) {
            return res.status(400).json({
                success: false,
                validation: validationResults,
                error: "Validation failed"
            });
        }

        // Ensure income is a valid number
        const incomeValue = parseFloat(income);
        if (isNaN(incomeValue)) {
            return res.status(400).json({
                success: false,
                error: "Income must be a valid number"
            });
        }

        
        // Correct path to skillscore.py
        const pythonScriptPath = path.join(__dirname, 'skillscore.py');

        // Run the Python script
        // If validation passes, proceed with Python script execution
        const pythonProcess = spawn('python', [pythonScriptPath, username, leetcode, repo1, repo2, incomeValue.toString()]);

        

        let pythonOutput = '';
        let pythonError = '';

        pythonProcess.stdout.on('data', (data) => {
            pythonOutput += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
            pythonError += data.toString();
            console.error(`Python error: ${data.toString()}`);
        });

        pythonProcess.on('close', (code) => {
            console.log(`Python script finished with code: ${code}`);
            console.log("Raw Python Output:", `"${pythonOutput}"`);
            
            if (code !== 0) {
                return res.status(500).json({
                    success: false,
                    error: pythonError || "Python script execution failed"
                });
            }

            try {
                // First try to parse the output as JSON
                try {
                    const jsonResult = JSON.parse(pythonOutput.trim());
                    if (jsonResult.success === false) {
                        return res.status(400).json(jsonResult);
                    }
                    if (typeof jsonResult.ai_score === 'number') {
                        return res.json({
                            success: true,
                            ai_score: jsonResult.ai_score
                        });
                    }
                } catch (jsonError) {
                    // Not JSON, continue with number extraction
                }
                
                if (!pythonOutput.trim()) {
                    throw new Error("Python script returned an empty response");
                }

                // Extract only the last numeric value from Python output
                const matches = pythonOutput.match(/[-+]?[0-9]*\.?[0-9]+/g);
                if (!matches || matches.length === 0) {
                    throw new Error("No valid numeric score found in Python output");
                }

                const score = parseFloat(matches[matches.length - 1]); // Get last number found

                res.json({ success: true, ai_score: score });
                console.log("AI Score:", score);
            } catch (error) {
                console.error("Error parsing Python response:", error);
                res.status(500).json({ 
                    success: false, 
                    error: "Invalid response from Python script",
                    details: error.message,
                    rawOutput: pythonOutput
                });
            }
        });
    } catch (error) {
        console.error("Server error:", error);
        res.status(500).json({ 
            success: false, 
            error: "Server error during processing",
            details: error.message
        });
    }
};
// Simple endpoint to check if server is running 
// app.get('/health', (req, res) => {
//     res.json({ status: 'ok', message: 'Server is running' });
// });

// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => {
//     console.log(`Server running on http://localhost:${PORT}`);
// });
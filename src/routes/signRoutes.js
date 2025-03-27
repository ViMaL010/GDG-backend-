import express from "express";
import { authenticateUser, loginAuth, signupAuth } from "../middlewares/auth.js";

const signRoutes = express.Router();

// Match Student to Scholarships
signRoutes.post('/login', loginAuth);
signRoutes.post('/signup', signupAuth);

export default signRoutes;

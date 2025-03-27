import express from "express";
import { getAllScholarships, getScholarships, getSingleScholarship, storeMatchedScholarships } from "../controllers/scholarshipController.js";
import studentDetails from "../controllers/studentController.js";
import { authenticateUser } from "../middlewares/auth.js";

const router = express.Router();

// Match Student to Scholarships
router.post("/match", authenticateUser, storeMatchedScholarships);
router.post("/studentDetails",authenticateUser, studentDetails);
router.post("/getScholarships",authenticateUser, getScholarships);
router.post("/getAllScholarships",authenticateUser, getAllScholarships);
router.get("/getSingleScholarship/:Id",authenticateUser, getSingleScholarship);

export default router;

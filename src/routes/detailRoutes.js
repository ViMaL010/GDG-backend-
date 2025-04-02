import express from "express";
import { authenticateUser } from "../middlewares/auth.js";
import { checkUserExist, CreateUserDetails, getUserDetails } from "../controllers/userDetailsController.js";
// import {fileupload}

const UserDetailRouter = express.Router();

// Match Student to Scholarships
// UserDetailRouter.post("/filehandler", authenticateUser, fileUploadH);
// UserDetailRouter.get('/download/:filename' , authenticateUser, fileDownload);
UserDetailRouter.post('/uploadUserDetails', authenticateUser, CreateUserDetails)
UserDetailRouter.post('/check',authenticateUser ,checkUserExist)
UserDetailRouter.get('/getUserDetails', authenticateUser, getUserDetails)

export default UserDetailRouter;

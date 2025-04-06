import { UserDetails } from "../models/UserDetailsModel.js";
// 1️⃣ Route to create and store user information
export const CreateUserDetails = async (req, res) => {
  const { personalInfo } = req.body;

  try {
    // Check if the user already exists based on email or mobile number
    const existingUser = await UserDetails.findOne({
      $or: [
        { 'personalInfo.email': personalInfo.email },
        { 'personalInfo.mobileNumber': personalInfo.mobileNumber }
      ]
    });

    if (existingUser) {
      return res.status(400).json({ message: 'User already exists!' });
    }

    // Create a new user and save to DB
    const newUser = new UserDetails(req.body);
    await newUser.save();
    res.status(201).json({ message: 'User created successfully!', user: newUser });
  } catch (err) {
    res.status(500).json({ message: 'Error saving user', error: err.message });
  }
};

// 2️⃣ Route to check if user already exists
export const checkUserExist = async (req, res) => {
  const { email, mobileNumber } = req.body;

  try {
    // Check for an existing user by email or mobile number
    const existingUser = await UserDetails.findOne({
      $or: [
        { 'personalInfo.email': email },
        { 'personalInfo.mobileNumber': mobileNumber }
      ]
    });

    console.log(existingUser);

    if (existingUser) {
      res.status(200).json({ message: 'User already exists' , user: existingUser });
    } else {
      res.status(404).json({ message: 'User does not exist' });
    }
  } catch (err) {
    res.status(500).json({ message: 'Error checking user', error: err.message });
  }
};

export const getUserDetails = async (req, res) => {
  const { email } = req.body; // Extract email directly from req.body
  
  try {
    const existingUser = await UserDetails.findOne({
      "personalInfo.email": email // Corrected query to match the structure
    });

    console.log(existingUser); // Logging the existing user object

    if (!existingUser) {
      return res.status(404).json({ msg: "User not found" });
    }
    else{    
      res.json({
      response: existingUser // Sending existing user data as response
    });
    }


  } catch (e) {
    res.status(500).json({
      msg: "Error checking user"
    });
  }
}



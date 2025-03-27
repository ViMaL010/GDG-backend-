import mongoose from "mongoose";

const Schema = mongoose.Schema;

// Define a schema for the user's information
const userSchema = new Schema({
  personalInfo: {
    fullName: { type: String, required: true },
    dateOfBirth: { type: String, required: true },
    gender: { type: String, required: true },
    mobileNumber: { type: String, required: true },
    email: { type: String, required: true }
  },
  academicInfo: {
    highestQualification: { type: String, required: true },
    currentCourse: { type: String, required: true },
    collegeName: { type: String, required: true },
    universityName: { type: String, required: true },
  },
  fundraiserInfo: {
    fundraiserTitle: { type: String, required: true },
    fundraiserReason: { type: String, required: true },
    fundraisingGoal: { type: String, required: true },
    fundsUsage: { type: String, required: true }
  },
  financialInfo: {
    annualIncome: { type: String, required: true },
    guardianName: { type: String, required: true },
    guardianContact: { type: String, required: true }
  },
  bankDetails: {
    accountHolderName: { type: String, required: true },
    bankName: { type: String, required: true },
    accountNumber: { type: String, required: true },
    ifscCode: { type: String, required: true },
    upiId: { type: String, required: true },
  }
});

// Create a model based on the schema
export const UserDetails = mongoose.model("UserDetails", userSchema);

import mongoose from "mongoose";

const studentScholarshipSchema = new mongoose.Schema({
  // Reference to the Student model
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
    required: true
  },
  // Student email for easy querying
  studentEmail: {
    type: String,
    required: true
  },
  // Best matched scholarship (single scholarship that is considered the best fit)
  bestMatchScholarship: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Scholarship"
  },
  // Array of other eligible scholarships
  eligibleScholarships: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Scholarship"
  }],
  // Timestamps for when the matches were created/updated
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Add an index for faster queries on studentEmail
studentScholarshipSchema.index({ studentEmail: 1 });

const StudentScholarship = mongoose.model("StudentScholarship", studentScholarshipSchema);
export default StudentScholarship;
import StudentScholarship from "../models/matchedScholarshipModel.js.js";
import Scholarship from "../models/scholarshipModel.js";
import Student from "../models/studentModel.js";// Import the correct model

export const storeMatchedScholarships = async (req, res) => {
  try {
    // Validate Student Input
    const studentData = req.body;
    
    // Fetch all scholarships matching the student's category
    const scholarships = await Scholarship.find({ category: studentData.category });
    const plainScholarship = JSON.parse(JSON.stringify(scholarships));
    
    if (scholarships.length === 0) {
      return res.status(404).json({
        message: "No scholarships available for this category. Please check other categories or try again later."
      });
    }
    
    // Filter eligible scholarships
    let eligibleScholarships = plainScholarship.filter((scholarship) => {
      // Check if scholarship meets all criteria
      return (
        (scholarship.criteria.tenthMarks <= studentData.tenthMarks || scholarship.criteria.tenthMarks === 0) &&
        (scholarship.criteria.twelfthMarks <= studentData.twelfthMarks || scholarship.criteria.twelfthMarks === 0) &&
        (scholarship.criteria.CGPA <= studentData.CGPA || scholarship.criteria.CGPA === 0)
        // (scholarship.criteria.AIScore <= studentData.AIScore || scholarship.criteria.AIScore === 0)
      );
    });
    
    if (eligibleScholarships.length === 0) {
      return res.status(404).json({ message: "No eligible scholarships found based on your academic criteria." });
    }
    
    // Sort scholarships by amount (highest first)
    eligibleScholarships.sort((a, b) => b.amount - a.amount);
    
    // Assign the best scholarship
    const bestScholarship = eligibleScholarships[0];
    const otherEligibleScholarships = eligibleScholarships.slice(1);
    
    // Store the matching results in the database
    const student = await Student.findOne({ email: studentData.email });
    
    if (student) {
      // Create or update StudentScholarship record
      await StudentScholarship.findOneAndUpdate(
        { studentEmail: studentData.email },
        {
          student: student._id,
          studentEmail: studentData.email,
          bestMatchScholarship: bestScholarship._id,
          eligibleScholarships: otherEligibleScholarships.map(s => s._id),
          updatedAt: Date.now()
        },
        { upsert: true, new: true }
      );
    }
    
    res.status(200).json({
      assignedScholarship: bestScholarship,
      otherEligibleScholarships: otherEligibleScholarships.length > 0 ? otherEligibleScholarships : "No other scholarships available",
    });
  } catch (error) {
    console.error("Error matching scholarships:", error);
    res.status(500).json({ message: "Error processing scholarship matches", error: error.message });
  }
};

export const getScholarships = async (req, res) => {
  try {
    const { email } = req.body;

    // Find the student's scholarship record
    const studentScholarship = await StudentScholarship.findOne({ studentEmail: email })
      .populate("student", "name email") // Get student details
      .populate("bestMatchScholarship") // Get the best matched scholarship details
      .populate("eligibleScholarships"); // Get the list of eligible scholarships

    // If no scholarship record is found
    if (!studentScholarship) {
      return res.status(404).json({
        message: "No scholarship record found for this user."
      });
    }

    // Structure the response
    res.status(200).json({
      student: studentScholarship.student,
      bestMatchedScholarship: studentScholarship.bestMatchScholarship,
      otherEligibleScholarships: studentScholarship.eligibleScholarships.length > 0
        ? studentScholarship.eligibleScholarships
        : "No other scholarships available",
    });
  } catch (error) {
    console.error("Error fetching scholarships:", error);
    res.status(500).json({
      message: "Error retrieving scholarship details",
      error: error.message
    });
  }
};


export const getAllScholarships = async (req, res) => {
  try {
    const scholarships = await Scholarship.find(); // Await the response

    if (scholarships.length > 0) {
      return res.status(200).json({
        scholarships, // Returning scholarships directly
      });
    } else {
      return res.status(404).json({
        msg: "No scholarships found",
      });
    }
  } catch (error) {
    console.error("Error fetching scholarships:", error);
    return res.status(500).json({
      msg: "Error accessing the database",
      error: error.message, // Providing more context in error response
    });
  }
};


export const getSingleScholarship = async (req, res) =>{
  try {
        const scholarship = await Scholarship.findOne({ _id: req.params.Id });
        console.log(scholarship)
        res.json({
          "fullScholarship" : scholarship
        });
      } catch (err) {
        res.status(404).json({ error: "scholarship not found" });
      }
}
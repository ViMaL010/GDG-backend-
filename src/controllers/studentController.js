import Student from "../models/studentModel.js";  // Ensure correct path with .js

const studentDetails = async (req, res) => {
    try {
        const { AIScore, CGPA, category, email, lastName, name, requiredFunds, tenthMarks, twelfthMarks } = req.body;

        const student = await Student.create({  // Add `await`
            AIScore, CGPA, category, email, lastName, name, requiredFunds, tenthMarks, twelfthMarks
        });

        if (student) {
            return res.status(201).json({ message: "Student details added successfully" });
        } else {
            return res.status(400).json({ message: "Student details addition failed" });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const getStudentDetails = async (req, res) => {
    const { email } = req.body;
    
    try {
      const studentDetails = await Student.findOne({
        email: email
      });
      
      if (!studentDetails) {
        return res.status(404).json({ message: "Student not found" });
      }
      
      res.status(200).json(studentDetails);
    } catch (error) {
      res.status(500).json({ message: "Error fetching student details", error: error.message });
    }
  };

export default studentDetails;

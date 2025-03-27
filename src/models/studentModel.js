import mongoose from "mongoose";

const studentSchema = new mongoose.Schema({
    name: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    category: { type: String, required: true },
    CGPA: { type: Number, required: true },
    AIScore: { type: Number, required: false },
    requiredFunds: { type: Number, required: true },
    tenthMarks: { type: Number, required: true },
    twelfthMarks: { type: Number, required: true }
});

const Student = mongoose.model("Student", studentSchema);
export default Student;

import { z } from "zod";

export const studentSchema = z.object({
  studentID: z.string(),
  name: z.string(),
  tenthMarks: z.number().min(0).max(100),
  twelfthMarks: z.number().min(0).max(100),
  CGPA: z.number().min(0).max(10),
  AIScore: z.number().min(0).max(100),
  requiredFunds: z.number().min(0),
  category: z.enum(["Merit-Based", "Skill-Based"]),
});

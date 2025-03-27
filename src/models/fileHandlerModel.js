const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  fileType: String,
  fileName: String,
  filePath: String,
  uploadedAt: { type: Date, default: Date.now }
});

const File = mongoose.model('File', fileSchema);

// Save file data to DB
const saveFileToDB = async (fileData) => {
  const newFile = new File({
    fileType: fileData.mimetype,
    fileName: fileData.filename,
    filePath: fileData.path
  });
  await newFile.save();
};

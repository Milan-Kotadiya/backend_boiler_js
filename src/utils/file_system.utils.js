const fs = require("fs");
const path = require("path");
const mime = require("mime-types");
const { v4: uuidv4 } = require("uuid");
const logger = require("../logger/logger");
const { s3Client } = require("../connections/s3bucket.connection");
const { S3_BUCKET_NAME } = require("../config/dotenv.config");
const { PUBLIC_PATH } = require("../config/paths.config");

const createDirectory = (dirPath) => {
  try {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  } catch (error) {
    logger.error(`Unable to create directory: ${error?.message}`);
  }
};

const validateFile = (file, maxFileSize, allowedFileTypes) => {
  const fileType = mime.lookup(file.originalname);
  if (!allowedFileTypes.includes(fileType)) {
    throw new Error(`Invalid file type: ${fileType}`);
  }
  if (file.size > maxFileSize) {
    throw new Error(`File size exceeds the limit of ${maxFileSize} bytes`);
  }
};

const generateFileName = (originalName) => {
  const ext = path.extname(originalName);
  return `${uuidv4()}${ext}`;
};

const uploadFileToS3 = async (dirPath, fileName, fileBuffer) => {
  try {
    const s3Key = `${dirPath}/${fileName}`;

    const mimeType = mime.lookup(fileName) || "application/octet-stream";

    const params = {
      Bucket: S3_BUCKET_NAME,
      Key: s3Key,
      Body: fileBuffer,
      ContentType: mimeType,
      ACL: "private", // Change to 'public-read' if needed
    };

    const result = await s3Client.upload(params).promise();

    return {
      fileName: path.basename(result.Key),
      filePath: result.Key,
      bucket: result.Bucket,
      url: result.Location, // S3 URL
    };
  } catch (error) {
    console.error("Error uploading file to S3:", error.message);
    throw error;
  }
};

const saveFile = async (
  dirPath,
  file,
  maxFileSize = null,
  allowedFileTypes = null
) => {
  try {
    if (maxFileSize || allowedFileTypes) {
      validateFile(file, maxFileSize, allowedFileTypes);
    }
    const fileName = generateFileName(file.originalname);

    if (s3Client?.Buckets) {
      const data = await uploadFileToS3(
        dirPath,
        fileName,
        Buffer.isBuffer(file) ? file : Buffer.from(file)
      );

      return data;
    } else {
      // Save Locally
      const folderPath = path.resolve(PUBLIC_PATH, dirPath);
      const filePath = path.join(folderPath, fileName);

      createDirectory(folderPath);
      if (fs.existsSync(filePath)) {
        deleteFile(filePath);
      }
      fs.writeFileSync(
        filePath,
        Buffer.isBuffer(file) ? file : Buffer.from(file)
      );

      return {
        name: path.basename(filePath),
        size: file.length,
        basePath: folderPath,
        fullPath: filePath,
      };
    }
  } catch (error) {
    logger.error(`Unable to save file: ${error.message}`);
    throw error;
  }
};

const deleteFile = async (filePath) => {
  try {
    if (filePath.startsWith("s3://")) {
      const fileName = filePath.split("/").pop();
      await s3.deleteObject({ Bucket: bucketName, Key: fileName }).promise();
    } else {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
  } catch (error) {
    logger.error(`Unable to delete file: ${error?.message}`);
  }
};

module.exports = { saveFile, deleteFile };

const fs = require("fs");
const path = require("path");
const mime = require("mime-types");
const { v4: uuidv4 } = require("uuid");
const logger = require("../logger/logger");
const {
  s3BucketConnection,
  s3Client,
} = require("../connections/s3bucket.connection");
const { DeleteObjectCommand, PutObjectCommand } = require("@aws-sdk/client-s3");
const { S3_BUCKET_NAME, AWS_REGION } = require("../config/dotenv.config");
const { PUBLIC_PATH } = require("../config/paths.config");

const createDirectory = (dirPath) => {
  try {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  } catch (error) {
    logger.error(`Unable to create directory: ${error.message}`);
  }
};

const validateFile = (file, maxFileSize, allowedFileTypes) => {
  const fileType = mime.lookup(file.originalname);
  if (!fileType || !allowedFileTypes.includes(fileType)) {
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
    };

    const command = new PutObjectCommand(params);
    await s3Client.send(command);

    return {
      fileName,
      filePath: s3Key,
      bucket: S3_BUCKET_NAME,
      url: `https://${S3_BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/${s3Key}`,
    };
  } catch (error) {
    console.error("Error uploading file to S3:", error.message);
    throw error;
  }
};

const isS3Url = (filePath) => {
  const s3Prefix = `https://${S3_BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/`;
  return filePath.startsWith(s3Prefix);
};

const extractS3Key = (fileUrl) => {
  const s3Prefix = `https://${S3_BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/`;
  return fileUrl.startsWith(s3Prefix) ? fileUrl.replace(s3Prefix, "") : null;
};

const deleteFileFromS3 = async (fileUrl) => {
  try {
    const s3Key = extractS3Key(fileUrl);

    if (!s3Key) {
      console.log("Invalid S3 URL format.");
      return;
    }

    const deleteParams = {
      Bucket: S3_BUCKET_NAME,
      Key: s3Key,
    };

    const command = new DeleteObjectCommand(deleteParams);
    await s3Client.send(command);

    console.log(`File deleted successfully: ${fileUrl}`);
  } catch (error) {
    console.error("Error deleting file from S3:", error);
  }
};

const saveFile = async (dirPath, file, maxFileSize, allowedFileTypes) => {
  try {
    const isS3Ready = await s3BucketConnection();

    if (maxFileSize && allowedFileTypes) {
      validateFile(file, maxFileSize, allowedFileTypes);
    }

    const fileName = generateFileName(file.originalname);

    if (isS3Ready) {
      return await uploadFileToS3(dirPath, fileName, file.buffer);
    } else {
      const folderPath = path.resolve(PUBLIC_PATH, dirPath);
      const filePath = path.join(folderPath, fileName);

      createDirectory(folderPath);

      if (fs.existsSync(filePath)) {
        deleteFile(filePath);
      }

      fs.writeFileSync(filePath, file.buffer);

      return {
        name: path.basename(filePath),
        size: file.size,
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
    if (isS3Url(filePath)) {
      await deleteFileFromS3(filePath);
    } else {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
  } catch (error) {
    logger.error(`Unable to delete file: ${error.message}`);
  }
};

module.exports = { saveFile, deleteFile };

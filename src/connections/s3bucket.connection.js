const { S3Client, ListBucketsCommand } = require("@aws-sdk/client-s3");
const logger = require("../logger/logger");
const {
  AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY,
  AWS_REGION,
} = require("../config/dotenv.config");

// ✅ Create S3 Client
const s3Client = new S3Client({
  region: AWS_REGION,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
  },
});

// ✅ Function to Verify S3 Bucket Connection
const s3BucketConnection = async () => {
  try {
    const command = new ListBucketsCommand({});
    const result = await s3Client.send(command);

    if (result.Buckets) {
      logger.info(
        `✅ S3 Connection Successful: Found ${result.Buckets.length} Buckets.`
      );
      return true;
    } else {
      logger.error("❌ S3 Connection Failed: No Buckets Found.");
      return false;
    }
  } catch (error) {
    logger.error(`❌ Error connecting to S3: ${error.message}`);
    return false;
  }
};

module.exports = { s3Client, s3BucketConnection };

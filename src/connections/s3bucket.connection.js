const { S3Client, ListBucketsCommand } = require("@aws-sdk/client-s3");
const {
  AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY,
  AWS_REGION,
} = require("../config/dotenv.config");
const logger = require("../logger/logger");

const s3Client = new S3Client({
  region: AWS_REGION,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
  },
});

const s3BucketConnection = async () => {
  try {
    const command = new ListBucketsCommand({});
    const result = await s3Client.send(command);
    logger.info(`S3 Buckets: ${JSON.stringify(result.Buckets)}`);
  } catch (error) {
    logger.error(`Error connecting to S3: ${error.message}`);
  }
};

module.exports = { s3Client, s3BucketConnection };

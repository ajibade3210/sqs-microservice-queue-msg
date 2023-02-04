require("dotenv").config();
const { SQSClient } = require("@aws-sdk/client-sqs");
const sqsConfig = {
  region: "us-east-1",
  credentials: {}
};
sqsConfig.credentials.accessKeyId = process.env.AWS_ACCESS_KEY_ID;

sqsConfig.credentials.secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

console.log(sqsConfig);
const sqs = new SQSClient(sqsConfig);




// exports.QUEUE_URL =
//   process.env.SQS_QUEUE_URL ||
//   "http://localhost:4566/000000000000/sqs-consumer-data";

// exports.sqsConfig = sqsConfig;

module.exports = sqs;

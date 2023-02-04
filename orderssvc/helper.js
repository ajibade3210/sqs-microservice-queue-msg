require("dotenv").config();
const axios = require("axios");
const splitArray = require("split-array");
const AWS = require("aws-sdk");
const { Consumer } = require("sqs-consumer");
const sqs = require("../sqs");

// Configure the region
AWS.config.update({ region: "us-east-1" });
// Create an SQS service object

const sqsSetup = new AWS.SQS({ apiVersion: "2012-11-05" });

const queueUrl = process.env.SEND;
const recieveQueueUrl = process.env.RECIEVE;

const getEmp = async email => {
  const createUserUrl = `http://localhost:3000/employee?email=${email}`;
  console.log({ createUserUrl });

  const response = await axios.get(createUserUrl, {
    headers: { accept: "application/json" },
  });

  return response.data;
};

// console.log(await getEmp("rims@scello"));

const queueMessages = async emp => {
  try {
    const employees = splitArray(emp, 5);
    for (const arr of employees) {
      let params = {
        QueueUrl: queueUrl,
        MessageBody: "",
      };

      params.MessageBody = JSON.stringify(arr);

      // Send the order data to the SQS queue
      // console.log("Moving");
      let done = await sqsSetup.sendMessage(params).promise();
      // console.log("Stopping", done);
    }
    return 201;
  } catch (e) {
    throw new Error(e.message);
  }
};

// const recieveQueueMsg = async function (emp) {
let employee;
let p = 0;
const consumer = Consumer.create({
  queueUrl: recieveQueueUrl,
  sqs,
  handleMessage: message => {
    console.log("Received a message");
    employee = JSON.parse(message.Body);
    p += 1;
    // employee.map(async emp => {
    //   // console.log(p, emp);
    //   let newEmp = await getEmp(emp.email);
      console.log(p,employee);
    // });

  },
});
console.log("END");
consumer.on("error", err => {
  // eslint-disable-next-line no-console
  console.log("RECEIVED SQS ERROR:");
  // eslint-disable-next-line no-console
  console.error(err.message);
});

consumer.on("processing_error", err => {
  // eslint-disable-next-line no-console
  console.log("RECEIVED SQS PROCESSING ERROR:");
  // eslint-disable-next-line no-console
  console.error(err.message);
});

consumer.on("timeout_error", err => {
  // eslint-disable-next-line no-console
  console.log("RECEIVED SQS TIMEOUT ERROR:");
  // eslint-disable-next-line no-console
  console.error(err.message);
});

consumer.on("response_processed", () => {
  // eslint-disable-next-line no-console
  console.log("RECEIVED SQS RESPONSE PROCESSED:");
});

consumer.on("stopped", () => {
  // eslint-disable-next-line no-console
  console.log("RECEIVED SQS STOPPED:");
});

consumer.on("empty", () => {
  // eslint-disable-next-line no-console
  console.log("RECEIVED SQS EMPTY:");
});

console.log("Emails service is running");
consumer.start();
// };

module.exports = { queueMessages, getEmp, consumer };

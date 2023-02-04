require("dotenv").config();
const AWS = require("aws-sdk");
const { Consumer } = require("sqs-consumer");
const sqs = require("../sqs");
const db = require("./models");
const axios = require("axios");
// const splitArray = require("split-array");

// Configure the region
// const queueUrl = process.env.SEND_MESSAGE;
// const recieveQueueUrl = process.env.RECIEVE_MESSAGE;

const queueUrl = "https://sqs.us-east-1.amazonaws.com/380714923639/testQueue";
const recieveQueueUrl =
  "https://sqs.us-east-1.amazonaws.com/380714923639/sendQueue";

AWS.config.update({ region: "us-east-1" });
const sqsSetup = new AWS.SQS({ apiVersion: "2012-11-05" });

const creation = async data => {
  const emp = await db.Employee.create(data);
  return emp;
};

// Send Msg...
const queueMessages = async (emp,p) => {
  try {
    for (const arr of emp) {
      let params = {
        QueueUrl: recieveQueueUrl,
        MessageBody: "",
      };
      params.MessageBody = JSON.stringify(arr);

      let done = await sqsSetup.sendMessage(params).promise();
      console.log("Stopping", done, p);
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
  queueUrl: queueUrl,
  sqs,
  handleMessage: async message => {
    let data =[]
    console.log("<--Received a message-->");
    employee = JSON.parse(message.Body);
    p += 1;
    employee.map(emp => {
      console.log(p, emp);
      // creation(emp);
    });
    // console.log('KKKKK---->', employee);
    //   let gio = await creation(employee);
    //   data = [gio.dataValues]
    //   queueMessages(data,p);
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

module.exports = { queueMessages, consumer, creation };

require("dotenv").config();
const express = require("express");
const axios = require("axios");
const employees = require("./employees");
const port = process.argv.slice(2)[0] || 9100;
const AWS = require("aws-sdk");
const { getEmp, queueMessages } = require("./helper");
const app = express();

console.log("LENGTH========", employees.length);

app.use(express.json());

// the new endpoint
app.get("/order", async (req, res) => {
  const response = await queueMessages(employees);
  res.send({
    message: response
  });
});

app.get("/index", (req, res) => {
  res.send("Welcome to NodeShop Orders.");
});

app.get("/emp", async (req, res) => {
  const email = req.query.email;
  let doo = await getEmp(email);
  res.send(doo);
});

// const getEmp = async (email) => {
//   const createUserUrl = `http://localhost:3000/emp?email=${email}`;
//   console.log({ createUserUrl });

//   const response = await axios.get(createUserUrl, {headers: { accept: "application/json"}});

//         return response.data;
// }

console.log(`Orders service listening on port ${port}`);
app.listen(port);

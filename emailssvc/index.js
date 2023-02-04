require("dotenv").config();
const express = require("express");
const db = require("./config/db");
const { creation, consumer } = require("./helper");

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.post("/emp", async (req, res) => {
  const data = req.body;
  try {
    const emp = await creation(data);
    console.log(emp)
    res.send(emp);
  } catch (err) {k
    res.send(err.message);
  }
});

app.get("/employee", async (req, res) => {
  // Read One Movie
  const email = req.query.email;
  try {
    const emp = await db.Employee.findOne({
      where: { email },
    });
    if (!emp) {
      return res.send({ Emp: "Employee not found" });
    }
    res.send({ emp });
  } catch (err) {
    res.send(err);
  }
});

consumer.start();

console.log(`Orders service listening on port ${port}`);
app.listen(port);

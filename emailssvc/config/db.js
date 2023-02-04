const db = require("../models/index");
// Sync database
db.sequelize
  .sync()
  .then(() => {
    console.log("Db connected.");
  })
  .catch(err => {
    console.log("Failed to sync db:  " + err.message);
  });

module.exports = db;
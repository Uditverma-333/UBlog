const mongoose = require("mongoose");
require("dotenv").config();

// Explicitly set strictQuery
mongoose.set('strictQuery', true); // Or set it to false if you prefer that behavior

const connection = mongoose.connect(process.env.ATLAS_URL);

module.exports = {
  connection,
};

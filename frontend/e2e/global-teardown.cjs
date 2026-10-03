const { connect } = require("./database.cjs");

module.exports = async () => {
  const mongoose = await connect();
  await mongoose.connection.db.dropDatabase();
  await mongoose.disconnect();
};

const mongoose = require("../../backend/node_modules/mongoose");

const databaseUri = () => process.env.E2E_MONGO_URI || "mongodb://127.0.0.1:27017/marineaegis_e2e";

const assertIsolatedDatabase = (uri) => {
  const name = new URL(uri).pathname.replace(/^\//, "").split("?")[0];
  if (!name.endsWith("_e2e")) {
    throw new Error(`Refusing to modify non-E2E MongoDB database: ${name || "(missing)"}`);
  }
};

const connect = async () => {
  const uri = databaseUri();
  assertIsolatedDatabase(uri);
  await mongoose.connect(uri);
  return mongoose;
};

module.exports = { connect, databaseUri };

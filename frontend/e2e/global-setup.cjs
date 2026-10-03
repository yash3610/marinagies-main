const bcrypt = require("../../backend/node_modules/bcryptjs");
const { connect } = require("./database.cjs");
const User = require("../../backend/src/models/User");
const Vessel = require("../../backend/src/models/Vessel");

module.exports = async () => {
  const mongoose = await connect();
  await mongoose.connection.db.dropDatabase();

  await User.create({
    name: "E2E Administrator",
    email: "e2e-admin@marineaegis.test",
    password: await bcrypt.hash("MarineE2E@2026", 4),
    role: "ADMIN",
    active: true,
    allVessels: true,
  });

  await Vessel.create({
    name: "MV E2E Guardian",
    vesselId: "E2E-001",
    imoNumber: "9990001",
    vesselType: "CONTAINER",
    status: "ONLINE",
    riskScore: 12,
    riskLevel: "LOW",
    latitude: 18.94,
    longitude: 72.835,
    speed: 14.5,
    heading: 285,
    destination: "Dubai",
    route: { origin: "Mumbai", destination: "Dubai" },
    isActive: true,
  });

  await mongoose.disconnect();
};

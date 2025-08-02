import env from "../config/env.js";

import mongoose from "mongoose";

const MONGO_URL = env.MONGO_URL;

mongoose.connection.once("open", () => {
  console.log("Mongoose connection ready!");
});

mongoose.connection.on("error", err => {
  console.error("Error connecting to mongoose", err);
});

async function mongoConnect() {
  await mongoose.connect(MONGO_URL);
}

async function mongoDisconnect() {
  await mongoose.disconnect();
}

export { mongoConnect, mongoDisconnect };

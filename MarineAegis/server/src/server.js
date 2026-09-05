import "dotenv/config";
import { createApp } from "./app.js";
import { connectDatabase } from "./config/db.js";

const port = Number(process.env.PORT) || 5000;

await connectDatabase(process.env.MONGODB_URI);

createApp().listen(port, () => {
  console.log(`MarineAegis API listening on http://localhost:${port}`);
});

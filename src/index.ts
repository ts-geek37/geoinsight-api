import cors from "cors";
import dotenv from "dotenv";
import express from "express";

import routes from "./routes";
import { runRFMSeeder } from "./run";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use("/", routes);

// // Run the script
// runRFMSeeder().catch((err) => {
//   console.error("❌ Error running RFM seeder:", err);
//   process.exit(1);
// });

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

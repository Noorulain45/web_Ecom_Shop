import * as dotenv from "dotenv";
dotenv.config({ path: ".env" });

import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const MONGODB_URI = process.env.MONGODB_URI as string;
if (!MONGODB_URI) throw new Error("MONGODB_URI not set");

const UserSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, unique: true, lowercase: true },
    password: String,
    role: { type: String, enum: ["user", "admin", "superadmin"], default: "user" },
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model("User", UserSchema);

const admins = [
  { name: "Admin", email: "admin@arik.com", password: "admin123", role: "admin" },
  { name: "Super Admin", email: "superadmin@arik.com", password: "admin123", role: "superadmin" },
];

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB");

  for (const a of admins) {
    const hashed = await bcrypt.hash(a.password, 10);
    await User.findOneAndUpdate(
      { email: a.email },
      { name: a.name, email: a.email, password: hashed, role: a.role },
      { upsert: true, new: true }
    );
    console.log(`✓ ${a.role}: ${a.email}`);
  }

  await mongoose.disconnect();
  console.log("Done.");
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});

import fs from "fs";
import path from "path";
import { pool } from "./pool";

export async function migrate(): Promise<void> {
  const schema = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");
  await pool.query(schema);
  console.log("[db] Schema applied");
}

if (require.main === module) {
  migrate()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

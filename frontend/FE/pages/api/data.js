import path from "path";
import { promises as fs } from "fs";

export default async function handler(req, res) {
  const { filename } = req.query;

  if (!filename) {
    return res.status(400).json({ error: "Filename is required" });
  }

  try {
    const jsonDirectory = path.join(process.cwd(), "data");
    const fileContents = await fs.readFile(
      path.join(jsonDirectory, `${filename}.json`),
      "utf8"
    );
    res.status(200).json(JSON.parse(fileContents));
  } catch (error) {
    res.status(500).json({ error: "File not found or cannot be read" });
  }
}

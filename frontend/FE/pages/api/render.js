import fs from "fs";
import path from "path";
import AdmZip from "adm-zip";
import { promisify } from "util";

const writeFileAsync = promisify(fs.writeFile);
const mkdirAsync = promisify(fs.mkdir);

export default async function handler(req, res) {
  const { filename } = req.query;

  const zipFilePath = path.join(process.cwd(), "data/testCode", "template.zip");
  const tempDir = path.join(process.cwd(), "public/temp");

  try {
    await mkdirAsync(tempDir, { recursive: true });
  } catch (err) {
    console.error("Error creating temp directory:", err);
    res.status(500).json({ error: "Error creating temp directory" });
    return;
  }

  fs.readFile(zipFilePath, async (err, data) => {
    if (err) {
      console.error("File not found:", zipFilePath);
      res.status(404).json({ error: "File not found" });
      return;
    }

    const zip = new AdmZip(data);
    const zipEntries = zip.getEntries();

    if (!filename) {
      const structure = zipEntries.map((entry) => ({
        name: entry.entryName,
        isDirectory: entry.isDirectory,
      }));
      res.status(200).json({ structure });
      return;
    }

    const file = zipEntries.find((entry) => entry.entryName === filename);
    if (!file) {
      res.status(404).json({ error: "File not found in zip" });
      return;
    }

    const isBinary = /\.(jpg|jpeg|png|gif|svg|webp|woff|woff2|ttf)$/.test(
      filename
    );
    const content = file.getData();

    if (isBinary) {
      const filePath = path.join(tempDir, filename);
      await writeFileAsync(filePath, content);
      res
        .status(200)
        .json({ content: `/temp/${filename}`, isBinary, name: filename });
    } else {
      res
        .status(200)
        .json({ content: content.toString("utf8"), isBinary, name: filename });
    }
  });
}

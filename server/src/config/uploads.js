import path from "node:path";
import { fileURLToPath } from "node:url";

const currentDirectory = path.dirname(
  fileURLToPath(import.meta.url)
);

export const uploadDirectory = path.resolve(
  currentDirectory,
  "../../uploads"
);

export const uploadUrlPrefix = "/uploads";
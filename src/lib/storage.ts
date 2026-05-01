import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { put, del, get } from "@vercel/blob";

const UPLOAD_DIR = path.join(process.cwd(), "uploads");
const useBlob =
  typeof process.env.BLOB_READ_WRITE_TOKEN === "string" &&
  process.env.BLOB_READ_WRITE_TOKEN.length > 0;

// Private store kullanıyoruz; SDK >= 2.3 zorunlu.
const BLOB_ACCESS = "private" as const;

// Ensure upload directory exists (only for local storage)
export function ensureUploadDir(ownerType: string, ownerId: string): string {
  const dir = path.join(UPLOAD_DIR, ownerType.toLowerCase(), ownerId);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

// Save file to storage (Vercel Blob if token set, else local disk)
export async function saveFile(
  file: Buffer,
  originalName: string,
  ownerType: string,
  ownerId: string
): Promise<{ storagePath: string; fileName: string }> {
  const ext = path.extname(originalName);
  const fileName = `${uuidv4()}${ext}`;
  const relativePath = `${ownerType.toLowerCase()}/${ownerId}/${fileName}`;

  if (useBlob) {
    const blob = await put(relativePath, file, {
      access: BLOB_ACCESS,
      addRandomSuffix: false,
    });
    return { storagePath: blob.url, fileName };
  }

  const dir = ensureUploadDir(ownerType, ownerId);
  const storagePath = path.join(ownerType.toLowerCase(), ownerId, fileName);
  const fullPath = path.join(dir, fileName);
  await fs.promises.writeFile(fullPath, file);
  return { storagePath, fileName };
}

// Get file from storage. Private Blob için SDK'nın get() metodu kullanılır;
// stream'i Buffer'a dönüştürüp geri veriyoruz.
export async function getFile(storagePath: string): Promise<Buffer | null> {
  if (useBlob) {
    try {
      const result = await get(storagePath, { access: BLOB_ACCESS });
      if (!result || !result.stream) return null;

      const chunks: Uint8Array[] = [];
      const reader = result.stream.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) chunks.push(value);
      }
      const totalLength = chunks.reduce((sum, c) => sum + c.byteLength, 0);
      const merged = new Uint8Array(totalLength);
      let offset = 0;
      for (const chunk of chunks) {
        merged.set(chunk, offset);
        offset += chunk.byteLength;
      }
      return Buffer.from(merged);
    } catch (err) {
      console.error("[storage] get() failed:", err);
      return null;
    }
  }

  const fullPath = path.join(UPLOAD_DIR, storagePath);
  try {
    return await fs.promises.readFile(fullPath);
  } catch {
    return null;
  }
}

// Delete file from storage
export async function deleteFile(storagePath: string): Promise<boolean> {
  if (useBlob) {
    try {
      await del(storagePath);
      return true;
    } catch (err) {
      console.error("[storage] del() failed:", err);
      return false;
    }
  }

  const fullPath = path.join(UPLOAD_DIR, storagePath);
  try {
    await fs.promises.unlink(fullPath);
    return true;
  } catch {
    return false;
  }
}

// Get full path for a file (local only; returns empty string when using Blob)
export function getFullPath(storagePath: string): string {
  if (useBlob) return "";
  return path.join(UPLOAD_DIR, storagePath);
}

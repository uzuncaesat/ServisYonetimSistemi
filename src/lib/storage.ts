import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { put, del, head } from "@vercel/blob";

const UPLOAD_DIR = path.join(process.cwd(), "uploads");
const useBlob =
  typeof process.env.BLOB_READ_WRITE_TOKEN === "string" &&
  process.env.BLOB_READ_WRITE_TOKEN.length > 0;

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
    // `access: "public"` is required by the Vercel Blob API. On a Private
    // store the returned URL still requires a token (or signed URL) to read,
    // so the actual access control is enforced by the store's privacy setting.
    const blob = await put(relativePath, file, {
      access: "public",
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

// Get file from storage. Works for both Public and Private Vercel Blob stores
// by going through `head()` which returns a signed `downloadUrl`.
export async function getFile(storagePath: string): Promise<Buffer | null> {
  if (useBlob) {
    try {
      // Try authenticated metadata lookup. This works for both Public and
      // Private blobs and gives us a signed URL we can fetch without leaking
      // the token to the network.
      const meta = await head(storagePath);
      const downloadUrl = meta.downloadUrl ?? meta.url ?? storagePath;
      const res = await fetch(downloadUrl);
      if (res.ok) {
        const ab = await res.arrayBuffer();
        return Buffer.from(ab);
      }
    } catch (err) {
      console.error("[storage] head() failed, falling back to direct fetch:", err);
    }

    // Fallback: direct fetch (works for Public stores).
    try {
      const res = await fetch(storagePath);
      if (!res.ok) return null;
      const ab = await res.arrayBuffer();
      return Buffer.from(ab);
    } catch (err) {
      console.error("[storage] direct fetch failed:", err);
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

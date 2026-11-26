import path from 'node:path';
import { fileURLToPath } from 'node:url';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

/**
 * App root (`shush-dance/`), whether this file is loaded from `src/payload` or compiled output.
 */
export function getProjectRoot(): string {
  return path.resolve(dirname, '../..');
}

export function getEnvFilePath(): string {
  return path.join(getProjectRoot(), '.env');
}

/**
 * Filesystem root for `/media` static files (sibling `01-repos/media` unless `MEDIA_DIR` is set).
 */
export function getMediaRoot(): string {
  if (process.env.MEDIA_DIR) {
    return process.env.MEDIA_DIR;
  }
  return path.resolve(getProjectRoot(), '../../media');
}

export function getAudioUploadDir(): string {
  return path.join(getMediaRoot(), 'audio');
}

export function getDocumentsUploadDir(): string {
  return path.join(getMediaRoot(), 'documents');
}
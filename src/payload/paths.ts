import path from 'path';

/**
 * App root (`shush-dance/`), whether this file is loaded from `src/payload` or `dist/payload`.
 */
export function getProjectRoot(): string {
  return path.resolve(__dirname, '../..');
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

export function getDocumentsUploadDir(): string {
  return path.join(getMediaRoot(), 'documents');
}

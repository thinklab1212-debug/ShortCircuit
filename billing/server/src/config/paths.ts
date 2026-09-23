import path from 'path';
import fs from 'fs';
import os from 'os';

export function getUploadsDir(subfolder: string = ''): string {
  const isVercel = Boolean(process.env.VERCEL);
  const baseDir = isVercel
    ? path.join(os.tmpdir(), 'shortcircuit_uploads')
    : path.resolve(process.cwd(), 'uploads');

  const targetDir = subfolder ? path.join(baseDir, subfolder) : baseDir;
  if (!fs.existsSync(targetDir)) {
    try {
      fs.mkdirSync(targetDir, { recursive: true });
    } catch {}
  }
  return targetDir;
}

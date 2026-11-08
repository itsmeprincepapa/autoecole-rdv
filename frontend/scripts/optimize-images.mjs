// Allège les photos du carrousel : 1920 px de large maximum, JPEG qualité 75.
// Les originaux sont sauvegardés dans frontend/photos-originales (jamais écrasés).
// Usage : npm run optimize-images
import { copyFile, mkdir, readdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const SOURCE = 'public/images';
const BACKUP = 'photos-originales';
const EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp']);

await mkdir(BACKUP, { recursive: true });

for (const name of await readdir(SOURCE)) {
  if (!EXTENSIONS.has(path.extname(name).toLowerCase())) continue;

  const file = path.join(SOURCE, name);
  const backup = path.join(BACKUP, name);

  // Sauvegarde de l'original, une seule fois
  try {
    await stat(backup);
  } catch {
    await copyFile(file, backup);
  }

  // On repart toujours de l'original sauvegardé
  const buffer = await sharp(backup)
    .rotate() // respecte l'orientation de la photo
    .resize({ width: 1920, withoutEnlargement: true })
    .jpeg({ quality: 75, mozjpeg: true })
    .toBuffer();

  // Le fichier garde son nom : le contenu est un JPEG valide
  await writeFile(file, buffer);

  const before = (await stat(backup)).size;
  console.log(
    `${name} : ${(before / 1024).toFixed(0)} Ko -> ${(buffer.length / 1024).toFixed(0)} Ko`,
  );
}
console.log('Terminé. Originaux sauvegardés dans', BACKUP);
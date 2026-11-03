import { cp, mkdir, stat } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = resolve(repositoryRoot, 'src/assets/config.example');
const target = resolve(repositoryRoot, 'src/assets/config');

async function exists(path) {
  try {
    await stat(path);
    return true;
  } catch (error) {
    if (error?.code === 'ENOENT') {
      return false;
    }
    throw error;
  }
}

if (await exists(target)) {
  console.log('Using existing local portfolio configuration.');
} else {
  await mkdir(dirname(target), { recursive: true });
  await cp(source, target, { recursive: true, errorOnExist: true });
  console.log('Created local configuration from src/assets/config.example.');
}

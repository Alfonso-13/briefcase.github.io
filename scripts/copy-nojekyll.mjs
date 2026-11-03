import { copyFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const source = resolve('.nojekyll');
const destination = resolve('www', 'browser', '.nojekyll');
const index = resolve('www', 'browser', 'index.html');
const fallback = resolve('www', 'browser', '404.html');

await mkdir(dirname(destination), { recursive: true });
await copyFile(source, destination);
await copyFile(index, fallback);

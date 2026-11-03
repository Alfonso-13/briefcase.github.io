import { copyFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const source = resolve('.nojekyll');
const destination = resolve('www', 'browser', '.nojekyll');

await mkdir(dirname(destination), { recursive: true });
await copyFile(source, destination);

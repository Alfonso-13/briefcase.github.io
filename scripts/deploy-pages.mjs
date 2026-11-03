import { cp, readdir, rm } from 'node:fs/promises';
import { execFileSync, spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const buildDirectory = resolve(repositoryRoot, 'www', 'browser');
const worktreeDirectory = resolve(repositoryRoot, '.pages-deploy');

function git(args, cwd = repositoryRoot) {
  execFileSync('git', args, { cwd, stdio: 'inherit' });
}

async function copyBuild() {
  const worktreeEntries = await readdir(worktreeDirectory, { withFileTypes: true });

  // `.git` links this folder to the parent repository and must survive the cleanup.
  await Promise.all(
    worktreeEntries
      .filter((entry) => entry.name !== '.git')
      .map((entry) => rm(resolve(worktreeDirectory, entry.name), { recursive: true, force: true })),
  );

  const buildEntries = await readdir(buildDirectory, { withFileTypes: true });
  await Promise.all(
    buildEntries.map((entry) =>
      cp(resolve(buildDirectory, entry.name), resolve(worktreeDirectory, entry.name), {
        recursive: true,
        force: true,
      }),
    ),
  );
}

let worktreeCreated = false;

try {
  await readdir(buildDirectory);
  git(['fetch', 'origin', 'gh-pages']);
  git(['worktree', 'add', '--detach', worktreeDirectory, 'origin/gh-pages']);
  worktreeCreated = true;

  await copyBuild();
  git(['add', '-A'], worktreeDirectory);

  const hasChanges = spawnSync('git', ['diff', '--cached', '--quiet'], {
    cwd: worktreeDirectory,
    stdio: 'inherit',
  }).status !== 0;

  if (!hasChanges) {
    console.log('GitHub Pages is already up to date.');
  } else {
    git(['commit', '-m', 'Deploy portfolio [ci skip]'], worktreeDirectory);
    git(['push', 'origin', 'HEAD:gh-pages'], worktreeDirectory);
  }
} finally {
  if (worktreeCreated) {
    git(['worktree', 'remove', '--force', worktreeDirectory]);
  }
}

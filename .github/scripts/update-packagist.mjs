import { execFileSync } from 'node:child_process';
import { appendFileSync, readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';

const packageName = 'edgeinfinity/diy-homepage';
const repository = 'https://github.com/edgeinfinity1/flarum-diy-homepage';
const userAgent = 'DIY-Homepage-Packagist-Publication (+https://github.com/edgeinfinity1/flarum-diy-homepage/issues)';

export function validateRelease({ tag, username, token, composer, frontend }) {
  if (!username || !token) throw new Error('Configure PACKAGIST_USERNAME and PACKAGIST_TOKEN in the repository Actions settings.');
  if (!/^v\d+\.\d+\.\d+(?:-(?:alpha|beta|rc)\.?\d+)?$/i.test(tag || '')) {
    throw new Error('Choose an existing version tag such as v0.1.0.');
  }
  const version = tag.slice(1);
  if (composer.name !== packageName || composer.version || frontend.version !== version || frontend.private !== true) {
    throw new Error('The checked-out Composer package and frontend version must match the release tag.');
  }
  return version;
}

export function indexedVersions(metadata) {
  const versions = metadata.packages?.[packageName] || [];
  if (metadata.minified !== 'composer/2.0') return versions;
  // Composer's P2 format inherits omitted fields from the preceding version.
  let previous = {};
  return versions.map(changes => {
    const current = { ...previous };
    for (const [key, value] of Object.entries(changes)) {
      if (value === '__unset') delete current[key];
      else current[key] = value;
    }
    previous = current;
    return current;
  });
}

export async function synchronize({ tag, username, token, composer, frontend, commit }, {
  request = fetch, pause = delay, attempts = 24,
} = {}) {
  const version = validateRelease({ tag, username, token, composer, frontend });
  let accepted = false;
  for (let attempt = 0; attempt < 3; attempt++) {
    let response;
    try {
      response = await request('https://packagist.org/api/update-package', {
        method: 'POST', redirect: 'error', signal: AbortSignal.timeout(30_000),
        headers: {
          Authorization: `Bearer ${username}:${token}`,
          'Content-Type': 'application/json', 'User-Agent': userAgent,
        },
        body: JSON.stringify({ repository }),
      });
    } catch {
      if (attempt === 2) throw new Error('Unable to contact the Packagist update API.');
      await pause(5_000); continue;
    }
    if (response.ok) {
      const result = await response.json().catch(() => null);
      if (result?.status !== 'success') throw new Error('Packagist did not accept the update request.');
      accepted = true; break;
    }
    if ((response.status === 429 || response.status >= 500) && attempt < 2) {
      await pause(5_000); continue;
    }
    throw new Error(`Packagist update returned HTTP ${response.status}. Check the Actions credentials and package ownership.`);
  }
  if (!accepted) throw new Error('Packagist did not accept the update request.');

  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      // The package-details API can remain cached for twelve hours. P2 is the
      // static installation index used by Composer and reflects published tags.
      const response = await request(`https://repo.packagist.org/p2/${packageName}.json`, {
        redirect: 'error', signal: AbortSignal.timeout(15_000),
        headers: { 'User-Agent': userAgent, 'Cache-Control': 'no-cache' },
      });
      if (response.ok) {
        const metadata = await response.json();
        const indexed = indexedVersions(metadata).find(item => item.version?.replace(/^v/, '') === version);
        if (indexed?.source?.reference === commit) return { packageName, version, commit };
      }
    } catch { /* Indexing is asynchronous; retry without exposing response bodies or credentials. */ }
    if (attempt + 1 < attempts) await pause(5_000);
  }
  throw new Error('Packagist has not indexed this tag and commit yet. Re-run the workflow after checking the package page.');
}

async function main() {
  const result = await synchronize({
    tag: process.env.RELEASE_TAG, username: process.env.PACKAGIST_USERNAME, token: process.env.PACKAGIST_TOKEN,
    composer: JSON.parse(readFileSync('composer.json', 'utf8')),
    frontend: JSON.parse(readFileSync('js/package.json', 'utf8')),
    commit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
  });
  const message = `Packagist lists ${result.packageName} ${result.version} at ${result.commit}.`;
  console.log(message);
  if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${message}\n\n[View package](https://packagist.org/packages/${result.packageName})\n`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}

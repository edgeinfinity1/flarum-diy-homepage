import assert from 'node:assert/strict';
import test from 'node:test';
import { indexedVersions, synchronize } from './update-packagist.mjs';

const release = { tag: 'v0.1.0', username: 'example-maintainer', token: 'example-placeholder',
  composer: { name: 'edgeinfinity/diy-homepage' }, frontend: { version: '0.1.0', private: true }, commit: 'a'.repeat(40) };
const response = (status, body) => ({ ok: status >= 200 && status < 300, status, json: async () => body });
const indexed = commit => ({ packages: { 'edgeinfinity/diy-homepage': [{ version: 'v0.1.0', source: { reference: commit } }] } });

test('refuses missing credentials and mismatched tags before making a request', async () => {
  let calls = 0;
  const options = { request: async () => { calls++; }, pause: async () => {} };
  await assert.rejects(synchronize({ ...release, token: '' }, options), /Configure PACKAGIST/);
  await assert.rejects(synchronize({ ...release, tag: 'main' }, options), /version tag/);
  await assert.rejects(synchronize({ ...release, frontend: { version: '0.2.0', private: true } }, options), /match the release tag/);
  assert.equal(calls, 0);
});

test('sends credentials only in the update header and waits for the exact commit', async () => {
  let calls = 0;
  const result = await synchronize(release, { pause: async () => {}, request: async (url, options) => {
    calls++;
    assert.equal(url.includes(release.token), false);
    if (calls === 1) {
      assert.equal(options.headers.Authorization, `Bearer ${release.username}:${release.token}`);
      assert.deepEqual(JSON.parse(options.body), { repository: 'https://github.com/edgeinfinity1/flarum-diy-homepage' });
      return response(202, { status: 'success' });
    }
    assert.equal(url, 'https://repo.packagist.org/p2/edgeinfinity/diy-homepage.json');
    assert.equal(options.headers.Authorization, undefined);
    return response(200, indexed(calls === 2 ? 'b'.repeat(40) : release.commit));
  } });
  assert.equal(calls, 3);
  assert.equal(result.version, '0.1.0');
});

test('expands inherited P2 fields and honors fields removed by older versions', () => {
  const metadata = { minified: 'composer/2.0', packages: { 'edgeinfinity/diy-homepage': [
    { version: 'v0.1.1', source: { reference: release.commit }, description: 'new' },
    { version: 'v0.1.0', description: '__unset' },
  ] } };
  const versions = indexedVersions(metadata);
  assert.equal(versions[1].source.reference, release.commit);
  assert.equal('description' in versions[1], false);
  assert.equal(versions[0].description, 'new');
});

test('retries a transient API failure', async () => {
  let calls = 0;
  await synchronize(release, { pause: async () => {}, request: async () => {
    calls++;
    return calls === 1 ? response(503, {}) : calls === 2 ? response(202, { status: 'success' }) : response(200, indexed(release.commit));
  } });
  assert.equal(calls, 3);
});

test('fails authentication without exposing the response body', async () => {
  await assert.rejects(synchronize(release, { request: async () => response(403, { secret: release.token }) }), error => {
    assert.match(error.message, /HTTP 403/);
    assert.equal(error.message.includes(release.token), false);
    return true;
  });
});

test('fails when the version exists at a different commit', async () => {
  await assert.rejects(synchronize(release, { attempts: 2, pause: async () => {}, request: async (_url, options) =>
    options.method === 'POST' ? response(202, { status: 'success' }) : response(200, indexed('b'.repeat(40))) }), /not indexed this tag and commit/);
});

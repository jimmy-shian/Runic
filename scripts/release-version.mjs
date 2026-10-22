import fs from 'node:fs';
const epoch = 1577836800;
let previous = 1;
if (fs.existsSync('.release-state.json')) previous = JSON.parse(fs.readFileSync('.release-state.json', 'utf8')).versionCode;
const headers = { Accept: 'application/vnd.github+json' };
if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
const response = await fetch('https://api.github.com/repos/jimmy-shian/Runic/releases/latest', { headers, signal: AbortSignal.timeout(15000) });
if (response.ok) {
  const release = await response.json();
  for (const asset of release.assets ?? []) {
    const match = /-(\d+)-release\.apk$/.exec(asset.name);
    if (match) previous = Math.max(previous, Number(match[1]));
  }
} else if (response.status !== 404) throw new Error(`Cannot check latest APK version: HTTP ${response.status}`);
const version = Math.max(Math.floor(Date.now() / 1000) - epoch, previous + 1);
if (version > 2100000000) throw new Error('Android versionCode limit exceeded');
console.log(version);

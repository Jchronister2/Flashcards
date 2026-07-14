import { readFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { spawnSync } from 'node:child_process'

const root = process.cwd()
const listed = spawnSync('git', ['ls-files', '--cached', '--others', '--exclude-standard'], {
  cwd: root,
  encoding: 'utf8'
})
if (listed.status !== 0) throw new Error(listed.stderr)

const files = listed.stdout.trim().split(/\r?\n/).filter(Boolean)
const forbiddenPaths = ['src/assets/config.local.js']
const forbiddenContent = [
  /AIza[0-9A-Za-z_-]{20,}/,
  /\b\d{10,}-[0-9a-z]{20,}\.apps\.googleusercontent\.com\b/i,
  /C:\\Users\\Jommbles/i,
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/
]

for (const file of files) {
  if (file.replaceAll('\\', '/') === 'scripts/validate-public-release.mjs') continue
  const normalized = file.replaceAll('\\', '/')
  if (forbiddenPaths.includes(normalized)) {
    throw new Error(`Local OAuth configuration is included in the public release: ${file}`)
  }
  if (/\.(png|ico|jpg|jpeg|webp|lock)$/i.test(file)) continue
  const contents = await readFile(path.join(root, file), 'utf8')
  for (const pattern of forbiddenContent) {
    if (pattern.test(contents)) throw new Error(`Public-release check failed for ${file}: ${pattern}`)
  }
}

console.log(`Validated ${files.length} public release files.`)

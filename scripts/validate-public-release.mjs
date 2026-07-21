import { readFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
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
const requiredPaths = [
  '.github/workflows/deploy-pages.yml',
  'docs/screenshots/deck-manager.png',
  'docs/screenshots/study-session.png',
  'src/assets/config.public.js'
]
const approvedScreenshotHashes = {
  'docs/screenshots/deck-manager.png': '61a09f07216cb412135ad42ea49da59ac7a2e52d798bc1a57f5eeaaef0d064c9',
  'docs/screenshots/study-session.png': '7fcb229a9eaabe7d43cd8a8faee6ff564f311077b6cfe0c6f5d71e33a6c19d8a'
}
const forbiddenContent = [
  /AIza[0-9A-Za-z_-]{20,}/,
  /\b\d{10,}-[0-9a-z]{20,}\.apps\.googleusercontent\.com\b/i,
  /C:\\Users\\Jommbles/i,
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/
]

for (const requiredPath of requiredPaths) {
  if (!files.includes(requiredPath)) throw new Error(`Public release is missing ${requiredPath}`)
}

for (const [screenshot, approvedHash] of Object.entries(approvedScreenshotHashes)) {
  const hash = createHash('sha256').update(await readFile(path.join(root, screenshot))).digest('hex')
  if (hash !== approvedHash) throw new Error('Public screenshot requires privacy and accuracy review: ' + screenshot)
}

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

const readme = await readFile(path.join(root, 'README.md'), 'utf8')
if (!readme.includes('https://jchronister2.github.io/Flashcards/')) {
  throw new Error('README.md must link to the deployed GitHub Pages demo')
}
for (const screenshot of requiredPaths.filter(file => file.endsWith('.png'))) {
  if (!readme.includes(screenshot)) throw new Error(`README.md must display ${screenshot}`)
}

const routes = await readFile(path.join(root, 'src/app/app-routing.module.ts'), 'utf8')
if (!routes.includes('useHash: true')) throw new Error('GitHub Pages requires hash routing')

const index = await readFile(path.join(root, 'src/index.html'), 'utf8')
if (/accounts\.google\.com\/gsi\/client|apis\.google\.com\/js\/api\.js/.test(index)) {
  throw new Error('Google API scripts must be loaded only after authenticated mode is selected')
}

const main = await readFile(path.join(root, 'src/main.ts'), 'utf8')
if (/accounts\.google\.com\/gsi\/client/.test(main)) {
  throw new Error('Application bootstrap must not load Google OAuth before demo mode is resolved')
}

console.log(`Validated ${files.length} public release files.`)

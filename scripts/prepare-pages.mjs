import { copyFile, mkdir } from 'node:fs/promises'
import path from 'node:path'

const root = process.cwd()
const output = path.join(root, 'dist', 'flashcards')
const assets = path.join(output, 'assets')

await mkdir(assets, { recursive: true })
await copyFile(
  path.join(root, 'src', 'assets', 'config.public.js'),
  path.join(assets, 'config.local.js')
)

console.log('Prepared the GitHub Pages demo runtime configuration.')

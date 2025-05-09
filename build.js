import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 复制 manifest.json 到 dist 目录
fs.copyFileSync(
  path.join(__dirname, 'manifest.json'),
  path.join(__dirname, 'dist', 'manifest.json')
)

// 复制 background.js 到 dist 目录
fs.copyFileSync(
  path.join(__dirname, 'background.js'),
  path.join(__dirname, 'dist', 'background.js')
)

// 复制图标到 dist 目录
const iconsDir = path.join(__dirname, 'icons')
const distIconsDir = path.join(__dirname, 'dist', 'icons')

if (!fs.existsSync(distIconsDir)) {
  fs.mkdirSync(distIconsDir, { recursive: true })
}

if (fs.existsSync(iconsDir)) {
  const files = fs.readdirSync(iconsDir)
  files.forEach(file => {
    fs.copyFileSync(
      path.join(iconsDir, file),
      path.join(distIconsDir, file)
    )
  })
}

console.log('Build completed successfully!'); 
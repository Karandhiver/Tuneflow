#!/usr/bin/env node
/**
 * Run this once after npm install to generate PWA icons:
 *   node scripts/generate-icons.js
 *
 * Requires: npm install sharp --save-dev
 */
const fs = require('fs')
const path = require('path')

async function generate() {
  let sharp
  try {
    sharp = require('sharp')
  } catch {
    console.log('Installing sharp...')
    require('child_process').execSync('npm install sharp --save-dev', { stdio: 'inherit' })
    sharp = require('sharp')
  }

  const svgPath = path.join(__dirname, '../public/icon.svg')
  const svg = fs.readFileSync(svgPath)

  const sizes = [192, 512]
  for (const size of sizes) {
    await sharp(svg)
      .resize(size, size)
      .png()
      .toFile(path.join(__dirname, `../public/icon-${size}.png`))
    console.log(`✅ Generated icon-${size}.png`)
  }

  // Also generate apple-touch-icon
  await sharp(svg)
    .resize(180, 180)
    .png()
    .toFile(path.join(__dirname, '../public/apple-touch-icon.png'))
  console.log('✅ Generated apple-touch-icon.png')

  // favicon
  await sharp(svg)
    .resize(32, 32)
    .png()
    .toFile(path.join(__dirname, '../public/favicon.png'))
  console.log('✅ Generated favicon.png')
}

generate().catch(console.error)

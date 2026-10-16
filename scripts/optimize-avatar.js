#!/usr/bin/env node

const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const inputPath = path.join(__dirname, '../web-client/public/avatar.png');
const outputDir = path.join(__dirname, '../web-client/public/avatar');

// Create output directory
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const sizes = [
  { name: 'blur', width: 24, height: 29 }, // Tiny placeholder for blur-up effect
  { name: 'sm', width: 400, height: 483 }, // Mobile
  { name: 'md', width: 600, height: 725 }, // Tablet
  { name: 'lg', width: 900, height: 1086 }, // Desktop (original)
];

(async () => {
  try {
    console.log('🖼️  Optimizing avatar.png...\n');

    for (const size of sizes) {
      // Generate WEBP versions
      const webpPath = path.join(outputDir, `avatar-${size.name}.webp`);
      await sharp(inputPath)
        .resize(size.width, size.height, {
          fit: 'cover',
          position: 'center',
        })
        .webp({ quality: size.name === 'blur' ? 80 : 85 })
        .toFile(webpPath);

      const stats = fs.statSync(webpPath);
      console.log(
        `✓ avatar-${size.name}.webp (${size.width}×${size.height}) — ${(stats.size / 1024).toFixed(1)}KB`
      );
    }

    // Generate base64 blur placeholder for inline use
    const blurPath = path.join(outputDir, 'avatar-blur.webp');
    const blurBuffer = fs.readFileSync(blurPath);
    const base64Blur = blurBuffer.toString('base64');
    const dataUri = `data:image/webp;base64,${base64Blur}`;

    // Save the data URI to a file for reference
    const dataUriPath = path.join(outputDir, 'blur-placeholder.txt');
    fs.writeFileSync(dataUriPath, dataUri);
    console.log(`\n✓ Blur placeholder generated (${base64Blur.length} chars)`);

    console.log('\n📋 Update Hero.tsx to use responsive images with progressive loading.\n');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
})();

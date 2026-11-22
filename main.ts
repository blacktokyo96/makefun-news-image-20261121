const fs = require('node:fs');
const path = require('node:path');

const MAX_BYTES = 1048576;
const OUTPUT_NAME = 'entry.png';

function magic(bytes: Buffer): Buffer | null {
  if (bytes.length >= 4 && bytes.subarray(0, 4).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47]))) {
    return bytes.subarray(0, 4);
  }
  if (bytes.length >= 3 && bytes.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))) {
    return bytes.subarray(0, 3);
  }
  return null;
}

if (process.argv.slice(2).some((arg: string) => arg === '--help' || arg === '-h')) {
  console.log('Usage: node main.ts [--help|-h]\nCopies entry.png next to this script to $MAKEFUN_OUTPUT_DIR/entry.png (default: /output/entry.png).');
  process.exit(0);
}

try {
  const sourcePath = path.join(__dirname, 'entry.png');
  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Source missing: ${sourcePath}`);
  }
  if (!fs.statSync(sourcePath).isFile()) {
    throw new Error(`Source is not a regular file: ${sourcePath}`);
  }
  if (fs.statSync(sourcePath).size > MAX_BYTES) {
    throw new Error(`Source exceeds MAX_BYTES (${MAX_BYTES} bytes)`);
  }
  const source = fs.readFileSync(sourcePath);
  if (source.length > MAX_BYTES) {
    throw new Error(`Source exceeds MAX_BYTES (${MAX_BYTES} bytes)`);
  }
  const sourceMagic = magic(source);
  if (!sourceMagic) {
    throw new Error('Source must start with PNG or JPEG magic bytes');
  }
  const outputDir = process.env.MAKEFUN_OUTPUT_DIR || '/output';
  const outputPath = path.resolve(outputDir, OUTPUT_NAME);
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(outputPath, source);
  const written = fs.readFileSync(outputPath);
  const writtenMagic = magic(written);
  if (written.length !== source.length || !writtenMagic || !writtenMagic.equals(sourceMagic)) {
    throw new Error('Output verification failed: byte length or magic bytes mismatch');
  }
  if (!written.equals(source)) {
    throw new Error('Output verification failed: file contents mismatch');
  }
  console.log(`${outputPath} ${written.length} bytes`);
} catch (error) {
  console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}

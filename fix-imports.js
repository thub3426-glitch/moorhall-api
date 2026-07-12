import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distDir = path.join(__dirname, 'dist');

function addJsExtensions(dir) {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      addJsExtensions(filePath);
    } else if (file.endsWith('.js')) {
      let content = fs.readFileSync(filePath, 'utf-8');

      // Replace imports from local files without extensions
      // Match: import ... from './path' or import ... from '../path'
      // But not if they already have an extension like .js, .json, .ts, etc.
      content = content.replace(
        /from\s+['"](\.[^'"]+)(['"]);/g,
        (match, importPath, quote) => {
          // Check if the path already has an extension
          if (
            importPath.endsWith('.js') ||
            importPath.endsWith('.json') ||
            importPath.endsWith('.mjs') ||
            importPath.endsWith('.cjs')
          ) {
            return match;
          }
          // Add .js extension
          return `from ${quote}${importPath}.js${quote};`;
        }
      );

      fs.writeFileSync(filePath, content, 'utf-8');
    }
  });
}

try {
  if (fs.existsSync(distDir)) {
    addJsExtensions(distDir);
    console.log('✓ Fixed ES module imports with .js extensions');
  } else {
    console.log('dist directory not found');
  }
} catch (error) {
  console.error('Error fixing imports:', error);
  process.exit(1);
}

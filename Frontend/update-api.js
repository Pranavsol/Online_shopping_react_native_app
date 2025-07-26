#!/usr/bin/env node

/**
 * Script to update API calls in frontend files
 * This replaces all instances of the old API pattern with the new one
 */

const fs = require('fs');
const path = require('path');

const filesToUpdate = [
  'app/product/[id].tsx',
  'app/(tabs)/cart.tsx', 
  'app/checkout.tsx',
  'app/(tabs)/orders.tsx',
  'app/order/[id].tsx',
  'app/(tabs)/admin.tsx'
];

const replacements = [
  {
    from: /const API_BASE_URL = ['"]http:\/\/localhost:5000\/api['"];?/g,
    to: "import { apiRequest, API_ENDPOINTS } from '../../config/api';"
  },
  {
    from: /const API_BASE_URL = ['"]http:\/\/localhost:5000\/api['"];?\n/g,
    to: "import { apiRequest, API_ENDPOINTS } from '../../config/api';\n"
  },
  {
    from: /fetch\(`\$\{API_BASE_URL\}\/products\/\$\{id\}`,\s*\{\s*headers,?\s*\}\)/g,
    to: "apiRequest(API_ENDPOINTS.PRODUCT_BY_ID(id), {}, token || undefined)"
  },
  {
    from: /fetch\(`\$\{API_BASE_URL\}\/cart`,\s*\{\s*headers:\s*\{\s*['"']Authorization['"]:\s*`Bearer \$\{token\}`[,\s]*\}[,\s]*\}\)/g,
    to: "apiRequest(API_ENDPOINTS.CART, {}, token)"
  },
  {
    from: /fetch\(`\$\{API_BASE_URL\}\/cart\/\$\{([^}]+)\}`,\s*\{\s*method:\s*['"]PUT['"],\s*headers:\s*\{[^}]+\},\s*body:\s*JSON\.stringify\(([^)]+)\)[,\s]*\}\)/g,
    to: "apiRequest(API_ENDPOINTS.CART_ITEM($1), { method: 'PUT', body: JSON.stringify($2) }, token)"
  }
];

const frontendDir = path.join(__dirname);

function updateFile(filePath) {
  const fullPath = path.join(frontendDir, filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }
  
  let content = fs.readFileSync(fullPath, 'utf8');
  let modified = false;
  
  replacements.forEach(({ from, to }) => {
    if (content.match(from)) {
      content = content.replace(from, to);
      modified = true;
    }
  });
  
  if (modified) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`Updated: ${filePath}`);
  } else {
    console.log(`No changes needed: ${filePath}`);
  }
}

// Update each file
filesToUpdate.forEach(updateFile);

console.log('API update script completed!');
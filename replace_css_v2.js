const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, 'frontend/src/index.css');
let css = fs.readFileSync(cssPath, 'utf8');

// Replace root variables
css = css.replace(/--bg-800: #0F0E0D;/g, '--bg-800: #0D0B0A;');
css = css.replace(/--bg-700: #171513;/g, '--bg-700: #161210;');
css = css.replace(/--bg-600: #1E1C1A;/g, '--bg-600: #1E1916;');
css = css.replace(/--bubble-ai: var\(--bg-600\);/g, '--bubble-ai: #1A1614;');
css = css.replace(/--bubble-user: var\(--amber-500\);/g, '--bubble-user: #5C3D2E;');
css = css.replace(/--terra-500: #C4714A;/g, '--terra-500: #D4845A;');
css = css.replace(/--amber-200: #fae29f;/g, '--amber-200: #8FAF8F;'); // Map secondary accent here
css = css.replace(/--text-1: #fdfaf6;/g, '--text-1: #F0E6DC;');
css = css.replace(/--text-2: #ebdcc9;/g, '--text-2: #8A7A70;');
css = css.replace(/--text-3: #a39586;/g, '--text-3: #8A7A70;');

// Update alert banner colors which were hardcoded
css = css.replace(/rgba\(234, 179, 8, 0\.1\)/g, 'rgba(196, 120, 90, 0.1)'); // C4785A in rgb
css = css.replace(/rgba\(234, 179, 8, 0\.2\)/g, 'rgba(196, 120, 90, 0.2)');
css = css.replace(/color: #fef08a;/g, 'color: #C4785A;');
css = css.replace(/background: #eab308;/g, 'background: #C4785A;');
css = css.replace(/color: #422006;/g, 'color: #F0E6DC;'); // Button text
css = css.replace(/background: #fde047;/g, 'background: #D4845A;'); // Button hover

// Update border colors if any
css = css.replace(/border: 1px solid rgba\(196, 113, 74, 0\.3\);/g, 'border: 1px solid #2A2320;');
css = css.replace(/border: 1px solid var\(--terra-500\);/g, 'border: 1px solid #2A2320;');
css = css.replace(/border-color: rgba\(255,255,255,0.06\);/g, 'border-color: #2A2320;');
css = css.replace(/border-top: 1px solid rgba\(255,255,255,0.04\);/g, 'border-top: 1px solid #2A2320;');

// Also replace gradients
css = css.replace(/rgba\(196,113,74,0\.12\)/g, 'rgba(212, 132, 90, 0.08)');
css = css.replace(/rgba\(139,105,20,0\.06\)/g, 'rgba(92, 61, 46, 0.06)');
css = css.replace(/rgba\(196,113,74,0\.05\)/g, 'rgba(212, 132, 90, 0.04)');

fs.writeFileSync(cssPath, css);
console.log('CSS tokens replaced successfully.');

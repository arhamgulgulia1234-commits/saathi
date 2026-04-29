const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, 'frontend/src/index.css');
let css = fs.readFileSync(cssPath, 'utf8');

// Replace root variables
css = css.replace(/--navy-900:.*?;/g, '--bg-900: #080706;');
css = css.replace(/--navy-800:.*?;/g, '--bg-800: #0F0E0D;');
css = css.replace(/--navy-700:.*?;/g, '--bg-700: #171513;');
css = css.replace(/--navy-600:.*?;/g, '--bg-600: #1E1C1A;');
css = css.replace(/--navy-500:.*?;/g, '--bg-500: #2b2824;');

css = css.replace(/--lav-100:.*?;/g, '--amber-100: #fdf3d1;');
css = css.replace(/--lav-200:.*?;/g, '--amber-200: #fae29f;');
css = css.replace(/--lav-300:.*?;/g, '--amber-300: #f4c962;');
css = css.replace(/--lav-400:.*?;/g, '--amber-400: #eaa630;');
css = css.replace(/--lav-500:.*?;/g, '--terra-500: #C4714A;');
css = css.replace(/--lav-600:.*?;/g, '--amber-500: #8B6914;');

// Replace text colors
css = css.replace(/--text-1:.*?;/g, '--text-1: #fdfaf6;');
css = css.replace(/--text-2:.*?;/g, '--text-2: #ebdcc9;');
css = css.replace(/--text-3:.*?;/g, '--text-3: #a39586;');
css = css.replace(/--text-4:.*?;/g, '--text-4: #6b6156;');

// Replace specific bubbles
css = css.replace(/--bubble-user:.*?;/g, '--bubble-user: var(--amber-500);');
css = css.replace(/--bubble-ai:.*?;/g, '--bubble-ai: var(--bg-600);');
css = css.replace(/--bubble-border:.*?;/g, '--bubble-border: rgba(196, 113, 74, 0.15);');

// Replace fonts
css = css.replace(/--font:.*?;/g, "--font: 'Plus Jakarta Sans', system-ui, sans-serif;");
css = css.replace(/--serif:.*?;/g, "--serif: 'Plus Jakarta Sans', Georgia, serif;");

// Replace references throughout the file
css = css.replace(/--navy-900/g, '--bg-900');
css = css.replace(/--navy-800/g, '--bg-800');
css = css.replace(/--navy-700/g, '--bg-700');
css = css.replace(/--navy-600/g, '--bg-600');
css = css.replace(/--navy-500/g, '--bg-500');

css = css.replace(/--lav-100/g, '--amber-100');
css = css.replace(/--lav-200/g, '--amber-200');
css = css.replace(/--lav-300/g, '--amber-300');
css = css.replace(/--lav-400/g, '--amber-400');
css = css.replace(/--lav-500/g, '--terra-500');
css = css.replace(/--lav-600/g, '--amber-500');

// Fix specific gradients that still use rgba values of purple
css = css.replace(/rgba\(110,80,200,0\.16\)/g, 'rgba(196,113,74,0.12)');
css = css.replace(/rgba\(80,50,160,0\.08\)/g, 'rgba(139,105,20,0.06)');
css = css.replace(/rgba\(55,35,115,0\.07\)/g, 'rgba(196,113,74,0.05)');

css = css.replace(/rgba\(185, 165, 232/g, 'rgba(196, 113, 74');
css = css.replace(/rgba\(185,165,232/g, 'rgba(196,113,74');
css = css.replace(/rgba\(157, 135, 212/g, 'rgba(139, 105, 20');
css = css.replace(/rgba\(157,135,212/g, 'rgba(139,105,20');
css = css.replace(/rgba\(107, 82, 174/g, 'rgba(196, 113, 74');
css = css.replace(/rgba\(107,82,174/g, 'rgba(196,113,74');

// Some stroke and chart colors in CSS (if any)
css = css.replace(/#8a80a8/g, '#a39586'); // text-3 hex
css = css.replace(/#9d87d4/g, '#C4714A'); // terra-500 hex
css = css.replace(/#7c68b8/g, '#8B6914'); // amber-500 hex
css = css.replace(/#ddd0ff/g, '#fae29f'); // amber-200 hex

// Fix welcome glow
css = css.replace(/radial-gradient\(circle at 50% 50%, rgba\(157, 135, 212, 0.15\) 0%, transparent 70%\)/g, 'radial-gradient(circle at 50% 50%, rgba(196, 113, 74, 0.15) 0%, transparent 70%)');

fs.writeFileSync(cssPath, css);
console.log('CSS updated successfully.');

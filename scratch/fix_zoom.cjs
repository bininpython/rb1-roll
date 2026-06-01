const fs = require('fs');

const mainFile = 'scratch/main_transformed.ts';
let code = fs.readFileSync(mainFile, 'utf8');

// The original `replace` destroyed the panzoom code. Let's fix it manually.
code = code.replace(
  /initialZoom:\s*0\.15,/g,
  `initialZoom: 0.25,`
);

fs.writeFileSync(mainFile, code);
console.log('Fixed initialZoom in scratch file!');

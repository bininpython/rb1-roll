const fs = require('fs');
let code = fs.readFileSync('src/main.ts', 'utf8');

code = code.replace(
  `const track1 = document.getElementById('trackPath1') as SVGPathElement;`,
  `const track1 = document.getElementById('trackPath1') as unknown as SVGPathElement;`
);
code = code.replace(
  `const track2 = document.getElementById('trackPath2') as SVGPathElement;`,
  `const track2 = document.getElementById('trackPath2') as unknown as SVGPathElement;`
);

fs.writeFileSync('src/main.ts', code);
console.log('Fixed TypeScript errors');

const fs = require('fs');

const mainFile = 'src/main.ts'; // Wait, let's process the original file
let code = fs.readFileSync('scratch/main_copy.ts', 'utf8');

const renderStripAndStartG = (transform, startM, newRowText) => `
  // === RENDER PREVIOUS PATH ===
  svg += \`<path d="\${stripPath}" fill="none" stroke="rgba(255, 255, 255, 0.2)" stroke-width="4" filter="url(#whiteGlow)"/>\`;
  svg += \`<path d="\${stripPath}" fill="none" stroke="#ffffff" stroke-width="1.5"/>\`;
  svg += \`</g>\`; // Close previous row

  // === START NEW ROW ===
  svg += \`<g transform="${transform}">\`;
  stripPath = \`${startM}\`;
  
  // Adding Row Title
  svg += \`<text x="${parseInt(startM.split(' ')[1])}" y="320" font-family="Montserrat, sans-serif" font-size="24" font-weight="900" fill="#38bdf8" opacity="0.6">${newRowText}</text>\`;
`;

code = code.replace(
  `let p2 = \`M 100 \${Y2} \`;`,
  `svg += \`<g transform="translate(0, 0)">\`;\n  let p2 = \`M 100 \${Y2} \`;`
);

code = code.replace(
  /\/\/\s*=*?\s*\n\s*\/\/\s*SEÇÃO 2:.*?\n\s*\/\/\s*=*?/s,
  renderStripAndStartG('translate(-1400, 450)', 'M 1510 450 ', 'CONTINUAÇÃO 1') + `\n  // SEÇÃO 2: SOLDA E PREPARAÇÃO`
);

code = code.replace(
  /\/\/\s*=*?\s*\n\s*\/\/\s*SEÇÃO 3:.*?\n\s*\/\/\s*=*?/s,
  renderStripAndStartG('translate(-2650, 1050)', 'M 2750 450 ', 'CONTINUAÇÃO 2') + `\n  // SEÇÃO 3: ACUMULADOR DE ENTRADA`
);

code = code.replace(
  /\/\/\s*=*?\s*\n\s*\/\/\s*SEÇÃO 4:.*?\n\s*\/\/\s*=*?/s,
  renderStripAndStartG('translate(-3850, 1550)', 'M 3800 450 ', 'CONTINUAÇÃO 3') + `\n  // SEÇÃO 4: FORNO E RESFRIAMENTO`
);

code = code.replace(
  /\/\/\s*----\s*BS 3 SECTION.*?\n/s,
  renderStripAndStartG('translate(-5750, 2150)', 'M 5800 450 ', 'CONTINUAÇÃO 4') + `\n  // ---- BS 3 SECTION ----\n`
);

code = code.replace(
  /\/\/\s*BS4 e LOOP DE SAÍDA.*?\n/s,
  renderStripAndStartG('translate(-8850, 2750)', 'M 8950 450 ', 'CONTINUAÇÃO 5') + `\n  // BS4 e LOOP DE SAÍDA\n`
);

code = code.replace(
  `const W = 12000, H = 900;`,
  `const W = 3600, H = 3600;`
);

code = code.replace(
  `// Apply the path (Forno Glowing Strip)\n  svg += \`<path d="\${stripPath}" fill="none" stroke="rgba(255, 255, 255, 0.2)" stroke-width="4" filter="url(#whiteGlow)"/>\`;\n  svg += \`<path d="\${stripPath}" fill="none" stroke="#ffffff" stroke-width="1.5"/>\`;`,
  `// Apply the final path\n  svg += \`<path d="\${stripPath}" fill="none" stroke="rgba(255, 255, 255, 0.2)" stroke-width="4" filter="url(#whiteGlow)"/>\`;\n  svg += \`<path d="\${stripPath}" fill="none" stroke="#ffffff" stroke-width="1.5"/>\`;\n  svg += \`</g>\`; // Close final row group`
);

fs.writeFileSync('scratch/main_transformed.ts', code);
console.log('Regex Transformation fixed complete!');

const fs = require('fs');
let code = fs.readFileSync('src/main.ts', 'utf8');

// evaluate the logic
// We need to extract the stripPath up to line 2561
// Since it's dynamic, let's just write a snippet that mocks it

const regex = /stripPath \+= `A 30 30 0 0 0 1350 450 `/;
console.log("Match:", !!code.match(regex));

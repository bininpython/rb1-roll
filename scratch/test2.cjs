const fs = require('fs');

const code = fs.readFileSync('src/main.ts', 'utf8');

let p2 = "M 100 450 L 1350 450 ";
let stripPath = "M 100 170 L 1090 170 A 30 30 0 0 1 1113.11 180.87 L 1326.89 439.13 A 30 30 0 0 0 1350 450 ";
stripPath += "L 1510 450 "; // Next command in the real file

let commonPartIdx = stripPath.indexOf(" 1350 450 ");
console.log("Index:", commonPartIdx);
let commonPart = stripPath.substring(commonPartIdx + " 1350 450 ".length);
console.log("Common Part:", commonPart);
let pathArrow2 = p2 + commonPart;
console.log("Path Arrow 2:", pathArrow2);

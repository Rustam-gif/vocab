const fs = require('fs');
const path = require('path');

const audioDir = path.join(__dirname, '../assets/audio/words');
const files = fs.readdirSync(audioDir).filter(f => f.endsWith('.mp3'));

const mapping = {};
files.forEach(file => {
  const word = file.replace('.mp3', '').replace(/_/g, ' ');
  mapping[word] = file;
});

const code = `// Auto-generated word-to-audio mapping
export const wordAudioFiles: Record<string, any> = {
${Object.entries(mapping).map(([word, file]) =>
  `  '${word}': require('./words/${file}'),`
).join('\n')}
};
`;

fs.writeFileSync(path.join(__dirname, '../assets/audio/index.ts'), code);
console.log(`Created mapping for ${files.length} words`);
console.log('File: assets/audio/index.ts');

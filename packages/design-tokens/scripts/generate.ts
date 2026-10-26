import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parseRootTokens, renderTokensModule } from './parse.ts';

const css = readFileSync(fileURLToPath(new URL('../src/tokens.css', import.meta.url)), 'utf8');
const out = fileURLToPath(new URL('../src/tokens.ts', import.meta.url));
writeFileSync(out, renderTokensModule(parseRootTokens(css)));
console.log(`wrote ${out}`);

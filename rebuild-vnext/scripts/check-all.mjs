import { readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { execFileSync } from 'node:child_process';
const roots=['src','web','tests'];
const files=[];
function walk(dir){for(const name of readdirSync(dir)){const path=join(dir,name);const stat=statSync(path);if(stat.isDirectory())walk(path);else if(/\.(?:js|mjs)$/.test(name))files.push(path);}}
for(const root of roots)walk(root);
for(const file of files.sort()){execFileSync(process.execPath,['--check',file],{stdio:'inherit'});}
console.log(`Syntax checked ${files.length} JavaScript modules.`);

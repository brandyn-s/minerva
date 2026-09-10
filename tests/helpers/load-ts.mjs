import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve, dirname } from 'node:path';
import ts from 'typescript';
const requirePackage = createRequire(import.meta.url);
export function loader() {
  const cache = new Map();
  function load(path) {
    path = resolve(path);
    if (cache.has(path)) return cache.get(path);
    const exports = {}; cache.set(path, exports);
    const code = ts.transpileModule(readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
    new Function('exports', 'require', code)(exports, name => name.startsWith('.') ? load(resolve(dirname(path), name.endsWith('.ts') ? name : name + '.ts')) : requirePackage(name));
    return exports;
  }
  return load;
}

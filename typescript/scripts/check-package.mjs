/** Verify the packed artifact, rather than imports from the working source. */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, writeFile, mkdir, cp, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = fileURLToPath(new URL("../", import.meta.url));
const repoRoot = dirname(packageRoot);
const temporary = await mkdtemp(join(tmpdir(), "url2regex-package-"));
function run(command, args, cwd = temporary, capture = false) {
  const result = spawnSync(command, args, { cwd, encoding: "utf8", stdio: capture ? "pipe" : "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} failed: ${result.stderr ?? result.status}`);
  return result.stdout;
}
try {
  run("npm", ["test"], packageRoot);
  // Run tests explicitly so lifecycle output cannot contaminate npm's JSON.
  const packed = JSON.parse(run("npm", ["pack", "--ignore-scripts", "--json", "--pack-destination", temporary], packageRoot, true));
  const info = packed[0];
  const files = info.files.map(file => file.path);
  for (const path of ["LICENSE", "README.md", "src/index.js", "src/index.d.ts", "src/node.js", "src/node.d.ts", "src/csv.js", "src/validation.js"]) {
    assert.ok(files.includes(path), `Missing packaged file: ${path}`);
  }
  assert.ok(files.every(path => !/^(?:test|type-tests|fixtures|node_modules)\//.test(path)));
  await writeFile(join(temporary, "package.json"), JSON.stringify({ private: true, type: "module" }));
  run("npm", ["install", "--offline", "--ignore-scripts", "--no-audit", "--no-fund", join(temporary, info.filename)]);
  assert.equal(await readFile(join(temporary, "node_modules/url2regex/LICENSE"), "utf8"), await readFile(join(repoRoot, "LICENSE"), "utf8"));

  // Mirror relative fixture paths while rewriting source imports to the installed package.
  const tests = join(temporary, "typescript/test");
  await mkdir(tests, { recursive: true });
  await cp(join(repoRoot, "fixtures"), join(temporary, "fixtures"), { recursive: true });
  for (const file of await readdir(join(packageRoot, "test"))) {
    if (!file.endsWith(".test.js")) continue;
    const source = (await readFile(join(packageRoot, "test", file), "utf8"))
      .replaceAll('"../src/index.js"', '"url2regex"')
      .replaceAll('"../src/node.js"', '"url2regex/node"');
    await writeFile(join(tests, file), source);
  }
  await cp(join(repoRoot, "examples/urls.csv"), join(temporary, "examples/urls.csv"), { recursive: true });
  run(process.execPath, ["--test"], join(temporary, "typescript"));

  const examples = join(temporary, "examples/typescript");
  await mkdir(examples, { recursive: true });
  for (const file of await readdir(join(repoRoot, "examples/typescript"))) {
    if (!file.endsWith(".mjs")) continue;
    const source = (await readFile(join(repoRoot, "examples/typescript", file), "utf8"))
      .replaceAll('"../../typescript/src/index.js"', '"url2regex"')
      .replaceAll('"../../typescript/src/node.js"', '"url2regex/node"');
    await writeFile(join(examples, file), source);
    run(process.execPath, [join(examples, file)]);
  }

  await cp(join(packageRoot, "type-tests/consumer.mts"), join(temporary, "consumer.mts"));
  await writeFile(join(temporary, "tsconfig.json"), JSON.stringify({
    compilerOptions: { target: "ES2022", module: "NodeNext", moduleResolution: "NodeNext", strict: true, noEmit: true, lib: ["ES2022", "DOM"], types: [] },
    files: ["consumer.mts"],
  }));
  run(process.execPath, [join(packageRoot, "node_modules/typescript/bin/tsc"), "--project", join(temporary, "tsconfig.json")]);

  // Root imports must remain browser-safe, including their transitive dependencies.
  const seen = new Set();
  async function checkBrowserModule(path) {
    if (seen.has(path)) return;
    seen.add(path);
    const source = await readFile(path, "utf8");
    for (const match of source.matchAll(/(?:from\s*|import\s*)["']([^"']+)["']/g)) {
      assert.ok(match[1].startsWith("./"), `Non-browser import: ${match[1]}`);
      await checkBrowserModule(join(dirname(path), match[1]));
    }
  }
  await checkBrowserModule(join(temporary, "node_modules/url2regex/src/index.js"));
  console.log("Packed runtime tests, examples, TypeScript declarations, and browser import graph passed.");
} finally {
  await rm(temporary, { recursive: true, force: true });
}

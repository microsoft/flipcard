import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { readFileSync, readdirSync } from "fs";
import { join, resolve } from "path";

const ROOT = resolve(import.meta.dirname, "..");
const SCHEMAS_DIR = join(ROOT, "schemas");
const EXAMPLES_DIR = join(ROOT, "examples");

function loadJson(path) {
  return JSON.parse(readFileSync(path, "utf-8"));
}

function loadAllSchemas(dir) {
  const schemas = [];
  for (const entry of readdirSync(dir, { withFileTypes: true, recursive: true })) {
    if (entry.isFile() && entry.name.endsWith(".schema.json")) {
      const fullPath = join(entry.parentPath ?? entry.path, entry.name);
      schemas.push(loadJson(fullPath));
    }
  }
  return schemas;
}

const ajv = new Ajv2020({ allErrors: true, strict: false });
addFormats(ajv);

const schemas = loadAllSchemas(SCHEMAS_DIR);
for (const schema of schemas) {
  ajv.addSchema(schema);
}

const deckSchema = schemas.find((s) => s.title === "Adaptive Slide Deck");
if (!deckSchema) {
  console.error("❌ Could not find deck schema");
  process.exit(1);
}

const validate = ajv.compile(deckSchema);

const examples = readdirSync(EXAMPLES_DIR).filter((f) => f.endsWith(".deck.json"));

let passed = 0;
let failed = 0;

for (const file of examples) {
  const deck = loadJson(join(EXAMPLES_DIR, file));
  const valid = validate(deck);
  if (valid) {
    console.log(`✅ ${file}`);
    passed++;
  } else {
    console.log(`❌ ${file}`);
    for (const err of validate.errors) {
      console.log(`   ${err.instancePath || "/"} — ${err.message}`);
    }
    failed++;
  }
}

console.log(`\n${passed} passed, ${failed} failed out of ${examples.length} examples`);
process.exit(failed > 0 ? 1 : 0);

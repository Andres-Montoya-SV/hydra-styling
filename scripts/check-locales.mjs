import ts from "typescript";
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
const parse = (path) =>
  ts.createSourceFile(
    path,
    readFileSync(path, "utf8"),
    ts.ScriptTarget.Latest,
    true,
    path.endsWith("tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
const visit = (node, callback) => {
  callback(node);
  ts.forEachChild(node, (child) => visit(child, callback));
};
const dictionary = new Map();
visit(parse("apps/showcase/src/showcase-translations.ts"), (node) => {
  if (
    !ts.isPropertyAssignment(node) ||
    !(ts.isStringLiteral(node.name) || ts.isIdentifier(node.name)) ||
    !ts.isArrayLiteralExpression(node.initializer)
  )
    return;
  const key = node.name.text,
    values = node.initializer.elements.map((element) => element.text);
  assert(!dictionary.has(key), `Duplicate translation: ${key}`);
  assert.equal(values.length, 2, `Missing ES/PT-BR: ${key}`);
  const placeholders = (value) =>
    [...value.matchAll(/\{\w+\}/g)].map((match) => match[0]).sort();
  for (const value of values) {
    assert(value?.trim(), `Empty translation: ${key}`);
    assert.deepEqual(
      placeholders(value),
      placeholders(key),
      `Interpolation mismatch: ${key}`,
    );
  }
  dictionary.set(key, values);
});
const requireKey = (key) =>
  assert(dictionary.has(key), `Missing static translation: ${key}`);
for (const file of [
  "App.tsx",
  "ComponentCatalog.tsx",
  "ConsistencyPreview.tsx",
  "ApiReference.tsx",
  "FeedbackPreview.tsx",
  "showcase-i18n.tsx",
]) {
  const source = parse(`apps/showcase/src/${file}`);
  visit(source, (node) => {
    if (
      ts.isCallExpression(node) &&
      ["t", "previewT"].includes(node.expression.getText(source)) &&
      ts.isStringLiteral(node.arguments[0])
    )
      requireKey(node.arguments[0].text);
  });
}
visit(parse("apps/showcase/src/component-catalog.ts"), (node) => {
  if (ts.isVariableDeclaration(node) && node.name.getText() === "rows")
    for (const row of node.initializer.elements) {
      requireKey(row.elements[2].text);
      requireKey(row.elements[4].text);
    }
});
console.log(
  `Validated ${dictionary.size} static ES/PT-BR entries, interpolation and catalog coverage.`,
);

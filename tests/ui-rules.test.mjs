import test from "node:test";
import assert from "node:assert/strict";
import { Linter } from "eslint";
import { uiRules } from "../scripts/eslint/ui-rules.mjs";
const linter = new Linter();
const check = code => linter.verify(code, [{languageOptions:{ecmaVersion:2022,sourceType:"module",parserOptions:{ecmaFeatures:{jsx:true}}},plugins:{ui:uiRules},rules:{"ui/shared-controls":"error"}}]);
test("UI ownership rejects raw controls and direct icon imports", () => {
  for (const tag of ["button","input","textarea","select","summary","svg"]) assert.ok(check(`const control = <${tag} />;`).some(m=>m.messageId==='raw'));
  assert.ok(check('import { X } from "lucide-react";').some(m=>m.messageId==='icon'));
});
test("shared controls allow layout but reject per-feature appearance", () => {
  assert.equal(check('const control = <Button variant="primary" style={{width:120}} />;').length,0);
  assert.ok(check('const control = <Button style={{fontSize:40}} />;').some(m=>m.messageId==='style'));
});

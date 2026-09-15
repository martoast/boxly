// ENTER MUST NOT SEND A HALF-TYPED MESSAGE.
//
// The guard is one condition, and the bug was its absence, so it is worth holding in place:
// customers sent "Cuál es el" and "Me refiero al" mid-sentence because a predictive-text
// accept fires keydown/Enter while the text is still being composed.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

let pass = 0;
const ok = (n, c) => { assert.ok(c, n); console.log('  ✓ ' + n); pass++; };

const sfc = readFileSync(new URL('./AssistantComposer.vue', import.meta.url), 'utf8');

// Rebuild onEnter from the component so the test exercises the real source, not a copy.
const body = sfc.match(/function onEnter\(e\) \{[\s\S]*?\n\}/)[0];
const onEnter = new Function(`${body}; return onEnter;`)();

const press = (over = {}) => {
  const e = { isComposing: false, keyCode: 13, prevented: false, preventDefault() { this.prevented = true; }, ...over };
  let sent = false;
  globalThis.doSend = () => { sent = true; };
  onEnter(e);
  return { sent, prevented: e.prevented };
};

{
  const r = press();
  ok('a finished message sends on Enter', r.sent === true);
  ok('and the newline is suppressed', r.prevented === true);
}
{
  // The actual bug: an IME/predictive-text Enter arrives mid-composition.
  const r = press({ isComposing: true });
  ok('an Enter while still composing does NOT send', r.sent === false);
  ok('and is NOT swallowed — that would lose the IME candidate', r.prevented === false);
}
{
  // Older engines report composition as keyCode 229 rather than isComposing.
  const r = press({ keyCode: 229 });
  ok('keyCode 229 is treated as composing too', r.sent === false && r.prevented === false);
}

ok('the template routes Enter through the guard, not straight to doSend',
  /@keydown\.enter\.exact="onEnter"/.test(sfc) && !/@keydown\.enter\.exact\.prevent="doSend"/.test(sfc));

console.log(`\n${pass} checks passed`);

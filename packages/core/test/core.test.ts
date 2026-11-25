import test from 'node:test';
import assert from 'node:assert/strict';
import {
  addClip, addText, duplicateClip, emptyProject, fadeFactor, History, layout, locate, moveClip, removeClip,
  splitAt, totalDuration, transitionAlpha, trimClip, updateClip, updateText,
} from '../src/index.ts';

const two = () => {
  let p = emptyProject();
  p = addClip(p, { id: 'm1', duration: 4 }, 'a');
  p = addClip(p, { id: 'm2', duration: 6 }, 'b');
  return p;
};

test('clips lay out end to end and total adds up', () => {
  const p = two();
  assert.equal(totalDuration(p), 10);
  assert.deepEqual(layout(p.clips).map((r) => [r.start, r.length]), [[0, 4], [4, 6]]);
});

test('locate picks the clip at a time, and the last clip past the end', () => {
  const p = two();
  assert.equal(locate(p, 1)?.clip.id, 'a');
  assert.equal(locate(p, 4)?.clip.id, 'b');
  assert.equal(locate(p, 99)?.clip.id, 'b');
  assert.equal(locate(p, 99)?.local, 6);
  assert.equal(locate(emptyProject(), 0), null);
});

test('split keeps total length and moves fades and transitions to the right side', () => {
  let p = two();
  p = updateClip(p, 'a', { fadeIn: 1, fadeOut: 1, transition: 'both' });
  const r = splitAt(p, 1.5, 'a2');
  assert.ok(r);
  const [first, second] = r.project.clips;
  assert.equal(totalDuration(r.project), 10);
  assert.equal(first.out, 1.5);
  assert.equal(second.in, 1.5);
  assert.equal(first.fadeOut, 0);
  assert.equal(second.fadeIn, 0);
  assert.equal(first.transition, 'in');
  assert.equal(second.transition, 'out');
  assert.equal(r.newClipId, 'a2');
});

test('split refuses to cut too close to a clip edge', () => {
  const p = two();
  assert.equal(splitAt(p, 0.05, 'x'), null);
  assert.equal(splitAt(p, 3.95, 'x'), null);
});

test('trim clamps to the media and to the minimum length', () => {
  const p = two();
  assert.equal(trimClip(p, 'a', 'out', 99, 4).clips[0].out, 4);
  assert.equal(trimClip(p, 'a', 'in', 99, 4).clips[0].in, 3.9);
  assert.equal(trimClip(p, 'a', 'in', -5, 4).clips[0].in, 0);
});

test('edits do not mutate the project they start from', () => {
  const p = two();
  const before = JSON.stringify(p);
  moveClip(p, 'a', 1); duplicateClip(p, 'a', 'z'); removeClip(p, 'a'); trimClip(p, 'a', 'out', 2, 4); addText(p, 0, 't');
  assert.equal(JSON.stringify(p), before);
});

test('move, duplicate and remove', () => {
  const p = two();
  assert.deepEqual(moveClip(p, 'a', 1).clips.map((c) => c.id), ['b', 'a']);
  assert.equal(moveClip(p, 'a', -1), p);
  assert.deepEqual(duplicateClip(p, 'a', 'z').clips.map((c) => c.id), ['a', 'z', 'b']);
  assert.deepEqual(removeClip(p, 'a').clips.map((c) => c.id), ['b']);
});

test('text overlays can be added, edited and ordered by id', () => {
  let p = addText(emptyProject(), 2, 't1');
  assert.equal(p.texts[0].start, 2);
  assert.equal(p.texts[0].end, 5);
  p = updateText(p, 't1', { text: 'Hello' });
  assert.equal(p.texts[0].text, 'Hello');
});

test('fade factor ramps in and out', () => {
  const c = updateClip(two(), 'a', { fadeIn: 1, fadeOut: 2 }).clips[0];
  assert.equal(fadeFactor(c, 0, 4), 0);
  assert.equal(fadeFactor(c, 0.5, 4), 0.5);
  assert.equal(fadeFactor(c, 2, 4), 1);
  assert.equal(fadeFactor(c, 3, 4), 0.5);
});

test('transition alpha dips to black at the chosen ends', () => {
  const c = updateClip(two(), 'a', { transition: 'both' }).clips[0];
  assert.equal(transitionAlpha(c, 0, 4), 0);
  assert.equal(transitionAlpha(c, 0.25, 4), 0.5);
  assert.equal(transitionAlpha(c, 2, 4), 1);
  assert.equal(transitionAlpha(c, 3.75, 4), 0.5);
  const none = updateClip(two(), 'a', { transition: 'none' }).clips[0];
  assert.equal(transitionAlpha(none, 0, 4), 1);
});

test('history undoes and redoes, and a new edit clears redo', () => {
  const h = new History(emptyProject());
  const p1 = h.push(addClip(h.present, { id: 'm', duration: 2 }, 'a'));
  const p2 = h.push(addText(p1, 0, 't'));
  assert.equal(h.canUndo, true);
  assert.equal(h.undo(), p1);
  assert.equal(h.canRedo, true);
  assert.equal(h.redo(), p2);
  h.undo();
  h.push(removeClip(p1, 'a'));
  assert.equal(h.canRedo, false);
});

test('history ignores a push of the same value and respects its limit', () => {
  const h = new History(0, 2);
  h.push(0);
  assert.equal(h.canUndo, false);
  h.push(1); h.push(2); h.push(3);
  assert.equal(h.undo(), 2);
  assert.equal(h.undo(), 1);
  assert.equal(h.undo(), 1);
});

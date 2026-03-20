/**
 * Postinstall patch: expo-av 16.x references EXEventEmitter.h and
 * EXEventEmitterService.h from <ExpoModulesCore/...>, but both headers
 * were removed in expo-modules-core 55.x.
 *
 * Strategy: drop stub headers directly into expo-av's own EXAV/ directory
 * and rewrite the #import lines in EXAV.h, EXAV.m, and EXAVTV.m to use
 * local "quoted" imports instead of <framework/angle-bracket> imports.
 * CocoaPods compiles EXAV from source, so the local headers are always found.
 *
 * Runs automatically via "postinstall" in package.json.
 */

const fs = require('fs');
const path = require('path');

const EXAV_DIR = path.join(__dirname, '..', 'node_modules', 'expo-av', 'ios', 'EXAV');

// ── 1. Create stub headers inside EXAV/ ─────────────────────────────────────

const stubs = {
  'EXEventEmitter.h': `\
// Auto-generated stub — see scripts/patch-expo-av.js
// EXEventEmitter was removed from expo-modules-core 55.x; expo-av 16.x still
// needs it.  This local stub satisfies the import without touching the pod.
#pragma once
#import <Foundation/Foundation.h>

@protocol EXEventEmitter <NSObject>
@required
- (NSArray<NSString *> *)supportedEvents;
- (void)startObserving;
- (void)stopObserving;
@end
`,
  'EXEventEmitterService.h': `\
// Auto-generated stub — see scripts/patch-expo-av.js
// EXEventEmitterService was removed from expo-modules-core 55.x; expo-av 16.x
// still needs it.  This local stub satisfies the import without touching the pod.
#pragma once
#import <Foundation/Foundation.h>

@protocol EXEventEmitterService <NSObject>
- (void)sendEventWithName:(NSString *)name body:(id)body;
@end
`,
};

for (const [filename, content] of Object.entries(stubs)) {
  const dest = path.join(EXAV_DIR, filename);
  fs.writeFileSync(dest, content, 'utf8');
  console.log(`patch-expo-av: wrote ${path.relative(process.cwd(), dest)}`);
}

// ── 2. Rewrite framework imports → local imports in EXAV source files ────────

const rewrites = [
  // file → [old substring, new substring]
  [
    'EXAV.h',
    '#import <ExpoModulesCore/EXEventEmitter.h>',
    '#import "EXEventEmitter.h"',
  ],
  [
    'EXAV.m',
    '#import <ExpoModulesCore/EXEventEmitterService.h>',
    '#import "EXEventEmitterService.h"',
  ],
  [
    'EXAVTV.m',
    '#import <ExpoModulesCore/EXEventEmitterService.h>',
    '#import "EXEventEmitterService.h"',
  ],
];

for (const [filename, oldStr, newStr] of rewrites) {
  const filePath = path.join(EXAV_DIR, filename);
  if (!fs.existsSync(filePath)) {
    console.warn(`patch-expo-av: ${filename} not found — skipping`);
    continue;
  }
  const original = fs.readFileSync(filePath, 'utf8');
  if (original.includes(newStr)) {
    console.log(`patch-expo-av: ${filename} already patched`);
    continue;
  }
  if (!original.includes(oldStr)) {
    console.warn(`patch-expo-av: ${filename}: expected import not found — skipping`);
    continue;
  }
  fs.writeFileSync(filePath, original.replace(oldStr, newStr), 'utf8');
  console.log(`patch-expo-av: patched ${filename}`);
}

console.log('patch-expo-av: done');

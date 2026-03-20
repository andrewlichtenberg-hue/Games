/**
 * Postinstall patch: expo-av 16.x references EXEventEmitter.h and
 * EXEventEmitterService.h from ExpoModulesCore, but these legacy headers
 * were removed in expo-modules-core 55.x.  We recreate them so the iOS
 * build succeeds without modifying expo-av itself.
 *
 * Runs automatically via "postinstall" in package.json.
 */

const fs = require('fs');
const path = require('path');

const legacyDir = path.join(
  __dirname,
  '..',
  'node_modules',
  'expo-modules-core',
  'ios',
  'Legacy',
  'Protocols',
);

const headers = {
  'EXEventEmitter.h': `\
// Auto-generated stub — see scripts/patch-expo-av.js
// EXEventEmitter was removed from expo-modules-core 55.x but expo-av 16.x
// still references it.  This stub satisfies the import.
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
// EXEventEmitterService was removed from expo-modules-core 55.x but
// expo-av 16.x still references it.  This stub satisfies the import.
#pragma once
#import <Foundation/Foundation.h>

@protocol EXEventEmitterService <NSObject>
- (void)sendEventWithName:(NSString *)name body:(id)body;
@end
`,
};

let ok = true;
for (const [filename, content] of Object.entries(headers)) {
  const dest = path.join(legacyDir, filename);
  try {
    if (!fs.existsSync(dest)) {
      fs.writeFileSync(dest, content, 'utf8');
      console.log(`patch-expo-av: created ${filename}`);
    }
  } catch (err) {
    console.error(`patch-expo-av: failed to write ${filename}: ${err.message}`);
    ok = false;
  }
}

if (ok) {
  console.log('patch-expo-av: expo-modules-core headers OK');
}

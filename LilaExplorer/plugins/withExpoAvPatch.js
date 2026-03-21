/**
 * Config plugin: patch expo-av 16.x for expo-modules-core 55.x compatibility.
 *
 * expo-av 16.x imports EXEventEmitter.h and EXEventEmitterService.h via
 *   #import <ExpoModulesCore/EXEventEmitter.h>
 * but both headers were removed in expo-modules-core 55.x, breaking iOS
 * builds with: 'ExpoModulesCore/EXEventEmitter.h' file not found
 *
 * Approach: inject a `pre_install` Ruby block into the generated Podfile.
 * This hook runs during `pod install` (guaranteed on every EAS Build),
 * before any compilation.  It writes stub headers into expo-av's own EXAV/
 * directory and rewrites the three affected source-file imports in-place.
 *
 * Because the stubs live inside expo-av's own source tree, CocoaPods finds
 * them as local "quoted" imports without touching expo-modules-core at all.
 */

const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

// Ruby code that will be prepended to the generated Podfile.
// Uses Ruby heredoc syntax; indented with 2-space to match Podfile style.
const PRE_INSTALL_HOOK = `
# ── expo-av / expo-modules-core 55.x compatibility patch ──────────────────
# EXEventEmitter.h and EXEventEmitterService.h were removed in EMC 55.x but
# expo-av 16.x still imports them.  We write stub headers into expo-av's own
# source tree and rewrite the #import lines before the build starts.
pre_install do |installer|
  exav_dir = File.expand_path('../../node_modules/expo-av/ios/EXAV', __dir__)

  unless Dir.exist?(exav_dir)
    Pod::UI.warn "[withExpoAvPatch] EXAV directory not found – skipping patch"
    next
  end

  # 1. Write stub headers
  {
    'EXEventEmitter.h' => <<~HEADER,
      // Stub: removed from expo-modules-core 55.x – created by withExpoAvPatch.js
      #pragma once
      #import <Foundation/Foundation.h>
      @protocol EXEventEmitter <NSObject>
      @required
      - (NSArray<NSString *> *)supportedEvents;
      - (void)startObserving;
      - (void)stopObserving;
      @end
    HEADER
    'EXEventEmitterService.h' => <<~HEADER,
      // Stub: removed from expo-modules-core 55.x – created by withExpoAvPatch.js
      #pragma once
      #import <Foundation/Foundation.h>
      @protocol EXEventEmitterService <NSObject>
      - (void)sendEventWithName:(NSString *)name body:(id)body;
      @end
    HEADER
  }.each do |filename, content|
    File.write(File.join(exav_dir, filename), content)
    Pod::UI.message "[withExpoAvPatch] wrote #{filename}"
  end

  # 2. Rewrite framework imports → local imports in three source files
  {
    'EXAV.h'   => ['#import <ExpoModulesCore/EXEventEmitter.h>',        '#import "EXEventEmitter.h"'],
    'EXAV.m'   => ['#import <ExpoModulesCore/EXEventEmitterService.h>', '#import "EXEventEmitterService.h"'],
    'EXAVTV.m' => ['#import <ExpoModulesCore/EXEventEmitterService.h>', '#import "EXEventEmitterService.h"'],
  }.each do |filename, (old_str, new_str)|
    filepath = File.join(exav_dir, filename)
    next unless File.exist?(filepath)
    content = File.read(filepath)
    next if content.include?(new_str)
    File.write(filepath, content.gsub(old_str, new_str))
    Pod::UI.message "[withExpoAvPatch] patched #{filename}"
  end

  Pod::UI.message "[withExpoAvPatch] expo-av patch complete"
end
# ──────────────────────────────────────────────────────────────────────────

`;

const withExpoAvPatch = (config) =>
  withDangerousMod(config, [
    'ios',
    (modConfig) => {
      const podfilePath = path.join(
        modConfig.modRequest.platformProjectRoot,
        'Podfile',
      );

      if (!fs.existsSync(podfilePath)) {
        console.warn('[withExpoAvPatch] Podfile not found – skipping');
        return modConfig;
      }

      const podfile = fs.readFileSync(podfilePath, 'utf8');

      // Avoid inserting twice
      if (podfile.includes('[withExpoAvPatch]')) {
        console.log('[withExpoAvPatch] Podfile already patched');
        return modConfig;
      }

      // Prepend the pre_install block right after the first require lines,
      // before any target blocks.  Inserting before the first blank line
      // after the header is safe for Expo-generated Podfiles.
      const patched = PRE_INSTALL_HOOK + podfile;
      fs.writeFileSync(podfilePath, patched, 'utf8');
      console.log('[withExpoAvPatch] injected pre_install hook into Podfile');

      return modConfig;
    },
  ]);

module.exports = withExpoAvPatch;

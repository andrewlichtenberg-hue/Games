/**
 * Config plugin: patch expo-av 16.x for expo-modules-core 55.x compatibility.
 *
 * expo-av 16.x imports EXEventEmitter.h and EXEventEmitterService.h via
 *   #import <ExpoModulesCore/EXEventEmitter.h>
 * but both headers were removed in expo-modules-core 55.x, breaking the iOS
 * Xcode build with: 'ExpoModulesCore/EXEventEmitter.h' file not found
 *
 * This plugin runs during `expo prebuild` (which always executes on EAS Build,
 * before `pod install`).  It:
 *   1. Writes stub header files into expo-av's own EXAV/ directory.
 *   2. Rewrites the three affected source files to use local "quoted" imports
 *      instead of <framework/angle-bracket> imports.
 *
 * Because the stubs live inside expo-av's own source tree, CocoaPods finds
 * them without any change to expo-modules-core.
 */

const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

function patchExpoAv(projectRoot) {
  const exavDir = path.join(projectRoot, 'node_modules', 'expo-av', 'ios', 'EXAV');

  if (!fs.existsSync(exavDir)) {
    console.warn('[withExpoAvPatch] EXAV directory not found — skipping patch');
    return;
  }

  // ── 1. Write stub headers ────────────────────────────────────────────────

  const stubs = {
    'EXEventEmitter.h': [
      '// Stub: EXEventEmitter was removed from expo-modules-core 55.x.',
      '// Created by plugins/withExpoAvPatch.js during expo prebuild.',
      '#pragma once',
      '#import <Foundation/Foundation.h>',
      '',
      '@protocol EXEventEmitter <NSObject>',
      '@required',
      '- (NSArray<NSString *> *)supportedEvents;',
      '- (void)startObserving;',
      '- (void)stopObserving;',
      '@end',
      '',
    ].join('\n'),

    'EXEventEmitterService.h': [
      '// Stub: EXEventEmitterService was removed from expo-modules-core 55.x.',
      '// Created by plugins/withExpoAvPatch.js during expo prebuild.',
      '#pragma once',
      '#import <Foundation/Foundation.h>',
      '',
      '@protocol EXEventEmitterService <NSObject>',
      '- (void)sendEventWithName:(NSString *)name body:(id)body;',
      '@end',
      '',
    ].join('\n'),
  };

  for (const [filename, content] of Object.entries(stubs)) {
    const dest = path.join(exavDir, filename);
    fs.writeFileSync(dest, content, 'utf8');
    console.log(`[withExpoAvPatch] wrote ${filename}`);
  }

  // ── 2. Rewrite framework imports → local imports ─────────────────────────

  const rewrites = [
    ['EXAV.h',   '#import <ExpoModulesCore/EXEventEmitter.h>',        '#import "EXEventEmitter.h"'],
    ['EXAV.m',   '#import <ExpoModulesCore/EXEventEmitterService.h>', '#import "EXEventEmitterService.h"'],
    ['EXAVTV.m', '#import <ExpoModulesCore/EXEventEmitterService.h>', '#import "EXEventEmitterService.h"'],
  ];

  for (const [filename, oldStr, newStr] of rewrites) {
    const filePath = path.join(exavDir, filename);
    if (!fs.existsSync(filePath)) {
      console.warn(`[withExpoAvPatch] ${filename} not found — skipping`);
      continue;
    }
    const src = fs.readFileSync(filePath, 'utf8');
    if (src.includes(newStr)) {
      console.log(`[withExpoAvPatch] ${filename} already patched`);
      continue;
    }
    if (!src.includes(oldStr)) {
      console.warn(`[withExpoAvPatch] ${filename}: expected import not found — skipping`);
      continue;
    }
    fs.writeFileSync(filePath, src.replace(oldStr, newStr), 'utf8');
    console.log(`[withExpoAvPatch] patched ${filename}`);
  }
}

const withExpoAvPatch = (config) =>
  withDangerousMod(config, [
    'ios',
    (modConfig) => {
      patchExpoAv(modConfig.modRequest.projectRoot);
      return modConfig;
    },
  ]);

module.exports = withExpoAvPatch;

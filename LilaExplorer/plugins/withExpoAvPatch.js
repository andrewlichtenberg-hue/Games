/**
 * Config plugin: fix expo-av 16.x compatibility with expo-modules-core 55.x.
 *
 * Symbols removed from ExpoModulesCore in SDK 55 but still used by expo-av:
 *   - EXEventEmitter.h, EXEventEmitterService.h, EXLegacyExpoViewProtocol.h
 *   - EXFatal(), EXErrorWithMessage(), EXLogWarn()
 *
 * Strategy:
 *   1. Write shim protocol headers into ExpoModulesCore public headers
 *   2. Write a prefix header with missing function/macro definitions
 *   3. Set GCC_PREFIX_HEADER on the EXAV pod target so it picks them up
 */
const { withDangerousMod } = require("expo/config-plugins");
const fs = require("fs");
const path = require("path");

const SHIM_MARKER = "# --- expo-av compat shim (ExpoModulesCore 55.x) ---";

const SHIM_RUBY = `
    ${SHIM_MARKER}

    # 1. Write missing protocol headers into ExpoModulesCore public headers
    installer.pods_project.targets.each do |target|
      next unless target.name == 'ExpoModulesCore'

      header_dir = File.join(installer.sandbox.root, 'Headers', 'Public', 'ExpoModulesCore')
      FileUtils.mkdir_p(header_dir)

      shims = {
        'EXEventEmitter.h' => <<~OBJC,
          #ifndef _EX_EVENT_EMITTER_SHIM_H
          #define _EX_EVENT_EMITTER_SHIM_H
          #import <Foundation/Foundation.h>
          @protocol EXEventEmitter <NSObject>
          - (NSArray<NSString *> *)supportedEvents;
          - (void)startObserving;
          - (void)stopObserving;
          @end
          #endif
        OBJC
        'EXEventEmitterService.h' => <<~OBJC,
          #ifndef _EX_EVENT_EMITTER_SERVICE_SHIM_H
          #define _EX_EVENT_EMITTER_SERVICE_SHIM_H
          #import <Foundation/Foundation.h>
          @protocol EXEventEmitterService <NSObject>
          - (void)sendEventWithName:(nonnull NSString *)name body:(nullable id)body;
          @end
          #endif
        OBJC
        'EXLegacyExpoViewProtocol.h' => <<~OBJC,
          #ifndef _EX_LEGACY_EXPO_VIEW_PROTOCOL_SHIM_H
          #define _EX_LEGACY_EXPO_VIEW_PROTOCOL_SHIM_H
          #import <Foundation/Foundation.h>
          @protocol EXLegacyExpoViewProtocol <NSObject>
          @optional
          - (void)updateProps:(nonnull NSDictionary *)props;
          @end
          #endif
        OBJC
      }

      shims.each do |name, content|
        p = File.join(header_dir, name)
        File.write(p, content)
      end
    end

    # 2. Write a prefix header with missing utility functions/macros
    prefix_dir = File.join(installer.sandbox.root, 'expo-av-shims')
    FileUtils.mkdir_p(prefix_dir)
    prefix_path = File.join(prefix_dir, 'expo-av-compat-prefix.h')
    File.write(prefix_path, <<~'OBJC')
      #ifndef _EX_AV_COMPAT_PREFIX_H
      #define _EX_AV_COMPAT_PREFIX_H

      #import <Foundation/Foundation.h>

      static inline NSError * _Nonnull EXErrorWithMessage(NSString * _Nonnull message) {
        return [NSError errorWithDomain:@"expo-av"
                                   code:0
                               userInfo:@{NSLocalizedDescriptionKey: message}];
      }

      static inline void EXFatal(NSError * _Nonnull error) {
        NSLog(@"[expo-av] Fatal error: %@", error);
        @throw [NSException exceptionWithName:@"EXFatalException"
                                       reason:error.localizedDescription
                                     userInfo:@{@"error": error}];
      }

      #define EXLogError(fmt, ...) NSLog(@"[expo-av] Error: " fmt, ##__VA_ARGS__)
      #define EXLogWarn(fmt, ...)  NSLog(@"[expo-av] Warning: " fmt, ##__VA_ARGS__)
      #define EXLogInfo(fmt, ...)  NSLog(@"[expo-av] Info: " fmt, ##__VA_ARGS__)

      // Legacy unimodules type aliases (UM* -> EX*)
      #import <ExpoModulesCore/EXDefines.h>
      typedef EXPromiseResolveBlock UMPromiseResolveBlock;
      typedef EXPromiseRejectBlock  UMPromiseRejectBlock;

      #endif
    OBJC

    # 3. Set the prefix header on every EXAV build configuration
    installer.pods_project.targets.each do |target|
      next unless target.name == 'EXAV'
      target.build_configurations.each do |bc|
        bc.build_settings['GCC_PREFIX_HEADER'] = prefix_path
        bc.build_settings['GCC_PRECOMPILE_PREFIX_HEADER'] = 'YES'
      end
    end
    # --- end expo-av compat shim ---`;

function withExpoAvPatch(config) {
  return withDangerousMod(config, [
    "ios",
    async (config) => {
      const podfilePath = path.join(
        config.modRequest.platformProjectRoot,
        "Podfile"
      );
      let podfile = fs.readFileSync(podfilePath, "utf8");

      if (podfile.includes(SHIM_MARKER)) {
        return config;
      }

      if (podfile.includes("post_install do |installer|")) {
        podfile = podfile.replace(
          "post_install do |installer|",
          `post_install do |installer|${SHIM_RUBY}`
        );
      } else {
        podfile += `\npost_install do |installer|${SHIM_RUBY}\nend\n`;
      }

      fs.writeFileSync(podfilePath, podfile);
      return config;
    },
  ]);
}

module.exports = withExpoAvPatch;

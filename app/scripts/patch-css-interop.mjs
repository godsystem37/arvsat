import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const file = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  'node_modules/react-native-css-interop/dist/metro/index.js',
);

if (!existsSync(file)) process.exit(0);

const source = readFileSync(file, 'utf8');
if (source.includes('modifiedFiles: new Map([[filePath, __metroChangeMeta]])')) {
  process.exit(0);
}

const needle = `            haste.emit("change", {
                eventsQueue: [
                    {
                        filePath,
                        metadata: {
                            modifiedTime: Date.now(),
                            size: 1,
                            type: "virtual",
                        },
                        type: "change",
                    },
                ],
            });`;

const next = `            const __metroChangeMeta = {
                modifiedTime: Date.now(),
                size: 1,
                type: "f",
            };
            try {
                haste.emit("change", {
                    eventsQueue: [
                        {
                            filePath,
                            metadata: {
                                modifiedTime: Date.now(),
                                size: 1,
                                type: "virtual",
                            },
                            type: "change",
                        },
                    ],
                    changes: {
                        addedFiles: new Map(),
                        modifiedFiles: new Map([[filePath, __metroChangeMeta]]),
                        removedFiles: new Map(),
                    },
                    rootDir: "",
                });
            }
            catch {
                // Metro 0.83+ crashes on the legacy eventsQueue-only payload.
            }`;

if (!source.includes(needle)) process.exit(0);
writeFileSync(file, source.replace(needle, next));

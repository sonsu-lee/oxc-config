import type { OxlintConfig, OxlintOverride } from 'oxlint';

export interface FilesPresetOptions {
  files: readonly string[];
}

function filePatterns(name: string, options: FilesPresetOptions): string[] {
  const files = options?.files;
  if (!Array.isArray(files) || files.length === 0) {
    throw new TypeError(`${name} requires a non-empty files array of non-empty strings`);
  }

  const patterns = Array.from(files);
  if (
    patterns.some((file) => typeof file !== 'string' || file.length === 0 || file.trim() !== file)
  ) {
    throw new TypeError(`${name} requires a non-empty files array of non-empty strings`);
  }

  return patterns;
}

export function scopedPreset(
  name: string,
  plugin: NonNullable<OxlintOverride['plugins']>[number],
  rules: NonNullable<OxlintConfig['rules']>,
  options: FilesPresetOptions,
): OxlintConfig {
  return {
    categories: { correctness: 'off' },
    overrides: [
      {
        files: filePatterns(name, options),
        plugins: [plugin],
        rules: structuredClone(rules),
      },
    ],
  };
}

import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { argbFromHex, hexFromArgb, themeFromSourceColor, TonalPalette } from "@material/material-color-utilities";

const tones = [100, 98, 96, 95, 94, 92, 90, 87, 80, 70, 60, 50, 40, 35, 30, 25, 24, 22, 20, 17, 12, 10, 6, 4, 0];


export default async function generate(config = {
  customColors: {
    primary: '#6750A4',
    secondary: '#625B71',
    tertiary: '#7D5260',
    neutral: '#67616f',
    neutralVariant: '#605666',
    error: '#B3261E'
  },
  customColors: [
    {
      name: 'customColor',
      color: '#5b7166'
    }
  ]
}, outputFilePath = './colorTokens.css') {
  const palette = createTheme(config);
  const content = `
    :root {
      ${Object.entries(palette.palettes).flatMap(([name, tones]) => {
    return Object.entries(tones).map(([tone, color]) => `--mc-${name}-${tone}: ${color};`);
  }).join('\n  ')}
      \n\n
      ${palette.customColors.length === 0 ? '' : '\n\n  /* custom colors */'}
      ${palette.customColors.flatMap(item => item.light.map(v => `${v.join(': ')};`).join('\n  '))}
    }
    ${palette.customColors.length === 0 ? '' : `
    .mc-theme-dark,
    :root.mc-theme-dark {
      /* custom colors */
      ${palette.customColors.flatMap(item => item.dark.map(v => `${v.join(': ')};`).join('\n  '))}
    }`}
  `.replace(/^\s\s\s\s/gm, '');

  await writeFile(path.resolve('.', outputFilePath), content);
}


function createTheme({ coreColors, customColors }) {
  if (!coreColors.primary) return;

  const sourceTheme = themeFromSourceColor(argbFromHex(coreColors.primary), (customColors || []).map(({ name, color }) => ({ name, value: color })));
  const palettes = {
    primary: Object.fromEntries(tones.map(tone => ([tone, hexFromArgb(sourceTheme.palettes.primary.tone(tone))]))),
    secondary: !coreColors.secondary && Object.fromEntries(tones.map(tone => ([tone, hexFromArgb(sourceTheme.palettes.secondary.tone(tone))]))),
    tertiary: !coreColors.tertiary && Object.fromEntries(tones.map(tone => ([tone, hexFromArgb(sourceTheme.palettes.tertiary.tone(tone))]))),
    neutral: !coreColors.neutral && Object.fromEntries(tones.map(tone => ([tone, hexFromArgb(sourceTheme.palettes.neutral.tone(tone))]))),
    neutralVariant: !coreColors.neutralVariant && Object.fromEntries(tones.map(tone => ([tone, hexFromArgb(sourceTheme.palettes.neutralVariant.tone(tone))]))),
    error: !coreColors.error && Object.fromEntries(tones.map(tone => ([tone, hexFromArgb(sourceTheme.palettes.error.tone(tone))])))
  };

  for (const [key, value] of Object.entries(coreColors)) {
    if (key === 'primary' || !value) continue;

    const palette = TonalPalette.fromInt(argbFromHex(value));
    palettes[key] = Object.fromEntries(tones.map(tone => ([tone, hexFromArgb(palette.tone(tone))])));
  }

  palettes['neutral-variant'] = palettes.neutralVariant;
  delete palettes.neutralVariant;
  const customColorsResult = (sourceTheme.customColors || []).map(item => ({
    name: item.color.name,
    color: item.value,
    light: [
      [`--mc-custom-color-${item.color.name}-color`, hexFromArgb(item.light.color)],
      [`--mc-custom-color-${item.color.name}-on-color`, hexFromArgb(item.light.onColor)],
      [`--mc-custom-color-${item.color.name}-color-container`, hexFromArgb(item.light.colorContainer)],
      [`--mc-custom-color-${item.color.name}-on-color-container`, hexFromArgb(item.light.onColorContainer)],
    ],
    dark: [
      [`--mc-custom-color-${item.color.name}-color`, hexFromArgb(item.dark.color)],
      [`--mc-custom-color-${item.color.name}-on-color`, hexFromArgb(item.dark.onColor)],
      [`--mc-custom-color-${item.color.name}-color-container`, hexFromArgb(item.dark.colorContainer)],
      [`--mc-custom-color-${item.color.name}-on-color-container`, hexFromArgb(item.dark.onColorContainer)],
    ]
  }));

  return {
    palettes,
    customColors: customColorsResult
  };
}

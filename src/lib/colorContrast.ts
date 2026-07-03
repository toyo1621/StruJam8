export interface RgbColor {
  red: number;
  green: number;
  blue: number;
}

export function parseHexColor(color: string): RgbColor {
  const match = /^#([0-9a-f]{6})$/i.exec(color.trim());

  if (!match) {
    throw new Error(`Unsupported hex color: ${color}`);
  }

  const channels = match[1].match(/.{2}/g)?.map((channel) => parseInt(channel, 16)) ?? [];
  const [red, green, blue] = channels;

  if (red === undefined || green === undefined || blue === undefined) {
    throw new Error(`Unsupported hex color: ${color}`);
  }

  return { red, green, blue };
}

function toLinearChannel(channel: number) {
  const srgb = channel / 255;
  return srgb <= 0.03928 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
}

export function getRelativeLuminance(color: string) {
  const { red, green, blue } = parseHexColor(color);
  return (
    0.2126 * toLinearChannel(red) +
    0.7152 * toLinearChannel(green) +
    0.0722 * toLinearChannel(blue)
  );
}

export function getContrastRatio(foreground: string, background: string) {
  const foregroundLuminance = getRelativeLuminance(foreground);
  const backgroundLuminance = getRelativeLuminance(background);
  const lighter = Math.max(foregroundLuminance, backgroundLuminance);
  const darker = Math.min(foregroundLuminance, backgroundLuminance);

  return (lighter + 0.05) / (darker + 0.05);
}

export function meetsContrastRatio(
  foreground: string,
  background: string,
  minimumRatio: number,
) {
  return getContrastRatio(foreground, background) >= minimumRatio;
}

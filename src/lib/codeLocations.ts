import type { CodeToken } from "./codeTokens";

export interface CodeLocation {
  start: number;
  end: number;
}

function rangesOverlap(start: number, end: number, location: CodeLocation) {
  const locationStart = Math.min(location.start, location.end);
  const locationEnd = Math.max(location.start, location.end);

  return locationStart < end && locationEnd > start;
}

export function getCodeLineOffsets(lines: readonly string[]) {
  let offset = 0;

  return lines.map((line) => {
    const lineOffset = offset;
    offset += line.length + 1;
    return lineOffset;
  });
}

export function getActiveCodeLineIndexesFromLocations(
  lines: readonly string[],
  locations: readonly CodeLocation[],
) {
  const offsets = getCodeLineOffsets(lines);
  const activeIndexes = new Set<number>();

  lines.forEach((line, index) => {
    const lineStart = offsets[index] ?? 0;
    const lineEnd = lineStart + line.length;

    if (locations.some((location) => rangesOverlap(lineStart, lineEnd, location))) {
      activeIndexes.add(index);
    }
  });

  return activeIndexes;
}

export interface CodeTokenSegment {
  text: string;
  isActive: boolean;
}

export function getCodeTokenSegments(
  lineOffset: number,
  tokenText: string,
  locations: readonly CodeLocation[],
): CodeTokenSegment[] {
  const tokenStart = lineOffset;
  const tokenEnd = tokenStart + tokenText.length;
  const boundaries = new Set<number>([tokenStart, tokenEnd]);

  locations.forEach((location) => {
    const locationStart = Math.max(tokenStart, Math.min(location.start, location.end));
    const locationEnd = Math.min(tokenEnd, Math.max(location.start, location.end));

    if (locationStart < locationEnd) {
      boundaries.add(locationStart);
      boundaries.add(locationEnd);
    }
  });

  const sortedBoundaries = [...boundaries].sort((a, b) => a - b);
  const segments: CodeTokenSegment[] = [];

  for (let index = 0; index < sortedBoundaries.length - 1; index += 1) {
    const segmentStart = sortedBoundaries[index] ?? tokenStart;
    const segmentEnd = sortedBoundaries[index + 1] ?? tokenEnd;

    if (segmentStart === segmentEnd) {
      continue;
    }

    segments.push({
      text: tokenText.slice(segmentStart - tokenStart, segmentEnd - tokenStart),
      isActive: locations.some((location) => rangesOverlap(segmentStart, segmentEnd, location)),
    });
  }

  return segments;
}

export function getActiveCodeTokenIndexes(
  lineOffset: number,
  tokens: readonly Pick<CodeToken, "text">[],
  locations: readonly CodeLocation[],
) {
  const activeIndexes = new Set<number>();
  let tokenOffset = lineOffset;

  tokens.forEach((token, index) => {
    const tokenStart = tokenOffset;
    const tokenEnd = tokenStart + token.text.length;

    if (locations.some((location) => rangesOverlap(tokenStart, tokenEnd, location))) {
      activeIndexes.add(index);
    }

    tokenOffset = tokenEnd;
  });

  return activeIndexes;
}

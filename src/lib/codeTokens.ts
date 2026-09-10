export type CodeTokenKind =
  | "text"
  | "whitespace"
  | "identifier"
  | "function"
  | "string"
  | "number"
  | "comment"
  | "punctuation"
  | "operator";

export interface CodeToken {
  text: string;
  kind: CodeTokenKind;
}

function isWhitespace(character: string | undefined) {
  return character === " " || character === String.fromCharCode(9);
}

function isDigit(character: string | undefined) {
  return character !== undefined && character >= "0" && character <= "9";
}

function isIdentifierStart(character: string | undefined) {
  return character !== undefined && ((character >= "A" && character <= "Z") || (character >= "a" && character <= "z") || character === "_" || character === "$");
}

function isIdentifierPart(character: string | undefined) {
  return isIdentifierStart(character) || isDigit(character);
}

function pushToken(tokens: CodeToken[], text: string, kind: CodeTokenKind) {
  if (text) {
    tokens.push({ text, kind });
  }
}

export function tokenizeCodeLine(line: string): CodeToken[] {
  const tokens: CodeToken[] = [];
  const quote = String.fromCharCode(34);
  const escape = String.fromCharCode(92);
  let index = 0;

  while (index < line.length) {
    const character = line[index];

    if (character === "/" && line[index + 1] === "/") {
      pushToken(tokens, line.slice(index), "comment");
      break;
    }

    if (isWhitespace(character)) {
      const start = index;
      while (isWhitespace(line[index])) {
        index += 1;
      }
      pushToken(tokens, line.slice(start, index), "whitespace");
      continue;
    }

    if (character === quote) {
      const start = index;
      index += 1;

      while (index < line.length) {
        if (line[index] === escape && index + 1 < line.length) {
          index += 2;
          continue;
        }

        const isClosingQuote = line[index] === quote;
        index += 1;

        if (isClosingQuote) {
          break;
        }
      }

      pushToken(tokens, line.slice(start, index), "string");
      continue;
    }

    if (isDigit(character) || (character === "-" && isDigit(line[index + 1]))) {
      const start = index;
      index += 1;

      while (isDigit(line[index])) {
        index += 1;
      }

      if (line[index] === ".") {
        index += 1;
        while (isDigit(line[index])) {
          index += 1;
        }
      }

      pushToken(tokens, line.slice(start, index), "number");
      continue;
    }

    if (isIdentifierStart(character)) {
      const start = index;
      index += 1;

      while (isIdentifierPart(line[index])) {
        index += 1;
      }

      const kind = line[index] === "(" ? "function" : "identifier";
      pushToken(tokens, line.slice(start, index), kind);
      continue;
    }

    if (".,()[]{}:".includes(character)) {
      pushToken(tokens, character, "punctuation");
      index += 1;
      continue;
    }

    if ("=><+-*/".includes(character)) {
      pushToken(tokens, character, "operator");
      index += 1;
      continue;
    }

    pushToken(tokens, character, "text");
    index += 1;
  }

  return tokens;
}

export type HSMLContent =
  | { kind: "text"; value: string }
  | { kind: "url"; value: string }
  | { kind: "style"; value: string };

export type IdentVal = { kind: "ident"; value: string };
export type CallVal = { kind: "call"; name: string; args: (number | string | IdentVal)[] };
export type ListVal = { kind: "list"; items: StyleValue[] };

export type StyleValue = number | string | IdentVal | CallVal | ListVal;
export type StyleMap = Record<string, StyleValue>;

export type NodeDecl = {
  path: string[];
  content?: HSMLContent;
  inlineStyle?: StyleMap;
  sourceLine: number;
};

export type RuleSelector =
  | { kind: "name"; a: string }
  | { kind: "path"; a: string }
  | { kind: "desc"; a: string; b: string };

export type StyleRule = {
  selector: RuleSelector;
  style: StyleMap;
  sourceLine: number;
};

export type ParseResult = {
  nodes: NodeDecl[];
  rules: StyleRule[];
};

export function parseHSML(src: string): ParseResult {
  const lines = src.split(/\r?\n/);
  const nodes: NodeDecl[] = [];
  const rules: StyleRule[] = [];

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const line = raw.trim();
    if (!line) continue;
    if (line.startsWith("#")) continue;

    const hasBrace = line.includes("{") && line.endsWith("}");
    const hasColon = line.includes(":");

    if (hasBrace && !hasColon) {
      const [selPart, stylePart] = splitOnce(line, "{");
      const selectorStr = selPart.trim();
      const styleBody = stylePart.slice(0, -1).trim(); // remove trailing }
      const selector = parseSelector(selectorStr);
      const style = parseStyleBody(styleBody);
      rules.push({ selector, style, sourceLine: i + 1 });
      continue;
    }

    const { pathStr, rest } = parsePathPrefix(line);
    const path = pathStr.split("/").filter(Boolean);

    let content: HSMLContent | undefined;
    let inlineStyle: StyleMap | undefined;

    let r = rest.trim();

    if (r.startsWith(":")) {
      r = r.slice(1).trim();
      const [contentPart, afterContent] = splitContentAndInlineStyle(r);
      content = parseContent(contentPart.trim());
      r = afterContent.trim();
    }

    if (r.startsWith("{") && r.endsWith("}")) {
      const body = r.slice(1, -1).trim();
      inlineStyle = parseStyleBody(body);
    } else if (r.length > 0) {
      const braceIdx = r.indexOf("{");
      if (braceIdx >= 0 && r.endsWith("}")) {
        const body = r.slice(braceIdx + 1, -1).trim();
        inlineStyle = parseStyleBody(body);
      }
    }

    nodes.push({ path, content, inlineStyle, sourceLine: i + 1 });
  }

  return { nodes, rules };
}

function splitOnce(s: string, sep: string): [string, string] {
  const idx = s.indexOf(sep);
  if (idx < 0) return [s, ""];
  return [s.slice(0, idx), s.slice(idx + sep.length)];
}

function parsePathPrefix(line: string): { pathStr: string; rest: string } {
  const colon = line.indexOf(":");
  const brace = line.indexOf("{");
  let cut = -1;
  if (colon >= 0 && brace >= 0) cut = Math.min(colon, brace);
  else cut = Math.max(colon, brace);
  if (cut < 0) return { pathStr: line.trim(), rest: "" };
  return { pathStr: line.slice(0, cut).trim(), rest: line.slice(cut).trim() };
}

function splitContentAndInlineStyle(s: string): [string, string] {
  let inStr = false;
  let esc = false;
  let parenDepth = 0;

  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (esc) { esc = false; continue; }
    if (c === "\\") { if (inStr) esc = true; continue; }
    if (c === "\"") { inStr = !inStr; continue; }
    if (!inStr) {
      if (c === "(") parenDepth++;
      else if (c === ")") parenDepth = Math.max(0, parenDepth - 1);
      else if (c === "{" && parenDepth === 0) {
        return [s.slice(0, i).trim(), s.slice(i).trim()];
      }
    }
  }
  return [s.trim(), ""];
}

function parseContent(s: string): HSMLContent {
  if (s.startsWith("\"")) return { kind: "text", value: parseString(s) };
  if (s.startsWith("url(")) return { kind: "url", value: parseFuncStringArg(s, "url") };
  if (s.startsWith("style(")) return { kind: "style", value: parseFuncStringArg(s, "style") };
  return { kind: "text", value: s };
}

function parseFuncStringArg(s: string, name: string): string {
  const prefix = `${name}(`;
  if (!s.startsWith(prefix) || !s.endsWith(")")) throw new Error(`Invalid ${name}(...)`);
  const inner = s.slice(prefix.length, -1).trim();
  return parseString(inner);
}

function parseString(s: string): string {
  const t = s.trim();
  if (!t.startsWith("\"") || !t.endsWith("\"")) throw new Error(`Expected STRING, got: ${s}`);
  const inner = t.slice(1, -1);
  return inner
    .replace(/\\n/g, "\n")
    .replace(/\\"/g, "\"")
    .replace(/\\\\/g, "\\");
}

function parseSelector(s: string): RuleSelector {
  const parts = s.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    if (parts[0].includes("/")) return { kind: "path", a: parts[0] };
    return { kind: "name", a: parts[0] };
  }
  if (parts.length === 2) return { kind: "desc", a: parts[0], b: parts[1] };
  return { kind: "name", a: s.trim() };
}

function parseStyleBody(body: string): StyleMap {
  const pairs = splitTopLevelPairs(body);
  const style: StyleMap = {};
  for (const p of pairs) {
    const [k, v] = splitOnce(p, ":");
    const key = k.trim();
    const valStr = v.trim();
    if (!key) continue;
    style[key] = parseValue(valStr);
  }
  return style;
}

function splitTopLevelPairs(body: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inStr = false;
  let esc = false;
  let bracket = 0;
  let paren = 0;

  for (let i = 0; i < body.length; i++) {
    const c = body[i];
    if (esc) { cur += c; esc = false; continue; }
    if (c === "\\" && inStr) { cur += c; esc = true; continue; }
    if (c === "\"") { cur += c; inStr = !inStr; continue; }

    if (!inStr) {
      if (c === "[") bracket++;
      else if (c === "]") bracket = Math.max(0, bracket - 1);
      else if (c === "(") paren++;
      else if (c === ")") paren = Math.max(0, paren - 1);

      if ((c === " " || c === "\t") && bracket === 0 && paren === 0) {
        if (cur.trim()) out.push(cur.trim());
        cur = "";
        continue;
      }
    }
    cur += c;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

function parseValue(s: string): StyleValue {
  const t = s.trim();
  if (!t) return { kind: "ident", value: "" };

  if (t.startsWith("\"")) return parseString(t);
  if (t.startsWith("[")) return parseList(t);
  if (/^-?\d+(\.\d+)?$/.test(t)) return Number(t);

  const callMatch = /^([A-Za-z_][A-Za-z0-9_-]*)\((.*)\)$/.exec(t);
  if (callMatch) {
    const name = callMatch[1];
    const argsRaw = splitArgs(callMatch[2]);
    const args = argsRaw.map(parseArg);
    return { kind: "call", name, args };
  }

  return { kind: "ident", value: t };
}

function parseList(t: string): ListVal {
  if (!t.startsWith("[") || !t.endsWith("]")) throw new Error("Invalid list");
  const inner = t.slice(1, -1).trim();
  if (!inner) return { kind: "list", items: [] };
  const items = splitArgs(inner).map(parseValue);
  return { kind: "list", items };
}

function splitArgs(s: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inStr = false;
  let esc = false;
  let bracket = 0;
  let paren = 0;

  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (esc) { cur += c; esc = false; continue; }
    if (c === "\\" && inStr) { cur += c; esc = true; continue; }
    if (c === "\"") { cur += c; inStr = !inStr; continue; }

    if (!inStr) {
      if (c === "[") bracket++;
      else if (c === "]") bracket = Math.max(0, bracket - 1);
      else if (c === "(") paren++;
      else if (c === ")") paren = Math.max(0, paren - 1);

      if (c === "," && bracket === 0 && paren === 0) {
        if (cur.trim()) out.push(cur.trim());
        cur = "";
        continue;
      }
    }
    cur += c;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

function parseArg(a: string): number | string | IdentVal {
  const t = a.trim();
  if (!t) return { kind: "ident", value: "" };
  if (t.startsWith("\"")) return parseString(t);
  if (/^-?\d+(\.\d+)?$/.test(t)) return Number(t);
  return { kind: "ident", value: t };
}


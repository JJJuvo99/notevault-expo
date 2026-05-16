export type BlockType =
  | "text"
  | "h1"
  | "h2"
  | "h3"
  | "quote"
  | "callout"
  | "bullet"
  | "numbered"
  | "checklist"
  | "divider"
  | "code"
  | "table"
  | "image";

export interface Block {
  id: string;
  type: BlockType;
  text?: string;
  checked?: boolean;
  collapsed?: boolean;
  language?: string;
  rows?: string[][];
  url?: string;
  caption?: string;
}

export function uid(): string {
  return (
    Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)
  );
}

export function newBlock(type: BlockType): Block {
  const base: Block = { id: uid(), type };

  if (type === "code") {
    return {
      ...base,
      text: "",
      language: "javascript",
    };
  }

  if (type === "table") {
    return {
      ...base,
      rows: [
        ["Header 1", "Header 2", "Header 3"],
        ["", "", ""],
        ["", "", ""],
      ],
    };
  }

  if (type === "image") {
    return {
      ...base,
      url: "",
      caption: "",
    };
  }

  if (type === "divider") {
    return base;
  }

  if (type === "checklist") {
    return {
      ...base,
      text: "",
      checked: false,
    };
  }

  return {
    ...base,
    text: "",
  };
}

export function emptyDoc(): Block[] {
  return [newBlock("text")];
}

export function parseContent(content: string | undefined | null): Block[] {
  if (!content || !content.trim()) {
    return emptyDoc();
  }

  const trimmed = content.trim();

  if (trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed) as Block[];

      if (
        Array.isArray(parsed) &&
        parsed.every((b) => b && typeof b === "object" && "type" in b)
      ) {
        return parsed.map((b) => ({
          ...b,
          id: b.id || uid(),
        }));
      }
    } catch {
      // fallback to markdown parsing
    }
  }

  return markdownToBlocks(content);
}

export function serializeBlocks(blocks: Block[]): string {
  return JSON.stringify(blocks);
}

export function blocksToPlainText(blocks: Block[]): string {
  return blocks
    .map((b) => {
      if (b.type === "divider") return "---";

      if (b.type === "table") {
        return (b.rows ?? []).map((r) => r.join(" | ")).join("\n");
      }

      if (b.type === "code") {
        return b.text ?? "";
      }

      if (b.type === "image") {
        return b.caption ?? b.url ?? "";
      }

      return b.text ?? "";
    })
    .filter(Boolean)
    .join("\n");
}

function markdownToBlocks(md: string): Block[] {
  const lines = md.split("\n");
  const blocks: Block[] = [];

  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // CODE BLOCKS
    if (/^```/.test(line.trim())) {
      const lang = line.trim().slice(3).trim() || "plaintext";
      const codeLines: string[] = [];

      i++;

      while (i < lines.length && !/^```/.test(lines[i].trim())) {
        codeLines.push(lines[i]);
        i++;
      }

      i++;

      blocks.push({
        id: uid(),
        type: "code",
        language: lang,
        text: codeLines.join("\n"),
      });

      continue;
    }

    // TABLES
    if (/^\|/.test(line.trim())) {
      const tableLines: string[] = [];

      while (i < lines.length && /^\|/.test(lines[i].trim())) {
        tableLines.push(lines[i].trim());
        i++;
      }

      const rows = tableLines
        .filter((l) => !/^\|\s*-+/.test(l) && !/^\|\s*:?-+:?\s*\|/.test(l))
        .map((l) =>
          l
            .replace(/^\||\|$/g, "")
            .split("|")
            .map((c) => c.trim()),
        );

      if (rows.length > 0) {
        blocks.push({
          id: uid(),
          type: "table",
          rows,
        });
      }

      continue;
    }

    // DIVIDER
    if (/^---\s*$/.test(line.trim())) {
      blocks.push({
        id: uid(),
        type: "divider",
      });

      i++;
      continue;
    }

    // HEADINGS
    if (/^###\s+/.test(line)) {
      blocks.push({
        id: uid(),
        type: "h3",
        text: line.replace(/^###\s+/, ""),
      });

      i++;
      continue;
    }

    if (/^##\s+/.test(line)) {
      blocks.push({
        id: uid(),
        type: "h2",
        text: line.replace(/^##\s+/, ""),
      });

      i++;
      continue;
    }

    if (/^#\s+/.test(line)) {
      blocks.push({
        id: uid(),
        type: "h1",
        text: line.replace(/^#\s+/, ""),
      });

      i++;
      continue;
    }

    // CHECKLIST
    const checkM = line.match(/^-\s+\[( |x|X)\]\s+(.*)$/);

    if (checkM) {
      blocks.push({
        id: uid(),
        type: "checklist",
        text: checkM[2],
        checked: checkM[1].toLowerCase() === "x",
      });

      i++;
      continue;
    }

    // BULLET
    if (/^[-*]\s+/.test(line)) {
      blocks.push({
        id: uid(),
        type: "bullet",
        text: line.replace(/^[-*]\s+/, ""),
      });

      i++;
      continue;
    }

    // NUMBERED
    if (/^\d+\.\s+/.test(line)) {
      blocks.push({
        id: uid(),
        type: "numbered",
        text: line.replace(/^\d+\.\s+/, ""),
      });

      i++;
      continue;
    }

    // CALLOUT
    if (/^>\s*\*\*Note:\*\*/i.test(line)) {
      blocks.push({
        id: uid(),
        type: "callout",
        text: line.replace(/^>\s*\*\*Note:\*\*\s*/i, ""),
      });

      i++;
      continue;
    }

    // QUOTE
    if (/^>\s+/.test(line)) {
      blocks.push({
        id: uid(),
        type: "quote",
        text: line.replace(/^>\s+/, ""),
      });

      i++;
      continue;
    }

    // IMAGE
    const imgM = line.match(/^!\[([^\]]*)\]\(([^)]+)\)/);

    if (imgM) {
      blocks.push({
        id: uid(),
        type: "image",
        url: imgM[2],
        caption: imgM[1],
      });

      i++;
      continue;
    }

    // EMPTY LINE
    if (line.trim().length === 0) {
      const last = blocks[blocks.length - 1];

      if (!last || last.type !== "text" || (last.text ?? "").length > 0) {
        blocks.push({
          id: uid(),
          type: "text",
          text: "",
        });
      }

      i++;
      continue;
    }

    // DEFAULT TEXT
    blocks.push({
      id: uid(),
      type: "text",
      text: line,
    });

    i++;
  }

  return blocks.length > 0 ? blocks : emptyDoc();
}

export function mapBlockTypeFromMarkdown(markdown: string): BlockType | null {
  const t = markdown.trim();

  if (t === "#" || t.startsWith("# ")) return "h1";
  if (t === "##" || t.startsWith("## ")) return "h2";
  if (t === "###" || t.startsWith("### ")) return "h3";

  if (t.startsWith("- [ ]") || t.startsWith("- [x]")) {
    return "checklist";
  }

  if (t.startsWith("-") || t.startsWith("*")) {
    return "bullet";
  }

  if (t.startsWith("1.")) {
    return "numbered";
  }

  if (t.startsWith(">") && t.includes("Note:")) {
    return "callout";
  }

  if (t.startsWith(">")) {
    return "quote";
  }

  if (t === "---") {
    return "divider";
  }

  if (t === "CODE_BLOCK") {
    return "code";
  }

  if (t === "TABLE") {
    return "table";
  }

  if (t.startsWith("![")) {
    return "image";
  }

  return null;
}

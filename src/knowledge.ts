/**
 * Searches the Markdown knowledge base (knowledge/*.md) so support answers are
 * grounded in what the team has written down. Files are re-read on every call,
 * so edits apply without a restart.
 */
import { readdir, readFile } from "node:fs/promises";
import { basename, join } from "node:path";

export interface KnowledgeSection {
  file: string;
  heading: string;
  text: string;
}

export function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

/** Splits a Markdown document into sections at ## / ### headings. */
export function splitSections(file: string, markdown: string): KnowledgeSection[] {
  const sections: KnowledgeSection[] = [];
  let heading = basename(file, ".md");
  let parents: string[] = [];
  let buf: string[] = [];
  const flush = () => {
    const text = buf.join("\n").trim();
    if (text) sections.push({ file, heading, text });
    buf = [];
  };
  for (const line of markdown.split("\n")) {
    const m = /^(#{1,3})\s+(.*)$/.exec(line);
    if (m) {
      flush();
      const level = m[1]!.length;
      parents = parents.slice(0, Math.max(0, level - 1));
      parents[level - 1] = m[2]!.trim();
      heading = parents.filter(Boolean).join(" › ");
      buf.push(line);
    } else {
      buf.push(line);
    }
  }
  flush();
  return sections;
}

export async function loadKnowledge(dir: string): Promise<KnowledgeSection[]> {
  const files = (await readdir(dir)).filter((f) => f.endsWith(".md")).sort();
  const all: KnowledgeSection[] = [];
  for (const f of files) all.push(...splitSections(f, await readFile(join(dir, f), "utf8")));
  return all;
}

const STOPWORDS = new Set(
  (
    "a o e de da do das dos que para por com em no na nos nas um uma os as se nao sim ja como " +
    "eu meu minha voce voces ele ela isso isto esta este essa esse tem ter ver onde qual quando quero queria " +
    "posso pode podem consigo consegue saber faco fazer faz fiz mais muito boa bom dia tarde noite ola obrigado " +
    "the to is and of in for on how can my do does what where i"
  ).split(" "),
);

export function searchKnowledge(sections: KnowledgeSection[], query: string, limit = 5): KnowledgeSection[] {
  const terms = normalize(query)
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 1 && !STOPWORDS.has(t));
  if (!terms.length) return [];
  const scored = sections.map((s) => {
    const heading = normalize(s.heading);
    const body = normalize(s.text);
    let score = 0;
    let matched = 0;
    for (const t of terms) {
      const inHeading = heading.includes(t);
      const count = body.split(t).length - 1;
      if (inHeading || count) matched++;
      score += (inHeading ? 5 : 0) + Math.min(count, 5);
    }
    // Favour sections that match more of the distinct query terms.
    return { s, score: score * (matched / terms.length), coverage: matched / terms.length };
  });
  // With longer queries, require a reasonable share of the terms to match, so a
  // single common word doesn't drag in an unrelated section.
  const minCoverage = terms.length >= 3 ? 0.34 : 0;
  return scored
    .filter((x) => x.score > 0 && x.coverage >= minCoverage)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.s);
}

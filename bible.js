
async function loadBibleFile(filename) {
  const response = await fetch(filename);

  if (!response.ok) {
    throw new Error(`Could not load ${filename}`);
  }

  const text = await response.text();
  const verses = new Map();

  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^(.+?)\s+(\d+:\d+)\t(.+)$/);

    if (!match) continue;

    const [, book, reference, content] = match;
    const key = `${book} ${reference}`;

    verses.set(key, content.trim());
  }

  return verses;
}

function normalize(text) {
  return text
    .normalize("NFC")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[—–]/g, "-")
    .replace(/[.,;:!?'"()\-]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

async function loadComparison() {
  const [ylt, web] = await Promise.all([
    loadBibleFile("YLT.txt"),
    loadBibleFile("WEB.txt")
  ]);

  const references = [...new Set([
    ...ylt.keys(),
    ...web.keys()
  ])];

  return references.map(reference => {
    const literal = ylt.get(reference);
    const readable = web.get(reference);

    return {
      reference,
      literal,
      readable,
      differs:
        literal !== undefined &&
        readable !== undefined &&
        normalize(literal) !== normalize(readable)
    };
  });
}

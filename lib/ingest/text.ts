export const normalizeText = (input: string) => {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

export const matchAliases = (text: string, aliases: string[]) => {
  const normalized = normalizeText(text);
  const matches: string[] = [];

  for (const alias of aliases) {
    const aliasNormalized = normalizeText(alias);
    if (!aliasNormalized) {
      continue;
    }
    if (normalized.includes(aliasNormalized)) {
      matches.push(alias);
    }
  }

  return matches;
};

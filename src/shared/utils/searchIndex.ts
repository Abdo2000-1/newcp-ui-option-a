/**
 * UIUX-REQ-009 — Global Search Debouncing & Token Indexing Utility
 *
 * In-memory tokenized search indexing structure for instant, offline,
 * whitespace-tolerant, multi-token fuzzy matching across clinical orders,
 * patients, doctors, facilities, and system quick actions.
 */

export interface SearchResultItem {
  id: string;
  category: 'orders' | 'patients' | 'doctors' | 'clinics' | 'actions';
  title: string;
  subtitle: string;
  tag?: string;
  badgeColor?: string;
  route: string;
  icon: any;
}

export interface IndexedItem {
  item: SearchResultItem;
  id: string;
  category: string;
  searchableText: string;
  tokens: string[];
}

/**
 * Normalizes a text string for search:
 * - Converts to lowercase
 * - Strips special punctuation while preserving letters, digits, '#', and '-'
 * - Collapses extra whitespace
 * - Trims ends cleanly
 */
export function normalizeSearchTerm(term: string): string {
  if (!term) return '';
  return term
    .toLowerCase()
    .replace(/[^\p{L}\p{N}#-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extracts unique search tokens from a string.
 */
export function tokenize(text: string): string[] {
  const normalized = normalizeSearchTerm(text);
  if (!normalized) return [];
  return Array.from(new Set(normalized.split(' ').filter(Boolean)));
}

/**
 * Creates an indexable item from a SearchResultItem and any auxiliary search strings.
 */
export function createIndexedItem(
  item: SearchResultItem,
  auxiliaryTexts: (string | undefined | null)[] = []
): IndexedItem {
  const allTexts = [item.title, item.subtitle, item.tag || '', ...auxiliaryTexts].filter(Boolean);
  const combined = allTexts.join(' ');
  const searchableText = normalizeSearchTerm(combined);
  const tokens = tokenize(combined);

  return {
    item,
    id: item.id,
    category: item.category,
    searchableText,
    tokens,
  };
}

/**
 * Matches a query against an indexed item.
 * Supports:
 * - Multi-token queries (AND semantics: all tokens must match)
 * - Partial token matching (prefix or substring)
 * - Order number and ID exact/prefix matching
 * - Whitespace tolerance
 */
export function matchItem(indexedItem: IndexedItem, queryTokens: string[]): boolean {
  if (queryTokens.length === 0) return true;

  const { searchableText, tokens } = indexedItem;

  // Every token in the query must match something in the item
  for (const qToken of queryTokens) {
    // 1. Direct substring in full searchable text
    if (searchableText.includes(qToken)) {
      continue;
    }

    // 2. Prefix match on any individual token
    const tokenMatch = tokens.some((t) => t.startsWith(qToken) || t.includes(qToken));
    if (tokenMatch) {
      continue;
    }

    // If neither matched, this item fails
    return false;
  }

  return true;
}

/**
 * Calculates a relevance score for sorting:
 * Higher score = higher relevance.
 */
export function calculateRelevance(indexedItem: IndexedItem, query: string, queryTokens: string[]): number {
  const cleanQ = normalizeSearchTerm(query);
  if (!cleanQ) return 0;

  const titleNorm = normalizeSearchTerm(indexedItem.item.title);
  let score = 0;

  // Exact ID / Order number match
  if (titleNorm.includes(cleanQ)) {
    score += 50;
  }
  if (titleNorm.startsWith(cleanQ)) {
    score += 30;
  }

  // Token matches in title vs subtitle
  for (const t of queryTokens) {
    if (titleNorm.includes(t)) {
      score += 15;
    }
    if (indexedItem.tokens.includes(t)) {
      score += 10;
    }
  }

  return score;
}

/**
 * In-Memory Search Index Class
 * Reusable structure holding pre-indexed items for instant querying.
 */
export class SearchIndex {
  private items: IndexedItem[] = [];

  constructor(items: IndexedItem[] = []) {
    this.items = items;
  }

  public setItems(items: IndexedItem[]) {
    this.items = items;
  }

  public size(): number {
    return this.items.length;
  }

  public search(
    query: string,
    category: string = 'all',
    limits: {
      maxTotal?: number;
      maxPerCategory?: Record<string, number>;
    } = {}
  ): SearchResultItem[] {
    const cleanQ = query.trim();
    const queryTokens = tokenize(cleanQ);

    // Filter by category and token match
    let candidates = this.items.filter((entry) => {
      if (category !== 'all' && entry.category !== category) {
        return false;
      }
      return matchItem(entry, queryTokens);
    });

    // If query exists, rank by relevance
    if (cleanQ) {
      candidates.sort((a, b) => {
        const scoreA = calculateRelevance(a, cleanQ, queryTokens);
        const scoreB = calculateRelevance(b, cleanQ, queryTokens);
        return scoreB - scoreA;
      });
    }

    // If category is specific, apply total limit
    if (category !== 'all') {
      const max = limits.maxTotal || 20;
      return candidates.slice(0, max).map((c) => c.item);
    }

    // Balanced category distribution for 'all'
    if (limits.maxPerCategory && cleanQ) {
      const perCat = limits.maxPerCategory;
      const grouped: Record<string, SearchResultItem[]> = {};

      for (const c of candidates) {
        if (!grouped[c.category]) {
          grouped[c.category] = [];
        }
        const maxForCat = perCat[c.category] ?? 10;
        if (grouped[c.category].length < maxForCat) {
          grouped[c.category].push(c.item);
        }
      }

      // Order categories logically
      const order = ['orders', 'actions', 'patients', 'doctors', 'clinics'];
      const combined: SearchResultItem[] = [];
      for (const cat of order) {
        if (grouped[cat]) {
          combined.push(...grouped[cat]);
        }
      }
      return combined;
    }

    const max = limits.maxTotal || 20;
    return candidates.slice(0, max).map((c) => c.item);
  }
}

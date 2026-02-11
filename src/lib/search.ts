import { supabase } from './supabase';
import type { Post, PaperReview, KnowledgeNode } from './supabase';

export type SearchResultType = 'post' | 'paper' | 'node';

export interface SearchResult {
  type: SearchResultType;
  id: string;
  title: string;
  subtitle?: string;
  excerpt: string;
  path: string;
  createdAt: string;
  meta?: string;
}

const excerpt = (text: string, maxLen = 120): string => {
  const t = (text || '')
    .replace(/#{1,6}\s/g, '')
    .replace(/\*\*|__|[*_`]/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/!\[.*?\]\(.*?\)/g, '')
    .replace(/\n/g, ' ')
    .trim();
  return t.length <= maxLen ? t : `${t.slice(0, maxLen)}...`;
};

function sanitizeSearchInput(raw: string): string {
  return raw
    .slice(0, 100)
    .replace(/[,%()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function searchAll(query: string): Promise<{
  posts: Post[];
  papers: PaperReview[];
  nodes: KnowledgeNode[];
}> {
  const q = sanitizeSearchInput(query.trim());
  if (!q) return { posts: [], papers: [], nodes: [] };

  const pattern = `%${q}%`;

  const [postsRes, papersRes, nodesRes] = await Promise.all([
    supabase
      .from('posts')
      .select('*')
      .eq('published', true)
      .or(`title.ilike.${pattern},content.ilike.${pattern}`)
      .order('created_at', { ascending: false })
      .limit(15),
    supabase
      .from('paper_reviews')
      .select('*')
      .eq('published', true)
      .or(`title.ilike.${pattern},tldr.ilike.${pattern},content.ilike.${pattern},authors.ilike.${pattern}`)
      .order('created_at', { ascending: false })
      .limit(15),
    supabase
      .from('knowledge_nodes')
      .select('*')
      .or(`label.ilike.${pattern},description.ilike.${pattern}`)
      .order('created_at', { ascending: false })
      .limit(15),
  ]);

  return {
    posts: (postsRes.data || []) as Post[],
    papers: (papersRes.data || []) as PaperReview[],
    nodes: (nodesRes.data || []) as KnowledgeNode[],
  };
}

export function toSearchResults(
  posts: Post[],
  papers: PaperReview[],
  nodes: KnowledgeNode[]
): SearchResult[] {
  const results: SearchResult[] = [];

  posts.forEach((p) => {
    results.push({
      type: 'post',
      id: p.id,
      title: p.title,
      excerpt: excerpt(p.content),
      path: `/posts/${p.id}`,
      createdAt: p.created_at,
      meta: '블로그',
    });
  });

  papers.forEach((p) => {
    results.push({
      type: 'paper',
      id: p.id,
      title: p.title,
      subtitle: p.authors,
      excerpt: excerpt(p.tldr || p.content, 100),
      path: `/papers/${p.id}`,
      createdAt: p.created_at,
      meta: p.venue,
    });
  });

  nodes.forEach((n) => {
    const typeLabel =
      { field: '분야', technology: '기술', concept: '개념', paper: '논문' }[n.type] || n.type;
    results.push({
      type: 'node',
      id: n.id,
      title: n.label,
      excerpt: excerpt(n.description || '', 100),
      path: `/papers/${n.id}`,
      createdAt: n.created_at,
      meta: typeLabel,
    });
  });

  return results;
}

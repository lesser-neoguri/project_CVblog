import { supabase, PaperReview } from './supabase';
import { createKnowledgeNode, getKnowledgeNodeByPaperReviewId, updateKnowledgeNode } from './knowledge';

// 논문 리뷰 생성 (지식 그래프 노드 자동 생성)
export async function createPaperReview(data: {
  title: string;
  authors: string;
  venue: string;
  year: number;
  paper_url?: string;
  tldr: string;
  content: string;
  tags?: string[];
  rating: number;
  published?: boolean;
  node_label?: string | null;
}): Promise<PaperReview> {
  const nodeLabel = data.node_label?.trim() || null;

  const { data: review, error } = await supabase
    .from('paper_reviews')
    .insert({
      title: data.title,
      authors: data.authors,
      venue: data.venue,
      year: data.year,
      paper_url: data.paper_url || null,
      tldr: data.tldr,
      content: data.content,
      tags: data.tags || [],
      rating: data.rating,
      published: data.published ?? false,
      node_label: nodeLabel,
    })
    .select()
    .single();

  if (error) {
    console.error('논문 리뷰 생성 오류:', error);
    throw error;
  }

  const r = review as PaperReview;
  const label = nodeLabel || r.title;

  await createKnowledgeNode({
    label,
    type: 'paper',
    description: r.tldr,
    url: r.paper_url,
    color: null,
    metadata: { paper_review_id: r.id, venue: r.venue, authors: r.authors, year: r.year },
  });

  return r;
}

// 논문 리뷰 목록 조회
export async function getPaperReviews(publishedOnly = true): Promise<PaperReview[]> {
  let query = supabase
    .from('paper_reviews')
    .select('*')
    .order('created_at', { ascending: false });

  if (publishedOnly) {
    query = query.eq('published', true);
  }

  const { data, error } = await query;

  if (error) {
    console.error('논문 리뷰 목록 조회 오류:', error);
    throw error;
  }

  return data as PaperReview[];
}

// ID로 논문 리뷰 조회
export async function getPaperReviewById(id: string): Promise<PaperReview> {
  const { data, error } = await supabase
    .from('paper_reviews')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('논문 리뷰 조회 오류:', error);
    throw error;
  }

  return data as PaperReview;
}

// 논문 리뷰 수정
export async function updatePaperReview(
  id: string,
  data: Partial<Omit<PaperReview, 'id' | 'created_at'>>
): Promise<PaperReview> {
  const { data: review, error } = await supabase
    .from('paper_reviews')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('논문 리뷰 수정 오류:', error);
    throw error;
  }

  const r = review as PaperReview;
  if (data.node_label !== undefined) {
    const node = await getKnowledgeNodeByPaperReviewId(id);
    const label = data.node_label?.trim() || r.title;
    if (node) {
      await updateKnowledgeNode(node.id, { label, description: r.tldr, url: r.paper_url });
    } else {
      await createKnowledgeNode({
        label,
        type: 'paper',
        description: r.tldr,
        url: r.paper_url,
        color: null,
        metadata: { paper_review_id: r.id, venue: r.venue, authors: r.authors, year: r.year },
      });
    }
  }

  return r;
}

// 논문 리뷰 삭제
export async function deletePaperReview(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('paper_reviews')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('논문 리뷰 삭제 오류:', error);
    throw error;
  }

  return true;
}

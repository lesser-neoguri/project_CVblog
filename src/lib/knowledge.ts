import { supabase, KnowledgeNode, KnowledgeEdge } from './supabase';

// 모든 노드 조회
export async function getKnowledgeNodes(): Promise<KnowledgeNode[]> {
  const { data, error } = await supabase
    .from('knowledge_nodes')
    .select('*')
    .order('label');

  if (error) { console.error('노드 조회 오류:', error); throw error; }
  return data as KnowledgeNode[];
}

// 모든 엣지 조회
export async function getKnowledgeEdges(): Promise<KnowledgeEdge[]> {
  const { data, error } = await supabase
    .from('knowledge_edges')
    .select('*');

  if (error) { console.error('엣지 조회 오류:', error); throw error; }
  return data as KnowledgeEdge[];
}

// paper_review_id로 연결된 노드 조회
export async function getKnowledgeNodeByPaperReviewId(paperReviewId: string): Promise<KnowledgeNode | null> {
  const { data, error } = await supabase
    .from('knowledge_nodes')
    .select('*')
    .eq('metadata->>paper_review_id', paperReviewId)
    .maybeSingle();

  if (error) { console.error('노드 조회 오류:', error); throw error; }
  return data as KnowledgeNode | null;
}

// 노드 하나 조회
export async function getKnowledgeNodeById(id: string): Promise<KnowledgeNode> {
  const { data, error } = await supabase
    .from('knowledge_nodes')
    .select('*')
    .eq('id', id)
    .single();

  if (error) { console.error('노드 조회 오류:', error); throw error; }
  return data as KnowledgeNode;
}

// 특정 노드의 연결된 노드들 조회
export async function getConnectedNodes(nodeId: string): Promise<{ nodes: KnowledgeNode[]; edges: KnowledgeEdge[] }> {
  // 연결된 엣지 조회
  const { data: edges, error: edgeErr } = await supabase
    .from('knowledge_edges')
    .select('*')
    .or(`source_id.eq.${nodeId},target_id.eq.${nodeId}`);

  if (edgeErr) throw edgeErr;

  // 연결된 노드 ID 추출
  const connectedIds = new Set<string>();
  (edges || []).forEach(e => {
    connectedIds.add(e.source_id);
    connectedIds.add(e.target_id);
  });
  connectedIds.delete(nodeId);

  if (connectedIds.size === 0) return { nodes: [], edges: edges || [] };

  const { data: nodes, error: nodeErr } = await supabase
    .from('knowledge_nodes')
    .select('*')
    .in('id', Array.from(connectedIds));

  if (nodeErr) throw nodeErr;
  return { nodes: nodes as KnowledgeNode[], edges: edges as KnowledgeEdge[] };
}

// 노드 생성
export async function createKnowledgeNode(data: Omit<KnowledgeNode, 'id' | 'created_at' | 'updated_at'>): Promise<KnowledgeNode> {
  const { data: node, error } = await supabase
    .from('knowledge_nodes')
    .insert(data)
    .select()
    .single();

  if (error) throw error;
  return node as KnowledgeNode;
}

// 노드 수정
export async function updateKnowledgeNode(
  id: string,
  updates: Partial<Omit<KnowledgeNode, 'id' | 'created_at'>>
): Promise<KnowledgeNode> {
  const { data, error } = await supabase
    .from('knowledge_nodes')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) { console.error('노드 수정 오류:', error); throw error; }
  return data as KnowledgeNode;
}

// 노드 삭제 (연결된 엣지도 CASCADE 삭제)
export async function deleteKnowledgeNode(id: string): Promise<void> {
  const { error } = await supabase
    .from('knowledge_nodes')
    .delete()
    .eq('id', id);

  if (error) { console.error('노드 삭제 오류:', error); throw error; }
}

// 엣지 생성
export async function createKnowledgeEdge(data: { source_id: string; target_id: string; relationship?: string }): Promise<KnowledgeEdge> {
  const { data: edge, error } = await supabase
    .from('knowledge_edges')
    .insert(data)
    .select()
    .single();

  if (error) throw error;
  return edge as KnowledgeEdge;
}

// 엣지 삭제
export async function deleteKnowledgeEdge(id: string): Promise<void> {
  const { error } = await supabase
    .from('knowledge_edges')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

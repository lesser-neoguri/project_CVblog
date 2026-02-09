'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { KnowledgeNode, KnowledgeEdge } from '@/lib/supabase';
import { getKnowledgeNodes, getKnowledgeEdges, getConnectedNodes } from '@/lib/knowledge';
import { useTheme } from '@/contexts/ThemeContext';
import MarkdownRenderer from '@/components/MarkdownRenderer';

/* ═══════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════ */
interface GNode {
  id: string;
  label: string;
  type: 'paper' | 'technology' | 'concept' | 'field';
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  connections: number;
  description: string | null;
  metadata: Record<string, unknown>;
}

interface GEdge {
  source: string;
  target: string;
  relationship: string;
}

interface Camera {
  panX: number;
  panY: number;
  zoom: number;
}

type DragState =
  | { type: 'node'; node: GNode; startX: number; startY: number }
  | { type: 'pan'; startScreenX: number; startScreenY: number; startPanX: number; startPanY: number }
  | null;

interface ConnectedNodeInfo {
  node: KnowledgeNode;
  relationship: string;
  direction: 'from' | 'to';
}

/* ═══════════════════════════════════════════════════════
   Constants
   ═══════════════════════════════════════════════════════ */
const REPULSION = 1200;
const ATTRACTION = 0.006;
const CENTER_GRAVITY = 0.01;
const DAMPING = 0.88;
const MAX_VELOCITY = 12;          // 속도 제한 — 노드가 튀지 않도록
const WARMUP_TICKS = 120;         // 렌더링 전 사전 시뮬레이션 횟수
const MAX_TICKS = 400;
const MIN_ZOOM = 0.2;
const MAX_ZOOM = 4;
const ZOOM_STEP = 0.15;
const ROTATE_SPEED = 0.0002;      // 자동 회전 속도 (rad/frame, ~1.4°/sec @60fps)

const TYPE_LABELS: Record<string, string> = {
  field: '분야',
  technology: '기술',
  concept: '개념',
  paper: '논문',
};

const REL_LABELS: Record<string, string> = {
  proposes: '제안',
  uses: '사용',
  extends: '확장',
  part_of: '분야',
  contains: '포함',
  related: '관련',
  solves: '해결',
  produces: '생성',
};

const TYPE_COLORS: Record<string, string> = {
  field: 'rgba(245,158,11,0.15)',
  technology: 'rgba(59,130,246,0.15)',
  concept: 'rgba(20,184,166,0.15)',
  paper: 'rgba(167,139,250,0.15)',
};

const TYPE_TEXT_COLORS: Record<string, string> = {
  field: '#f59e0b',
  technology: '#3b82f6',
  concept: '#14b8a6',
  paper: '#a78bfa',
};

/* ═══════════════════════════════════════════════════════
   Build Graph from DB Data
   ═══════════════════════════════════════════════════════ */
function buildGraphFromDB(nodes: KnowledgeNode[], edges: KnowledgeEdge[]): { nodes: GNode[]; edges: GEdge[] } {
  const connectionCount = new Map<string, number>();
  edges.forEach(e => {
    connectionCount.set(e.source_id, (connectionCount.get(e.source_id) || 0) + 1);
    connectionCount.set(e.target_id, (connectionCount.get(e.target_id) || 0) + 1);
  });

  const gNodes: GNode[] = nodes.map(n => {
    const conn = connectionCount.get(n.id) || 0;
    let radius: number;
    switch (n.type) {
      case 'field': radius = 14 + Math.min(conn * 0.5, 6); break;
      case 'technology': radius = 8 + Math.min(conn * 0.6, 6); break;
      case 'concept': radius = 5 + Math.min(conn * 0.5, 5); break;
      case 'paper': radius = 4 + Math.min(conn * 0.4, 4); break;
      default: radius = 5;
    }
    return {
      id: n.id,
      label: n.label,
      type: n.type as GNode['type'],
      x: 0, y: 0, vx: 0, vy: 0,
      radius,
      color: n.color || '#888',
      connections: conn,
      description: n.description,
      metadata: n.metadata || {},
    };
  });

  // Initial positions: spread widely by type to avoid initial clumping
  const typeGroups: Record<string, number> = { field: 0, technology: 1, concept: 2, paper: 3 };
  const typeCounters: Record<string, number> = { field: 0, technology: 0, concept: 0, paper: 0 };
  gNodes.forEach((node) => {
    const groupIdx = typeGroups[node.type] ?? 0;
    const countInGroup = typeCounters[node.type] ?? 0;
    typeCounters[node.type] = countInGroup + 1;

    // Each type group gets its own quadrant, nodes spread within
    const baseAngle = groupIdx * (Math.PI / 2) - Math.PI / 8;
    const spread = Math.PI / 3;
    const angle = baseAngle + (countInGroup * 0.4) + (Math.random() - 0.5) * spread;
    const dist = 120 + countInGroup * 18 + Math.random() * 80;
    node.x = Math.cos(angle) * dist;
    node.y = Math.sin(angle) * dist;
  });

  const gEdges: GEdge[] = edges.map(e => ({
    source: e.source_id,
    target: e.target_id,
    relationship: e.relationship || 'related',
  }));

  return { nodes: gNodes, edges: gEdges };
}

/* ═══════════════════════════════════════════════════════
   NodeViewer Component
   ═══════════════════════════════════════════════════════ */
function NodeViewer({
  node,
  connectedNodes,
  onSelectNode,
  onClose,
  onNavigate,
}: {
  node: GNode;
  connectedNodes: ConnectedNodeInfo[];
  onSelectNode: (id: string) => void;
  onClose: () => void;
  onNavigate: (path: string) => void;
}) {
  return (
    <div style={{
      width: '380px',
      minWidth: '380px',
      height: '100%',
      borderLeft: '1px solid var(--border)',
      background: 'var(--bg)',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      animation: 'slideInRight .25s ease-out',
    }}>
      {/* Header */}
      <div style={{
        padding: '20px 20px 16px',
        borderBottom: '1px solid var(--border)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
          <div style={{ flex: 1 }}>
            <span style={{
              display: 'inline-block',
              padding: '2px 8px',
              fontSize: '10px',
              fontFamily: 'var(--mono)',
              fontWeight: 600,
              letterSpacing: '0.05em',
              background: TYPE_COLORS[node.type] || 'rgba(255,255,255,0.1)',
              color: TYPE_TEXT_COLORS[node.type] || 'var(--t2)',
              marginBottom: '10px',
            }}>
              {TYPE_LABELS[node.type]?.toUpperCase() || node.type.toUpperCase()}
            </span>
            <h3 style={{
              fontSize: '18px',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              lineHeight: 1.3,
              color: 'var(--t1)',
            }}>
              {node.label}
            </h3>
            {node.type === 'paper' && typeof node.metadata?.venue === 'string' && (
              <p style={{ fontSize: '12px', color: 'var(--accent)', fontWeight: 600, marginTop: '6px' }}>
                {node.metadata.venue}
                {typeof node.metadata?.authors === 'string' && (
                  <span style={{ color: 'var(--t3)', fontWeight: 400, marginLeft: '8px' }}>
                    {node.metadata.authors}
                  </span>
                )}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              width: '28px', height: '28px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'transparent', border: '1px solid var(--border)',
              color: 'var(--t3)', cursor: 'pointer', flexShrink: 0,
              transition: 'all .15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-strong)'; e.currentTarget.style.color = 'var(--t1)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--t3)'; }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
          <span style={{
            width: '8px', height: '8px', background: node.color, display: 'inline-block', flexShrink: 0,
          }} />
          <span style={{ fontSize: '11px', color: 'var(--t3)', fontFamily: 'var(--mono)' }}>
            {node.connections}개 연결
          </span>
        </div>
        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '6px', marginTop: '12px' }}>
          <button
            onClick={() => onNavigate(`/papers/${node.id}`)}
            style={{
              flex: 1, padding: '7px 0', fontSize: '12px', fontWeight: 600,
              background: 'var(--t1)', color: 'var(--bg)',
              border: 'none', cursor: 'pointer', transition: 'opacity .15s',
              fontFamily: 'var(--font)',
            }}
            onMouseEnter={e => { e.currentTarget.style.opacity = '0.85'; }}
            onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
          >
            전문보기
          </button>
          <button
            onClick={() => onNavigate(`/papers/${node.id}/edit`)}
            style={{
              padding: '7px 14px', fontSize: '12px', fontWeight: 500,
              background: 'transparent', color: 'var(--t2)',
              border: '1px solid var(--border)', cursor: 'pointer',
              transition: 'all .15s', fontFamily: 'var(--font)',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-strong)'; e.currentTarget.style.color = 'var(--t1)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--t2)'; }}
          >
            수정
          </button>
        </div>
      </div>

      {/* Scrollable Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
        {/* Description */}
        {node.description && (
          <div style={{ marginBottom: '24px' }}>
            <MarkdownRenderer content={node.description} />
          </div>
        )}

        {/* Connected Nodes */}
        {connectedNodes.length > 0 && (
          <div>
            <p style={{
              fontSize: '10px',
              fontFamily: 'var(--mono)',
              fontWeight: 600,
              color: 'var(--t4)',
              letterSpacing: '0.08em',
              marginBottom: '12px',
              paddingBottom: '8px',
              borderBottom: '1px solid var(--border)',
            }}>
              CONNECTIONS ({connectedNodes.length})
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {connectedNodes.map((cn, i) => (
                <button
                  key={`${cn.node.id}-${i}`}
                  onClick={() => onSelectNode(cn.node.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '8px 10px',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    width: '100%',
                    transition: 'background .15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <span style={{
                    width: '6px', height: '6px',
                    background: cn.node.color || 'var(--t3)',
                    flexShrink: 0,
                  }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{
                      fontSize: '13px', fontWeight: 600,
                      color: 'var(--t1)',
                      display: 'block',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {cn.node.label}
                    </span>
                    <span style={{ fontSize: '10px', color: 'var(--t4)', fontFamily: 'var(--mono)' }}>
                      {TYPE_LABELS[cn.node.type] || cn.node.type}
                      {' · '}
                      {cn.direction === 'from'
                        ? `→ ${REL_LABELS[cn.relationship] || cn.relationship}`
                        : `← ${REL_LABELS[cn.relationship] || cn.relationship}`
                      }
                    </span>
                  </div>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--t4)" strokeWidth="2">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Main Component
   ═══════════════════════════════════════════════════════ */
export default function KnowledgeGraph({
  showLegend = true,
  highlightNodeId,
  highlightNodeIds,
  onNodeClick,
  onBackgroundClick,
}: {
  showLegend?: boolean;
  highlightNodeId?: string | null;
  highlightNodeIds?: string[] | null;
  onNodeClick?: (nodeId: string, nodeType: string, metadata: Record<string, unknown>) => void;
  onBackgroundClick?: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { isLightTheme } = useTheme();
  const router = useRouter();

  const nodesRef = useRef<GNode[]>([]);
  const edgesRef = useRef<GEdge[]>([]);
  const animRef = useRef<number>(0);
  const tickRef = useRef(0);
  const runningRef = useRef(false);
  const hoveredRef = useRef<GNode | null>(null);
  const dragRef = useRef<DragState>(null);
  const mouseWorldRef = useRef({ x: 0, y: 0 });
  const mouseScreenRef = useRef({ x: 0, y: 0 });
  const sizeRef = useRef({ w: 800, h: 500 });
  const themeRef = useRef(isLightTheme);
  const camRef = useRef<Camera>({ panX: 0, panY: 0, zoom: 1 });
  const selectedIdRef = useRef<string | null>(null);
  const externalHighlightRef = useRef<string | null>(null);
  const externalHighlightIdsRef = useRef<string[]>([]);
  const onNodeClickRef = useRef(onNodeClick);
  const onBackgroundClickRef = useRef(onBackgroundClick);
  const autoRotateRef = useRef(true);

  const [hoveredNode, setHoveredNode] = useState<GNode | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [graphReady, setGraphReady] = useState(false);   // warm-up 완료 후 true
  const [selectedNode, setSelectedNode] = useState<GNode | null>(null);
  const [connectedNodeInfo, setConnectedNodeInfo] = useState<ConnectedNodeInfo[]>([]);
  const [allDbNodes, setAllDbNodes] = useState<KnowledgeNode[]>([]);
  const [allDbEdges, setAllDbEdges] = useState<KnowledgeEdge[]>([]);
  const [autoRotating, setAutoRotating] = useState(true);

  useEffect(() => { themeRef.current = isLightTheme; }, [isLightTheme]);
  useEffect(() => { externalHighlightRef.current = highlightNodeId ?? null; }, [highlightNodeId]);
  useEffect(() => { externalHighlightIdsRef.current = highlightNodeIds ?? []; }, [highlightNodeIds]);
  useEffect(() => { onNodeClickRef.current = onNodeClick; }, [onNodeClick]);
  useEffect(() => { onBackgroundClickRef.current = onBackgroundClick; }, [onBackgroundClick]);

  /* ─── Camera helpers ─── */
  const screenToWorld = useCallback((sx: number, sy: number) => {
    const c = camRef.current;
    return { x: (sx - c.panX) / c.zoom, y: (sy - c.panY) / c.zoom };
  }, []);

  const applyZoom = useCallback((delta: number, centerX: number, centerY: number) => {
    const c = camRef.current;
    const oldZoom = c.zoom;
    const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, oldZoom * (1 + delta)));
    c.panX = centerX - (centerX - c.panX) * (newZoom / oldZoom);
    c.panY = centerY - (centerY - c.panY) * (newZoom / oldZoom);
    c.zoom = newZoom;
    setZoomLevel(Math.round(newZoom * 100));
  }, []);

  const resetCamera = useCallback(() => {
    const { w, h } = sizeRef.current;
    camRef.current = { panX: w / 2, panY: h / 2, zoom: 1 };
    setZoomLevel(100);
  }, []);

  /* ─── Select Node (for viewer) ─── */
  const selectNodeById = useCallback(async (nodeId: string) => {
    const gNode = nodesRef.current.find(n => n.id === nodeId);
    if (!gNode) return;

    selectedIdRef.current = nodeId;
    setSelectedNode(gNode);

    // Compute connected nodes
    try {
      const { nodes: connNodes, edges: connEdges } = await getConnectedNodes(nodeId);
      const info: ConnectedNodeInfo[] = connEdges.map(edge => {
        const isSource = edge.source_id === nodeId;
        const connectedId = isSource ? edge.target_id : edge.source_id;
        const connNode = connNodes.find(n => n.id === connectedId);
        if (!connNode) return null;
        return {
          node: connNode,
          relationship: edge.relationship || 'related',
          direction: isSource ? 'from' : 'to',
        } as ConnectedNodeInfo;
      }).filter(Boolean) as ConnectedNodeInfo[];

      // Sort: fields first, then technology, concept, paper
      const typeOrder = { field: 0, technology: 1, concept: 2, paper: 3 };
      info.sort((a, b) => (typeOrder[a.node.type as keyof typeof typeOrder] ?? 4) - (typeOrder[b.node.type as keyof typeof typeOrder] ?? 4));
      setConnectedNodeInfo(info);
    } catch {
      setConnectedNodeInfo([]);
    }
  }, []);

  const clearSelection = useCallback(() => {
    selectedIdRef.current = null;
    setSelectedNode(null);
    setConnectedNodeInfo([]);
  }, []);

  /* ─── Fetch data ─── */
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setGraphReady(false);
      try {
        const [nodes, edges] = await Promise.all([getKnowledgeNodes(), getKnowledgeEdges()]);
        if (cancelled) return;
        setAllDbNodes(nodes);
        setAllDbEdges(edges);

        const graph = buildGraphFromDB(nodes, edges);
        nodesRef.current = graph.nodes;
        edgesRef.current = graph.edges;
        tickRef.current = 0;

        // ─── Warm-up: 렌더링 없이 물리 시뮬레이션을 미리 돌림 ───
        for (let i = 0; i < WARMUP_TICKS; i++) {
          forceTick();
          tickRef.current++;
        }

        // Camera를 실제 캔버스 크기에 맞춰 설정
        const { w, h } = sizeRef.current;
        camRef.current = { panX: w / 2, panY: h / 2, zoom: 1 };
        setZoomLevel(100);

        runningRef.current = true;
        startLoop();

        // 짧은 딜레이 후 페이드인 (다음 프레임에서 CSS 전환이 동작하도록)
        requestAnimationFrame(() => {
          if (!cancelled) setGraphReady(true);
        });
      } catch (err) {
        console.error('Knowledge graph data load error:', err);
      }
    }
    load();
    return () => { cancelled = true; cancelAnimationFrame(animRef.current); runningRef.current = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ─── Canvas resize ─── */
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return; // 보이지 않으면 무시
      const dpr = window.devicePixelRatio || 1;
      const oldW = sizeRef.current.w;
      const oldH = sizeRef.current.h;
      sizeRef.current = { w: rect.width, h: rect.height };
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // 노드 데이터가 있을 때만 pan 보정 (초기 로딩 시 무의미한 보정 방지)
      if (oldW > 0 && nodesRef.current.length > 0) {
        camRef.current.panX += (rect.width - oldW) / 2;
        camRef.current.panY += (rect.height - oldH) / 2;
      }
    };

    resize();
    // 첫 로딩 시 레이아웃이 settle된 후 재측정 (뷰포트에 맞춘 UI와 동일하게)
    const raf1 = requestAnimationFrame(() => {
      requestAnimationFrame(resize);
    });
    const fallback = setTimeout(resize, 150);
    const ro = new ResizeObserver(resize);
    ro.observe(container);
    return () => {
      cancelAnimationFrame(raf1);
      clearTimeout(fallback);
      ro.disconnect();
    };
  }, []);

  /* ─── Force tick ─── */
  const forceTick = useCallback(() => {
    const nodes = nodesRef.current;
    const edges = edgesRef.current;

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[j].x - nodes[i].x;
        const dy = nodes[j].y - nodes[i].y;
        const dist = Math.max(1, Math.sqrt(dx * dx + dy * dy));
        const force = REPULSION / (dist * dist);
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        nodes[i].vx -= fx; nodes[i].vy -= fy;
        nodes[j].vx += fx; nodes[j].vy += fy;
      }
    }

    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    for (const edge of edges) {
      const src = nodeMap.get(edge.source);
      const tgt = nodeMap.get(edge.target);
      if (!src || !tgt) continue;
      const dx = tgt.x - src.x;
      const dy = tgt.y - src.y;
      const dist = Math.max(1, Math.sqrt(dx * dx + dy * dy));
      const force = ATTRACTION * dist;
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;
      src.vx += fx; src.vy += fy;
      tgt.vx -= fx; tgt.vy -= fy;
    }

    // Progressive damping: stronger early, relaxes later
    const tick = tickRef.current;
    const damp = tick < 30 ? 0.75 : tick < 80 ? 0.82 : DAMPING;

    for (const node of nodes) {
      node.vx += (0 - node.x) * CENTER_GRAVITY;
      node.vy += (0 - node.y) * CENTER_GRAVITY;
      node.vx *= damp;
      node.vy *= damp;

      // Clamp velocity to prevent flying off
      const speed = Math.sqrt(node.vx * node.vx + node.vy * node.vy);
      if (speed > MAX_VELOCITY) {
        node.vx = (node.vx / speed) * MAX_VELOCITY;
        node.vy = (node.vy / speed) * MAX_VELOCITY;
      }

      if (dragRef.current?.type === 'node' && dragRef.current.node.id === node.id) {
        node.x = mouseWorldRef.current.x;
        node.y = mouseWorldRef.current.y;
        node.vx = 0;
        node.vy = 0;
      } else {
        node.x += node.vx;
        node.y += node.vy;
      }
    }
  }, []);

  /* ─── Render ─── */
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { w, h } = sizeRef.current;
    const nodes = nodesRef.current;
    const edges = edgesRef.current;
    const hovered = hoveredRef.current;
    const selected = selectedIdRef.current;
    const extHL = externalHighlightRef.current;
    const light = themeRef.current;
    const cam = camRef.current;

    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.translate(cam.panX, cam.panY);
    ctx.scale(cam.zoom, cam.zoom);

    const extHLIds = externalHighlightIdsRef.current;
    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    const highlightIds = new Set<string>();
    const highlightEdges = new Set<number>();

    // Search highlight: multiple nodes from search
    if (extHLIds.length > 0) {
      extHLIds.forEach((nid) => {
        const n = nodeMap.get(nid);
        if (n) {
          highlightIds.add(n.id);
          edges.forEach((e, i) => {
            if (e.source === n.id || e.target === n.id) {
              highlightIds.add(e.source);
              highlightIds.add(e.target);
              highlightEdges.add(i);
            }
          });
        }
      });
    }

    // Single highlight: hovered, selected, or externally highlighted node's connections
    const focusNode = extHLIds.length === 0
      ? (hovered || (selected ? nodeMap.get(selected) || null : null) || (extHL ? nodeMap.get(extHL) || null : null))
      : null;
    if (focusNode) {
      highlightIds.add(focusNode.id);
      edges.forEach((e, i) => {
        if (e.source === focusNode.id || e.target === focusNode.id) {
          highlightIds.add(e.source);
          highlightIds.add(e.target);
          highlightEdges.add(i);
        }
      });
    }

    const invZ = 1 / cam.zoom;

    // ─── Edges ───
    edges.forEach((edge, i) => {
      const src = nodeMap.get(edge.source);
      const tgt = nodeMap.get(edge.target);
      if (!src || !tgt) return;

      const isHL = highlightEdges.has(i);
      const dimmed = (extHLIds.length > 0 ? !isHL : focusNode && !isHL);

      ctx.beginPath();
      ctx.moveTo(src.x, src.y);
      ctx.lineTo(tgt.x, tgt.y);

      if (dimmed) {
        ctx.strokeStyle = light ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.08)';
        ctx.lineWidth = 0.4 * invZ;
      } else if (isHL) {
        ctx.strokeStyle = light ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.55)';
        ctx.lineWidth = 1.5 * invZ;
      } else {
        ctx.strokeStyle = light ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 0.8 * invZ;
      }
      ctx.stroke();
    });

    // ─── Nodes ───
    const rScale = cam.zoom > 1 ? 1 / Math.pow(cam.zoom, 0.55) : 1;

    for (const node of nodes) {
      const isHovered = hovered?.id === node.id;
      const isSelected = selected === node.id || extHL === node.id || extHLIds.includes(node.id);
      const isHL = highlightIds.has(node.id);
      const dimmed = (extHLIds.length > 0 ? !isHL : focusNode && !isHL);
      const alpha = dimmed ? 0.08 : 1;
      const r = node.radius * rScale;

      // Glow
      if (!dimmed) {
        ctx.save();
        ctx.globalAlpha = isHovered || isSelected ? 0.6 : 0.2;
        ctx.shadowColor = node.color;
        ctx.shadowBlur = (isHovered || isSelected ? 22 : 8) * invZ;
        ctx.beginPath();
        ctx.arc(node.x, node.y, r + (isHovered || isSelected ? 3 : 0.5) * invZ, 0, Math.PI * 2);
        ctx.fillStyle = node.color;
        ctx.fill();
        ctx.restore();
      }

      // Body
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
      ctx.fillStyle = node.color;
      ctx.fill();

      // Selected ring
      if (isSelected) {
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2 * invZ;
        ctx.stroke();
      }

      // Type-specific outline
      if (node.type === 'field') {
        ctx.strokeStyle = light ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.25)';
        ctx.lineWidth = 1.2 * invZ;
        ctx.stroke();
      } else if (node.type === 'paper') {
        ctx.strokeStyle = light ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.15)';
        ctx.lineWidth = 0.6 * invZ;
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      // Always-visible labels for field nodes
      if (node.type === 'field' && !dimmed) {
        const fontSize = 11 * invZ;
        ctx.font = `700 ${fontSize}px 'Noto Sans KR', sans-serif`;
        const label = node.label;
        const tw = ctx.measureText(label).width;
        ctx.fillStyle = light ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.6)';
        ctx.fillText(label, node.x - tw / 2, node.y + r + 14 * invZ);
      }
    }

    // ─── Hover labels ───
    if (focusNode) {
      highlightIds.forEach(id => {
        const node = nodeMap.get(id);
        if (!node || node.type === 'field') return;
        const isMain = node.id === focusNode.id;
        const fontSize = (isMain ? 12 : 10) * invZ;
        const label = node.label.length > 30 ? node.label.slice(0, 28) + '…' : node.label;
        const nr = node.radius * rScale;

        ctx.font = `${isMain ? 600 : 400} ${fontSize}px 'Noto Sans KR', sans-serif`;
        const tw = ctx.measureText(label).width;
        const px = 6 * invZ, py = 3 * invZ;
        const tx = node.x - tw / 2;
        const ty = node.y - nr - 10 * invZ;

        ctx.fillStyle = light ? 'rgba(255,255,255,0.92)' : 'rgba(0,0,0,0.85)';
        ctx.fillRect(tx - px, ty - fontSize - py, tw + px * 2, fontSize + py * 2 + 2 * invZ);
        ctx.strokeStyle = light ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)';
        ctx.lineWidth = 0.5 * invZ;
        ctx.strokeRect(tx - px, ty - fontSize - py, tw + px * 2, fontSize + py * 2 + 2 * invZ);

        ctx.fillStyle = isMain ? node.color : (light ? '#333' : '#ccc');
        ctx.fillText(label, tx, ty);
      });
    }

    ctx.restore();
  }, []);

  /* ─── Animation loop ─── */
  const startLoop = useCallback(() => {
    const loop = () => {
      if (!runningRef.current) return;
      if (tickRef.current < MAX_TICKS || (dragRef.current?.type === 'node')) {
        forceTick();
        tickRef.current++;
      }

      // Auto-rotate: 마우스 상호작용이 없을 때 천천히 회전
      if (
        autoRotateRef.current &&
        !dragRef.current &&
        !hoveredRef.current &&
        !selectedIdRef.current
      ) {
        const cos = Math.cos(ROTATE_SPEED);
        const sin = Math.sin(ROTATE_SPEED);
        for (const node of nodesRef.current) {
          const x = node.x;
          const y = node.y;
          node.x = x * cos - y * sin;
          node.y = x * sin + y * cos;
        }
      }

      render();
      animRef.current = requestAnimationFrame(loop);
    };
    cancelAnimationFrame(animRef.current);
    loop();
  }, [forceTick, render]);

  /* ─── Mouse / Wheel events ─── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const getNodeAt = (wx: number, wy: number): GNode | null => {
      let closest: GNode | null = null;
      let minDist = Infinity;
      const z = camRef.current.zoom;
      const rs = z > 1 ? 1 / Math.pow(z, 0.55) : 1;
      for (const node of nodesRef.current) {
        const dx = node.x - wx;
        const dy = node.y - wy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const hitR = Math.max(node.radius * rs + 4 / z, 10 / z);
        if (dist < hitR && dist < minDist) { closest = node; minDist = dist; }
      }
      return closest;
    };

    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      mouseScreenRef.current = { x: sx, y: sy };
      const world = screenToWorld(sx, sy);
      mouseWorldRef.current = world;

      const drag = dragRef.current;
      if (drag?.type === 'pan') {
        camRef.current.panX = drag.startPanX + (sx - drag.startScreenX);
        camRef.current.panY = drag.startPanY + (sy - drag.startScreenY);
        canvas.style.cursor = 'grabbing';
        return;
      }
      if (drag?.type === 'node') {
        canvas.style.cursor = 'grabbing';
        return;
      }

      const node = getNodeAt(world.x, world.y);
      hoveredRef.current = node;
      setHoveredNode(node);
      canvas.style.cursor = node ? 'pointer' : 'grab';
    };

    const onDown = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      const world = screenToWorld(sx, sy);

      const node = getNodeAt(world.x, world.y);
      if (node) {
        dragRef.current = { type: 'node', node, startX: world.x, startY: world.y };
      } else {
        dragRef.current = {
          type: 'pan',
          startScreenX: sx, startScreenY: sy,
          startPanX: camRef.current.panX, startPanY: camRef.current.panY,
        };
      }
      canvas.style.cursor = 'grabbing';
      e.preventDefault();
    };

    const onUp = (e: MouseEvent) => {
      const drag = dragRef.current;
      if (drag?.type === 'node') {
        // Check if it was a click (not a real drag)
        const world = mouseWorldRef.current;
        const dx = Math.abs(drag.startX - world.x);
        const dy = Math.abs(drag.startY - world.y);
        if (dx < 3 && dy < 3) {
          // If external handler provided, delegate to parent
          if (onNodeClickRef.current) {
            onNodeClickRef.current(drag.node.id, drag.node.type, drag.node.metadata);
          } else {
            // Internal selection (standalone usage)
            selectNodeById(drag.node.id);
          }
        }
      } else if (drag?.type === 'pan') {
        // Check if it was a background click (not a real pan drag)
        const rect = canvasRef.current?.getBoundingClientRect();
        if (rect) {
          const sx = e.clientX - rect.left;
          const sy = e.clientY - rect.top;
          const dx = Math.abs(drag.startScreenX - sx);
          const dy = Math.abs(drag.startScreenY - sy);
          if (dx < 3 && dy < 3) {
            // Background click → deselect
            if (onBackgroundClickRef.current) {
              onBackgroundClickRef.current();
            }
            selectedIdRef.current = null;
            setSelectedNode(null);
          }
        }
      }
      dragRef.current = null;
      if (canvasRef.current) canvasRef.current.style.cursor = 'grab';
    };

    const onLeave = () => {
      hoveredRef.current = null;
      setHoveredNode(null);
      if (dragRef.current?.type !== 'pan') dragRef.current = null;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      const delta = e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP;
      applyZoom(delta, sx, sy);
    };

    canvas.addEventListener('mousemove', onMove);
    canvas.addEventListener('mousedown', onDown);
    window.addEventListener('mouseup', onUp);
    canvas.addEventListener('mouseleave', onLeave);
    canvas.addEventListener('wheel', onWheel, { passive: false });

    return () => {
      canvas.removeEventListener('mousemove', onMove);
      canvas.removeEventListener('mousedown', onDown);
      window.removeEventListener('mouseup', onUp);
      canvas.removeEventListener('mouseleave', onLeave);
      canvas.removeEventListener('wheel', onWheel);
    };
  }, [screenToWorld, applyZoom, selectNodeById]);

  /* ─── Legend ─── */
  const legendItems: [string, string][] = [
    ['분야 (Field)', '#f59e0b'],
    ['기술 (Technology)', '#3b82f6'],
    ['개념 (Concept)', '#14b8a6'],
    ['논문 (Paper)', '#a78bfa'],
  ];

  /* ─── Zoom controls style ─── */
  const zoomBtnStyle: React.CSSProperties = {
    width: '32px', height: '32px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'var(--bg)', border: '1px solid var(--border)',
    color: 'var(--t2)', cursor: 'pointer', fontSize: '16px',
    fontFamily: 'var(--mono)', transition: 'color .15s, border-color .15s',
  };

  return (
    <div style={{ position: 'relative', height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Animation keyframes */}
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>

      {/* Main layout: Graph + Viewer */}
      <div style={{
        display: 'flex',
        flex: 1,
        minHeight: 0,
        border: '1px solid var(--border)',
        overflow: 'hidden',
        transition: 'all .25s ease-out',
      }}>
        {/* Graph Area */}
        <div style={{ flex: 1, position: 'relative', minWidth: 0, minHeight: 0 }}>
          <div
            ref={containerRef}
            style={{ position: 'absolute', inset: 0, overflow: 'hidden', cursor: 'grab' }}
          >
            <canvas
              ref={canvasRef}
              style={{
                opacity: graphReady ? 1 : 0,
                transition: 'opacity 0.5s ease-out',
              }}
            />

            {/* Loading overlay — fade out when graph is ready */}
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'var(--bg-alt)',
              opacity: graphReady ? 0 : 1,
              transition: 'opacity 0.4s ease-out',
              pointerEvents: graphReady ? 'none' : 'auto',
              zIndex: graphReady ? -1 : 20,
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: '32px', height: '32px', border: '2px solid var(--border)',
                  borderTopColor: 'var(--accent)',
                  animation: 'spin 1s linear infinite',
                  margin: '0 auto 12px',
                }} />
                <p style={{ fontSize: '12px', color: 'var(--t3)', fontFamily: 'var(--mono)' }}>
                  Loading graph...
                </p>
              </div>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>

            {/* Zoom controls */}
            <div style={{
              position: 'absolute', bottom: '48px', left: '12px',
              display: 'flex', flexDirection: 'column', gap: '1px', zIndex: 10,
            }}>
              <button
                style={zoomBtnStyle}
                onClick={() => { const { w, h } = sizeRef.current; applyZoom(ZOOM_STEP, w / 2, h / 2); }}
                onMouseEnter={e => { e.currentTarget.style.color = 'var(--t1)'; e.currentTarget.style.borderColor = 'var(--border-strong)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--t2)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
                title="확대"
              >+</button>
              <button
                style={{ ...zoomBtnStyle, fontSize: '11px', cursor: 'default', color: 'var(--t3)' }}
                title="줌 레벨"
              >{zoomLevel}%</button>
              <button
                style={zoomBtnStyle}
                onClick={() => { const { w, h } = sizeRef.current; applyZoom(-ZOOM_STEP, w / 2, h / 2); }}
                onMouseEnter={e => { e.currentTarget.style.color = 'var(--t1)'; e.currentTarget.style.borderColor = 'var(--border-strong)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--t2)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
                title="축소"
              >−</button>
              <button
                style={{ ...zoomBtnStyle, marginTop: '4px', fontSize: '10px' }}
                onClick={resetCamera}
                onMouseEnter={e => { e.currentTarget.style.color = 'var(--t1)'; e.currentTarget.style.borderColor = 'var(--border-strong)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--t2)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
                title="초기화"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
                  <path d="M21 3v5h-5"/>
                  <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
                  <path d="M3 21v-5h5"/>
                </svg>
              </button>
              {/* Auto-rotate toggle */}
              <button
                style={{
                  ...zoomBtnStyle,
                  marginTop: '4px',
                  color: autoRotating ? 'var(--accent)' : 'var(--t3)',
                  borderColor: autoRotating ? 'var(--accent)' : 'var(--border)',
                }}
                onClick={() => {
                  const next = !autoRotateRef.current;
                  autoRotateRef.current = next;
                  setAutoRotating(next);
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = autoRotateRef.current ? 'var(--accent)' : 'var(--border-strong)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = autoRotateRef.current ? 'var(--accent)' : 'var(--border)'; }}
                title={autoRotating ? '회전 정지' : '회전 재개'}
              >
                {autoRotating ? (
                  /* Pause icon */
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="6" y="4" width="4" height="16" />
                    <rect x="14" y="4" width="4" height="16" />
                  </svg>
                ) : (
                  /* Play icon */
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="6 3 20 12 6 21 6 3" />
                  </svg>
                )}
              </button>
            </div>

            {/* Controls hint — 왼쪽 하단 (줌 컨트롤 아래, 범례와 겹치지 않도록) */}
            <div style={{
              position: 'absolute', bottom: '12px', left: '12px',
              fontSize: '10px', fontFamily: 'var(--mono)', color: 'var(--t4)',
              display: 'flex', gap: '12px', zIndex: 10,
            }}>
              <span>스크롤 — 확대/축소</span>
              <span>클릭 — 상세보기</span>
            </div>

            {/* Hover tooltip */}
            {hoveredNode && !selectedNode && (
              <div style={{
                position: 'absolute', top: '12px', right: '12px',
                background: 'var(--bg)', border: '1px solid var(--border)',
                padding: '10px 14px', maxWidth: '260px', zIndex: 10, pointerEvents: 'none',
              }}>
                <span style={{ fontSize: '10px', fontFamily: 'var(--mono)', color: TYPE_TEXT_COLORS[hoveredNode.type] || 'var(--accent)', display: 'block', marginBottom: '4px' }}>
                  {TYPE_LABELS[hoveredNode.type]?.toUpperCase() || hoveredNode.type.toUpperCase()}
                </span>
                <span style={{ fontSize: '13px', fontWeight: 600, display: 'block', lineHeight: 1.4 }}>
                  {hoveredNode.label}
                </span>
                <span style={{ fontSize: '11px', color: 'var(--t3)', marginTop: '2px', display: 'block' }}>
                  {hoveredNode.connections}개 연결 · 클릭하여 상세보기
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Viewer Panel (only in standalone mode — when no external onNodeClick) */}
        {selectedNode && !onNodeClick && (
          <NodeViewer
            node={selectedNode}
            connectedNodes={connectedNodeInfo}
            onSelectNode={selectNodeById}
            onClose={clearSelection}
            onNavigate={(path) => router.push(path)}
          />
        )}
      </div>

      {/* Legend */}
      {showLegend && (
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', padding: '16px 0 0', justifyContent: 'center' }}>
          {legendItems.map(([label, color]) => (
            <span key={label} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--t3)' }}>
              <span style={{ width: '8px', height: '8px', background: color, display: 'inline-block', flexShrink: 0 }} />
              {label}
            </span>
          ))}
          <span style={{ fontSize: '11px', color: 'var(--t4)', fontFamily: 'var(--mono)', marginLeft: '8px', display: 'flex', alignItems: 'center' }}>
            {allDbNodes.length} nodes · {allDbEdges.length} edges
          </span>
        </div>
      )}
    </div>
  );
}

// variant-c-river.jsx — "数据河流" horizontal lineage lanes, click-to-trace upstream

const VariantC = ({ theme }) => {
  const t = theme;
  const [selected, setSelected] = React.useState('r-Ibase');
  const [showPanel, setShowPanel] = React.useState(true);
  const exp = KG_DATA.experiment;

  // Layout in % within a 1400 x 720 logical canvas.
  // 5 lanes: 0=标准 (thin), 1=常量, 2=设备, 3=试验+步骤, 4=结果+下游
  // Width: 1400, lane heights: 60, 120, 120, 200, 180 (slim header strip)

  const VBW = 1400, VBH = 740;
  const laneY = [10, 80, 220, 360, 580]; // top of each lane
  const laneH = [60, 130, 130, 200, 150];

  // Nodes per lane
  const nodes = [
    // Standards (lane 0)
    { id: 'ref-sae', lane: 0, type: 'reference', x: 130, label: 'SAE J2264', sub: '§4.2', w: 130 },
    { id: 'ref-gb',  lane: 0, type: 'reference', x: 300, label: 'GB/T 18352.6', sub: '附录C', w: 150 },
    { id: 'ref-iso', lane: 0, type: 'reference', x: 480, label: 'ISO 10521', sub: 'Part 1', w: 130 },

    // Constants (lane 1) - spaced left side
    { id: 'c-r',   lane: 1, type: 'constant', x: 60,  label: 'r', sub: '0.2032 m', desc: '滚筒半径' },
    { id: 'c-fs',  lane: 1, type: 'constant', x: 200, label: 'fs', sub: '200 Hz', desc: '采样频率' },
    { id: 'c-N',   lane: 1, type: 'constant', x: 340, label: 'N', sub: '1024', desc: '编码器脉冲数' },
    { id: 'c-vhi', lane: 1, type: 'constant', x: 480, label: 'v_hi/lo', sub: '55/15 mph', desc: '速度门限' },
    { id: 'c-tau', lane: 1, type: 'constant', x: 640, label: 'τ_max', sub: '2000 N·m', desc: '扭矩量程' },

    // Equipment (lane 2)
    { id: 'eq-drum',    lane: 2, type: 'equipment', x: 60,  label: '滚筒', sub: 'Horiba DC-48"' },
    { id: 'eq-torque',  lane: 2, type: 'equipment', x: 220, label: '扭矩传感器', sub: 'HBM T40B' },
    { id: 'eq-encoder', lane: 2, type: 'equipment', x: 400, label: '编码器', sub: 'Heidenhain ERN1387' },
    { id: 'eq-inverter',lane: 2, type: 'equipment', x: 580, label: '变频器', sub: 'ABB ACS880' },

    // Experiment steps inline in lane 3 (5 steps)
    ...exp.steps.map((s, i) => ({
      id: 'step-' + s.id, lane: 3, type: 'experiment', x: 60 + i * 165, w: 140,
      label: `S${i + 1}: ${s.name}`, sub: s.formula || s.outputs[0]?.k,
      isStep: true, formula: s.formula, params: s.params, outputs: s.outputs,
    })),

    // Results + downstream (lane 4)
    { id: 'r-Idrum', lane: 4, type: 'result', x: 900, label: 'I_drum', sub: '142.6 kg', w: 130, desc: '滚筒旋转质量' },
    { id: 'r-Ibase', lane: 4, type: 'result', x: 900, y: 660, label: 'I_base', sub: '78.4 kg·m²', w: 130, primary: true, desc: '基础惯量' },
    { id: 'exp-coastdown', lane: 4, type: 'experiment', x: 1110, label: '滑行系数测定', sub: 'EXP-CD-002', w: 150 },
    { id: 'exp-nedc', lane: 4, type: 'experiment', x: 1110, y: 660, label: 'NEDC 工况', sub: '模拟惯量', w: 150 },
    { id: 'exp-wltc', lane: 4, type: 'experiment', x: 1280, y: 660, label: 'WLTC ▶', sub: '', w: 90 },
  ];

  // Edges: which sources feed which targets
  const edges = [
    // standards govern the steps (top-down dashed)
    ['ref-sae', 'step-s1', 'gov'],
    ['ref-sae', 'step-s5', 'gov'],
    ['ref-gb', 'step-s4', 'gov'],
    // constants → steps
    ['c-r', 'step-s3'],
    ['c-fs', 'step-s1'],
    ['c-fs', 'step-s2'],
    ['c-N', 'step-s3'],
    ['c-vhi', 'step-s1'],
    ['c-vhi', 'step-s2'],
    ['c-tau', 'step-s1'],
    // equipment → steps
    ['eq-drum', 'step-s1'],
    ['eq-torque', 'step-s1'],
    ['eq-torque', 'step-s2'],
    ['eq-encoder', 'step-s1'],
    ['eq-encoder', 'step-s2'],
    ['eq-inverter', 'step-s1'],
    // steps chain
    ['step-s1', 'step-s2'],
    ['step-s2', 'step-s3'],
    ['step-s3', 'step-s4'],
    ['step-s4', 'step-s5'],
    // step→result
    ['step-s5', 'r-Ibase'],
    ['step-s3', 'r-Idrum'],
    // result→downstream
    ['r-Ibase', 'exp-nedc'],
    ['r-Ibase', 'exp-wltc'],
    ['r-Ibase', 'exp-coastdown'],
    ['r-Idrum', 'exp-nedc'],
  ];

  // BFS upstream from selected node
  const upstreamOf = (id) => {
    const set = new Set([id]);
    let frontier = [id];
    while (frontier.length) {
      const next = [];
      for (const cur of frontier) {
        for (const [from, to] of edges) {
          if (to === cur && !set.has(from)) { set.add(from); next.push(from); }
        }
      }
      frontier = next;
    }
    return set;
  };
  const downstreamOf = (id) => {
    const set = new Set([id]);
    let frontier = [id];
    while (frontier.length) {
      const next = [];
      for (const cur of frontier) {
        for (const [from, to] of edges) {
          if (from === cur && !set.has(to)) { set.add(to); next.push(to); }
        }
      }
      frontier = next;
    }
    return set;
  };
  const traceSet = new Set([...upstreamOf(selected), ...downstreamOf(selected)]);
  const isTraced = (id) => traceSet.has(id);

  const byId = Object.fromEntries(nodes.map(n => [n.id, n]));

  // node x→ get center coords
  const nodeBox = (n) => {
    const w = n.w || 110;
    const h = n.lane === 3 ? 80 : n.lane === 0 ? 32 : 60;
    const y = n.y != null ? n.y : (laneY[n.lane] + 20);
    return { x: n.x, y, w, h, cx: n.x + w / 2, cy: y + h / 2 };
  };

  const isDark = t.name === 'dark';

  const nodeOf = (id) => {
    if (id === 'r-Ibase') {
      return {
        type: 'result', code: id, name: '基础惯量 I_base', value: '78.4', unit: 'kg·m²',
        fields: [
          { label: '描述', value: '通过加速/减速测试得出,用作工况实验中模拟惯量的关键基础' },
          { label: '来源试验', value: '基础惯量测定 EXP-BI-001 · 步骤 5' },
          { label: '公差', value: '±0.6%' },
        ],
        upstream: [
          { type: 'experiment', name: '基础惯量测定', via: '步骤 5 输出' },
          { type: 'constant', name: '滚筒半径 r = 0.2032 m', via: '步骤 3' },
          { type: 'equipment', name: 'HBM T40B 扭矩传感器', via: '步骤 1, 2' },
          { type: 'reference', name: 'SAE J2264 §4.2', via: '计算依据' },
        ],
        downstream: [
          { type: 'experiment', name: 'NEDC 工况', via: 'I_sim = m − I_base/r²' },
          { type: 'experiment', name: 'WLTC 工况', via: '模拟惯量' },
          { type: 'experiment', name: '滑行系数测定', via: '修正补偿' },
        ],
      };
    }
    const n = byId[id]; if (!n) return null;
    return {
      type: n.type, code: id, name: (n.label) + (n.desc ? ` · ${n.desc}` : ''),
      value: n.sub?.split(' ')[0], unit: n.sub?.split(' ').slice(1).join(' '),
      fields: [
        { label: '类型', value: TYPE_TOKENS[n.type]?.label },
        n.params && { label: '参数', value: n.params.map(p => `${p.k}=${p.v}${p.u || ''}`).join(', ') },
        n.formula && { label: '公式', value: <code style={{ fontFamily: 'ui-monospace, monospace' }}>{n.formula}</code> },
      ].filter(Boolean),
    };
  };

  return (
    <div style={{
      width: '100%', height: '100%', position: 'relative', overflow: 'hidden', background: t.bg,
    }}>
      {/* Header */}
      <div style={{
        padding: '12px 20px', borderBottom: `1px solid ${t.border}`, background: t.surface,
        display: 'flex', alignItems: 'center', gap: 14,
      }}>
        <div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
            <span style={{
              padding: '2px 7px', borderRadius: 4, fontSize: 10, fontWeight: 600,
              background: 'oklch(94% 0.05 28)', color: 'oklch(45% 0.15 28)',
            }}>试验</span>
            <span style={{ fontFamily: 'ui-monospace, monospace', color: t.textMuted, fontSize: 11 }}>EXP-BI-001</span>
            <span style={{ color: t.textFaint, fontSize: 11 }}>· 数据溯源视图</span>
          </div>
          <div style={{ fontSize: 17, fontWeight: 600, marginTop: 3 }}>
            基础惯量测定 <span style={{ color: t.textMuted, fontSize: 12, fontWeight: 400 }}>· 从输入到下游的全链条</span>
          </div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
          <TraceModeToggle t={t} selected={selected} traceCount={traceSet.size}/>
          <button style={{
            height: 30, padding: '0 12px', borderRadius: 6, border: `1px solid ${t.border}`,
            background: t.surface, color: t.text, fontSize: 12, display: 'flex',
            alignItems: 'center', gap: 6,
          }}><Icon name="layers" size={11} stroke="currentColor"/> 全部展开</button>
          <button style={{
            height: 30, padding: '0 12px', borderRadius: 6, border: 0,
            background: t.accent, color: '#fff', fontSize: 12, fontWeight: 600,
          }}>导出溯源报告</button>
        </div>
      </div>

      {/* Scrollable canvas */}
      <div style={{ position: 'absolute', top: 73, left: 0, right: 0, bottom: 0, overflow: 'hidden' }}>
        <svg viewBox={`0 0 ${VBW} ${VBH}`} preserveAspectRatio="xMidYMin meet" style={{
          width: '100%', height: '100%', display: 'block',
          background: isDark
            ? `linear-gradient(180deg, #0c0f15 0%, #0a0d12 100%)`
            : `linear-gradient(180deg, #fafbfc 0%, #f5f6f8 100%)`,
        }}>
          <defs>
            {/* River gradients per type — for flow connectors */}
            {Object.entries(TYPE_TOKENS).map(([k, v]) => (
              <linearGradient key={k} id={`river-${k}`} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor={`oklch(60% 0.16 ${v.hue} / 0.5)`}/>
                <stop offset="100%" stopColor={`oklch(60% 0.16 ${v.hue} / 0.9)`}/>
              </linearGradient>
            ))}
            <marker id="arrow-r" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M0,0 L7,4 L0,8 Z" fill="currentColor" opacity="0.8"/>
            </marker>
          </defs>

          {/* Lane bands */}
          {[
            { y: laneY[0], h: laneH[0], label: '引用 · 标准 / 规范', faint: true },
            { y: laneY[1], h: laneH[1], label: '常量 · 参数 / 设定值' },
            { y: laneY[2], h: laneH[2], label: '设备 · 测量与执行机构' },
            { y: laneY[3], h: laneH[3], label: '试验流程 · 5 步骤', accent: true },
            { y: laneY[4], h: laneH[4], label: '结果 · 输出与下游应用' },
          ].map((l, i) => (
            <g key={i}>
              <rect x="0" y={l.y - 8} width={VBW} height={l.h + 8}
                fill={l.accent
                  ? (isDark ? 'rgba(96,165,250,0.04)' : 'oklch(98% 0.02 240)')
                  : (i % 2 === 0 ? (isDark ? 'rgba(255,255,255,0.015)' : 'rgba(15,23,42,0.02)') : 'transparent')}
                stroke={l.accent ? `oklch(70% 0.10 240 / 0.2)` : 'none'} strokeDasharray="0"/>
              <text x="20" y={l.y - 14} fontSize="10" fontWeight="600"
                fill={t.textFaint} letterSpacing="1.5">
                {l.label}
              </text>
            </g>
          ))}

          {/* Direction header */}
          <g>
            <text x={VBW - 20} y="22" textAnchor="end" fontSize="10" fontWeight="600"
              fill={t.textFaint} letterSpacing="1.5">数据流向 ─→</text>
            <line x1={VBW - 250} y1="26" x2={VBW - 80} y2="26" stroke={t.border}/>
          </g>

          {/* Edges */}
          {edges.map(([from, to, kind], i) => {
            const a = byId[from], b = byId[to];
            if (!a || !b) return null;
            const A = nodeBox(a), B = nodeBox(b);
            const traced = traceSet.has(from) && traceSet.has(to);
            // outgoing from right edge of A, entering left edge of B
            const x1 = A.x + A.w, y1 = A.cy;
            const x2 = B.x, y2 = B.cy;
            const dx = Math.abs(x2 - x1);
            const c1x = x1 + dx * 0.45, c1y = y1;
            const c2x = x2 - dx * 0.45, c2y = y2;
            const d = `M ${x1} ${y1} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${x2} ${y2}`;
            const tk = TYPE_TOKENS[a.type];
            const isDashed = kind === 'gov';
            return (
              <g key={i}>
                {/* outer halo when traced */}
                {traced && (
                  <path d={d} fill="none"
                    stroke={`oklch(70% 0.16 ${tk.hue} / 0.25)`}
                    strokeWidth="10" strokeLinecap="round"/>
                )}
                <path d={d} fill="none"
                  stroke={traced ? `url(#river-${a.type})` : (isDark ? 'rgba(255,255,255,0.10)' : 'rgba(15,23,42,0.12)')}
                  strokeWidth={traced ? 2.4 : 1}
                  strokeDasharray={isDashed ? '4 4' : '0'}
                  strokeLinecap="round"/>
              </g>
            );
          })}

          {/* Nodes */}
          {nodes.map(n => {
            const B = nodeBox(n);
            const tk = TYPE_TOKENS[n.type];
            const traced = traceSet.has(n.id);
            const isSel = selected === n.id;
            const dim = !traced;
            return (
              <g key={n.id} style={{ cursor: 'pointer', opacity: dim ? 0.35 : 1, transition: 'opacity .2s' }}
                onClick={() => { setSelected(n.id); setShowPanel(true); }}>
                {isSel && (
                  <rect x={B.x - 4} y={B.y - 4} width={B.w + 8} height={B.h + 8} rx={10}
                    fill="none" stroke={`oklch(60% 0.18 ${tk.hue})`} strokeWidth="1.5" strokeDasharray="4 3"/>
                )}
                <rect x={B.x} y={B.y} width={B.w} height={B.h} rx={6}
                  fill={isDark ? `oklch(18% 0.04 ${tk.hue})` : `oklch(99% 0.01 ${tk.hue})`}
                  stroke={isSel ? `oklch(55% 0.18 ${tk.hue})` : `oklch(${isDark ? 35 : 80}% 0.08 ${tk.hue})`}
                  strokeWidth={isSel ? 1.6 : 1}/>
                {/* type stripe top */}
                <rect x={B.x} y={B.y} width={B.w} height={4}
                  fill={`oklch(60% 0.16 ${tk.hue})`}/>
                {/* primary glow */}
                {n.primary && (
                  <rect x={B.x - 2} y={B.y - 2} width={B.w + 4} height={B.h + 4} rx={8}
                    fill="none" stroke={`oklch(60% 0.18 ${tk.hue} / 0.4)`} strokeWidth="3"/>
                )}
                <text x={B.x + 10} y={B.y + 22} fontSize={n.primary ? 15 : 13} fontWeight="600"
                  fill={isDark ? '#e8eaef' : '#1a1d23'}>{n.label}</text>
                <text x={B.x + 10} y={B.y + 22 + 16} fontSize={11}
                  fontFamily="ui-monospace, monospace" fill={t.textMuted}>{n.sub}</text>
                {n.desc && (
                  <text x={B.x + 10} y={B.y + 22 + 30} fontSize="10" fill={t.textFaint}>{n.desc}</text>
                )}
                {n.isStep && (
                  <>
                    <text x={B.x + B.w - 10} y={B.y + 16} textAnchor="end" fontSize="9"
                      fontFamily="ui-monospace, monospace" fill={t.textFaint}>
                      In[{n.id.replace('step-s', '')}]
                    </text>
                    {n.outputs?.slice(0, 1).map((o, i) => (
                      <text key={i} x={B.x + 10} y={B.y + B.h - 10} fontSize="10"
                        fontFamily="ui-monospace, monospace" fill="oklch(45% 0.16 145)">
                        → {o.k}
                      </text>
                    ))}
                  </>
                )}
                {/* type letter top-right */}
                <text x={B.x + B.w - 10} y={B.y + B.h - 10} textAnchor="end" fontSize="9"
                  fontWeight="700" fill={`oklch(55% 0.14 ${tk.hue})`} opacity="0.7">
                  {tk.label}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Floating panel */}
        {showPanel && (
          <NodePanel t={t} node={nodeOf(selected)} onClose={() => setShowPanel(false)}/>
        )}

        {/* Bottom hint */}
        <div style={{
          position: 'absolute', left: 20, bottom: 14, padding: '6px 12px',
          background: t.surface, border: `1px solid ${t.border}`, borderRadius: 6,
          fontSize: 11, color: t.textMuted, display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span>点击任一节点</span>
          <span style={{ color: t.textFaint }}>→</span>
          <span style={{ color: t.accent, fontWeight: 600 }}>追溯上下游全链路</span>
          <span style={{ color: t.textFaint }}>· 当前追溯 {traceSet.size} 个节点</span>
        </div>
      </div>
    </div>
  );
};

const TraceModeToggle = ({ t, selected, traceCount }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 8, height: 30, padding: '0 12px',
    border: `1px solid ${t.border}`, borderRadius: 6, background: t.surfaceAlt, fontSize: 11,
  }}>
    <div style={{
      width: 7, height: 7, borderRadius: 4, background: 'oklch(60% 0.18 145)',
      boxShadow: '0 0 8px oklch(60% 0.18 145 / 0.6)',
    }}/>
    <span style={{ color: t.textMuted }}>追溯模式</span>
    <span style={{ color: t.text, fontFamily: 'ui-monospace, monospace' }}>{selected}</span>
    <span style={{ color: t.textFaint }}>· {traceCount} 节点高亮</span>
  </div>
);

Object.assign(window, { VariantC });

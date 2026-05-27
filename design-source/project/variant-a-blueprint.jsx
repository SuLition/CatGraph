// variant-a-blueprint.jsx — "工程图纸" style: orthogonal lines + type lanes + Jupyter step rail

const VariantA = ({ theme }) => {
  const t = theme;
  const [selected, setSelected] = React.useState('exp');
  const [showPanel, setShowPanel] = React.useState(true);
  const exp = KG_DATA.experiment;

  // Node positions for the graph (relative %).
  // Manually placed to feel "engineering schematic".

  const nodeOf = (id) => {
    if (id === 'exp') return {
      type: 'experiment', code: exp.code, name: exp.name,
      value: exp.finalResult.value, unit: exp.finalResult.unit,
      fields: [
        { label: '描述', value: exp.description },
        { label: '主公式', value: <code style={{ fontFamily: 'ui-monospace, monospace', background: t.surfaceAlt, padding: '2px 6px', borderRadius: 4 }}>{exp.formula}</code> },
        { label: '依据标准', value: `${exp.standard} ${exp.section}` },
        { label: '状态', value: exp.status },
      ],
      upstream: [
        { type: 'constant', name: '滚筒半径 r = 0.2032 m' },
        { type: 'constant', name: '采样频率 fs = 200 Hz' },
        { type: 'equipment', name: 'HBM T40B 扭矩传感器' },
        { type: 'reference', name: 'SAE J2264 §4.2' },
      ],
      downstream: [
        { type: 'experiment', name: 'NEDC 工况', via: 'I_sim' },
        { type: 'experiment', name: 'WLTC 工况', via: 'I_sim' },
        { type: 'experiment', name: '滑行系数测定', via: '补偿' },
      ],
    };
    if (id?.startsWith('c-')) {
      const c = KG_DATA.constants.find(x => x.id === id);
      return c && {
        type: 'constant', code: c.id, name: c.name, value: c.value, unit: c.unit,
        fields: [
          { label: '符号', value: <code style={{ fontFamily: 'ui-monospace, monospace' }}>{c.sym}</code> },
          { label: '引用次数', value: `${c.usedBy} 次` },
        ],
        downstream: [{ type: 'experiment', name: '基础惯量测定', via: '步骤 1, 2' }],
      };
    }
    if (id?.startsWith('r-')) {
      const r = KG_DATA.results.find(x => x.id === id);
      return r && {
        type: 'result', code: r.id, name: r.name, value: r.value, unit: r.unit,
        fields: [
          { label: '符号', value: <code style={{ fontFamily: 'ui-monospace, monospace' }}>{r.sym}</code> },
          { label: '来源试验', value: '基础惯量测定 EXP-BI-001' },
        ],
        downstream: r.downstream.map(d => ({ ...d, type: 'experiment' })),
        upstream: [{ type: 'experiment', name: '基础惯量测定' }],
      };
    }
    return null;
  };

  return (
    <div style={{
      width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
      background: t.bg, position: 'relative',
    }}>
      {/* Header */}
      <BPHeader t={t} exp={exp} />
      {/* Main split: graph (top) + step rail (bottom) */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
          <BlueprintGraph t={t} selected={selected} onSelect={(id) => { setSelected(id); setShowPanel(true); }} />
          {showPanel && (
            <NodePanel t={t} node={nodeOf(selected)} onClose={() => setShowPanel(false)} variant="blueprint"/>
          )}
        </div>
        <StepRail t={t} exp={exp} />
      </div>
    </div>
  );
};

const BPHeader = ({ t, exp }) => (
  <div style={{
    padding: '12px 20px', borderBottom: `1px solid ${t.border}`, background: t.surface,
    display: 'flex', alignItems: 'center', gap: 20,
  }}>
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{
          padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 600, letterSpacing: 0.6,
          background: 'oklch(94% 0.05 28)', color: 'oklch(45% 0.15 28)',
        }}>试验</span>
        <span style={{ fontFamily: 'ui-monospace, monospace', color: t.textMuted, fontSize: 11 }}>{exp.code}</span>
        <span style={{ color: t.textFaint, fontSize: 11 }}>· 修订 v3 · 2026-05-21</span>
      </div>
      <div style={{ fontSize: 18, fontWeight: 600, marginTop: 4 }}>{exp.name}</div>
    </div>
    {/* Tabs */}
    <div style={{ marginLeft: 24, display: 'flex', gap: 0,
      background: t.surfaceAlt, padding: 3, borderRadius: 8, border: `1px solid ${t.border}` }}>
      {['图谱与流程', '原始数据', '修订历史', '导出'].map((tab, i) => (
        <div key={tab} style={{
          padding: '5px 14px', fontSize: 12, borderRadius: 5, fontWeight: i === 0 ? 600 : 400,
          background: i === 0 ? t.surface : 'transparent', color: i === 0 ? t.text : t.textMuted,
          boxShadow: i === 0 ? '0 1px 2px rgba(15,23,42,0.06)' : 'none',
        }}>{tab}</div>
      ))}
    </div>
    {/* Right side: action chips */}
    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{
        display: 'flex', alignItems: 'baseline', gap: 6,
        padding: '6px 12px', borderRadius: 6,
        background: 'oklch(96% 0.05 145)', border: `1px solid oklch(85% 0.08 145)`,
      }}>
        <span style={{ fontSize: 10, color: 'oklch(40% 0.12 145)', textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 600 }}>最终结果</span>
        <code style={{ fontFamily: 'ui-monospace, monospace', fontWeight: 600, color: 'oklch(35% 0.15 145)', fontSize: 13 }}>
          I_base = {exp.finalResult.value} {exp.finalResult.unit}
        </code>
      </div>
      <button style={{
        height: 30, padding: '0 14px', borderRadius: 6, border: 0,
        background: t.accent, color: '#fff', fontSize: 12, fontWeight: 600,
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        <Icon name="play" size={11} stroke="#fff"/> 重新计算
      </button>
    </div>
  </div>
);

// ── Blueprint graph: type-lane grouping + orthogonal connectors ─
const BlueprintGraph = ({ t, selected, onSelect }) => {
  const isDark = t.name === 'dark';
  // Node coords (cx, cy) in px on a logical 1000×500 plane; we use SVG viewBox.
  const W = 1000, H = 500;
  const nodes = [
    // standards top
    { id: 'ref-sae', type: 'reference', x: 220, y: 36, w: 150, h: 36, label: 'SAE J2264', sub: '§4.2 校准' },
    { id: 'ref-gb', type: 'reference', x: 400, y: 36, w: 150, h: 36, label: 'GB/T 18352.6', sub: '附录 C' },
    { id: 'ref-iso', type: 'reference', x: 580, y: 36, w: 150, h: 36, label: 'ISO 10521', sub: 'Part 1' },
    // constants column (left)
    { id: 'c-r', type: 'constant', x: 30, y: 110, w: 170, h: 56, label: 'r · 滚筒半径', sub: '0.2032 m' },
    { id: 'c-fs', type: 'constant', x: 30, y: 180, w: 170, h: 56, label: 'fs · 采样频率', sub: '200 Hz' },
    { id: 'c-N', type: 'constant', x: 30, y: 250, w: 170, h: 56, label: 'N · 编码器脉冲', sub: '1024 脉冲/转' },
    { id: 'c-vhi', type: 'constant', x: 30, y: 320, w: 170, h: 56, label: 'v_hi / v_lo · 速度门限', sub: '55 / 15 mph' },
    // equipment column (left bottom)
    { id: 'eq-drum', type: 'equipment', x: 30, y: 410, w: 170, h: 56, label: '滚筒', sub: 'Horiba DC-48"' },
    // experiment cluster (center)
    { id: 'exp', type: 'experiment', x: 320, y: 200, w: 360, h: 130, label: '基础惯量测定', sub: 'EXP-BI-001 · 5 步骤', big: true },
    { id: 'eq-torque', type: 'equipment', x: 320, y: 360, w: 170, h: 56, label: '扭矩传感器', sub: 'HBM T40B · 2000 N·m' },
    { id: 'eq-encoder', type: 'equipment', x: 510, y: 360, w: 170, h: 56, label: '编码器', sub: 'Heidenhain ERN1387' },
    // results column (right)
    { id: 'r-Ibase', type: 'result', x: 800, y: 140, w: 170, h: 70, label: 'I_base · 基础惯量', sub: '78.4 kg·m² ±0.6%', emphasis: true },
    { id: 'r-Idrum', type: 'result', x: 800, y: 230, w: 170, h: 56, label: 'I_drum · 滚筒旋转质量', sub: '142.6 kg' },
    // downstream experiments (far right)
    { id: 'exp-nedc', type: 'experiment', x: 800, y: 330, w: 170, h: 56, label: 'NEDC 工况', sub: '使用 I_sim' },
    { id: 'exp-wltc', type: 'experiment', x: 800, y: 410, w: 170, h: 56, label: 'WLTC 工况', sub: '使用 I_sim' },
  ];
  const byId = Object.fromEntries(nodes.map(n => [n.id, n]));
  // Connections: [from, to, label?, style?]
  const edges = [
    ['ref-sae', 'exp', '规范'],
    ['ref-gb', 'exp'],
    ['c-r', 'exp', 'r'],
    ['c-fs', 'exp', 'fs'],
    ['c-N', 'exp'],
    ['c-vhi', 'exp'],
    ['eq-drum', 'exp'],
    ['eq-torque', 'exp', 'T'],
    ['eq-encoder', 'exp', 'α'],
    ['exp', 'r-Ibase', 'I_base'],
    ['exp', 'r-Idrum', 'I_drum'],
    ['r-Ibase', 'exp-nedc', '模拟惯量'],
    ['r-Idrum', 'exp-nedc'],
    ['r-Ibase', 'exp-wltc', '模拟惯量'],
  ];

  // Orthogonal routing: pick exit on right of `from` and entry on left of `to`,
  // route with a midpoint at average x.
  const route = (a, b) => {
    const ax = a.x + a.w, ay = a.y + a.h / 2;
    const bx = b.x, by = b.y + b.h / 2;
    const mx = (ax + bx) / 2;
    return `M ${ax} ${ay} L ${mx} ${ay} L ${mx} ${by} L ${bx} ${by}`;
  };
  // Top-down routing for refs → exp
  const routeTopDown = (a, b) => {
    const ax = a.x + a.w / 2, ay = a.y + a.h;
    const bx = b.x + b.w / 2, by = b.y;
    const my = (ay + by) / 2;
    return `M ${ax} ${ay} L ${ax} ${my} L ${bx} ${my} L ${bx} ${by}`;
  };
  // Bottom-up for equipment(bottom of center) → exp
  const routeBottomUp = (a, b) => {
    const ax = a.x + a.w / 2, ay = a.y;
    const bx = b.x + b.w / 2, by = b.y + b.h;
    const my = (ay + by) / 2;
    return `M ${ax} ${ay} L ${ax} ${my} L ${bx} ${my} L ${bx} ${by}`;
  };

  return (
    <div style={{
      width: '100%', height: '100%', position: 'relative', overflow: 'hidden',
      background: isDark
        ? `radial-gradient(circle at 20% 20%, oklch(20% 0.02 240) 0, ${t.bg} 60%)`
        : `radial-gradient(circle at 30% 20%, oklch(98% 0.01 240) 0, ${t.bg} 70%)`,
      backgroundImage: `linear-gradient(${t.gridLine} 1px, transparent 1px), linear-gradient(90deg, ${t.gridLine} 1px, transparent 1px)`,
      backgroundSize: '24px 24px',
    }}>
      {/* Title corner */}
      <div style={{
        position: 'absolute', top: 12, left: 16, display: 'flex', gap: 8,
        fontSize: 10, color: t.textFaint, textTransform: 'uppercase', letterSpacing: 1.2,
      }}>
        <Icon name="layers" size={11} stroke={t.textFaint}/>
        <span>知识图谱 — 局部视图 · 14 节点 · 14 关系</span>
      </div>
      {/* Lane labels */}
      <SwimLaneLabels t={t} />
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" style={{
        width: '100%', height: '100%', display: 'block', position: 'relative', zIndex: 1,
      }}>
        <defs>
          <marker id="arr-bp" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M0,1 L9,5 L0,9 Z" fill={t.textMuted}/>
          </marker>
          <marker id="arr-bp-sel" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0,1 L9,5 L0,9 Z" fill={t.accent}/>
          </marker>
        </defs>
        {/* Edges */}
        {edges.map(([f, to, lbl], i) => {
          const a = byId[f], b = byId[to]; if (!a || !b) return null;
          // pick routing
          let d;
          if (a.type === 'reference') d = routeTopDown(a, b);
          else if (a.type === 'equipment' && a.id !== 'eq-drum') d = routeBottomUp(a, b);
          else d = route(a, b);
          const isSel = (selected === f || selected === to);
          return (
            <g key={i}>
              <path d={d} fill="none"
                stroke={isSel ? t.accent : t.borderStrong}
                strokeWidth={isSel ? 1.6 : 1}
                strokeDasharray={a.type === 'reference' ? '4 3' : '0'}
                markerEnd={isSel ? 'url(#arr-bp-sel)' : 'url(#arr-bp)'}/>
              {lbl && (
                <g>
                  {(() => {
                    // place label at midpoint
                    const [_, mx, my] = d.match(/M ([\d.]+) ([\d.]+)/) || [];
                    const parts = d.split('L');
                    const last = parts[parts.length - 1].trim().split(' ');
                    const cx = (Number(mx) + Number(last[0])) / 2;
                    const cy = (Number(my) + Number(last[1])) / 2;
                    return (
                      <>
                        <rect x={cx - lbl.length * 4 - 4} y={cy - 9} width={lbl.length * 8 + 8} height={16} rx={4}
                          fill={isDark ? 'rgba(20,24,32,0.95)' : '#fff'} stroke={isSel ? t.accent : t.border}/>
                        <text x={cx} y={cy + 3.5} textAnchor="middle" fontFamily="ui-monospace, monospace"
                          fontSize="10" fill={isSel ? t.accent : t.textMuted} fontWeight={isSel ? 600 : 500}>{lbl}</text>
                      </>
                    );
                  })()}
                </g>
              )}
            </g>
          );
        })}
        {/* Nodes */}
        {nodes.map(n => {
          const tk = TYPE_TOKENS[n.type];
          const isSel = selected === n.id;
          const fill = isDark
            ? `oklch(20% 0.04 ${tk.hue})`
            : `oklch(99% 0.005 ${tk.hue})`;
          const stroke = `oklch(${isSel ? 50 : 70}% ${isSel ? 0.18 : 0.10} ${tk.hue})`;
          return (
            <g key={n.id} onClick={() => onSelect(n.id)} style={{ cursor: 'pointer' }}>
              {/* drop shadow if selected */}
              {isSel && (
                <rect x={n.x - 3} y={n.y - 3} width={n.w + 6} height={n.h + 6} rx={8}
                  fill="none" stroke={t.accent} strokeWidth="1" strokeDasharray="3 3"/>
              )}
              <rect x={n.x} y={n.y} width={n.w} height={n.h} rx={6}
                fill={fill} stroke={stroke} strokeWidth={isSel ? 1.5 : 1}/>
              {/* type strip on left */}
              <rect x={n.x} y={n.y} width={5} height={n.h} rx={6}
                fill={`oklch(60% 0.16 ${tk.hue})`} />
              {/* type letter top-right */}
              <text x={n.x + n.w - 8} y={n.y + 13} textAnchor="end" fontSize="9"
                fontWeight={700} fill={`oklch(55% 0.14 ${tk.hue})`}>{tk.label.toUpperCase()}</text>
              <text x={n.x + 14} y={n.y + 22} fontSize={n.big ? 16 : 13}
                fontWeight={n.big ? 700 : 600} fill={t.text}>{n.label}</text>
              <text x={n.x + 14} y={n.y + 22 + (n.big ? 22 : 18)}
                fontSize={n.big ? 12 : 11} fill={t.textMuted}
                fontFamily="ui-monospace, monospace">{n.sub}</text>
              {n.emphasis && (
                <>
                  <circle cx={n.x + n.w - 12} cy={n.y + n.h - 12} r={3}
                    fill="oklch(60% 0.18 145)"/>
                </>
              )}
              {n.big && (
                <g>
                  <text x={n.x + 14} y={n.y + 80} fontSize="10" fill={t.textFaint}
                    letterSpacing="0.6">主公式</text>
                  <text x={n.x + 14} y={n.y + 100} fontSize="13" fontFamily="ui-monospace, monospace"
                    fill={t.text}>I = T / α = F·r / α</text>
                  <text x={n.x + 14} y={n.y + 118} fontSize="10" fill={t.textFaint}>
                    步骤 1 ─ 2 ─ 3 ─ 4 ─ 5 · 4 加速度组 · 20 次运行
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
      {/* Legend */}
      <BPLegend t={t}/>
    </div>
  );
};

const SwimLaneLabels = ({ t }) => (
  <div style={{
    position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
    fontSize: 10, color: t.textFaint, fontWeight: 600, letterSpacing: 1.2, textTransform: 'uppercase',
  }}>
    {/* Vertical lane bands - subtle */}
    {[
      { left: '2%', top: '4%', label: '── 标准引用 ──', w: '70%' },
      { left: '2%', top: '20%', label: '│ 输入域', vertical: true },
      { left: '32%', top: '20%', label: '│ 试验主体', vertical: true },
      { left: '78%', top: '20%', label: '│ 产出与下游', vertical: true },
    ].map((l, i) => (
      <div key={i} style={{
        position: 'absolute', left: l.left, top: l.top,
      }}>
        {l.label}
      </div>
    ))}
  </div>
);

const BPLegend = ({ t }) => (
  <div style={{
    position: 'absolute', left: 16, bottom: 14, display: 'flex', gap: 14,
    padding: '8px 14px', background: t.surface,
    border: `1px solid ${t.border}`, borderRadius: 6,
    fontSize: 11, color: t.textMuted, zIndex: 2,
  }}>
    {[
      ['experiment', '试验'],
      ['constant', '常量'],
      ['result', '结果'],
      ['equipment', '设备'],
      ['reference', '标准'],
    ].map(([k, l]) => {
      const tk = TYPE_TOKENS[k];
      return (
        <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 12, height: 12, borderRadius: 2, background: `oklch(60% 0.16 ${tk.hue})` }}/>
          {l}
        </div>
      );
    })}
    <div style={{ width: 1, background: t.border, margin: '0 4px' }}/>
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <svg width="20" height="10"><line x1="0" y1="5" x2="20" y2="5" stroke={t.textMuted} strokeWidth="1"/></svg>
      引用
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <svg width="20" height="10"><line x1="0" y1="5" x2="20" y2="5" stroke={t.textMuted} strokeWidth="1" strokeDasharray="3 2"/></svg>
      规范
    </div>
  </div>
);

const StepRail = ({ t, exp }) => (
  <div style={{
    height: 170, flexShrink: 0, borderTop: `1px solid ${t.border}`, background: t.surface,
    padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8, overflow: 'hidden',
  }}>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: t.text }}>试验流程 · 5 步骤</span>
      <span style={{ fontSize: 11, color: t.textFaint }}>类 Jupyter 单元 · 点击展开 · ⇧⏎ 重新执行</span>
      <span style={{ marginLeft: 'auto', fontSize: 11, color: t.textMuted,
        display: 'flex', gap: 6, alignItems: 'center' }}>
        <Icon name="check" size={11} stroke="oklch(50% 0.18 145)"/>
        全部步骤已通过校验
      </span>
    </div>
    <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, minHeight: 0 }}>
      {exp.steps.map((s, i) => <StepCard key={s.id} t={t} step={s} index={i + 1} total={exp.steps.length}/>)}
    </div>
  </div>
);

const StepCard = ({ t, step, index, total }) => (
  <div style={{
    background: t.surfaceAlt, border: `1px solid ${t.border}`, borderRadius: 8,
    padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 6, overflow: 'hidden',
    position: 'relative',
  }}>
    {/* Cell number gutter (Jupyter In[N]) */}
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
      <span style={{
        fontFamily: 'ui-monospace, monospace', fontSize: 10, color: t.textFaint,
      }}>In [{index}]:</span>
      <span style={{ fontSize: 12, fontWeight: 600, color: t.text }}>{step.name}</span>
      <span style={{ marginLeft: 'auto', fontSize: 10, color: 'oklch(50% 0.18 145)', display: 'flex', alignItems: 'center', gap: 3 }}>
        <Icon name="check" size={9} stroke="currentColor"/>
      </span>
    </div>
    {/* Params */}
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {step.params.slice(0, 3).map((p, i) => (
        <div key={i} style={{
          display: 'flex', gap: 6, fontSize: 10.5,
          fontFamily: 'ui-monospace, monospace',
        }}>
          <span style={{ color: 'oklch(50% 0.14 280)' }}>{p.k}</span>
          <span style={{ color: t.textFaint }}>=</span>
          <span style={{ color: t.text }}>{p.v}</span>
          {p.u && <span style={{ color: t.textFaint }}>{p.u}</span>}
        </div>
      ))}
    </div>
    {/* Formula */}
    {step.formula && (
      <div style={{
        background: t.surface, border: `1px dashed ${t.border}`, borderRadius: 4,
        padding: '4px 6px', fontFamily: 'ui-monospace, monospace', fontSize: 10.5,
        color: t.text,
      }}>{step.formula}</div>
    )}
    {/* Outputs (In[N+1] = Out) */}
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 'auto' }}>
      <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 10, color: t.textFaint }}>
        Out[{index}]:
      </span>
      {step.outputs.slice(0, 2).map((o, i) => (
        <div key={i} style={{
          display: 'flex', gap: 6, fontSize: 10.5,
          fontFamily: 'ui-monospace, monospace',
        }}>
          <span style={{ color: 'oklch(45% 0.16 145)' }}>{o.k}</span>
          {o.v && <><span style={{ color: t.textFaint }}>→</span><span style={{ color: t.text }}>{o.v}</span></>}
        </div>
      ))}
    </div>
    {index < total && (
      <div style={{
        position: 'absolute', right: -8, top: '50%', width: 16, height: 2,
        background: t.borderStrong, transform: 'translateY(-50%)', zIndex: 1,
      }}/>
    )}
  </div>
);

Object.assign(window, { VariantA });

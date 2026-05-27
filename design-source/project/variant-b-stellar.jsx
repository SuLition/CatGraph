// variant-b-stellar.jsx — "星图" radial dark layout with scrubbable step timeline

const VariantB = ({ theme }) => {
  const t = theme;
  const [selected, setSelected] = React.useState('exp');
  const [activeStep, setActiveStep] = React.useState(2); // 0..4, controls graph highlights
  const [showPanel, setShowPanel] = React.useState(true);
  const exp = KG_DATA.experiment;
  const isDark = t.name === 'dark';

  // For stellar variant we ALWAYS render against a dark canvas regardless of theme,
  // because the design depends on it. But chrome respects theme.
  const stellarBg = '#070a13';
  const stellarSurface = 'rgba(15,20,30,0.6)';
  const stellarText = '#e7ebf2';
  const stellarMuted = 'rgba(231,235,242,0.55)';
  const stellarFaint = 'rgba(231,235,242,0.3)';

  // Step→nodes mapping: which nodes are involved in each step
  const stepNodes = {
    0: ['c-vlo','c-vhi','c-fs','eq-torque','eq-encoder','eq-drum'],
    1: ['c-vlo','c-vhi','c-fs','eq-torque','eq-encoder','eq-drum'],
    2: ['c-r','eq-torque','eq-encoder'],
    3: [],
    4: ['r-Ibase','r-Idrum','ref-sae'],
  };
  const activeIds = new Set(stepNodes[activeStep] || []);

  // Radial layout — angle ranges per type sector
  // top: reference (-135 to -45), right: result (-45 to 45),
  // bottom: equipment (45 to 135), left: constant (135 to 225)
  const sectors = [
    { type: 'reference', start: -130, end: -50, radius: 230,
      items: KG_DATA.references.map((r) => ({ id: r.id, type: 'reference', label: r.name, sub: r.section })) },
    { type: 'result', start: -55, end: 55, radius: 260,
      items: [
        { id: 'r-Ibase', type: 'result', label: 'I_base', sub: '78.4 kg·m²', primary: true },
        { id: 'r-Idrum', type: 'result', label: 'I_drum', sub: '142.6 kg' },
        { id: 'exp-nedc', type: 'experiment', label: 'NEDC ▶', sub: '下游工况' },
        { id: 'exp-wltc', type: 'experiment', label: 'WLTC ▶', sub: '下游工况' },
      ] },
    { type: 'equipment', start: 50, end: 135, radius: 230,
      items: KG_DATA.equipment.map(e => ({ id: e.id, type: 'equipment', label: e.name, sub: e.model })) },
    { type: 'constant', start: 130, end: 230, radius: 240,
      items: KG_DATA.constants.map(c => ({ id: c.id, type: 'constant', label: c.sym, sub: `${c.value} ${c.unit}` })) },
  ];

  // Center pos in % of viewBox: 50/50, viewBox 800x600
  const VBW = 800, VBH = 600;
  const cx = 420, cy = 290;

  // Build positioned nodes
  const positioned = [];
  sectors.forEach(sec => {
    const n = sec.items.length;
    sec.items.forEach((it, i) => {
      const frac = n === 1 ? 0.5 : i / (n - 1);
      const deg = sec.start + (sec.end - sec.start) * frac;
      const rad = (deg - 90) * Math.PI / 180; // -90 to put 0deg at top? actually we use 0 = right (east)
      // Convert: our "top" sector start=-130 means upper-left area. We'll use deg=0→east, deg=-90→north
      const r = sec.radius;
      const x = cx + r * Math.cos((deg) * Math.PI / 180);
      const y = cy + r * Math.sin((deg) * Math.PI / 180);
      positioned.push({ ...it, x, y, sectorType: sec.type });
    });
  });

  // Node lookup
  const nodeOf = (id) => {
    if (id === 'exp') return {
      type: 'experiment', code: exp.code, name: exp.name,
      value: exp.finalResult.value, unit: exp.finalResult.unit,
      fields: [
        { label: '描述', value: exp.description },
        { label: '主公式', value: <code style={{ fontFamily: 'ui-monospace, monospace', background: 'rgba(96,165,250,0.15)', padding: '2px 6px', borderRadius: 4, color: '#93c5fd' }}>{exp.formula}</code> },
        { label: '依据标准', value: `${exp.standard} ${exp.section}` },
        { label: '当前步骤', value: `${activeStep + 1} / 5  ·  ${exp.steps[activeStep].name}` },
      ],
      downstream: [
        { type: 'experiment', name: 'NEDC 工况', via: 'I_sim' },
        { type: 'experiment', name: 'WLTC 工况', via: 'I_sim' },
        { type: 'experiment', name: '滑行系数测定', via: '补偿' },
      ],
    };
    const p = positioned.find(p => p.id === id);
    if (!p) return null;
    return {
      type: p.type, code: id, name: p.label + (p.sub ? ` · ${p.sub}` : ''),
      value: p.type === 'constant' || p.type === 'result' ? p.sub.split(' ')[0] : null,
      unit: p.type === 'constant' || p.type === 'result' ? p.sub.split(' ').slice(1).join(' ') : null,
      fields: [
        { label: '类型', value: TYPE_TOKENS[p.type]?.label },
        { label: '关联试验', value: '基础惯量测定 (使用于步骤 ' + (activeStep + 1) + ')' },
      ],
    };
  };

  // Make theme adapter for panel (always dark glass)
  const darkPanelTheme = {
    ...t,
    name: 'dark', surface: stellarSurface,
    surfaceAlt: 'rgba(255,255,255,0.04)',
    border: 'rgba(255,255,255,0.12)', text: stellarText, textMuted: stellarMuted,
    textFaint: stellarFaint, shadow: '0 12px 48px rgba(0,0,0,0.5)', bg: stellarBg,
  };

  return (
    <div style={{
      width: '100%', height: '100%', position: 'relative',
      background: `radial-gradient(ellipse at 55% 50%, #1a2542 0%, ${stellarBg} 55%, #03060f 100%)`,
      color: stellarText, overflow: 'hidden',
    }}>
      {/* Star noise overlay */}
      <StarField />

      {/* Top header strip */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, padding: '14px 20px',
        display: 'flex', alignItems: 'center', gap: 16, zIndex: 4,
      }}>
        <div>
          <div style={{ fontSize: 10, color: stellarFaint, letterSpacing: 1.5, textTransform: 'uppercase' }}>
            EXP-BI-001 · 试验 · 修订 v3
          </div>
          <div style={{ fontSize: 17, fontWeight: 600, color: stellarText, marginTop: 2 }}>
            基础惯量测定 <span style={{ color: stellarMuted, fontWeight: 400, fontSize: 13 }}>· I_base = 78.4 kg·m²</span>
          </div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <ChipDark icon="search" label="搜索节点 ⌘K" />
          <ChipDark icon="layers" label="图层 · 全部" />
          <ChipDark icon="play" label="重新计算" primary />
        </div>
      </div>

      {/* Left: vertical step timeline (scrubable) */}
      <StepTimeline t={t} steps={exp.steps} activeStep={activeStep} onStep={setActiveStep} />

      {/* Center: graph */}
      <svg viewBox={`0 0 ${VBW} ${VBH}`} preserveAspectRatio="xMidYMid meet" style={{
        position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 2,
      }}>
        <defs>
          <radialGradient id="glow-center" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="oklch(75% 0.20 28)" stopOpacity="0.9"/>
            <stop offset="40%" stopColor="oklch(60% 0.18 28)" stopOpacity="0.5"/>
            <stop offset="100%" stopColor="oklch(40% 0.10 28)" stopOpacity="0"/>
          </radialGradient>
          <radialGradient id="glow-soft" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(96,165,250,0.4)"/>
            <stop offset="100%" stopColor="rgba(96,165,250,0)"/>
          </radialGradient>
          <filter id="blur-soft"><feGaussianBlur stdDeviation="6"/></filter>
          {Object.entries(TYPE_TOKENS).map(([k, v]) => (
            <radialGradient key={k} id={`g-${k}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={`oklch(75% 0.20 ${v.hue})`} stopOpacity="0.95"/>
              <stop offset="100%" stopColor={`oklch(50% 0.16 ${v.hue})`} stopOpacity="0.7"/>
            </radialGradient>
          ))}
        </defs>

        {/* Concentric orbit rings */}
        {[120, 180, 230, 280].map((r, i) => (
          <circle key={i} cx={cx} cy={cy} r={r}
            fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.6"
            strokeDasharray={i === 0 ? '0' : '2 5'}/>
        ))}

        {/* Sector arcs (faint type-colored bands) */}
        {sectors.map(sec => {
          const tk = TYPE_TOKENS[sec.type];
          const r1 = sec.radius - 30, r2 = sec.radius + 30;
          const a1 = (sec.start) * Math.PI / 180;
          const a2 = (sec.end) * Math.PI / 180;
          const x1a = cx + r1 * Math.cos(a1), y1a = cy + r1 * Math.sin(a1);
          const x2a = cx + r2 * Math.cos(a1), y2a = cy + r2 * Math.sin(a1);
          const x1b = cx + r1 * Math.cos(a2), y1b = cy + r1 * Math.sin(a2);
          const x2b = cx + r2 * Math.cos(a2), y2b = cy + r2 * Math.sin(a2);
          const largeArc = (sec.end - sec.start) > 180 ? 1 : 0;
          const d = `M ${x1a} ${y1a} L ${x2a} ${y2a} A ${r2} ${r2} 0 ${largeArc} 1 ${x2b} ${y2b} L ${x1b} ${y1b} A ${r1} ${r1} 0 ${largeArc} 0 ${x1a} ${y1a} Z`;
          return (
            <path key={sec.type} d={d}
              fill={`oklch(40% 0.10 ${tk.hue} / 0.06)`}
              stroke={`oklch(50% 0.12 ${tk.hue} / 0.18)`}
              strokeWidth="0.5"/>
          );
        })}

        {/* Sector labels */}
        {sectors.map(sec => {
          const tk = TYPE_TOKENS[sec.type];
          const mid = (sec.start + sec.end) / 2;
          const r = sec.radius + 60;
          const x = cx + r * Math.cos(mid * Math.PI / 180);
          const y = cy + r * Math.sin(mid * Math.PI / 180);
          return (
            <text key={sec.type} x={x} y={y} fill={`oklch(75% 0.12 ${tk.hue})`}
              fontSize="11" fontWeight="600" textAnchor="middle"
              letterSpacing="2" textTransform="uppercase">
              {tk.label.toUpperCase()} ─ {sec.items.length}
            </text>
          );
        })}

        {/* Connections: center → each node */}
        {positioned.map(p => {
          const tk = TYPE_TOKENS[p.type];
          const isActive = activeIds.has(p.id) || activeStep === 4 && p.id === 'r-Ibase';
          const isSel = selected === p.id;
          const dim = activeStep < 4 && !isActive;
          const stroke = isSel
            ? `oklch(70% 0.18 ${tk.hue})`
            : isActive ? `oklch(65% 0.16 ${tk.hue} / 0.85)` : `oklch(50% 0.08 ${tk.hue} / ${dim ? 0.18 : 0.35})`;
          // curved bezier through midpoint with slight perpendicular offset
          const mx = (cx + p.x) / 2, my = (cy + p.y) / 2;
          const dx = p.x - cx, dy = p.y - cy;
          const len = Math.hypot(dx, dy);
          const nx = -dy / len * 18, ny = dx / len * 18;
          return (
            <path key={'e' + p.id} d={`M ${cx} ${cy} Q ${mx + nx} ${my + ny} ${p.x} ${p.y}`}
              fill="none" stroke={stroke}
              strokeWidth={isSel ? 1.8 : isActive ? 1.4 : 0.8}
              style={isActive ? { filter: `drop-shadow(0 0 4px oklch(60% 0.18 ${tk.hue}))` } : {}}/>
          );
        })}

        {/* Central node halo */}
        <circle cx={cx} cy={cy} r="78" fill="url(#glow-center)" filter="url(#blur-soft)" opacity="0.9"/>
        <circle cx={cx} cy={cy} r="78" fill="url(#glow-center)" opacity="0.55"/>

        {/* Central experiment node */}
        <g style={{ cursor: 'pointer' }} onClick={() => { setSelected('exp'); setShowPanel(true); }}>
          <circle cx={cx} cy={cy} r={selected === 'exp' ? 60 : 56}
            fill="oklch(20% 0.06 28 / 0.85)"
            stroke={selected === 'exp' ? 'oklch(75% 0.18 28)' : 'oklch(60% 0.16 28 / 0.7)'}
            strokeWidth={selected === 'exp' ? 2 : 1.2}/>
          {/* Inner ring */}
          <circle cx={cx} cy={cy} r="48"
            fill="none" stroke="oklch(50% 0.10 28 / 0.5)" strokeWidth="0.5" strokeDasharray="2 3"/>
          <text x={cx} y={cy - 18} textAnchor="middle" fontSize="9"
            fill="oklch(75% 0.12 28)" letterSpacing="2.2" fontWeight="600">
            EXPERIMENT
          </text>
          <text x={cx} y={cy + 2} textAnchor="middle" fontSize="15"
            fill={stellarText} fontWeight="700">基础惯量测定</text>
          <text x={cx} y={cy + 20} textAnchor="middle" fontSize="11"
            fontFamily="ui-monospace, monospace" fill="oklch(80% 0.18 28)">I_base = 78.4</text>
          <text x={cx} y={cy + 33} textAnchor="middle" fontSize="9"
            fill={stellarMuted} fontFamily="ui-monospace, monospace">kg·m²  ±0.6%</text>
        </g>

        {/* Outer nodes */}
        {positioned.map(p => {
          const tk = TYPE_TOKENS[p.type];
          const isActive = activeIds.has(p.id) || (activeStep === 4 && p.id === 'r-Ibase');
          const isSel = selected === p.id;
          const dim = activeStep < 4 && !isActive;
          return (
            <g key={p.id} style={{ cursor: 'pointer' }}
              onClick={() => { setSelected(p.id); setShowPanel(true); }}>
              {(isActive || isSel) && (
                <circle cx={p.x} cy={p.y} r={p.primary ? 32 : 24}
                  fill={`oklch(60% 0.18 ${tk.hue} / 0.18)`} filter="url(#blur-soft)"/>
              )}
              <circle cx={p.x} cy={p.y}
                r={isSel ? (p.primary ? 22 : 18) : (p.primary ? 19 : 15)}
                fill={`url(#g-${p.type})`}
                opacity={dim ? 0.3 : 1}
                stroke={isSel ? '#fff' : 'rgba(255,255,255,0.15)'}
                strokeWidth={isSel ? 1.5 : 0.5}/>
              {/* Label below */}
              <text x={p.x} y={p.y + (p.primary ? 36 : 30)} textAnchor="middle" fontSize="11"
                fill={dim ? stellarFaint : stellarText} fontWeight="600">{p.label}</text>
              {p.sub && (
                <text x={p.x} y={p.y + (p.primary ? 50 : 44)} textAnchor="middle" fontSize="9"
                  fill={dim ? stellarFaint : stellarMuted} fontFamily="ui-monospace, monospace">{p.sub}</text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Bottom: legend / mini help */}
      <div style={{
        position: 'absolute', bottom: 16, right: 20, display: 'flex', alignItems: 'center',
        gap: 12, padding: '8px 12px', background: 'rgba(15,20,30,0.7)', backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, color: stellarMuted,
        fontSize: 11, zIndex: 4,
      }}>
        <span style={{ color: stellarText, fontWeight: 600 }}>步骤 {activeStep + 1}/5</span>
        <span>· 高亮节点为当前步骤所涉及对象</span>
        <span style={{ color: stellarFaint }}>· 双击节点聚焦 · 拖动重新布局 · ⌘+回车追溯链</span>
      </div>

      {/* Right floating node panel — adapted dark glass */}
      {showPanel && (
        <NodePanel t={darkPanelTheme} node={nodeOf(selected)} onClose={() => setShowPanel(false)}/>
      )}
    </div>
  );
};

const StarField = () => (
  <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 1, opacity: 0.5 }} viewBox="0 0 800 600">
    {Array.from({ length: 60 }).map((_, i) => {
      const seed = (i * 137.5) % 1;
      const x = (i * 53.7) % 800;
      const y = (i * 91.3) % 600;
      const r = 0.3 + ((i * 7) % 9) / 12;
      const o = 0.3 + ((i * 11) % 7) / 10;
      return <circle key={i} cx={x} cy={y} r={r} fill="#fff" opacity={o}/>;
    })}
  </svg>
);

const ChipDark = ({ icon, label, primary }) => (
  <div style={{
    height: 28, padding: '0 12px', display: 'flex', alignItems: 'center', gap: 6,
    borderRadius: 6, fontSize: 12,
    background: primary ? 'oklch(58% 0.18 28)' : 'rgba(255,255,255,0.04)',
    border: primary ? '1px solid oklch(70% 0.18 28)' : '1px solid rgba(255,255,255,0.08)',
    color: primary ? '#fff' : 'rgba(231,235,242,0.85)',
    fontWeight: primary ? 600 : 400,
  }}>
    <Icon name={icon} size={11} stroke="currentColor"/> {label}
  </div>
);

const StepTimeline = ({ t, steps, activeStep, onStep }) => {
  return (
    <div style={{
      position: 'absolute', left: 0, top: 76, bottom: 56, width: 240,
      padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 0, zIndex: 3,
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 16 }}>
        <span style={{ fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase',
          color: 'rgba(231,235,242,0.5)' }}>试验流程</span>
        <span style={{ fontSize: 11, color: 'rgba(231,235,242,0.3)', marginLeft: 'auto' }}>
          {activeStep + 1}/{steps.length}
        </span>
      </div>
      <div style={{ position: 'relative', flex: 1 }}>
        {/* Vertical glow line */}
        <div style={{
          position: 'absolute', left: 7, top: 4, bottom: 4, width: 2,
          background: 'linear-gradient(to bottom, rgba(96,165,250,0.05), rgba(96,165,250,0.4), rgba(96,165,250,0.05))',
        }}/>
        <div style={{
          position: 'absolute', left: 7, top: 4, width: 2,
          height: `${(activeStep / (steps.length - 1)) * 100}%`,
          background: 'linear-gradient(to bottom, oklch(75% 0.20 28), oklch(60% 0.18 28))',
          boxShadow: '0 0 8px oklch(60% 0.18 28 / 0.7)',
        }}/>
        {/* Step nodes */}
        {steps.map((s, i) => {
          const active = i === activeStep;
          const past = i < activeStep;
          return (
            <div key={s.id} onClick={() => onStep(i)} style={{
              position: 'absolute', left: 0, top: `${(i / (steps.length - 1)) * 92}%`,
              right: 0, display: 'flex', alignItems: 'flex-start', gap: 14, cursor: 'pointer',
            }}>
              <div style={{
                width: 16, height: 16, borderRadius: 8, marginTop: 4,
                background: active ? 'oklch(70% 0.20 28)' : past ? 'oklch(60% 0.16 28)' : 'rgba(15,20,30,0.9)',
                border: active ? '2px solid #fff' : past ? '2px solid oklch(70% 0.18 28)' : '2px solid rgba(231,235,242,0.3)',
                boxShadow: active ? '0 0 16px oklch(70% 0.20 28 / 0.8)' : 'none',
                flexShrink: 0,
              }}/>
              <div style={{ flex: 1, opacity: active ? 1 : past ? 0.75 : 0.55 }}>
                <div style={{
                  fontFamily: 'ui-monospace, monospace', fontSize: 10,
                  color: 'rgba(231,235,242,0.5)',
                }}>In [{i + 1}]</div>
                <div style={{
                  fontSize: 12.5, fontWeight: active ? 700 : 500,
                  color: active ? '#fff' : 'rgba(231,235,242,0.85)',
                }}>{s.name}</div>
                {active && (
                  <div style={{
                    marginTop: 6, fontSize: 10.5, fontFamily: 'ui-monospace, monospace',
                    color: 'oklch(80% 0.16 28)', display: 'flex', flexDirection: 'column', gap: 2,
                  }}>
                    {s.params.slice(0, 3).map((p, j) => (
                      <div key={j}>{p.k} = {p.v}{p.u && ` ${p.u}`}</div>
                    ))}
                    {s.formula && <div style={{ color: 'rgba(231,235,242,0.7)', marginTop: 2 }}>{s.formula}</div>}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

Object.assign(window, { VariantB });

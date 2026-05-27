// shared.jsx — data, theme tokens, chrome components (titlebar, left nav, middle list)
// Shared across all 3 variants. Exports to window so other Babel scripts can use.

// ─── Sample knowledge graph data ────────────────────────────────
const KG_DATA = {
  experiment: {
    id: 'exp-base-inertia',
    name: '基础惯量测定',
    code: 'EXP-BI-001',
    standard: 'SAE J2264',
    section: '§4.2',
    description: '通过加速/减速测量,确定底盘测功机系统的等效转动惯量',
    formula: 'I = T / α = F·r / α',
    status: '已完成 · 3 次校验',
    finalResult: { name: 'I_base', value: '78.4', unit: 'kg·m²', tolerance: '±0.6%' },
    steps: [
      {
        id: 's1', name: '加速阶段测量',
        params: [
          { k: 'v_low', v: '20', u: 'mph' },
          { k: 'v_high', v: '55', u: 'mph' },
          { k: 'fs', v: '200', u: 'Hz' },
        ],
        formula: 'F_ext, a_ext ← 200Hz 采样',
        outputs: [
          { k: 'F_accel[]', v: '120 samples' },
          { k: 'a_accel[]', v: '120 samples' },
        ],
      },
      {
        id: 's2', name: '减速阶段测量',
        params: [
          { k: 'v_high', v: '50', u: 'mph' },
          { k: 'v_low', v: '15', u: 'mph' },
          { k: 'fs', v: '200', u: 'Hz' },
        ],
        formula: 'F_decel, a_decel ← 200Hz 采样',
        outputs: [
          { k: 'F_decel[]', v: '118 samples' },
          { k: 'a_decel[]', v: '118 samples' },
        ],
      },
      {
        id: 's3', name: '单次运行计算',
        params: [{ k: 'runs', v: '5', u: '次/组' }],
        formula: 'I_run = F̄ / ā',
        outputs: [{ k: 'I_run', v: '5 次 × 4 组' }],
      },
      {
        id: 's4', name: '加速度组聚合',
        params: [{ k: 'groups', v: '4', u: '组' }],
        formula: 'I_group = mean(I_run × 5)',
        outputs: [
          { k: 'I_group_1', v: '77.8 kg·m²' },
          { k: 'I_group_2', v: '78.2 kg·m²' },
          { k: 'I_group_3', v: '78.6 kg·m²' },
          { k: 'I_group_4', v: '79.0 kg·m²' },
        ],
      },
      {
        id: 's5', name: '最终基础惯量',
        params: [{ k: 'method', v: 'max+min/2' }],
        formula: 'I_base = (I_max + I_min) / 2',
        outputs: [{ k: 'I_base', v: '78.4 kg·m²' }],
      },
    ],
  },
  constants: [
    { id: 'c-r', sym: 'r', name: '滚筒半径', value: '0.2032', unit: 'm', usedBy: 5 },
    { id: 'c-fs', sym: 'fs', name: '采样频率', value: '200', unit: 'Hz', usedBy: 3 },
    { id: 'c-N', sym: 'N', name: '编码器脉冲数', value: '1024', unit: '脉冲/转', usedBy: 2 },
    { id: 'c-vlo', sym: 'v_lo', name: '低速门限', value: '15', unit: 'mph', usedBy: 1 },
    { id: 'c-vhi', sym: 'v_hi', name: '高速门限', value: '55', unit: 'mph', usedBy: 1 },
    { id: 'c-tau', sym: 'τ_max', name: '扭矩量程', value: '2000', unit: 'N·m', usedBy: 2 },
  ],
  equipment: [
    { id: 'eq-drum', name: '滚筒', model: 'DC-48"', vendor: 'Horiba' },
    { id: 'eq-torque', name: '扭矩传感器', model: 'T40B', vendor: 'HBM' },
    { id: 'eq-encoder', name: '编码器', model: 'ERN1387', vendor: 'Heidenhain' },
    { id: 'eq-inverter', name: '变频器', model: 'ACS880', vendor: 'ABB' },
  ],
  results: [
    {
      id: 'r-Ibase', sym: 'I_base', name: '基础惯量', value: '78.4', unit: 'kg·m²',
      from: 'exp-base-inertia',
      downstream: [
        { id: 'exp-coastdown', name: '滑行系数测定', via: '修正补偿' },
        { id: 'exp-nedc', name: 'NEDC 工况', via: '模拟惯量' },
        { id: 'exp-wltc', name: 'WLTC 工况', via: '模拟惯量' },
      ],
    },
    {
      id: 'r-Idrum', sym: 'I_drum', name: '滚筒旋转质量等效', value: '142.6', unit: 'kg',
      from: 'exp-base-inertia',
      downstream: [{ id: 'exp-nedc', name: 'NEDC 工况', via: 'I_sim = m_test − I_drum / r²' }],
    },
  ],
  references: [
    { id: 'ref-sae', name: 'SAE J2264', section: '§4.2', title: '底盘测功机校准' },
    { id: 'ref-gb', name: 'GB/T 18352.6', section: '附录C', title: '轻型汽车排放限值' },
    { id: 'ref-iso', name: 'ISO 10521', section: 'Part 1', title: '道路车辆 — 道路负载' },
  ],
  variables: [
    { sym: 'I', desc: '转动惯量', unit: 'kg·m²' },
    { sym: 'T', desc: '扭矩', unit: 'N·m' },
    { sym: 'α', desc: '角加速度', unit: 'rad/s²' },
    { sym: 'F', desc: '切向力', unit: 'N' },
    { sym: 'r', desc: '滚筒半径', unit: 'm' },
  ],
};

// ─── Type tokens (color per entity type) ────────────────────────
const TYPE_TOKENS = {
  experiment: { hue: 28,  label: '试验', initial: '试' }, // amber
  constant:   { hue: 200, label: '常量', initial: '常' }, // cyan
  result:     { hue: 145, label: '结果', initial: '果' }, // green
  equipment:  { hue: 280, label: '设备', initial: '设' }, // violet
  reference:  { hue: 0,   label: '标准', initial: '标' }, // red
  variable:   { hue: 50,  label: '变量', initial: '变' }, // yellow
};

const typeColor = (type, opts = {}) => {
  const { hue } = TYPE_TOKENS[type] || { hue: 0 };
  const { l = 55, c = 0.14, a = 1, dark = false } = opts;
  const L = dark ? Math.min(70, l + 8) : l;
  return `oklch(${L}% ${c} ${hue} / ${a})`;
};

// ─── Theme ──────────────────────────────────────────────────────
const THEMES = {
  light: {
    name: 'light',
    bg: '#f5f6f8',
    surface: '#ffffff',
    surfaceAlt: '#fafbfc',
    border: '#e4e6ea',
    borderStrong: '#cfd2d8',
    text: '#1a1d23',
    textMuted: '#5b6271',
    textFaint: '#8a909d',
    accent: '#2563eb',
    accentSoft: '#dbeafe',
    titlebar: '#ffffff',
    gridLine: 'rgba(15,23,42,0.05)',
    gridDot: 'rgba(15,23,42,0.18)',
    shadow: '0 1px 2px rgba(15,23,42,0.04), 0 8px 24px rgba(15,23,42,0.06)',
  },
  dark: {
    name: 'dark',
    bg: '#0b0d12',
    surface: '#13161d',
    surfaceAlt: '#1a1e27',
    border: '#252a34',
    borderStrong: '#363d4a',
    text: '#e8eaef',
    textMuted: '#9aa3b2',
    textFaint: '#5b6271',
    accent: '#60a5fa',
    accentSoft: 'rgba(96,165,250,0.16)',
    titlebar: '#0f1116',
    gridLine: 'rgba(148,163,184,0.05)',
    gridDot: 'rgba(148,163,184,0.20)',
    shadow: '0 1px 2px rgba(0,0,0,0.4), 0 8px 24px rgba(0,0,0,0.5)',
  },
};

// ─── Icon set (tiny inline SVGs) ────────────────────────────────
const Icon = ({ name, size = 16, stroke = 'currentColor' }) => {
  const paths = {
    docs: <><path d="M4 3h8l3 3v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z"/><path d="M12 3v3h3"/></>,
    flask: <><path d="M7 3h4M8 3v5L4 15a1 1 0 0 0 .9 1.5h8.2A1 1 0 0 0 14 15l-4-7V3"/></>,
    code: <><path d="m6 5-4 4 4 4M12 5l4 4-4 4"/></>,
    constants: <><path d="M5 6h8M5 12h8"/><circle cx="14" cy="6" r="0.8" fill={stroke} stroke="none"/><circle cx="14" cy="12" r="0.8" fill={stroke} stroke="none"/></>,
    graph: <><circle cx="4" cy="4" r="1.5"/><circle cx="14" cy="4" r="1.5"/><circle cx="4" cy="14" r="1.5"/><circle cx="14" cy="14" r="1.5"/><circle cx="9" cy="9" r="2"/><path d="m5 5 3 3M13 5l-3 3M5 13l3-3M13 13l-3-3"/></>,
    ref: <><path d="M4 3h7l3 3v11H4z"/><path d="M6 8h7M6 11h5M6 14h7"/></>,
    chevron: <path d="m6 4 5 5-5 5"/>,
    search: <><circle cx="8" cy="8" r="5"/><path d="m12 12 4 4"/></>,
    plus: <><path d="M9 4v10M4 9h10"/></>,
    x: <path d="m4 4 10 10M14 4 4 14"/>,
    pin: <><path d="M9 2v6M5 8h8l-1 4H6zM9 12v4"/></>,
    expand: <><path d="M4 8V4h4M14 10v4h-4"/></>,
    play: <path d="M5 3v12l10-6z" fill={stroke}/>,
    check: <path d="m4 9 3 3 7-7"/>,
    book: <><path d="M3 3h6a2 2 0 0 1 2 2v10a2 2 0 0 0-2-2H3z"/><path d="M15 3H9a2 2 0 0 0-2 2v10a2 2 0 0 1 2-2h6z"/></>,
    sun: <><circle cx="9" cy="9" r="3"/><path d="M9 1v2M9 15v2M1 9h2M15 9h2M3 3l1.5 1.5M14.5 14.5 16 16M3 15l1.5-1.5M14.5 3.5 16 2"/></>,
    moon: <path d="M14 11A6 6 0 1 1 7 4a5 5 0 0 0 7 7Z"/>,
    arrow: <path d="M3 9h12M11 5l4 4-4 4"/>,
    cog: <><circle cx="9" cy="9" r="2.5"/><path d="M9 1v2M9 15v2M1 9h2M15 9h2M3 3l1.5 1.5M14.5 14.5 16 16M3 15l1.5-1.5M14.5 3.5 16 2"/></>,
    minus: <path d="M3 9h12"/>,
    square: <rect x="4" y="4" width="10" height="10"/>,
    layers: <><path d="M9 2 2 6l7 4 7-4z"/><path d="m2 11 7 4 7-4M2 14l7 4 7-4"/></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" stroke={stroke}
      strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      {paths[name]}
    </svg>
  );
};

// ─── Window chrome shell ────────────────────────────────────────
// Renders title bar + menu + left icon nav + middle list, leaves right slot empty.
// `right` prop = ReactNode to render in right area.
const WinShell = ({ theme, variant, right, listType = 'experiments', selectedNodeId, onNodeSelect }) => {
  const t = theme;
  return (
    <div style={{
      width: '100%', height: '100%', background: t.bg, color: t.text,
      fontFamily: '"Segoe UI Variable", "Segoe UI", -apple-system, "PingFang SC", "Microsoft YaHei UI", sans-serif',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
      fontSize: 13, fontFeatureSettings: '"cv11", "ss01"',
    }}>
      {/* Title bar + menu */}
      <TitleBar theme={t} variant={variant} />
      {/* Body */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        <LeftIconNav theme={t} />
        <MiddleList theme={t} listType={listType} selectedNodeId={selectedNodeId} onNodeSelect={onNodeSelect} />
        <div style={{ flex: 1, minWidth: 0, position: 'relative', background: t.bg }}>
          {right}
        </div>
      </div>
      {/* Status bar */}
      <StatusBar theme={t} />
    </div>
  );
};

const TitleBar = ({ theme: t, variant }) => (
  <div style={{
    height: 36, flexShrink: 0, display: 'flex', alignItems: 'center',
    background: t.titlebar, borderBottom: `1px solid ${t.border}`,
    paddingLeft: 8, paddingRight: 0, gap: 4, userSelect: 'none',
  }}>
    {/* App icon + traffic */}
    <div style={{ width: 28, height: 28, display: 'grid', placeItems: 'center', color: t.textMuted }}>
      <Icon name="square" size={14} />
    </div>
    <button style={navBtn(t)}><Icon name="chevron" size={12} stroke={t.textMuted}/></button>
    <button style={{...navBtn(t), transform: 'rotate(180deg)', opacity: 0.4}}><Icon name="chevron" size={12} stroke={t.textMuted}/></button>
    <div style={{ display: 'flex', gap: 0, marginLeft: 6 }}>
      {['文件', '编辑', '查看', '窗口', '帮助'].map(m => (
        <div key={m} style={{
          padding: '6px 12px', fontSize: 13, color: t.text, cursor: 'default',
          borderRadius: 4,
        }}>{m}</div>
      ))}
    </div>
    {/* Title */}
    <div style={{ flex: 1, textAlign: 'center', color: t.textMuted, fontSize: 12, letterSpacing: 0.3 }}>
      CatGraph — 底盘测功机知识图谱 · {variant}
    </div>
    {/* Window controls */}
    <div style={{ display: 'flex' }}>
      <button style={winBtn(t)}><Icon name="minus" size={12} stroke={t.textMuted}/></button>
      <button style={winBtn(t)}><Icon name="square" size={11} stroke={t.textMuted}/></button>
      <button style={{...winBtn(t), color: '#e6534b'}}><Icon name="x" size={12} stroke="currentColor"/></button>
    </div>
  </div>
);

const navBtn = (t) => ({
  width: 26, height: 26, display: 'grid', placeItems: 'center', background: 'transparent',
  border: 0, borderRadius: 4, cursor: 'default', color: t.textMuted,
});
const winBtn = (t) => ({
  width: 46, height: 36, display: 'grid', placeItems: 'center', background: 'transparent',
  border: 0, cursor: 'default', color: t.textMuted,
});

const LeftIconNav = ({ theme: t }) => {
  const items = [
    { id: 'docs', icon: 'docs', label: '文档' },
    { id: 'exp', icon: 'flask', label: '试验', active: true },
    { id: 'const', icon: 'constants', label: '常量' },
    { id: 'graph', icon: 'graph', label: '图谱' },
    { id: 'ref', icon: 'ref', label: '文献' },
    { id: 'code', icon: 'code', label: '代码' },
  ];
  return (
    <div style={{
      width: 56, flexShrink: 0, background: t.surface, borderRight: `1px solid ${t.border}`,
      display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 10, gap: 4,
    }}>
      {items.map(it => (
        <div key={it.id} title={it.label} style={{
          width: 40, height: 40, display: 'grid', placeItems: 'center', borderRadius: 8,
          background: it.active ? t.accentSoft : 'transparent',
          color: it.active ? t.accent : t.textMuted, position: 'relative',
        }}>
          {it.active && <div style={{
            position: 'absolute', left: -12, top: 10, bottom: 10, width: 3,
            background: t.accent, borderRadius: 2,
          }}/>}
          <Icon name={it.icon} size={18} />
        </div>
      ))}
      <div style={{ flex: 1 }}/>
      <div style={{ width: 40, height: 40, display: 'grid', placeItems: 'center', color: t.textFaint }}>
        <Icon name="cog" size={16} />
      </div>
    </div>
  );
};

const MiddleList = ({ theme: t, listType, selectedNodeId, onNodeSelect }) => {
  const expActive = KG_DATA.experiment;
  return (
    <div style={{
      width: 260, flexShrink: 0, background: t.surface, borderRight: `1px solid ${t.border}`,
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Section header */}
      <div style={{ padding: '14px 16px 10px', borderBottom: `1px solid ${t.border}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <div style={{ fontSize: 14, fontWeight: 600 }}>试验</div>
          <div style={{ color: t.textFaint, fontSize: 11 }}>12 项</div>
        </div>
        <div style={{
          marginTop: 8, height: 28, background: t.surfaceAlt, border: `1px solid ${t.border}`,
          borderRadius: 6, display: 'flex', alignItems: 'center', padding: '0 8px', gap: 6,
        }}>
          <Icon name="search" size={12} stroke={t.textFaint}/>
          <span style={{ color: t.textFaint, fontSize: 12 }}>搜索试验、常量、文献…</span>
          <span style={{ marginLeft: 'auto', color: t.textFaint, fontSize: 10,
            border: `1px solid ${t.border}`, borderRadius: 3, padding: '0 4px' }}>⌘K</span>
        </div>
      </div>
      {/* Group headers + items */}
      <div style={{ flex: 1, overflow: 'hidden', padding: '6px 8px' }}>
        <ListGroup t={t} title="基础试验" count={3}>
          <ListItem t={t} active label="基础惯量测定" code="EXP-BI-001" tag="试验" status="已完成"/>
          <ListItem t={t} label="滑行系数测定" code="EXP-CD-002" tag="试验" status="进行中"/>
          <ListItem t={t} label="扭矩校准" code="EXP-TC-003" tag="试验" status="待开始"/>
        </ListGroup>
        <ListGroup t={t} title="工况实验" count={4}>
          <ListItem t={t} label="NEDC 循环" code="EXP-NEDC" tag="工况"/>
          <ListItem t={t} label="WLTC 循环" code="EXP-WLTC" tag="工况"/>
          <ListItem t={t} label="CLTC-P" code="EXP-CLTC" tag="工况"/>
        </ListGroup>
        <ListGroup t={t} title="标定" count={2}>
          <ListItem t={t} label="力传感器零点" code="EXP-ZE-008" tag="标定"/>
          <ListItem t={t} label="编码器分辨率" code="EXP-EN-009" tag="标定"/>
        </ListGroup>
      </div>
    </div>
  );
};

const ListGroup = ({ t, title, count, children }) => (
  <div style={{ marginBottom: 6 }}>
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6,
      padding: '6px 8px', color: t.textMuted, fontSize: 11,
      fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5,
    }}>
      <Icon name="chevron" size={9} stroke={t.textFaint}/>
      <span>{title}</span>
      <span style={{ color: t.textFaint, fontWeight: 400 }}>{count}</span>
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>{children}</div>
  </div>
);

const ListItem = ({ t, label, code, tag, status, active }) => (
  <div style={{
    padding: '8px 10px', borderRadius: 6, display: 'flex', flexDirection: 'column', gap: 3,
    background: active ? t.accentSoft : 'transparent',
    border: active ? `1px solid ${t.accent}33` : '1px solid transparent',
    cursor: 'default',
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{
        width: 6, height: 6, borderRadius: 3,
        background: active ? t.accent : status === '进行中' ? '#f59e0b' : status === '已完成' ? '#10b981' : t.textFaint,
      }}/>
      <span style={{
        fontSize: 13, fontWeight: active ? 600 : 500, color: active ? t.accent : t.text,
      }}>{label}</span>
    </div>
    <div style={{ display: 'flex', gap: 8, fontSize: 11, color: t.textFaint, paddingLeft: 12 }}>
      <span style={{ fontFamily: 'ui-monospace, "JetBrains Mono", monospace' }}>{code}</span>
      {status && <span>· {status}</span>}
    </div>
  </div>
);

const StatusBar = ({ theme: t }) => (
  <div style={{
    height: 24, flexShrink: 0, background: t.surface, borderTop: `1px solid ${t.border}`,
    display: 'flex', alignItems: 'center', padding: '0 12px', gap: 16,
    fontSize: 11, color: t.textMuted,
  }}>
    <span>● 已同步</span>
    <span>图谱 · 38 节点 / 64 关系</span>
    <span style={{ marginLeft: 'auto' }}>UTF-8</span>
    <span>EXP-BI-001</span>
    <span>v 0.4.2-alpha</span>
  </div>
);

// Common pieces shared by variant panels
const NodePanel = ({ t, node, onClose, variant = 'light', dockSide = 'right' }) => {
  if (!node) return null;
  const tk = TYPE_TOKENS[node.type] || TYPE_TOKENS.experiment;
  const accent = `oklch(60% 0.18 ${tk.hue})`;
  const accentSoft = `oklch(96% 0.04 ${tk.hue})`;
  const isDark = t.name === 'dark';
  return (
    <div style={{
      position: 'absolute', top: 20, right: 20, width: 300,
      background: isDark ? 'rgba(20,24,32,0.88)' : 'rgba(255,255,255,0.94)',
      backdropFilter: 'blur(20px) saturate(140%)', WebkitBackdropFilter: 'blur(20px) saturate(140%)',
      border: `1px solid ${t.border}`, borderRadius: 12,
      boxShadow: t.shadow, color: t.text, zIndex: 10,
      display: 'flex', flexDirection: 'column', maxHeight: 'calc(100% - 40px)',
    }}>
      {/* Header */}
      <div style={{
        padding: '12px 14px', borderBottom: `1px solid ${t.border}`,
        display: 'flex', alignItems: 'flex-start', gap: 10,
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8, flexShrink: 0,
          background: isDark ? `oklch(30% 0.10 ${tk.hue})` : accentSoft,
          color: accent, display: 'grid', placeItems: 'center',
          fontWeight: 700, fontSize: 14,
        }}>{tk.initial}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 10, color: t.textFaint, textTransform: 'uppercase', letterSpacing: 0.7 }}>
            {tk.label} · {node.code || node.id}
          </div>
          <div style={{ fontSize: 15, fontWeight: 600, marginTop: 2 }}>{node.name}</div>
        </div>
        <button onClick={onClose} style={{
          width: 22, height: 22, border: 0, background: 'transparent', cursor: 'pointer',
          color: t.textMuted, display: 'grid', placeItems: 'center', borderRadius: 4,
        }}><Icon name="x" size={12}/></button>
      </div>
      {/* Body */}
      <div style={{ padding: 14, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {node.fields?.map((f, i) => (
          <div key={i}>
            <div style={{ fontSize: 10, color: t.textFaint, textTransform: 'uppercase',
              letterSpacing: 0.7, marginBottom: 4 }}>{f.label}</div>
            <div style={{ fontSize: 13, color: t.text, lineHeight: 1.5 }}>{f.value}</div>
          </div>
        ))}
        {node.value && (
          <div style={{
            padding: 12, background: isDark ? 'rgba(255,255,255,0.04)' : t.surfaceAlt,
            border: `1px solid ${t.border}`, borderRadius: 8,
            display: 'flex', alignItems: 'baseline', gap: 6,
          }}>
            <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 22, fontWeight: 600, color: accent }}>
              {node.value}
            </span>
            <span style={{ color: t.textMuted, fontSize: 13 }}>{node.unit}</span>
          </div>
        )}
        {node.upstream && (
          <div>
            <div style={{ fontSize: 10, color: t.textFaint, textTransform: 'uppercase',
              letterSpacing: 0.7, marginBottom: 6 }}>上游 · {node.upstream.length} 项</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {node.upstream.map((u, i) => <RefRow key={i} t={t} item={u} dir="up"/>)}
            </div>
          </div>
        )}
        {node.downstream && (
          <div>
            <div style={{ fontSize: 10, color: t.textFaint, textTransform: 'uppercase',
              letterSpacing: 0.7, marginBottom: 6 }}>下游 · {node.downstream.length} 项</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {node.downstream.map((u, i) => <RefRow key={i} t={t} item={u} dir="down"/>)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const RefRow = ({ t, item, dir }) => {
  const tk = TYPE_TOKENS[item.type] || TYPE_TOKENS.experiment;
  const isDark = t.name === 'dark';
  return (
    <div style={{
      padding: '6px 8px', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 8,
      background: isDark ? 'rgba(255,255,255,0.03)' : '#f8f9fb',
      border: `1px solid ${t.border}`,
    }}>
      <span style={{
        width: 18, height: 18, borderRadius: 4, fontSize: 10, fontWeight: 700,
        display: 'grid', placeItems: 'center',
        background: isDark ? `oklch(30% 0.10 ${tk.hue})` : `oklch(94% 0.04 ${tk.hue})`,
        color: `oklch(55% 0.18 ${tk.hue})`,
      }}>{tk.initial}</span>
      <span style={{ flex: 1, fontSize: 12, color: t.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {item.name}
      </span>
      {item.via && <span style={{ fontSize: 10, color: t.textFaint, fontFamily: 'ui-monospace, monospace' }}>{item.via}</span>}
      <span style={{ color: t.textFaint, transform: dir === 'up' ? 'rotate(180deg)' : 'none' }}>
        <Icon name="chevron" size={9} stroke="currentColor"/>
      </span>
    </div>
  );
};

Object.assign(window, { KG_DATA, TYPE_TOKENS, typeColor, THEMES, Icon, WinShell, NodePanel, RefRow });

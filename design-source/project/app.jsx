// app.jsx — wires the design canvas with 3 artboards + dark/light toggle

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "light",
  "focused": "all"
}/*EDITMODE-END*/;

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const theme = THEMES[t.theme === 'dark' ? 'dark' : 'light'];

  // Title above canvas
  return (
    <>
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, padding: '18px 28px',
        background: 'linear-gradient(180deg, rgba(240,238,233,0.95), rgba(240,238,233,0))',
        zIndex: 50, pointerEvents: 'none',
        fontFamily: '"Segoe UI", -apple-system, "PingFang SC", sans-serif',
      }}>
        <div style={{ fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase',
          color: 'rgba(60,50,40,0.55)', fontWeight: 600 }}>CatGraph · 底盘测功机知识图谱</div>
        <div style={{ fontSize: 22, color: 'rgba(40,30,20,0.9)', fontWeight: 600, marginTop: 2 }}>
          右侧「试验流程区 + 知识图谱区」3 种探索方向
        </div>
        <div style={{ fontSize: 13, color: 'rgba(60,50,40,0.65)', marginTop: 4, maxWidth: 700 }}>
          顶栏菜单、左侧图标导航、中间列表保持你的初始设计;右侧主工作区与浮动节点详情面板做 3 种风格对比。
          示例数据:基础惯量测定 EXP-BI-001。
        </div>
      </div>

      <DesignCanvas>
        <DCSection id="main" title="基础惯量测定 · 三种右侧主区设计"
          subtitle="顶部菜单 + 左侧图标 + 中间列表保持一致 · 右侧工作区差异化探索 · 切换主题在右下角 Tweaks 面板">
          <DCArtboard id="va" label="A · Blueprint Studio  工程图纸"
            width={1480} height={940}>
            <WinShell theme={theme} variant="Blueprint Studio"
              right={<VariantA theme={theme} />}/>
          </DCArtboard>
          <DCArtboard id="vb" label="B · Stellar Map  星图径向"
            width={1480} height={940}>
            <WinShell theme={theme} variant="Stellar Map"
              right={<VariantB theme={theme} />}/>
          </DCArtboard>
          <DCArtboard id="vc" label="C · Data River  溯源河流"
            width={1480} height={940}>
            <WinShell theme={theme} variant="Data River"
              right={<VariantC theme={theme} />}/>
          </DCArtboard>
        </DCSection>
        <DCPostIt top={970} left={60} rotate={-3} width={260}>
          每个变体都打开了浮动节点详情面板 —
          点击图谱里的任意节点都会刷新它的内容,关闭后再点其它节点会重新打开。
        </DCPostIt>
        <DCPostIt top={1010} left={1620} rotate={2.5} width={260}>
          变体 B 左侧 5 步骤时间线是「可拖动的」——
          切换步骤,图谱中会高亮该步骤涉及的常量、设备、结果。
        </DCPostIt>
        <DCPostIt top={1010} left={3160} rotate={-1.5} width={260}>
          变体 C 的「追溯模式」:点击任意节点
          → 上下游全部高亮成河流,其它节点暗化。
          点 I_base 试试看。
        </DCPostIt>
      </DesignCanvas>

      {/* Wrap VariantA with WinShell too */}
      <style>{`
        body { margin: 0; }
        .dc-card { background: #fff !important; }
      `}</style>

      <TweaksPanel title="Tweaks">
        <TweakSection title="主题">
          <TweakRadio label="模式" value={t.theme}
            options={[{value: 'light', label: '浅色'}, {value: 'dark', label: '深色'}]}
            onChange={(v) => setTweak('theme', v)}/>
        </TweakSection>
      </TweaksPanel>
    </>
  );
}

// Hoist VariantA inside WinShell properly by replacing the render above.
// Override the artboard A to include the shell.
// (kept inline by editing component above)

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);

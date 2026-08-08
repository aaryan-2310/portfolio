/** Measured-metrics HUD — identical overlay for every prototype so numbers are comparable. */
export class MetricsHud {
  private fps = 0;
  private el: HTMLElement;
  private body: HTMLElement;
  private rows: Record<string, HTMLElement> = {};
  private flagsEl: HTMLElement;
  private t0 = performance.now();
  firstFrameMs: number | null = null;

  constructor(engine: string, private getDrawCalls: () => number | string) {
    const css = document.createElement('style');
    css.textContent = `
      .hud{position:fixed;left:12px;top:12px;z-index:50;background:rgba(5,6,8,.82);
        border:1px solid #2a2f3b;font:11px/1.8 Consolas,monospace;color:#98a0ac;min-width:210px}
      .hud-title{display:flex;align-items:center;justify-content:space-between;
        padding:8px 12px 4px;cursor:pointer;user-select:none;color:#e8e6e0;letter-spacing:.18em}
      .hud-title:hover{color:#d9a648}
      .hud-toggle{font-size:9px;opacity:.6;margin-left:8px;transition:transform .2s}
      .hud-toggle.open{transform:rotate(180deg)}
      .hud-body{padding:0 12px 10px;overflow:hidden}
      .hud-body.collapsed{display:none}
      .hud b{color:#d9a648;font-weight:400}
      .hud .flag{color:#5d646f}
      .hud .flag.on{color:#7fae8c}
      .hud button{margin-top:6px;background:none;border:1px solid #2a2f3b;color:#98a0ac;
        font:10px Consolas,monospace;letter-spacing:.14em;padding:4px 8px;cursor:pointer}
      .hud button:hover{color:#d9a648;border-color:#7a5e28}`;
    document.head.appendChild(css);

    this.el = document.createElement('div');
    this.el.className = 'hud';

    // Collapsible title bar
    const titleBar = document.createElement('div');
    titleBar.className = 'hud-title';
    titleBar.innerHTML = `<span>${engine} · MEASURED</span><span class="hud-toggle open">▲</span>`;
    this.el.appendChild(titleBar);

    this.body = document.createElement('div');
    this.body.className = 'hud-body';
    this.el.appendChild(this.body);

    titleBar.addEventListener('click', () => {
      const collapsed = this.body.classList.toggle('collapsed');
      titleBar.querySelector<HTMLElement>('.hud-toggle')!.classList.toggle('open', !collapsed);
    });

    document.body.appendChild(this.el);
    for (const k of ['fps', 'frame', 'draws', 'load', 'heap', 'device']) {
      const r = document.createElement('div');
      r.innerHTML = `${k.toUpperCase().padEnd(7, ' ')} <b>—</b>`;
      this.rows[k] = r.querySelector('b')!;
      this.body.appendChild(r);
    }
    this.flagsEl = document.createElement('div');
    this.body.appendChild(this.flagsEl);
  }

  setDevice(d: string) { this.rows['device'].textContent = d; }

  flag(name: string, ok: boolean, note = '') {
    const f = document.createElement('div');
    f.className = 'flag' + (ok ? ' on' : '');
    f.textContent = `${ok ? '●' : '○'} ${name}${note ? ' — ' + note : ''}`;
    this.flagsEl.appendChild(f);
  }

  button(label: string, fn: () => void) {
    const b = document.createElement('button');
    b.textContent = label; b.onclick = fn;
    this.body.appendChild(b);
  }

  /** call once per rendered frame */
  tick(dtMs: number) {
    if (this.firstFrameMs === null) {
      this.firstFrameMs = performance.now() - this.t0;
      this.rows['load'].textContent = this.firstFrameMs.toFixed(0) + ' ms to first frame';
    }
    if (dtMs <= 0 || !Number.isFinite(dtMs)) return;   // guard: a 0-length frame would poison the EMA forever
    this.fps = this.fps ? this.fps * 0.95 + (1000 / dtMs) * 0.05 : 1000 / dtMs;
    if ((performance.now() / 250 | 0) % 2 === 0) {
      this.rows['fps'].textContent = this.fps.toFixed(0);
      this.rows['frame'].textContent = dtMs.toFixed(1) + ' ms';
      this.rows['draws'].textContent = String(this.getDrawCalls());
      const mem = (performance as any).memory;
      if (mem) this.rows['heap'].textContent = (mem.usedJSHeapSize / 1048576).toFixed(0) + ' MB';
    }
  }
}

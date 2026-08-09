import { Component, ElementRef, OnInit, OnDestroy, ViewChild, ViewEncapsulation, inject, signal } from '@angular/core';
import { WorldlineService } from './worldline.service';

@Component({
  selector: 'app-worldline',
  standalone: true,
  template: `
    <canvas #wlCanvas></canvas>
    <button type="button" class="exterior-toggle" [class.active]="exteriorActive()" (click)="onToggleExterior()">
      {{ exteriorActive() ? 'COCKPIT VIEW' : 'EXTERIOR VIEW' }}
    </button>
  `,
  styles: [`
    :host { display: block; width: 100%; height: 100%; position: relative; }
    canvas { display: block; width: 100% !important; height: 100% !important; outline: none; }
    .exterior-toggle {
      position: absolute;
      bottom: 24px;
      right: 24px;
      padding: 10px 18px;
      font-family: monospace;
      font-size: 12px;
      letter-spacing: 0.08em;
      color: #d9a648;
      background: rgba(10, 12, 18, 0.55);
      border: 1px solid rgba(217, 166, 72, 0.4);
      border-radius: 4px;
      -webkit-backdrop-filter: blur(6px);
      backdrop-filter: blur(6px);
      cursor: pointer;
      transition: color 0.2s, border-color 0.2s;
    }
    .exterior-toggle:hover { border-color: rgba(217, 166, 72, 0.8); }
    .exterior-toggle.active {
      color: #5fb8a8;
      border-color: rgba(95, 184, 168, 0.6);
    }
  `],
  encapsulation: ViewEncapsulation.Emulated,
})
export class WorldlineComponent implements OnInit, OnDestroy {
  @ViewChild('wlCanvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

  private readonly wl = inject(WorldlineService);

  readonly exteriorActive = signal(false);

  ngOnInit(): void {
    this.wl.init(this.canvasRef.nativeElement);
  }

  ngOnDestroy(): void {
    this.wl.destroy();
  }

  onToggleExterior(): void {
    this.exteriorActive.set(this.wl.toggleExterior());
  }
}

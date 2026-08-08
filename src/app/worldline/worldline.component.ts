import { Component, ElementRef, OnInit, OnDestroy, ViewChild, ViewEncapsulation, inject } from '@angular/core';
import { WorldlineService } from './worldline.service';

@Component({
  selector: 'app-worldline',
  standalone: true,
  template: `<canvas #wlCanvas></canvas>`,
  styles: [`
    :host { display: block; width: 100%; height: 100%; }
    canvas { display: block; width: 100% !important; height: 100% !important; outline: none; }
  `],
  encapsulation: ViewEncapsulation.Emulated,
})
export class WorldlineComponent implements OnInit, OnDestroy {
  @ViewChild('wlCanvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

  private readonly wl = inject(WorldlineService);

  ngOnInit(): void {
    this.wl.init(this.canvasRef.nativeElement);
  }

  ngOnDestroy(): void {
    this.wl.destroy();
  }
}

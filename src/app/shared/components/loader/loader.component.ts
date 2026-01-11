import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'portfolio-loader',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './loader.component.html',
    styleUrls: ['./loader.component.scss']
})
export class LoaderComponent implements OnInit, OnDestroy {
    @Input() fullscreen = false;

    message = 'Loading...';
    progress = 0;

    private timers: ReturnType<typeof setTimeout>[] = [];
    private interval: ReturnType<typeof setInterval> | undefined;

    ngOnInit() {
        // Initial State
        this.message = 'Loading content...';

        // Stage 1: Cold Start Detection (2s)
        this.timers.push(setTimeout(() => {
            this.message = 'Waking up the server...';
        }, 2000));

        // Stage 2: Education (7s)
        this.timers.push(setTimeout(() => {
            this.message = 'Server is spinning up from cold state...';
        }, 7000));

        // Stage 3: Encouragement (15s)
        this.timers.push(setTimeout(() => {
            this.message = 'Almost there! Thanks for your patience.';
        }, 15000));

        // Mock Progress Bar (just visual feedback that it's not frozen)
        this.interval = setInterval(() => {
            if (this.progress < 90) {
                // Logarithmic-ish slowdown
                const increment = Math.max(0.5, (90 - this.progress) / 50);
                this.progress += increment;
            }
        }, 100);
    }

    ngOnDestroy() {
        this.timers.forEach(t => clearTimeout(t));
        if (this.interval) clearInterval(this.interval);
    }
}

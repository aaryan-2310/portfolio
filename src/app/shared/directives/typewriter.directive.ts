import { Directive, ElementRef, Input, OnDestroy, OnInit, NgZone } from '@angular/core';

@Directive({
    selector: '[portfolioTypewriter]',
    standalone: true
})
export class TypewriterDirective implements OnInit, OnDestroy {
    @Input('portfolioTypewriter') texts: string[] = [];
    @Input() typingSpeed = 100;
    @Input() deletingSpeed = 50;
    @Input() delayBetween = 2000;

    private loopActive = true;
    private currentTextIndex = 0;
    private currentCharIndex = 0;
    private isDeleting = false;
    private timer: any;

    constructor(private el: ElementRef<HTMLInputElement>, private ngZone: NgZone) { }

    ngOnInit() {
        if (this.texts.length > 0) {
            this.ngZone.runOutsideAngular(() => {
                this.typeLoop();
            });
        }
    }

    ngOnDestroy() {
        this.loopActive = false;
        clearTimeout(this.timer);
    }

    private typeLoop() {
        if (!this.loopActive) return;

        const currentText = this.texts[this.currentTextIndex];

        // Determine target string based on state
        const displayText = currentText.substring(0, this.currentCharIndex);
        this.el.nativeElement.setAttribute('placeholder', displayText);

        let nextSpeed = this.typingSpeed;

        if (this.isDeleting) {
            this.currentCharIndex--;
            nextSpeed = this.deletingSpeed;
        } else {
            this.currentCharIndex++;
        }

        // State transitions
        if (!this.isDeleting && this.currentCharIndex === currentText.length + 1) {
            // Finished typing
            this.isDeleting = true;
            nextSpeed = this.delayBetween;
        } else if (this.isDeleting && this.currentCharIndex === 0) {
            // Finished deleting
            this.isDeleting = false;
            this.currentTextIndex = (this.currentTextIndex + 1) % this.texts.length;
            nextSpeed = 500;
        }

        this.timer = setTimeout(() => this.typeLoop(), nextSpeed);
    }
}

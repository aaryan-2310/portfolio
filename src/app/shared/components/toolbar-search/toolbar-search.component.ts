import { Component, ElementRef, EventEmitter, Input, Output, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TypewriterDirective } from '../../directives/typewriter.directive';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'portfolio-toolbar-search',
    standalone: true,
    imports: [CommonModule, TypewriterDirective, FormsModule],
    templateUrl: './toolbar-search.component.html',
    styleUrl: './toolbar-search.component.scss'
})
export class ToolbarSearchComponent implements AfterViewInit, OnDestroy {
    @ViewChild('sentinel') sentinel!: ElementRef;

    // Inputs
    @Input() tags: string[] = [];
    @Input() activeTag: string | null = null;
    @Input() resultCount: number | null = null;
    @Input() placeholderTexts: string[] = ['"Search..."', '"Explore..."'];

    // Outputs
    @Output() searchChange = new EventEmitter<string>();
    @Output() tagChange = new EventEmitter<string | null>();
    @Output() focusChange = new EventEmitter<boolean>();

    // Internal State
    searchQuery = '';
    searchFocused = false;
    searchShake = false;
    isTyping = false;
    isDocked = false;

    private observer: IntersectionObserver | undefined;
    private debounceTimer: any;

    ngAfterViewInit() {
        this.observer = new IntersectionObserver(([entry]) => {
            // docked if scrolled past the trigger line (64px)
            this.isDocked = !entry.isIntersecting && entry.boundingClientRect.top < 100;
        }, { threshold: 0, rootMargin: '-64px 0px 0px 0px' });

        if (this.sentinel) {
            this.observer.observe(this.sentinel.nativeElement);
        }
    }

    ngOnDestroy() {
        this.observer?.disconnect();
    }

    onSearch(event: Event): void {
        const query = (event.target as HTMLInputElement).value;
        this.searchQuery = query;
        this.isTyping = true;

        // Smart Tag Check
        const exactTagMatch = this.tags.find(t => t.toLowerCase() === query.toLowerCase());

        if (exactTagMatch) {
            this.selectTag(exactTagMatch);
            this.searchQuery = '';
            this.searchChange.emit('');
            this.isTyping = false;
            return;
        }

        this.searchChange.emit(query);

        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => this.isTyping = false, 500);
    }

    clearSearch(): void {
        this.searchQuery = '';
        this.searchChange.emit('');
        this.selectTag(null);
    }

    selectTag(tag: string | null): void {
        this.tagChange.emit(tag);
    }

    onFocus(): void {
        this.searchFocused = true;
        this.focusChange.emit(true);
    }

    onBlur(): void {
        setTimeout(() => {
            this.searchFocused = false;
            this.focusChange.emit(false);
        }, 200);
    }

    // Bind to parent if they want to trigger shake externally, or check internal
    triggerShake() {
        this.searchShake = true;
        setTimeout(() => this.searchShake = false, 500);
    }
}

import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { AiService, AiChatResponse } from '../../../core/services/ai.service';

interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

@Component({
    selector: 'portfolio-chat-widget',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './chat-widget.component.html',
    styleUrl: './chat-widget.component.scss'
})
export class ChatWidgetComponent implements OnInit, OnDestroy {
    @ViewChild('messagesContainer') messagesContainer!: ElementRef;
    @ViewChild('messageInput') messageInput!: ElementRef;

    isOpen = false;
    isLoading = false;
    messages: ChatMessage[] = [];
    inputMessage = '';
    suggestions: string[] = [];
    conversationId: string | undefined;

    private destroy$ = new Subject<void>();

    constructor(private aiService: AiService) { }

    ngOnInit(): void {
        this.loadSuggestions();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    toggleChat(): void {
        this.isOpen = !this.isOpen;
        if (this.isOpen && this.messages.length === 0) {
            // Add welcome message on first open
            this.messages.push({
                role: 'assistant',
                content: "👋 Hi! I'm Aryan's AI assistant. Ask me anything about his skills, projects, or experience!",
                timestamp: new Date()
            });
        }
        // Focus input when opened
        setTimeout(() => {
            if (this.isOpen) {
                this.messageInput?.nativeElement?.focus();
            }
        }, 300);
    }

    closeChat(): void {
        this.isOpen = false;
    }

    sendMessage(): void {
        if (!this.inputMessage.trim() || this.isLoading) return;

        const userMessage = this.inputMessage.trim();
        this.inputMessage = '';

        // Add user message
        this.messages.push({
            role: 'user',
            content: userMessage,
            timestamp: new Date()
        });

        this.scrollToBottom();
        this.isLoading = true;

        // Send to AI
        this.aiService.chat({
            message: userMessage,
            conversationId: this.conversationId
        }).pipe(
            takeUntil(this.destroy$)
        ).subscribe({
            next: (response: AiChatResponse) => {
                this.isLoading = false;
                this.conversationId = response.conversationId;

                if (response.error) {
                    this.messages.push({
                        role: 'assistant',
                        content: response.errorMessage || 'Sorry, I encountered an error. Please try again.',
                        timestamp: new Date()
                    });
                } else {
                    this.messages.push({
                        role: 'assistant',
                        content: response.message,
                        timestamp: new Date()
                    });
                    this.suggestions = response.suggestions || [];
                }

                this.scrollToBottom();
            },
            error: () => {
                this.isLoading = false;
                this.messages.push({
                    role: 'assistant',
                    content: 'Sorry, I encountered an error. Please try again.',
                    timestamp: new Date()
                });
                this.scrollToBottom();
            }
        });
    }

    selectSuggestion(suggestion: string): void {
        this.inputMessage = suggestion;
        this.sendMessage();
    }

    onKeydown(event: KeyboardEvent): void {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            this.sendMessage();
        }
    }

    private loadSuggestions(): void {
        this.aiService.getSuggestions().pipe(
            takeUntil(this.destroy$)
        ).subscribe(suggestions => {
            this.suggestions = suggestions;
        });
    }

    private scrollToBottom(): void {
        setTimeout(() => {
            if (this.messagesContainer) {
                const container = this.messagesContainer.nativeElement;
                container.scrollTop = container.scrollHeight;
            }
        }, 100);
    }
}

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Observable, startWith } from 'rxjs';
import { ServiceOffering, ServiceOfferingService } from '../../core/services/service-offering.service';
import { SettingsService, SiteSettings } from '../../core/services/settings.service';
import { SkeletonComponent } from '../../shared/components/skeleton/skeleton.component';
import { ButtonComponent } from '../../shared/button/button.component';
import { RevealOnScrollDirective } from '../../shared/directives/reveal-on-scroll.directive';

@Component({
    selector: 'portfolio-services',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        SkeletonComponent,
        ButtonComponent,
        RevealOnScrollDirective
    ],
    templateUrl: './services.component.html',
    styleUrl: './services.component.scss',
})
export class ServicesComponent {
    services$: Observable<ServiceOffering[] | null>;
    settings$: Observable<SiteSettings | null>;

    // Extended service details for the dedicated page
    readonly serviceDetails: Record<string, { benefits: string[]; deliverables: string[] }> = {
        'Frontend Development': {
            benefits: [
                'Pixel-perfect implementation of designs',
                'Responsive across all devices',
                'Accessible to all users (WCAG compliant)',
                'Optimized for performance'
            ],
            deliverables: [
                'Component library',
                'Responsive layouts',
                'Animation and interactions',
                'Cross-browser testing'
            ]
        },
        'Backend Development': {
            benefits: [
                'Scalable architecture that grows with you',
                'Secure and reliable APIs',
                'Well-documented endpoints',
                'Comprehensive test coverage'
            ],
            deliverables: [
                'RESTful API design',
                'Database architecture',
                'Authentication & authorization',
                'API documentation'
            ]
        },
        'Full Product Delivery': {
            benefits: [
                'End-to-end ownership from concept to launch',
                'Continuous integration and deployment',
                'Production-ready infrastructure',
                'Ongoing maintenance support'
            ],
            deliverables: [
                'CI/CD pipelines',
                'Cloud deployment',
                'Monitoring & logging',
                'Performance optimization'
            ]
        },
        'Developer Tools': {
            benefits: [
                'Streamlined development workflows',
                'Automated testing and quality checks',
                'Efficient build processes',
                'Developer experience focus'
            ],
            deliverables: [
                'Build configuration',
                'Linting & formatting',
                'Git workflows',
                'Development environment setup'
            ]
        }
    };

    readonly processSteps = [
        {
            icon: 'chat',
            title: 'Discovery',
            description: 'We discuss your goals, requirements, and constraints to understand the full picture.'
        },
        {
            icon: 'architecture',
            title: 'Planning',
            description: 'I create a detailed technical plan with milestones and deliverables.'
        },
        {
            icon: 'code',
            title: 'Development',
            description: 'Iterative development with regular check-ins and progress updates.'
        },
        {
            icon: 'rocket_launch',
            title: 'Delivery',
            description: 'Thorough testing, documentation, and handoff with ongoing support.'
        }
    ];

    constructor(
        private serviceOfferingService: ServiceOfferingService,
        private settingsService: SettingsService
    ) {
        this.services$ = this.serviceOfferingService.getServices().pipe(startWith(null));
        this.settings$ = this.settingsService.settings$;
    }

    getDetails(title: string) {
        return this.serviceDetails[title] || { benefits: [], deliverables: [] };
    }

    trackByService = (_: number, s: ServiceOffering) => s.title;
    trackByStep = (_: number, s: { title: string }) => s.title;
}

import { Routes } from '@angular/router';
import { LayoutComponent } from './layout/layout.component';

export const routes: Routes = [
    {
        path: '',
        component: LayoutComponent,
        children: [
            {
                path: '',
                redirectTo: 'home',
                pathMatch: 'full'
            },
            {
                path: 'home',
                title: 'Home',
                data: { description: 'Full-stack engineer for TypeScript/Angular products.' },
                loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent)
            },
            {
                path: 'about',
                title: 'About',
                data: { description: 'About Aryan — experience, values, and approach.' },
                loadComponent: () => import('./pages/about/about.component').then(m => m.AboutComponent)
            },
            {
                path: 'projects',
                title: 'Projects',
                data: { description: 'Selected projects — things designed, built, and shipped.' },
                loadComponent: () => import('./pages/projects/projects.component').then(m => m.ProjectsComponent)
            },
            {
                path: 'career',
                title: 'Professional Experience',
                data: { description: 'Work experience and highlights across roles and companies.' },
                loadComponent: () => import('./pages/work-ex/work-ex.component').then(m => m.WorkExComponent)
            },
            {
                path: '**',
                title: 'Page not found',
                data: { description: 'The page you’re looking for doesn’t exist.' },
                loadComponent: () => import('./pages/not-found/not-found.component').then(m => m.NotFoundComponent)
            }
        ]
    }
];

import { Routes } from '@angular/router';
import { HomeComponent } from './features/home/home/home';
import { authGuard } from './core/guards/auth-guard';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { 
    path: 'auth/login', 
    loadComponent: () => import('./features/auth/login/login').then(m => m.LoginComponent) 
  },
  { 
    path: 'wiki/article/:id', 
    loadComponent: () => import('./features/wiki/article-detail/article-detail').then(m => m.ArticleDetailComponent) 
  },
  { 
    path: 'wiki/nuevo', 
    canActivate: [authGuard],
    loadComponent: () => import('./features/wiki/create-article/create-article').then(m => m.CreateArticleComponent) 
  },
  { path: '**', redirectTo: '' }
];
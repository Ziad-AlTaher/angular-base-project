import { Routes } from '@angular/router';
import { MainLayoutComponent } from './core/layout/main-layout/main-layout';
import { HomeComponent } from './features/home/home';
import { ServicesComponent } from './features/services/services';
import { Auth } from './features/auth/auth';

export const routes: Routes = [
    {
        path: '',
        component: MainLayoutComponent,
        children: [
            { path: '', component: HomeComponent },
            { path: 'contact', component: HomeComponent },
            { path: 'services', component: ServicesComponent }
        ]
    },
    { path: 'auth', component: Auth },
    { path: '**', redirectTo: '' }
];

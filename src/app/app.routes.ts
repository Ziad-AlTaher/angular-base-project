import { Routes } from '@angular/router';
import { MainLayoutComponent } from './core/layout/main-layout/main-layout';
import { HomeComponent } from './features/home/home';
import { ServicesComponent } from './features/services/services';

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
    { path: '**', redirectTo: '' }
];

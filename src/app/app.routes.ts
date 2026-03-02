import { Routes } from '@angular/router';
import { MainLayoutComponent } from './core/layout/main-layout/main-layout';
import { HomeComponent } from './features/home/home';
import { ServicesComponent } from './features/services/services';
import { ShowingDataComponent } from './features/showing-data/showing-data';
import { BookFormComponent } from './features/book-form/book-form';
import { Auth } from './features/auth/auth';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
    {
        path: '',
        component: MainLayoutComponent,
        children: [
            { path: '', component: HomeComponent },
            { path: 'contact', component: HomeComponent },
            { path: 'services', component: ServicesComponent },
            { path: 'showing-data', component: ShowingDataComponent, canActivate: [authGuard] },
            { path: 'showing-data/add', component: BookFormComponent, canActivate: [authGuard] },
            { path: 'showing-data/edit/:id', component: BookFormComponent, canActivate: [authGuard] }
        ]
    },
    { path: 'auth', component: Auth },
    { path: '**', redirectTo: '' }
];


import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login';
import { authGuard } from './auth/auth.guard';

export const routes: Routes = [
    { path: 'login', component: LoginComponent },
    { path: 'dashboard', loadComponent: () => import('./dashboard/dashboard').then(m => m.DashboardComponent), canActivate: [authGuard] },
    { path: 'vehiculos', loadComponent: () => import('./vehiculos/vehiculo-list/vehiculo-list').then(m => m.VehiculoListComponent), canActivate: [authGuard] },
    { path: 'conductores', loadComponent: () => import('./conductores/conductor-list/conductor-list').then(m => m.ConductorListComponent), canActivate: [authGuard] },
    { path: 'rutas', loadComponent: () => import('./rutas/ruta-list/ruta-list').then(m => m.RutaListComponent), canActivate: [authGuard] },
    { path: 'flujo-caja', loadComponent: () => import('./flujo-caja/flujo-caja-form/flujo-caja-form').then(m => m.FlujoCajaFormComponent), canActivate: [authGuard] },
    { path: 'flujo-consolidado', loadComponent: () => import('./flujo-caja/flujo-caja-list/flujo-caja-list').then(m => m.FlujoCajaListComponent), canActivate: [authGuard] },
    { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
    { path: '**', redirectTo: '/dashboard' }
];

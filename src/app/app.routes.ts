import { Routes } from '@angular/router';
import { PerfilListComponent } from './components/perfil-list/perfil-list.component';
import { PerfilFormComponent } from './components/perfil-form/perfil-form.component';
import { LoginComponent } from './components/login/login.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: '', component: PerfilListComponent, canActivate: [authGuard] },
  { path: 'nuevo', component: PerfilFormComponent, canActivate: [authGuard] },
  { path: 'editar/:id', component: PerfilFormComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: '' }
];

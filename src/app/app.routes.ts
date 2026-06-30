import { Routes } from '@angular/router';
import { PerfilListComponent } from './components/perfil-list/perfil-list.component';
import { PerfilFormComponent } from './components/perfil-form/perfil-form.component';
import { VacanteListComponent } from './components/vacante-list/vacante-list.component';
import { VacanteFormComponent } from './components/vacante-form/vacante-form.component';
import { PostulacionListComponent } from './components/postulacion-list/postulacion-list.component';
import { PostulacionFormComponent } from './components/postulacion-form/postulacion-form.component';
import { OfertasPublicasListComponent } from './components/ofertas-publicas-list/ofertas-publicas-list.component';
import { OfertaDetalleComponent } from './components/oferta-detalle/oferta-detalle.component';
import { LoginComponent } from './components/login/login.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  
  // Perfiles de Cargo (Private)
  { path: '', component: PerfilListComponent, canActivate: [authGuard] },
  { path: 'nuevo', component: PerfilFormComponent, canActivate: [authGuard] },
  { path: 'editar/:id', component: PerfilFormComponent, canActivate: [authGuard] },

  // Vacantes (Private)
  { path: 'vacantes', component: VacanteListComponent, canActivate: [authGuard] },
  { path: 'vacantes/nueva', component: VacanteFormComponent, canActivate: [authGuard] },
  { path: 'vacantes/editar/:id', component: VacanteFormComponent, canActivate: [authGuard] },

  // Postulaciones (Private)
  { path: 'postulaciones', component: PostulacionListComponent, canActivate: [authGuard] },
  { path: 'postulaciones/vacante/:vacanteId', component: PostulacionListComponent, canActivate: [authGuard] },

  // Portal Público de Ofertas (Public)
  { path: 'ofertas', component: OfertasPublicasListComponent },
  
  // Detalle de Oferta Público (Public)
  { path: 'oferta/:id', component: OfertaDetalleComponent },

  // Formulario de Postulación Público (Public)
  { path: 'postular/:vacanteId', component: PostulacionFormComponent },

  { path: '**', redirectTo: '' }
];

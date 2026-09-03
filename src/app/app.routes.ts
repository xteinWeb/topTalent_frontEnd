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
import { CandidatoLoginComponent } from './components/login/candidato-login/candidato-login.component';
import { CandidatoRegistroComponent } from './components/login/candidato-registro/candidato-registro.component';
import { CandidatoPerfilComponent } from './components/login/candidato-perfil/candidato-perfil.component';
import { EmpresaPerfilComponent } from './components/empresa-perfil/empresa-perfil.component';
import { authGuard } from './guards/auth.guard';
import { candidatoAuthGuard } from './guards/candidato-auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  
  // Candidato Auth Routes
  { path: 'candidato/login', component: CandidatoLoginComponent },
  { path: 'candidato/registro', component: CandidatoRegistroComponent },
  { path: 'candidato/perfil', component: CandidatoPerfilComponent, canActivate: [candidatoAuthGuard] },
  
  // Portal Público de Ofertas (Public) - Punto de entrada principal
  { path: '', component: OfertasPublicasListComponent },
  { path: 'ofertas', redirectTo: '', pathMatch: 'full' },

  // Detalle de Oferta Público (Public)
  { path: 'oferta/:id', component: OfertaDetalleComponent },

  // Formulario de Postulación Público (Public)
  { path: 'postular/:vacanteId', component: PostulacionFormComponent },

  // Perfiles de Cargo (Private)
  { path: 'dashboard', component: PerfilListComponent, canActivate: [authGuard] },
  { path: 'nuevo', component: PerfilFormComponent, canActivate: [authGuard] },
  { path: 'editar/:id', component: PerfilFormComponent, canActivate: [authGuard] },

  // Vacantes (Private)
  { path: 'vacantes', component: VacanteListComponent, canActivate: [authGuard] },
  { path: 'vacantes/nueva', component: VacanteFormComponent, canActivate: [authGuard] },
  { path: 'vacantes/editar/:id', component: VacanteFormComponent, canActivate: [authGuard] },

  // Postulaciones (Private)
  { path: 'postulaciones', component: PostulacionListComponent, canActivate: [authGuard] },
  { path: 'postulaciones/vacante/:vacanteId', component: PostulacionListComponent, canActivate: [authGuard] },

  // Configuración de Empresa y Credenciales (Private)
  { path: 'empresa/perfil', component: EmpresaPerfilComponent, canActivate: [authGuard] },

  { path: '**', redirectTo: '' }
];

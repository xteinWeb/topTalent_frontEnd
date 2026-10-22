import { Routes } from '@angular/router';
import { PostulacionFormComponent } from './components/postulacion-form/postulacion-form.component';
import { OfertasPublicasListComponent } from './components/ofertas-publicas-list/ofertas-publicas-list.component';
import { OfertaDetalleComponent } from './components/oferta-detalle/oferta-detalle.component';
import { CandidatoLoginComponent } from './components/login/candidato-login/candidato-login.component';
import { CandidatoRegistroComponent } from './components/login/candidato-registro/candidato-registro.component';
import { authGuard } from './guards/auth.guard';
import { candidatoAuthGuard } from './guards/candidato-auth.guard';

// Las rutas públicas se cargan de forma inmediata; las privadas, bajo demanda (lazy loading)
// para reducir el bundle inicial.
export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./components/login/login.component').then(m => m.LoginComponent), data: { seo: { title: 'Acceso empresas', noindex: true } } },

  // Candidato Auth Routes
  { path: 'candidato/login', component: CandidatoLoginComponent, data: { seo: { title: 'Iniciar sesión candidatos', description: 'Ingresa a tu cuenta de candidato en Empleo Artdecon para gestionar tu hoja de vida y tus postulaciones.' } } },
  { path: 'candidato/registro', component: CandidatoRegistroComponent, data: { seo: { title: 'Registro de candidatos', description: 'Crea tu cuenta gratis en Empleo Artdecon, registra tu hoja de vida y postúlate a nuestras ofertas de trabajo.' } } },
  { path: 'candidato/perfil', loadComponent: () => import('./components/login/candidato-perfil/candidato-perfil.component').then(m => m.CandidatoPerfilComponent), canActivate: [candidatoAuthGuard], data: { seo: { noindex: true } } },

  // Portal Público de Ofertas (Public) - Punto de entrada principal
  { path: '', component: OfertasPublicasListComponent, data: { seo: {} } },
  { path: 'ofertas', redirectTo: '', pathMatch: 'full' },

  // Detalle de Oferta Público (Public)
  { path: 'oferta/:id', component: OfertaDetalleComponent, data: { seo: { title: 'Oferta de empleo' } } },

  // Formulario de Postulación Público (Public)
  { path: 'postular/:vacanteId', component: PostulacionFormComponent, data: { seo: { title: 'Postúlate', noindex: true } } },

  // Perfiles de Cargo (Private)
  { path: 'dashboard', loadComponent: () => import('./components/perfil-list/perfil-list.component').then(m => m.PerfilListComponent), canActivate: [authGuard], data: { seo: { noindex: true } } },
  { path: 'nuevo', loadComponent: () => import('./components/perfil-form/perfil-form.component').then(m => m.PerfilFormComponent), canActivate: [authGuard], data: { seo: { noindex: true } } },
  { path: 'editar/:id', loadComponent: () => import('./components/perfil-form/perfil-form.component').then(m => m.PerfilFormComponent), canActivate: [authGuard], data: { seo: { noindex: true } } },

  // Vacantes (Private)
  { path: 'vacantes', loadComponent: () => import('./components/vacante-list/vacante-list.component').then(m => m.VacanteListComponent), canActivate: [authGuard], data: { seo: { noindex: true } } },
  { path: 'vacantes/nueva', loadComponent: () => import('./components/vacante-form/vacante-form.component').then(m => m.VacanteFormComponent), canActivate: [authGuard], data: { seo: { noindex: true } } },
  { path: 'vacantes/editar/:id', loadComponent: () => import('./components/vacante-form/vacante-form.component').then(m => m.VacanteFormComponent), canActivate: [authGuard], data: { seo: { noindex: true } } },

  // Solicitudes de Personal / Requerimientos de Líderes y Autorizaciones TH (Private)
  { path: 'solicitudes-vacantes', loadComponent: () => import('./components/solicitud-vacante-list/solicitud-vacante-list.component').then(m => m.SolicitudVacanteListComponent), canActivate: [authGuard], data: { seo: { noindex: true } } },
  { path: 'solicitudes', redirectTo: 'solicitudes-vacantes', pathMatch: 'full' },

  // Postulaciones (Private)
  { path: 'postulaciones', loadComponent: () => import('./components/postulacion-list/postulacion-list.component').then(m => m.PostulacionListComponent), canActivate: [authGuard], data: { seo: { noindex: true } } },
  { path: 'postulaciones/vacante/:vacanteId', loadComponent: () => import('./components/postulacion-list/postulacion-list.component').then(m => m.PostulacionListComponent), canActivate: [authGuard], data: { seo: { noindex: true } } },

  // Configuración de Empresa y Credenciales (Private)
  { path: 'empresa/perfil', loadComponent: () => import('./components/empresa-perfil/empresa-perfil.component').then(m => m.EmpresaPerfilComponent), canActivate: [authGuard], data: { seo: { noindex: true } } },

  { path: '**', redirectTo: '' }
];

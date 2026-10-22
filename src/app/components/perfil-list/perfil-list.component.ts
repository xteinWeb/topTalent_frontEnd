import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PerfilService, PerfilCargo } from '../../services/perfil.service';
import { VacanteService, Vacante } from '../../services/vacante.service';
import { PostulacionService, Postulacion } from '../../services/postulacion.service';
import { AuthService, UserSession } from '../../services/auth.service';

@Component({
  selector: 'app-perfil-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './perfil-list.component.html',
  styleUrls: ['./perfil-list.component.css']
})
export class PerfilListComponent implements OnInit {
  perfiles: PerfilCargo[] = [];
  filteredPerfiles: PerfilCargo[] = [];
  vacantes: Vacante[] = [];
  postulaciones: Postulacion[] = [];
  pendientesAutorizacion: Vacante[] = [];

  currentUser: UserSession | null = null;
  searchTerm: string = '';
  loading: boolean = true;
  errorMsg: string = '';

  // KPIs
  kpis = {
    totalPerfiles: 0,
    vacantesActivas: 0,
    solicitudesPendientes: 0,
    totalPostulaciones: 0,
    candidatosPreseleccionados: 0,
    candidatosCitados: 0,
    candidatosAprobados: 0,
    tasaConversion: 0
  };

  constructor(
    private perfilService: PerfilService,
    private vacanteService: VacanteService,
    private postulacionService: PostulacionService,
    public authService: AuthService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadAllDashboardData();
  }

  loadAllDashboardData(): void {
    this.loading = true;
    this.errorMsg = '';

    // Load Perfiles
    this.perfilService.getPerfiles().subscribe({
      next: (perfiles) => {
        this.perfiles = perfiles;
        this.filterPerfiles();
        this.kpis.totalPerfiles = perfiles.length;
      },
      error: (err) => console.error('Error cargando perfiles:', err)
    });

    // Load Vacantes
    this.vacanteService.getVacantes().subscribe({
      next: (vacantes) => {
        this.vacantes = vacantes;
        this.kpis.vacantesActivas = vacantes.filter(v => v.estado === 'ACTIVA').length;
      },
      error: (err) => console.error('Error cargando vacantes:', err)
    });

    // Load Solicitudes Pendientes (para Gerencia / HR)
    this.vacanteService.getPendientesAutorizacion().subscribe({
      next: (pendientes) => {
        this.pendientesAutorizacion = pendientes;
        this.kpis.solicitudesPendientes = pendientes.length;
      },
      error: (err) => console.error('Error cargando pendientes:', err)
    });

    // Load Postulaciones & Embudo
    this.postulacionService.getPostulaciones().subscribe({
      next: (postulaciones) => {
        this.postulaciones = postulaciones;
        this.calculateFunnel(postulaciones);
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        console.error('Error cargando postulaciones:', err);
      }
    });
  }

  calculateFunnel(list: Postulacion[]): void {
    this.kpis.totalPostulaciones = list.length;
    this.kpis.candidatosPreseleccionados = list.filter(p =>
      p.estado_postulante === 'Preseleccionado' ||
      p.estado_postulante === 'Citado a Entrevista' ||
      p.estado_postulante === 'Aprobado' ||
      p.estado_postulante === 'Aprobado con reservas'
    ).length;

    this.kpis.candidatosCitados = list.filter(p =>
      p.estado_postulante === 'Citado a Entrevista' ||
      p.estado_postulante === 'Aprobado' ||
      p.estado_postulante === 'Aprobado con reservas'
    ).length;

    this.kpis.candidatosAprobados = list.filter(p =>
      p.estado_postulante === 'Aprobado' ||
      p.estado_postulante === 'Aprobado con reservas'
    ).length;

    if (this.kpis.totalPostulaciones > 0) {
      this.kpis.tasaConversion = Math.round((this.kpis.candidatosAprobados / this.kpis.totalPostulaciones) * 100);
    } else {
      this.kpis.tasaConversion = 0;
    }
  }

  filterPerfiles(): void {
    if (!this.searchTerm.trim()) {
      this.filteredPerfiles = this.perfiles;
      return;
    }

    const term = this.searchTerm.toLowerCase();
    this.filteredPerfiles = this.perfiles.filter(p => 
      p.cargo.toLowerCase().includes(term) || 
      p.area.toLowerCase().includes(term)
    );
  }

  deletePerfil(id: string | undefined): void {
    if (!id) return;
    if (confirm('¿Está seguro de que desea eliminar este perfil de cargo?')) {
      this.perfilService.deletePerfil(id).subscribe({
        next: () => {
          this.loadAllDashboardData();
        },
        error: (err) => {
          alert('Error al eliminar el perfil.');
          console.error(err);
        }
      });
    }
  }
}

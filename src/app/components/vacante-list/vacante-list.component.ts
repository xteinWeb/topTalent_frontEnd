import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { VacanteService, Vacante } from '../../services/vacante.service';
import { PerfilService, PerfilCargo } from '../../services/perfil.service';
import { AuthService, UserSession } from '../../services/auth.service';

@Component({
  selector: 'app-vacante-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './vacante-list.component.html',
  styleUrls: ['./vacante-list.component.css']
})
export class VacanteListComponent implements OnInit {
  vacantes: Vacante[] = [];
  filteredVacantes: Vacante[] = [];
  pendientesAutorizacion: Vacante[] = [];
  solicitudesArea: Vacante[] = [];
  perfiles: PerfilCargo[] = [];

  activeTab: 'activas' | 'autorizaciones' | 'solicitudes' = 'activas';
  searchTerm: string = '';
  loading: boolean = true;
  errorMsg: string = '';
  currentUser: UserSession | null = null;

  // Modal Solicitar Vacante
  showSolicitudModal: boolean = false;
  solicitudSubmitting: boolean = false;
  nuevaSolicitud: {
    perfil_id: string;
    titulo: string;
    tipo_requerimiento: 'NUEVO_CARGO' | 'REEMPLAZO';
    nombre_reemplaza: string;
    seccion_area: string;
    salario_min: number | null;
    salario_max: number | null;
    descripcion: string;
    edad_preferida: string;
    turnos: string;
    observaciones_confidenciales: string;
  } = {
    perfil_id: '',
    titulo: '',
    tipo_requerimiento: 'NUEVO_CARGO',
    nombre_reemplaza: '',
    seccion_area: '',
    salario_min: null,
    salario_max: null,
    descripcion: '',
    edad_preferida: '',
    turnos: 'Diurno',
    observaciones_confidenciales: ''
  };

  // Modal Autorización Gerencia
  showAutorizarModal: boolean = false;
  autorizarSubmitting: boolean = false;
  vacanteParaAutorizar: Vacante | null = null;
  decisionAutorizacion: {
    estado_aprobacion: string;
    observaciones_aprobacion: string;
  } = {
    estado_aprobacion: 'Aprobado',
    observaciones_aprobacion: ''
  };

  constructor(
    private vacanteService: VacanteService,
    private perfilService: PerfilService,
    public authService: AuthService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    if (this.authService.isGerencia() && !this.authService.isTalentoHumano()) {
      this.activeTab = 'autorizaciones';
    } else if (this.authService.isLiderArea()) {
      this.activeTab = 'solicitudes';
    }

    if (this.currentUser?.area) {
      this.nuevaSolicitud.seccion_area = this.currentUser.area;
    }

    this.loadData();
    this.loadPerfiles();
  }

  loadData(): void {
    this.loading = true;
    this.errorMsg = '';

    this.vacanteService.getVacantes().subscribe({
      next: (data) => {
        this.vacantes = data;
        this.filterVacantes();
        this.loading = false;
      },
      error: (err) => {
        this.errorMsg = 'Error al cargar las vacantes.';
        this.loading = false;
        console.error(err);
      }
    });

    if (this.authService.isGerencia() || this.authService.isTalentoHumano() || this.authService.isSuperAdmin()) {
      this.vacanteService.getPendientesAutorizacion().subscribe({
        next: (pendientes) => {
          this.pendientesAutorizacion = pendientes;
        },
        error: (err) => console.error('Error cargando solicitudes pendientes:', err)
      });
    }
  }

  loadPerfiles(): void {
    this.perfilService.getPerfiles().subscribe({
      next: (perfiles) => {
        this.perfiles = perfiles;
      },
      error: (err) => console.error('Error cargando perfiles:', err)
    });
  }

  onPerfilChange(): void {
    const sel = this.perfiles.find(p => p.id === this.nuevaSolicitud.perfil_id);
    if (sel) {
      if (!this.nuevaSolicitud.titulo) {
        this.nuevaSolicitud.titulo = sel.cargo;
      }
      if (!this.nuevaSolicitud.seccion_area) {
        this.nuevaSolicitud.seccion_area = sel.area;
      }
      if (!this.nuevaSolicitud.descripcion && sel.perfil_json?.proposito) {
        this.nuevaSolicitud.descripcion = sel.perfil_json.proposito;
      }
    }
  }

  filterVacantes(): void {
    let list = this.vacantes;

    if (this.activeTab === 'solicitudes') {
      if (this.authService.isLiderArea() && this.currentUser?.id) {
        list = this.vacantes.filter(v => v.solicitado_por_id === this.currentUser?.id || v.seccion_area === this.currentUser?.area);
      } else {
        list = this.vacantes.filter(v => v.solicitado_por_id || v.estado_aprobacion);
      }
    } else if (this.activeTab === 'activas') {
      list = this.vacantes.filter(v => v.estado === 'ACTIVA' || (v.estado === 'INACTIVA' && (!v.estado_aprobacion || v.estado_aprobacion === 'APROBADA' || v.estado_aprobacion === 'Aprobado')));
    }

    if (!this.searchTerm.trim()) {
      this.filteredVacantes = list;
      return;
    }

    const term = this.searchTerm.toLowerCase();
    this.filteredVacantes = list.filter(v => 
      v.titulo.toLowerCase().includes(term) || 
      (v.perfil_cargo && v.perfil_cargo.toLowerCase().includes(term)) ||
      (v.seccion_area && v.seccion_area.toLowerCase().includes(term))
    );
  }

  setTab(tab: 'activas' | 'autorizaciones' | 'solicitudes'): void {
    this.activeTab = tab;
    this.filterVacantes();
  }

  openSolicitudModal(): void {
    this.nuevaSolicitud = {
      perfil_id: '',
      titulo: '',
      tipo_requerimiento: 'NUEVO_CARGO',
      nombre_reemplaza: '',
      seccion_area: this.currentUser?.area || '',
      salario_min: null,
      salario_max: null,
      descripcion: '',
      edad_preferida: '',
      turnos: 'Diurno',
      observaciones_confidenciales: ''
    };
    this.showSolicitudModal = true;
  }

  closeSolicitudModal(): void {
    this.showSolicitudModal = false;
  }

  enviarSolicitudVacante(): void {
    if (!this.nuevaSolicitud.perfil_id || !this.nuevaSolicitud.titulo || !this.nuevaSolicitud.descripcion) {
      alert('Por favor complete los campos obligatorios: Perfil, Título y Justificación/Descripción.');
      return;
    }

    if (this.nuevaSolicitud.tipo_requerimiento === 'REEMPLAZO' && !this.nuevaSolicitud.nombre_reemplaza.trim()) {
      alert('Por favor indique el nombre del colaborador a quien reemplaza este requerimiento.');
      return;
    }

    this.solicitudSubmitting = true;
    const payload = {
      perfil_id: this.nuevaSolicitud.perfil_id,
      titulo: this.nuevaSolicitud.titulo,
      descripcion: this.nuevaSolicitud.descripcion,
      tipo_requerimiento: this.nuevaSolicitud.tipo_requerimiento,
      nombre_reemplaza: this.nuevaSolicitud.tipo_requerimiento === 'REEMPLAZO' ? this.nuevaSolicitud.nombre_reemplaza : undefined,
      seccion_area: this.nuevaSolicitud.seccion_area,
      salario_min: this.nuevaSolicitud.salario_min || undefined,
      salario_max: this.nuevaSolicitud.salario_max || undefined,
      solicitado_por_id: this.currentUser?.id,
      perfil_oculto_json: {
        edad_preferida: this.nuevaSolicitud.edad_preferida,
        turnos: this.nuevaSolicitud.turnos,
        observaciones_confidenciales: this.nuevaSolicitud.observaciones_confidenciales
      }
    };

    this.vacanteService.solicitarVacante(payload).subscribe({
      next: (res) => {
        alert(res.message || 'Solicitud de vacante enviada exitosamente a Gerencia.');
        this.solicitudSubmitting = false;
        this.closeSolicitudModal();
        this.loadData();
      },
      error: (err) => {
        this.solicitudSubmitting = false;
        alert('Error al enviar solicitud: ' + (err.error?.error || err.message));
      }
    });
  }

  openAutorizarModal(vacante: Vacante): void {
    this.vacanteParaAutorizar = vacante;
    this.decisionAutorizacion = {
      estado_aprobacion: 'Aprobado',
      observaciones_aprobacion: vacante.observaciones_aprobacion || ''
    };
    this.showAutorizarModal = true;
  }

  closeAutorizarModal(): void {
    this.showAutorizarModal = false;
    this.vacanteParaAutorizar = null;
  }

  confirmarAutorizacion(): void {
    if (!this.vacanteParaAutorizar?.id) return;

    this.autorizarSubmitting = true;
    this.vacanteService.autorizarVacante(this.vacanteParaAutorizar.id, {
      estado_aprobacion: this.decisionAutorizacion.estado_aprobacion,
      observaciones_aprobacion: this.decisionAutorizacion.observaciones_aprobacion,
      autorizado_por_id: this.currentUser?.id
    }).subscribe({
      next: (res) => {
        alert(res.message || 'Decisión de autorización registrada.');
        this.autorizarSubmitting = false;
        this.closeAutorizarModal();
        this.loadData();
      },
      error: (err) => {
        this.autorizarSubmitting = false;
        alert('Error al registrar autorización: ' + (err.error?.error || err.message));
      }
    });
  }

  activarVacante(vacante: Vacante): void {
    if (!vacante.id) return;
    if (confirm(`¿Desea publicar y activar la vacante "${vacante.titulo}" para recibir postulaciones?`)) {
      this.vacanteService.activarVacante(vacante.id).subscribe({
        next: () => {
          vacante.estado = 'ACTIVA';
          alert('Vacante activada y publicada exitosamente.');
          this.loadData();
        },
        error: (err) => alert('Error al activar vacante: ' + err.message)
      });
    }
  }

  desactivarVacante(vacante: Vacante): void {
    if (!vacante.id) return;
    if (confirm(`¿Desea pausar/desactivar la vacante "${vacante.titulo}"?`)) {
      this.vacanteService.desactivarVacante(vacante.id).subscribe({
        next: () => {
          vacante.estado = 'INACTIVA';
          alert('Vacante desactivada exitosamente.');
          this.loadData();
        },
        error: (err) => alert('Error al desactivar vacante: ' + err.message)
      });
    }
  }

  deleteVacante(id: string | undefined): void {
    if (!id) return;
    if (confirm('¿Está seguro de que desea eliminar esta vacante?')) {
      this.vacanteService.deleteVacante(id).subscribe({
        next: () => {
          this.loadData();
        },
        error: (err) => {
          alert('Error al eliminar la vacante.');
          console.error(err);
        }
      });
    }
  }
}

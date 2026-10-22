import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { VacanteService, Vacante } from '../../services/vacante.service';
import { PerfilService, PerfilCargo } from '../../services/perfil.service';
import { AuthService, UserSession } from '../../services/auth.service';

@Component({
  selector: 'app-solicitud-vacante-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './solicitud-vacante-list.component.html',
  styleUrls: ['./solicitud-vacante-list.component.css']
})
export class SolicitudVacanteListComponent implements OnInit {
  currentUser: UserSession | null = null;
  loading: boolean = true;
  errorMsg: string = '';
  successMsg: string = '';

  // Data
  solicitudes: Vacante[] = [];
  pendientesAutorizacion: Vacante[] = [];
  perfiles: PerfilCargo[] = [];

  // Pestañas (para Talento Humano / Gerencia / Admin)
  activeTab: 'pendientes' | 'mis_solicitudes' | 'todas' = 'pendientes';
  searchTerm: string = '';

  // Modal Solicitar Vacante
  showSolicitudModal: boolean = false;
  solicitudSubmitting: boolean = false;
  solicitudError: string = '';
  nuevaSolicitud = {
    perfil_id: '',
    titulo: '',
    tipo_requerimiento: 'NUEVO_CARGO' as 'NUEVO_CARGO' | 'REEMPLAZO',
    nombre_reemplaza: '',
    seccion_area: '',
    salario_min: null as number | null,
    salario_max: null as number | null,
    descripcion: '',
    edad_preferida: '',
    turnos: 'Diurno',
    observaciones_confidenciales: ''
  };

  // Modal Autorización (Talento Humano / Gerencia)
  showAutorizarModal: boolean = false;
  autorizarSubmitting: boolean = false;
  autorizarError: string = '';
  vacanteParaAutorizar: Vacante | null = null;
  decisionAutorizacion = {
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
    
    // Si es líder de área, su vista por defecto es 'mis_solicitudes'
    if (this.authService.isLiderArea()) {
      this.activeTab = 'mis_solicitudes';
    } else {
      this.activeTab = 'pendientes';
    }

    if (this.currentUser?.area) {
      this.nuevaSolicitud.seccion_area = this.currentUser.area;
    }

    this.loadData();
    this.loadPerfiles();
  }

  loadPerfiles(): void {
    this.perfilService.getPerfiles().subscribe({
      next: (data) => {
        this.perfiles = data;
      },
      error: (err) => {
        console.error('Error al cargar perfiles para solicitud:', err);
      }
    });
  }

  loadData(): void {
    this.loading = true;
    this.errorMsg = '';

    // Si es líder de área, consultar únicamente sus solicitudes
    const solicitadoPorId = this.authService.isLiderArea() ? this.currentUser?.id : undefined;

    this.vacanteService.getVacantes(undefined, solicitadoPorId).subscribe({
      next: (data) => {
        this.solicitudes = data;
        this.loading = false;
      },
      error: (err) => {
        this.errorMsg = 'Error al cargar las solicitudes de vacantes.';
        this.loading = false;
        console.error(err);
      }
    });

    // Si tiene rol de Talento Humano, Gerencia o Superadmin, cargar las pendientes de autorizar
    if (this.authService.isTalentoHumano() || this.authService.isGerencia() || this.authService.isSuperAdmin()) {
      this.vacanteService.getPendientesAutorizacion().subscribe({
        next: (pendientes) => {
          this.pendientesAutorizacion = pendientes;
        },
        error: (err) => {
          console.error('Error al cargar solicitudes pendientes:', err);
        }
      });
    }
  }

  // Filtrado según búsqueda
  get filteredSolicitudes(): Vacante[] {
    let list = this.solicitudes;
    if (this.activeTab === 'mis_solicitudes' && this.currentUser?.id) {
      list = list.filter(v => v.solicitado_por_id === this.currentUser?.id);
    }
    if (!this.searchTerm.trim()) return list;

    const term = this.searchTerm.toLowerCase();
    return list.filter(v =>
      (v.titulo && v.titulo.toLowerCase().includes(term)) ||
      (v.seccion_area && v.seccion_area.toLowerCase().includes(term)) ||
      (v.perfil_cargo && v.perfil_cargo.toLowerCase().includes(term)) ||
      (v.solicitado_por_nombre && v.solicitado_por_nombre.toLowerCase().includes(term))
    );
  }

  // KPIs
  get totalSolicitudes(): number {
    return this.solicitudes.length;
  }

  get totalPendientes(): number {
    return this.pendientesAutorizacion.length || this.solicitudes.filter(s =>
      s.estado_aprobacion === 'PENDIENTE' || s.estado_aprobacion === 'Pendiente'
    ).length;
  }

  get totalAprobadas(): number {
    return this.solicitudes.filter(s =>
      s.estado_aprobacion === 'Aprobado' || s.estado_aprobacion === 'Aprobado con reservas' || s.estado_aprobacion === 'APROBADA'
    ).length;
  }

  get totalObservaciones(): number {
    return this.solicitudes.filter(s =>
      s.estado_aprobacion === 'Con observaciones'
    ).length;
  }

  // Apertura y Guardado de Solicitud de Vacante
  openSolicitudModal(): void {
    this.solicitudError = '';
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

  onPerfilChange(): void {
    if (this.nuevaSolicitud.perfil_id) {
      const selectedPerfil = this.perfiles.find(p => p.id === this.nuevaSolicitud.perfil_id);
      if (selectedPerfil) {
        if (!this.nuevaSolicitud.titulo) {
          this.nuevaSolicitud.titulo = selectedPerfil.cargo;
        }
        if (!this.nuevaSolicitud.seccion_area) {
          this.nuevaSolicitud.seccion_area = selectedPerfil.area;
        }
        if (!this.nuevaSolicitud.descripcion && selectedPerfil.perfil_json?.proposito) {
          this.nuevaSolicitud.descripcion = selectedPerfil.perfil_json.proposito;
        }
      }
    }
  }

  submitSolicitud(): void {
    if (!this.nuevaSolicitud.perfil_id) {
      this.solicitudError = 'Debe seleccionar un perfil de cargo base.';
      return;
    }
    if (!this.nuevaSolicitud.titulo.trim()) {
      this.solicitudError = 'El título de la vacante es obligatorio.';
      return;
    }
    if (this.nuevaSolicitud.tipo_requerimiento === 'REEMPLAZO' && !this.nuevaSolicitud.nombre_reemplaza.trim()) {
      this.solicitudError = 'Indique el nombre de la persona a quien se reemplaza.';
      return;
    }
    if (!this.nuevaSolicitud.descripcion.trim()) {
      this.solicitudError = 'La justificación o descripción del requerimiento es obligatoria.';
      return;
    }

    this.solicitudSubmitting = true;
    this.solicitudError = '';

    const payload: Partial<Vacante> = {
      perfil_id: this.nuevaSolicitud.perfil_id,
      titulo: this.nuevaSolicitud.titulo,
      descripcion: this.nuevaSolicitud.descripcion,
      tipo_requerimiento: this.nuevaSolicitud.tipo_requerimiento,
      nombre_reemplaza: this.nuevaSolicitud.nombre_reemplaza,
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
        this.solicitudSubmitting = false;
        this.showSolicitudModal = false;
        this.successMsg = 'Solicitud de vacante enviada con éxito a Talento Humano.';
        setTimeout(() => this.successMsg = '', 6000);
        this.loadData();
      },
      error: (err) => {
        this.solicitudSubmitting = false;
        this.solicitudError = err.error?.error || 'Error al enviar la solicitud.';
        console.error(err);
      }
    });
  }

  // Apertura y Decisión de Autorización (Talento Humano / Gerencia)
  openAutorizarModal(vacante: Vacante): void {
    this.vacanteParaAutorizar = vacante;
    this.decisionAutorizacion = {
      estado_aprobacion: vacante.estado_aprobacion && vacante.estado_aprobacion !== 'PENDIENTE' 
        ? vacante.estado_aprobacion 
        : 'Aprobado',
      observaciones_aprobacion: vacante.observaciones_aprobacion || ''
    };
    this.autorizarError = '';
    this.showAutorizarModal = true;
  }

  closeAutorizarModal(): void {
    this.showAutorizarModal = false;
    this.vacanteParaAutorizar = null;
  }

  submitAutorizacion(): void {
    if (!this.vacanteParaAutorizar?.id) return;

    this.autorizarSubmitting = true;
    this.autorizarError = '';

    this.vacanteService.autorizarVacante(this.vacanteParaAutorizar.id, {
      estado_aprobacion: this.decisionAutorizacion.estado_aprobacion,
      observaciones_aprobacion: this.decisionAutorizacion.observaciones_aprobacion,
      autorizado_por_id: this.currentUser?.id
    }).subscribe({
      next: () => {
        this.autorizarSubmitting = false;
        this.showAutorizarModal = false;
        this.successMsg = `Solicitud de vacante resuelta como: ${this.decisionAutorizacion.estado_aprobacion}`;
        setTimeout(() => this.successMsg = '', 6000);
        this.loadData();
      },
      error: (err) => {
        this.autorizarSubmitting = false;
        this.autorizarError = err.error?.error || 'Error al procesar la autorización.';
        console.error(err);
      }
    });
  }

  // Activar directamente una vacante aprobada
  activarVacante(vacante: Vacante): void {
    if (!vacante.id) return;
    if (confirm(`¿Desea publicar y activar la vacante "${vacante.titulo}" en el portal de empleo?`)) {
      this.vacanteService.activarVacante(vacante.id).subscribe({
        next: () => {
          vacante.estado = 'ACTIVA';
          this.successMsg = `La vacante "${vacante.titulo}" ha sido publicada exitosamente.`;
          setTimeout(() => this.successMsg = '', 6000);
          this.loadData();
        },
        error: (err) => {
          alert('Error al activar la vacante: ' + (err.error?.error || err.message));
        }
      });
    }
  }
}

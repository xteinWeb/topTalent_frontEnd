import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PostulacionService, Postulacion, CitaEntrevista, EvaluacionEntrevista, CompetenciaEvaluada } from '../../services/postulacion.service';
import { VacanteService, Vacante } from '../../services/vacante.service';
import { AuthService, UserSession } from '../../services/auth.service';
import { EstadoPostulacionService, EstadoPostulacion } from '../../services/estado-postulacion.service';
import { CatalogoService } from '../../services/catalogo.service';
import { PrefiltroPanelComponent } from '../prefiltro-panel/prefiltro-panel.component';
import { EvaluacionCompetenciasComponent } from '../evaluacion-competencias/evaluacion-competencias.component';
import { CompetenciaService, GRUPOS_CARGO } from '../../services/competencia.service';

import { guardarArchivoDescargado } from '../../utils/descargar-archivo';

// Formato de las evaluaciones hechas con la matriz de competencias
const FORMATO_MATRIZ = 'matriz_v1';

// Opción fija al final del catálogo MOTIVO_NO_APROBADO: exige describir el motivo
export const MOTIVO_OTRO = 'Otro';

@Component({
  selector: 'app-postulacion-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, PrefiltroPanelComponent, EvaluacionCompetenciasComponent],
  templateUrl: './postulacion-list.component.html',
  styleUrls: ['./postulacion-list.component.css']
})
export class PostulacionListComponent implements OnInit {
  postulaciones: Postulacion[] = [];
  filteredPostulaciones: Postulacion[] = [];
  vacantes: Vacante[] = [];
  selectedVacanteId: string = '';
  selectedEstadoFilter: string = '';
  searchTerm: string = '';
  loading: boolean = true;
  errorMsg: string = '';
  ejecutandoValidacion: boolean = false;
  validacionErrorMsg: string = '';
  currentUser: UserSession | null = null;

  // Motivos (catálogo de BD + "Otro") y modal que los pide al pasar a un estado que los requiere
  readonly MOTIVO_OTRO = MOTIVO_OTRO;
  motivosNoAprobado: string[] = [];
  motivoModal: { postulacion: Postulacion; estado: string; estadoAnterior?: string; select?: HTMLSelectElement } | null = null;
  motivoSeleccionado = '';
  motivoDetalle = '';
  motivoError = '';
  guardandoMotivo = false;

  // Prueba psicotécnica adjunta en el detalle del candidato
  subiendoPrueba = false;

  // Catálogo de estados del flujo del postulante (tabla estados_postulacion)
  catalogoEstados: EstadoPostulacion[] = [];
  estadosPipeline: EstadoPostulacion[] = [];
  estadosOficiales: string[] = [];

  // Concepto de la entrevista (FOR-TH-001). Es parte de la evaluación y no cambia el estado del postulante.
  // Los valores se conservan como antes para que las evaluaciones guardadas sigan mostrando su concepto.
  readonly conceptosEvaluacion = [
    { valor: 'Aprobado', etiqueta: 'Apto', descripcion: 'Apto para contratación' },
    { valor: 'Aprobado con reservas', etiqueta: 'Apto con reservas', descripcion: 'Apto con plan de inducción específico' },
    { valor: 'Con observaciones', etiqueta: 'En espera / revisión', descripcion: 'Pendiente validación de referencias o pruebas' },
    { valor: 'No aprobado', etiqueta: 'No apto', descripcion: 'No se ajusta al perfil requerido' }
  ];

  // Drawer Slide-over
  drawerOpen: boolean = false;
  drawerCandidate: Postulacion | null = null;
  activeDrawerTab: 'perfil' | 'prefiltro' | 'cita' | 'evaluacion' | 'ia' = 'perfil';

  // Modal / Detail view
  selectedCandidate?: Postulacion;

  // Modal Agendar Entrevista
  showAgendarModal: boolean = false;
  agendandoSubmitting: boolean = false;
  postulacionParaAgendar: Postulacion | null = null;
  datosEntrevista = {
    fecha: '',
    hora: '09:00',
    duracion_minutos: 60,
    modalidad: 'Presencial',
    ubicacion_o_enlace: 'Sede Principal Artdecon (Recepción Talento Humano)',
    entrevistador: '',
    notas: 'Presentar documento de identidad original y soportes académicos.',
    enviar_email: true,
    google_calendar_url: '',
    whatsapp_url: ''
  };

  // Modal Evaluación Psicológica FOR-TH-001
  showEvaluacionModal: boolean = false;
  evaluacionSubmitting: boolean = false;
  postulacionParaEvaluar: Postulacion | null = null;
  datosEvaluacion: EvaluacionEntrevista = {
    impresion_general: '',
    concepto_psicologico: '',
    matriz_competencias: [],
    promedio_competencias: 0,
    disponibilidad_ingreso: 'Inmediata',
    aspiracion_salarial: '',
    decision_final: 'Aprobado',
    evaluador_nombre: '',
    observaciones_adicionales: ''
  };

  // Evaluación por la matriz de competencias del grupo de cargo (las 5 de mayor peso son principales)
  readonly gruposCargo = GRUPOS_CARGO;
  grupoEvaluacion = '';
  competenciasOpcionales: CompetenciaEvaluada[] = [];
  cargandoMatriz = false;
  errorMatriz = '';
  // true = evaluación guardada antes de la matriz (10 factores fijos + STAR): se muestra tal como quedó
  evaluacionLegada = false;

  // Preguntas Metodología STAR (solo se muestran en evaluaciones antiguas)
  respuestasSTAR: { [key: string]: string } = {};
  preguntasSTAR = [
    { id: 'star1', code: 'STAR-1', titulo: 'A. Autoconocimiento, Fortalezas y Oportunidades de Mejora', pregunta: '"Cuéntame un poco sobre ti profesionalmente. ¿Cuáles son tus mayores virtudes y qué aspecto personal estás trabajando para mejorar?"', placeholder: 'Registrar respuesta y observaciones conductuales del entrevistador...' },
    { id: 'star2', code: 'STAR-2', titulo: 'B. Integridad, Ética y Acatar Normas (Valores)', pregunta: '"Describe alguna situación laboral donde tuviste la tentación de omitir un protocolo para terminar más rápido. ¿Qué decisión tomaste y por qué?"', placeholder: 'Registrar respuesta y evidencia de rectitud/ética...' },
    { id: 'star3', code: 'STAR-3', titulo: 'C. Resiliencia, Control Emocional y Manejo del Estrés', pregunta: '"Háblame de un error que hayas cometido en tu trabajo o de un momento de mucha presión. ¿Cómo reaccionaste emocionalmente y cómo lo solucionaste?"', placeholder: 'Registrar respuesta, autocontrol y manejo de frustración...' },
    { id: 'star4', code: 'STAR-4', titulo: 'D. Trabajo en Equipo y Manejo de Conflictos Interpersonales', pregunta: '"Cuéntame una diferencia o desacuerdo que hayas tenido con un compañero o supervisor. ¿Cómo gestionaste la situación?"', placeholder: 'Registrar empatía, diálogo y orientación a la colaboración...' },
    { id: 'star5', code: 'STAR-5', titulo: 'E. Sentido de Propiedad y Compromiso ("Ponerse la Camiseta")', pregunta: '"Menciona un logro del que te sientas muy orgulloso o un momento donde fuiste más allá de tus obligaciones normales para ayudar a la empresa."', placeholder: 'Registrar proactividad, sentido de pertenencia y compromiso...' },
    { id: 'star6', code: 'STAR-6', titulo: 'F. Adaptabilidad y Fit Cultural ARTDECON / Visión de Futuro', pregunta: '"ARTDECON es un entorno dinámico y exigente. ¿En qué tipo de ambiente rindes mejor? ¿Cómo te proyectas profesionalmente a 3-5 años?"', placeholder: 'Registrar adaptabilidad, tolerancia a la exigencia y visión...' }
  ];

  constructor(
    private route: ActivatedRoute,
    private postulacionService: PostulacionService,
    private vacanteService: VacanteService,
    private estadoPostulacionService: EstadoPostulacionService,
    private catalogoService: CatalogoService,
    private competenciaService: CompetenciaService,
    public authService: AuthService
  ) { }

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadEstados();
    this.catalogoService.getByTipo('MOTIVO_NO_APROBADO').subscribe({
      next: (motivos) => this.motivosNoAprobado = [...(motivos || []), MOTIVO_OTRO],
      error: (err) => {
        console.error('Error cargando motivos de no aprobación:', err);
        this.motivosNoAprobado = [MOTIVO_OTRO];
      }
    });
    this.loadVacantes();

    this.route.params.subscribe(params => {
      if (params['vacanteId']) {
        this.selectedVacanteId = params['vacanteId'];
      }
      this.loadPostulaciones();
    });
  }

  loadEstados(): void {
    this.estadoPostulacionService.getEstados().subscribe({
      next: (estados) => {
        this.catalogoEstados = estados || [];
        this.estadosOficiales = this.catalogoEstados.map(e => e.nombre);
        this.estadosPipeline = this.catalogoEstados.filter(e => e.mostrar_en_pipeline);
      },
      error: (err) => {
        console.error('Error al cargar el catálogo de estados:', err);
        this.errorMsg = 'No se pudo cargar el catálogo de estados. Recargue la página.';
      }
    });
  }

  loadVacantes(): void {
    this.vacanteService.getVacantes().subscribe({
      next: (data) => {
        this.vacantes = data;
      },
      error: (err) => {
        console.error('Error al cargar vacantes:', err);
      }
    });
  }

  loadPostulaciones(): void {
    this.loading = true;
    this.errorMsg = '';

    const request$ = this.selectedVacanteId
      ? this.postulacionService.getPostulacionesPorVacante(this.selectedVacanteId)
      : this.postulacionService.getPostulaciones();

    request$.subscribe({
      next: (data) => {
        const parsedData = data.map(item => {
          // Parse JSON if returned as string
          if (item.respuesta_ia && typeof item.respuesta_ia === 'string') {
            try { item.respuesta_ia = JSON.parse(item.respuesta_ia); } catch (e) {}
          }
          if (item.json_analisis_ia && typeof item.json_analisis_ia === 'string') {
            try { item.json_analisis_ia = JSON.parse(item.json_analisis_ia); } catch (e) {}
          }
          if (item.cita_entrevista_json && typeof item.cita_entrevista_json === 'string') {
            try { item.cita_entrevista_json = JSON.parse(item.cita_entrevista_json); } catch (e) {}
          }
          if (item.evaluacion_entrevista_json && typeof item.evaluacion_entrevista_json === 'string') {
            try { item.evaluacion_entrevista_json = JSON.parse(item.evaluacion_entrevista_json); } catch (e) {}
          }
          if (!item.estado_postulante) {
            item.estado_postulante = 'Postulado';
          }
          return item;
        });

        this.postulaciones = parsedData;
        this.filterPostulaciones();
        this.loading = false;
      },
      error: (err) => {
        this.errorMsg = 'Error al obtener la lista de postulaciones. Intente de nuevo.';
        this.loading = false;
        console.error(err);
      }
    });
  }

  filterPostulaciones(): void {
    let list = this.postulaciones;

    if (this.selectedEstadoFilter) {
      list = list.filter(p => p.estado_postulante === this.selectedEstadoFilter);
    }

    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      list = list.filter(p =>
        (p.nombre_completo && p.nombre_completo.toLowerCase().includes(term)) ||
        (p.correo && p.correo.toLowerCase().includes(term)) ||
        (p.telefono && p.telefono.includes(term)) ||
        (p.vacante_titulo && p.vacante_titulo.toLowerCase().includes(term))
      );
    }

    this.filteredPostulaciones = list;
  }

  onVacanteFilterChange(): void {
    this.loadPostulaciones();
  }

  // Estados marcados en el catálogo como "requiere motivo" (Descartado, No aprobó Pruebas, Reserva)
  requiereMotivo(estado?: string | null): boolean {
    return !!this.catalogoEstados.find(e => e.nombre === estado)?.requiere_motivo;
  }

  textoMotivo(p?: Postulacion | null): string {
    if (!p?.motivo_no_aprobado) return '';
    return p.motivo_no_aprobado === MOTIVO_OTRO ? (p.motivo_no_aprobado_detalle || MOTIVO_OTRO) : p.motivo_no_aprobado;
  }

  cambiarEstado(postulacion: Postulacion, nuevoEstado: string, select?: HTMLSelectElement): void {
    if (!postulacion.id || postulacion.estado_postulante === nuevoEstado) return;

    // Los estados que exigen motivo lo piden en un modal antes de guardar
    if (this.requiereMotivo(nuevoEstado)) {
      this.motivoModal = { postulacion, estado: nuevoEstado, estadoAnterior: postulacion.estado_postulante, select };
      this.motivoSeleccionado = '';
      this.motivoDetalle = '';
      this.motivoError = '';
      return;
    }

    this.guardarEstado(postulacion, nuevoEstado, undefined, select);
  }

  private guardarEstado(postulacion: Postulacion, nuevoEstado: string, motivo?: { motivo_no_aprobado: string; motivo_no_aprobado_detalle?: string }, select?: HTMLSelectElement): void {
    this.postulacionService.cambiarEstado(postulacion.id!, nuevoEstado, motivo).subscribe({
      next: () => {
        this.aplicarEstado(postulacion.id!, nuevoEstado, motivo);
        if (this.motivoModal) {
          this.guardandoMotivo = false;
          this.motivoModal = null;
        }
      },
      error: (err) => {
        const mensaje = err.error?.error || err.message;
        if (this.motivoModal) {
          this.guardandoMotivo = false;
          this.motivoError = mensaje;
        } else {
          alert('Error al actualizar estado: ' + mensaje);
          this.revertirSelect(select, postulacion.estado_postulante);
        }
      }
    });
  }

  // Actualiza el estado (y el motivo) en la fila, el detalle abierto y la lista
  private aplicarEstado(id: string, estado: string, motivo?: { motivo_no_aprobado: string; motivo_no_aprobado_detalle?: string }): void {
    const destinos = [this.postulaciones.find(p => p.id === id), this.drawerCandidate?.id === id ? this.drawerCandidate : undefined];
    for (const p of destinos) {
      if (!p) continue;
      p.estado_postulante = estado;
      p.motivo_no_aprobado = motivo?.motivo_no_aprobado || null;
      p.motivo_no_aprobado_detalle = motivo?.motivo_no_aprobado_detalle || null;
    }
  }

  // El <select> ya muestra la opción elegida aunque el modelo no cambió (ngModel de una vía):
  // se devuelve el DOM al estado guardado, que es el que el modelo sigue teniendo
  private revertirSelect(select: HTMLSelectElement | undefined, estado?: string): void {
    if (select && estado !== undefined) {
      select.value = estado;
    }
  }

  confirmarMotivo(): void {
    if (!this.motivoModal) return;
    if (!this.motivoSeleccionado) {
      this.motivoError = 'Seleccione el motivo.';
      return;
    }
    if (this.motivoSeleccionado === MOTIVO_OTRO && !this.motivoDetalle.trim()) {
      this.motivoError = 'Describa el motivo.';
      return;
    }

    this.guardandoMotivo = true;
    this.motivoError = '';
    this.guardarEstado(this.motivoModal.postulacion, this.motivoModal.estado, {
      motivo_no_aprobado: this.motivoSeleccionado,
      motivo_no_aprobado_detalle: this.motivoDetalle.trim() || undefined
    }, this.motivoModal.select);
  }

  cancelarMotivo(): void {
    if (!this.motivoModal) return;
    const { select, estadoAnterior } = this.motivoModal;
    this.motivoModal = null;
    this.revertirSelect(select, estadoAnterior);
  }

  // --- PRUEBA PSICOTÉCNICA ---
  onPruebaSeleccionada(event: Event, postulacion: Postulacion): void {
    const input = event.target as HTMLInputElement;
    const archivo = input.files?.[0];
    input.value = '';
    if (!archivo || !postulacion.id) return;

    if (!archivo.name.toLowerCase().endsWith('.pdf')) {
      alert('La prueba psicotécnica debe adjuntarse en PDF.');
      return;
    }
    if (archivo.size > 10 * 1024 * 1024) {
      alert('El archivo supera el tamaño máximo de 10 MB.');
      return;
    }

    this.subiendoPrueba = true;
    this.postulacionService.subirPruebaPsicotecnica(postulacion.id, archivo).subscribe({
      next: () => {
        this.subiendoPrueba = false;
        const ahora = new Date().toISOString();
        const destinos = [postulacion, this.postulaciones.find(p => p.id === postulacion.id)];
        for (const p of destinos) {
          if (!p) continue;
          p.prueba_psicotecnica_nombre = archivo.name;
          p.prueba_psicotecnica_fecha = ahora;
          p.tiene_prueba_psicotecnica = 1;
        }
      },
      error: (err) => {
        this.subiendoPrueba = false;
        alert('Error al adjuntar la prueba psicotécnica: ' + (err.error?.error || err.message));
      }
    });
  }

  descargarPrueba(postulacion: Postulacion): void {
    if (!postulacion.id) return;
    this.postulacionService.descargarPruebaPsicotecnica(postulacion.id).subscribe({
      next: (res) => guardarArchivoDescargado(res, postulacion.prueba_psicotecnica_nombre || 'prueba_psicotecnica.pdf'),
      error: (err) => alert('Error al descargar la prueba psicotécnica: ' + (err.status === 404 ? 'archivo no encontrado' : err.message))
    });
  }

  // --- DRAWER SLIDE-OVER LOGIC ---
  getInitials(name?: string): string {
    if (!name) return '??';
    const parts = name.trim().split(/\s+/).filter(p => p.length > 0);
    if (parts.length === 0) return '??';
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  getWhatsAppDirectUrl(phone?: string, name?: string): string {
    let cleanPhone = String(phone || '').replace(/\D/g, '');
    if (!cleanPhone) return '';
    if (cleanPhone.length === 10) cleanPhone = `57${cleanPhone}`;
    const msg = `Hola ${name || ''}, te saludamos de Gestión y Talento Humano de Artdecon.`;
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
  }

  openDrawer(postulacion: Postulacion, tab: 'perfil' | 'cita' | 'evaluacion' | 'ia' = 'perfil'): void {
    this.drawerCandidate = postulacion;
    this.activeDrawerTab = tab;
    this.drawerOpen = true;

    this.initAgendarData(postulacion);
    this.initEvaluacionData(postulacion);
  }

  closeDrawer(): void {
    this.drawerOpen = false;
    this.drawerCandidate = null;
  }

  setActiveDrawerTab(tab: 'perfil' | 'prefiltro' | 'cita' | 'evaluacion' | 'ia'): void {
    this.activeDrawerTab = tab;
  }

  onResultadoPrefiltro(postulacion: Postulacion, resultado: string | null): void {
    for (const p of [postulacion, this.postulaciones.find(x => x.id === postulacion.id)]) {
      if (p) p.prefiltro_json = { ...(p.prefiltro_json || {}), resultado };
    }
  }

  get drawerVacante(): Vacante | undefined {
    if (!this.drawerCandidate?.vacante_id) return undefined;
    return this.vacantes.find(v => v.id === this.drawerCandidate?.vacante_id);
  }

  // --- AGENDAMIENTO DE ENTREVISTAS ---
  initAgendarData(postulacion: Postulacion): void {
    this.postulacionParaAgendar = postulacion;
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];

    const currentCita = postulacion.cita_entrevista_json;
    this.datosEntrevista = {
      fecha: currentCita?.fecha || dateStr,
      hora: currentCita?.hora || '09:00',
      duracion_minutos: currentCita?.duracion_minutos || 60,
      modalidad: currentCita?.modalidad || 'Presencial',
      ubicacion_o_enlace: currentCita?.ubicacion_o_enlace || 'Sede Principal Artdecon (Recepción Talento Humano)',
      entrevistador: currentCita?.entrevistador || this.currentUser?.nombre || 'Gestión y Talento Humano',
      notas: currentCita?.notas || 'Presentar documento de identidad original y soportes académicos.',
      enviar_email: true,
      google_calendar_url: currentCita?.google_calendar_url || '',
      whatsapp_url: currentCita?.whatsapp_url || ''
    };

    this.updatePreviewLinks();
  }

  openAgendarModal(postulacion: Postulacion): void {
    this.initAgendarData(postulacion);
    this.showAgendarModal = true;
  }

  closeAgendarModal(): void {
    this.showAgendarModal = false;
    this.postulacionParaAgendar = null;
  }

  updatePreviewLinks(): void {
    const target = this.drawerCandidate || this.postulacionParaAgendar;
    if (!target || !this.datosEntrevista.fecha || !this.datosEntrevista.hora) return;

    const [year, month, day] = this.datosEntrevista.fecha.split('-').map(Number);
    const [hours, minutes] = this.datosEntrevista.hora.split(':').map(Number);
    const start = new Date(year, month - 1, day, hours, minutes);
    const end = new Date(start.getTime() + (this.datosEntrevista.duracion_minutos || 60) * 60000);

    const pad = (n: number) => String(n).padStart(2, '0');
    const formatGCal = (d: Date) => `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;

    const title = `Entrevista - ${target.vacante_titulo || 'Artdecon'}: ${target.nombre_completo}`;
    const details = `Entrevista para el cargo de ${target.vacante_titulo}.\nModalidad: ${this.datosEntrevista.modalidad}\nEntrevistador: ${this.datosEntrevista.entrevistador}\nNotas: ${this.datosEntrevista.notas}`;
    const loc = this.datosEntrevista.ubicacion_o_enlace || 'Sede Artdecon';

    this.datosEntrevista.google_calendar_url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${formatGCal(start)}/${formatGCal(end)}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(loc)}`;

    let cleanPhone = String(target.telefono || '').replace(/\D/g, '');
    if (cleanPhone.length === 10) cleanPhone = `57${cleanPhone}`;
    const msg = `Hola ${target.nombre_completo}, te saludamos de Gestión y Talento Humano de Artdecon. Te confirmamos tu citación a entrevista para la vacante *${target.vacante_titulo}* el día *${this.datosEntrevista.fecha}* a las *${this.datosEntrevista.hora}* (Modalidad: *${this.datosEntrevista.modalidad}*). Lugar/Enlace: ${this.datosEntrevista.ubicacion_o_enlace}. Por favor confírmanos tu asistencia. ¡Muchos éxitos!`;
    this.datosEntrevista.whatsapp_url = cleanPhone ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}` : '';
  }

  confirmarAgendamiento(): void {
    const target = this.drawerCandidate || this.postulacionParaAgendar;
    if (!target?.id) return;

    this.agendandoSubmitting = true;
    const payload = {
      ...this.datosEntrevista,
      candidato_nombre: target.nombre_completo,
      candidato_correo: target.correo,
      candidato_telefono: target.telefono,
      vacante_titulo: target.vacante_titulo
    };

    this.postulacionService.agendarEntrevista(target.id, payload).subscribe({
      next: (res) => {
        // Agendar no cambia el estado: Talento Humano lo pasa a mano (p. ej. a "Entrevista TH Agendada")
        alert(res.message || 'Entrevista agendada exitosamente.');
        target.cita_entrevista_json = res.data?.appointment;

        const inList = this.postulaciones.find(p => p.id === target.id);
        if (inList) {
          inList.cita_entrevista_json = res.data?.appointment;
        }

        this.agendandoSubmitting = false;
        this.closeAgendarModal();
      },
      error: (err) => {
        this.agendandoSubmitting = false;
        alert('Error al agendar entrevista: ' + (err.error?.error || err.message));
      }
    });
  }

  // --- EVALUACIÓN PSICOLÓGICA Y ENTREVISTA (FOR-TH-001) ---
  initEvaluacionData(postulacion: Postulacion): void {
    this.postulacionParaEvaluar = postulacion;
    const prevEval = postulacion.evaluacion_entrevista_json;

    // Evaluaciones guardadas antes de la matriz (10 factores fijos + STAR) se muestran tal como quedaron
    this.evaluacionLegada = !!prevEval?.matriz_competencias?.length && prevEval.formato !== FORMATO_MATRIZ;
    this.competenciasOpcionales = [];
    this.errorMatriz = '';
    this.grupoEvaluacion = prevEval?.grupo_cargo || postulacion.perfil_grupo_cargo || '';

    this.datosEvaluacion = {
      impresion_general: prevEval?.impresion_general || '',
      concepto_psicologico: prevEval?.concepto_psicologico || '',
      matriz_competencias: this.evaluacionLegada || prevEval?.formato === FORMATO_MATRIZ ? [...(prevEval?.matriz_competencias || [])] : [],
      promedio_competencias: prevEval?.promedio_competencias || 0,
      formato: this.evaluacionLegada ? prevEval?.formato : FORMATO_MATRIZ,
      grupo_cargo: this.grupoEvaluacion || undefined,
      disponibilidad_ingreso: prevEval?.disponibilidad_ingreso || 'Inmediata',
      aspiracion_salarial: prevEval?.aspiracion_salarial || '',
      decision_final: prevEval?.decision_final || postulacion.estado_postulante || 'Aprobado',
      evaluador_nombre: prevEval?.evaluador_nombre || this.currentUser?.nombre || 'Gestión y Talento Humano',
      observaciones_adicionales: prevEval?.observaciones_adicionales || '',
      fortalezas_clave: prevEval?.fortalezas_clave || '',
      oportunidades_mejora: prevEval?.oportunidades_mejora || '',
      ajuste_cultural: prevEval?.ajuste_cultural || '',
      respuestas_star: prevEval?.respuestas_star || {},
      motivo_no_aprobado: postulacion.motivo_no_aprobado || '',
      motivo_no_aprobado_detalle: postulacion.motivo_no_aprobado_detalle || ''
    };

    this.respuestasSTAR = { ...(prevEval?.respuestas_star || {}) };
    this.calcularPromedioCompetencias();
    if (!this.evaluacionLegada) {
      this.cargarCompetenciasMatriz(prevEval?.formato === FORMATO_MATRIZ);
    }
  }

  // Trae de la matriz las competencias del grupo del cargo: las principales entran a la evaluación y el resto
  // queda como opcional. Si la evaluación ya existía, se conservan sus calificaciones y solo se recalculan las opcionales.
  cargarCompetenciasMatriz(conservarGuardadas = false): void {
    this.competenciasOpcionales = [];
    if (!this.grupoEvaluacion) {
      this.datosEvaluacion.matriz_competencias = [];
      this.calcularPromedioCompetencias();
      return;
    }

    this.cargandoMatriz = true;
    this.errorMatriz = '';
    this.competenciaService.getParaEntrevista(this.grupoEvaluacion).subscribe({
      next: (res) => {
        this.cargandoMatriz = false;
        const items: CompetenciaEvaluada[] = res.competencias.map(c => ({
          competencia_id: c.id,
          competencia: c.nombre,
          categoria: c.categoria,
          definicion: c.definicion,
          pregunta: c.pregunta_seleccion,
          conductas: c.conductas_observables,
          criterio: c.criterio_evaluacion,
          nivel_requerido: c.nivel_requerido,
          peso: c.peso,
          principal: c.principal,
          puntuacion: null,
          observaciones: ''
        }));

        if (conservarGuardadas && this.datosEvaluacion.matriz_competencias?.length) {
          const ya = new Set(this.datosEvaluacion.matriz_competencias.map(m => m.competencia_id));
          this.competenciasOpcionales = items.filter(i => !ya.has(i.competencia_id));
        } else {
          this.datosEvaluacion.matriz_competencias = items.filter(i => i.principal);
          this.competenciasOpcionales = items.filter(i => !i.principal);
        }
        this.datosEvaluacion.grupo_cargo = this.grupoEvaluacion;
        this.calcularPromedioCompetencias();
      },
      error: (err) => {
        this.cargandoMatriz = false;
        this.errorMatriz = err.error?.error || 'No se pudo cargar la matriz de competencias.';
      }
    });
  }

  cambiarGrupoEvaluacion(grupo: string): void {
    const calificadas = (this.datosEvaluacion.matriz_competencias || []).some(c => c.puntuacion);
    if (calificadas && !confirm('Cambiar el grupo de cargo reinicia las calificaciones de esta evaluación. ¿Continuar?')) {
      return;
    }
    this.grupoEvaluacion = grupo;
    this.cargarCompetenciasMatriz(false);
  }

  agregarCompetenciaOpcional(item: CompetenciaEvaluada): void {
    this.datosEvaluacion.matriz_competencias = [...(this.datosEvaluacion.matriz_competencias || []), item];
    this.competenciasOpcionales = this.competenciasOpcionales.filter(o => o !== item);
    this.calcularPromedioCompetencias();
  }

  quitarCompetenciaOpcional(item: CompetenciaEvaluada): void {
    this.datosEvaluacion.matriz_competencias = (this.datosEvaluacion.matriz_competencias || []).filter(c => c !== item);
    item.puntuacion = null;
    item.observaciones = '';
    this.competenciasOpcionales = [...this.competenciasOpcionales, item].sort((a, b) => (b.peso || 0) - (a.peso || 0));
    this.calcularPromedioCompetencias();
  }

  openEvaluacionModal(postulacion: Postulacion): void {
    this.initEvaluacionData(postulacion);
    this.showEvaluacionModal = true;
  }

  closeEvaluacionModal(): void {
    this.showEvaluacionModal = false;
    this.postulacionParaEvaluar = null;
  }

  setRating(comp: CompetenciaEvaluada, score: number): void {
    comp.puntuacion = score;
    this.calcularPromedioCompetencias();
  }

  // Con la matriz: promedio ponderado por el peso del grupo sobre las competencias calificadas.
  // Evaluaciones antiguas: promedio simple, como se calculaba antes.
  calcularPromedioCompetencias(): void {
    const list = this.datosEvaluacion.matriz_competencias || [];
    const calificadas = list.filter(c => Number(c.puntuacion) > 0);
    this.datosEvaluacion.brechas = calificadas.filter(c => c.nivel_requerido !== undefined && Number(c.puntuacion) < c.nivel_requerido).length;

    if (calificadas.length === 0) {
      this.datosEvaluacion.promedio_competencias = 0;
      return;
    }
    if (calificadas.every(c => c.peso !== undefined)) {
      const pesoTotal = calificadas.reduce((acc, c) => acc + (c.peso || 0), 0);
      const suma = calificadas.reduce((acc, c) => acc + (c.peso || 0) * Number(c.puntuacion), 0);
      this.datosEvaluacion.promedio_competencias = pesoTotal > 0 ? Math.round((suma / pesoTotal) * 10) / 10 : 0;
      return;
    }
    const sum = calificadas.reduce((acc, c) => acc + Number(c.puntuacion), 0);
    this.datosEvaluacion.promedio_competencias = Math.round((sum / calificadas.length) * 10) / 10;
  }

  get competenciasSinCalificar(): number {
    return (this.datosEvaluacion.matriz_competencias || []).filter(c => c.principal && !c.puntuacion).length;
  }

  guardarEvaluacionEntrevista(): void {
    const target = this.drawerCandidate || this.postulacionParaEvaluar;
    if (!target?.id) return;

    if (!this.evaluacionLegada) {
      if (!this.grupoEvaluacion) {
        alert('Seleccione el grupo de cargo para evaluar con la matriz de competencias.');
        return;
      }
      if (this.competenciasSinCalificar > 0) {
        alert(`Califique las ${this.competenciasSinCalificar} competencia(s) principal(es) pendiente(s).`);
        return;
      }
    }

    // El concepto de la entrevista no mueve el estado ni pide motivo (eso se hace al cambiar el estado)
    delete this.datosEvaluacion.motivo_no_aprobado;
    delete this.datosEvaluacion.motivo_no_aprobado_detalle;

    this.evaluacionSubmitting = true;
    this.datosEvaluacion.respuestas_star = { ...this.respuestasSTAR };
    this.postulacionService.guardarEvaluacion(target.id, this.datosEvaluacion).subscribe({
      next: (res) => {
        alert(res.message || 'Evaluación de entrevista guardada exitosamente.');
        target.evaluacion_entrevista_json = res.data;

        const inList = this.postulaciones.find(p => p.id === target.id);
        if (inList) {
          inList.evaluacion_entrevista_json = res.data;
        }

        this.evaluacionSubmitting = false;
        this.closeEvaluacionModal();
      },
      error: (err) => {
        this.evaluacionSubmitting = false;
        alert('Error al guardar evaluación: ' + (err.error?.error || err.message));
      }
    });
  }

  // --- DETALLES Y ACCIONES GENERALES ---
  viewDetails(postulacion: Postulacion): void {
    this.selectedCandidate = postulacion;
  }

  closeDetails(): void {
    this.selectedCandidate = undefined;
  }

  cleanText(val: any): string {
    if (val === undefined || val === null) return '';
    const str = String(val).trim();
    if (!str || str.toLowerCase().split(/\s+/).every(w => w === 'undefined' || w === 'de')) return '';
    return str;
  }

  downloadResume(filename: string | undefined): void {
    if (!filename) return;
    this.postulacionService.descargarHojaVida(filename).subscribe({
      next: (res) => guardarArchivoDescargado(res, filename),
      error: (err) => alert('Error al descargar la hoja de vida: ' + (err.status === 404 ? 'archivo no encontrado' : err.message))
    });
  }

  downloadHojaVidaCorporativa(postulacion: Postulacion): void {
    if (!postulacion.candidato_id) return;
    this.postulacionService.descargarHojaVidaCorporativa(
      postulacion.candidato_id,
      postulacion.vacante_titulo || '',
      postulacion.fecha_postulacion || ''
    ).subscribe({
      next: (res) => guardarArchivoDescargado(res, 'HOJA_DE_VIDA.docx'),
      error: (err) => alert('Error al generar la hoja de vida corporativa: ' + err.message)
    });
  }

  ejecutarValidacion(): void {
    if (!this.selectedVacanteId || this.ejecutandoValidacion) return;

    this.ejecutandoValidacion = true;
    this.validacionErrorMsg = '';

    this.postulacionService.ejecutarValidacion(this.selectedVacanteId).subscribe({
      next: () => {
        this.ejecutandoValidacion = false;
        this.loadPostulaciones();
      },
      error: (err) => {
        this.ejecutandoValidacion = false;
        this.validacionErrorMsg = 'Error al ejecutar la validación: ' + (err.error?.error || err.message);
        console.error(err);
      }
    });
  }

  // Contadores para KPIs rápidos
  getCountByEstado(estado: string): number {
    return this.postulaciones.filter(p => p.estado_postulante === estado).length;
  }

  toggleEstadoFilter(estadoNombre: string): void {
    if (this.selectedEstadoFilter === estadoNombre) {
      this.selectedEstadoFilter = '';
    } else {
      this.selectedEstadoFilter = estadoNombre;
    }
    this.filterPostulaciones();
  }

  getEstadoBadgeStyle(nombreEstado: string | undefined): { [key: string]: string } {
    if (!nombreEstado) return {};
    const found = this.catalogoEstados.find(
      e => e.nombre.trim().toLowerCase() === nombreEstado.trim().toLowerCase()
    );
    if (found && found.color_texto && found.color_fondo) {
      return {
        'color': found.color_texto,
        'background-color': found.color_fondo,
        'border-color': found.color_borde || found.color_texto
      };
    }
    return {};
  }
}

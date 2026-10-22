import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PostulacionService, Postulacion, CitaEntrevista, EvaluacionEntrevista, CompetenciaEvaluada } from '../../services/postulacion.service';
import { VacanteService, Vacante } from '../../services/vacante.service';
import { AuthService, UserSession } from '../../services/auth.service';
import { EstadoPostulacionService, EstadoPostulacion } from '../../services/estado-postulacion.service';

@Component({
  selector: 'app-postulacion-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
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

  // Catálogo dinámico de estados desde BD
  catalogoEstados: EstadoPostulacion[] = [
    { nombre: 'Postulado', icono: '📥', color_texto: '#1d4ed8', color_fondo: '#eff6ff', color_borde: '#bfdbfe', mostrar_en_pipeline: true, es_decision_final: false },
    { nombre: 'Preseleccionado', icono: '⭐', color_texto: '#7e22ce', color_fondo: '#faf5ff', color_borde: '#e9d5ff', mostrar_en_pipeline: true, es_decision_final: false },
    { nombre: 'Citado a Entrevista', icono: '📅', color_texto: '#b45309', color_fondo: '#fffbeb', color_borde: '#fde68a', mostrar_en_pipeline: true, es_decision_final: false },
    { nombre: 'Aprobado', icono: '🟢', color_texto: '#15803d', color_fondo: '#f0fdf4', color_borde: '#bbf7d0', mostrar_en_pipeline: true, es_decision_final: true, descripcion: 'Apto para contratación' },
    { nombre: 'Aprobado con reservas', icono: '🟡', color_texto: '#0f766e', color_fondo: '#f0fdfa', color_borde: '#99f6e4', mostrar_en_pipeline: false, es_decision_final: true, descripcion: 'Apto con plan de inducción específico' },
    { nombre: 'Con observaciones', icono: '🟠', color_texto: '#c2410c', color_fondo: '#fff7ed', color_borde: '#fed7aa', mostrar_en_pipeline: false, es_decision_final: true, descripcion: 'Pendiente validación de referencias o pruebas' },
    { nombre: 'No aprobado', icono: '🔴', color_texto: '#b91c1c', color_fondo: '#fef2f2', color_borde: '#fecaca', mostrar_en_pipeline: false, es_decision_final: true, descripcion: 'No se ajusta al perfil requerido' }
  ];
  estadosPipeline: EstadoPostulacion[] = [
    { nombre: 'Postulado', icono: '📥', color_texto: '#1d4ed8', color_fondo: '#eff6ff', color_borde: '#bfdbfe', mostrar_en_pipeline: true },
    { nombre: 'Preseleccionado', icono: '⭐', color_texto: '#7e22ce', color_fondo: '#faf5ff', color_borde: '#e9d5ff', mostrar_en_pipeline: true },
    { nombre: 'Citado a Entrevista', icono: '📅', color_texto: '#b45309', color_fondo: '#fffbeb', color_borde: '#fde68a', mostrar_en_pipeline: true },
    { nombre: 'Aprobado', icono: '🟢', color_texto: '#15803d', color_fondo: '#f0fdf4', color_borde: '#bbf7d0', mostrar_en_pipeline: true }
  ];
  estadosDecision: EstadoPostulacion[] = [
    { nombre: 'Aprobado', icono: '🟢', descripcion: 'Apto para contratación' },
    { nombre: 'Aprobado con reservas', icono: '🟡', descripcion: 'Apto con plan de inducción específico' },
    { nombre: 'Con observaciones', icono: '🟠', descripcion: 'Pendiente validación de referencias o pruebas' },
    { nombre: 'No aprobado', icono: '🔴', descripcion: 'No se ajusta al perfil requerido' }
  ];

  // Nombres de estados para filtros/selects
  estadosOficiales: string[] = [
    'Postulado',
    'Preseleccionado',
    'Citado a Entrevista',
    'Aprobado',
    'Aprobado con reservas',
    'No aprobado',
    'Con observaciones'
  ];

  // Drawer Slide-over
  drawerOpen: boolean = false;
  drawerCandidate: Postulacion | null = null;
  activeDrawerTab: 'perfil' | 'cita' | 'evaluacion' | 'ia' = 'perfil';

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

  // 10 Factores de Evaluación Cuantitativa Oficiales (FOR-TH-001)
  competenciasBase: Array<{ id: string; competencia: string; definicion: string }> = [
    { id: 'f1', competencia: '1. Presentación, Actitud y Postura', definicion: 'Aseo personal, lenguaje corporal y cortesía' },
    { id: 'f2', competencia: '2. Comunicación y Fluidez Verbal', definicion: 'Articulación de ideas, claridad y vocabulario' },
    { id: 'f3', competencia: '3. Seguridad, Autocontrol y Manejo de Nervios', definicion: 'Confianza en sí mismo y entereza' },
    { id: 'f4', competencia: '4. Puntualidad y Cumplimiento', definicion: 'Asistencia a tiempo a la convocatoria' },
    { id: 'f5', competencia: '5. Integridad y Rectitud (Valores)', definicion: 'Alineación ética, apego a normas y honestidad' },
    { id: 'f6', competencia: '6. Relaciones Interpersonales y Trabajo en Equipo', definicion: 'Empatía, capacidad colaborativa y cordialidad' },
    { id: 'f7', competencia: '7. Resiliencia y Tolerancia a la Frustración', definicion: 'Manejo del estrés y superación de errores' },
    { id: 'f8', competencia: '8. Sentido de Propiedad (\'Ponerse la Camiseta\')', definicion: 'Compromiso, proactividad y entrega' },
    { id: 'f9', competencia: '9. Adaptabilidad y Fit Cultural ARTDECON', definicion: 'Alineación a los valores y dinamismo de la empresa' },
    { id: 'f10', competencia: '10. Organización y Atención al Detalle', definicion: 'Estructura mental, análisis y cuidado de procesos' }
  ];

  // Preguntas Metodología STAR oficiales
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
    public authService: AuthService
  ) { }

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadEstados();
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
        if (estados && estados.length > 0) {
          this.catalogoEstados = estados;
          this.estadosOficiales = estados.map(e => e.nombre);
          this.estadosPipeline = estados.filter(e => e.mostrar_en_pipeline);
          this.estadosDecision = estados.filter(e => e.es_decision_final);
        }
      },
      error: (err) => {
        console.warn('Error al cargar catálogo de estados desde BD, se usan predeterminados:', err);
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

  cambiarEstado(postulacion: Postulacion, nuevoEstado: string): void {
    if (!postulacion.id || postulacion.estado_postulante === nuevoEstado) return;

    this.postulacionService.cambiarEstado(postulacion.id, nuevoEstado).subscribe({
      next: () => {
        postulacion.estado_postulante = nuevoEstado;
        if (this.drawerCandidate && this.drawerCandidate.id === postulacion.id) {
          this.drawerCandidate.estado_postulante = nuevoEstado;
        }
      },
      error: (err) => {
        alert('Error al actualizar estado: ' + err.message);
      }
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

  setActiveDrawerTab(tab: 'perfil' | 'cita' | 'evaluacion' | 'ia'): void {
    this.activeDrawerTab = tab;
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
        alert(res.message || 'Entrevista agendada exitosamente.');
        target.estado_postulante = 'Citado a Entrevista';
        target.cita_entrevista_json = res.data?.appointment;
        
        const inList = this.postulaciones.find(p => p.id === target.id);
        if (inList) {
          inList.estado_postulante = 'Citado a Entrevista';
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

    let matrix: CompetenciaEvaluada[] = [];
    if (prevEval?.matriz_competencias && prevEval.matriz_competencias.length >= 10) {
      matrix = prevEval.matriz_competencias;
    } else {
      matrix = this.competenciasBase.map(c => {
        const found = prevEval?.matriz_competencias?.find(m => 
          m.competencia === c.competencia || m.competencia.includes(c.competencia.split('.')[1]?.trim() || '')
        );
        return {
          competencia: c.competencia,
          definicion: c.definicion,
          puntuacion: found?.puntuacion !== undefined ? found.puntuacion : 3,
          observaciones: found?.observaciones || ''
        };
      });
    }

    this.datosEvaluacion = {
      impresion_general: prevEval?.impresion_general || '',
      concepto_psicologico: prevEval?.concepto_psicologico || '',
      matriz_competencias: matrix,
      promedio_competencias: prevEval?.promedio_competencias || 3.0,
      disponibilidad_ingreso: prevEval?.disponibilidad_ingreso || 'Inmediata',
      aspiracion_salarial: prevEval?.aspiracion_salarial || '',
      decision_final: prevEval?.decision_final || postulacion.estado_postulante || 'Aprobado',
      evaluador_nombre: prevEval?.evaluador_nombre || this.currentUser?.nombre || 'Gestión y Talento Humano',
      observaciones_adicionales: prevEval?.observaciones_adicionales || '',
      fortalezas_clave: prevEval?.fortalezas_clave || '',
      oportunidades_mejora: prevEval?.oportunidades_mejora || '',
      ajuste_cultural: prevEval?.ajuste_cultural || '',
      respuestas_star: prevEval?.respuestas_star || {}
    };

    this.respuestasSTAR = { ...(prevEval?.respuestas_star || {}) };
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

  calcularPromedioCompetencias(): void {
    const list = this.datosEvaluacion.matriz_competencias || [];
    if (list.length === 0) {
      this.datosEvaluacion.promedio_competencias = 0;
      return;
    }
    const sum = list.reduce((acc, c) => acc + (Number(c.puntuacion) || 0), 0);
    this.datosEvaluacion.promedio_competencias = Math.round((sum / list.length) * 10) / 10;
  }

  guardarEvaluacionEntrevista(): void {
    const target = this.drawerCandidate || this.postulacionParaEvaluar;
    if (!target?.id) return;

    this.evaluacionSubmitting = true;
    this.datosEvaluacion.respuestas_star = { ...this.respuestasSTAR };
    this.postulacionService.guardarEvaluacion(target.id, this.datosEvaluacion).subscribe({
      next: (res) => {
        alert(res.message || 'Evaluación de entrevista guardada exitosamente.');
        target.evaluacion_entrevista_json = res.data;
        if (this.datosEvaluacion.decision_final) {
          target.estado_postulante = this.datosEvaluacion.decision_final;
        }

        const inList = this.postulaciones.find(p => p.id === target.id);
        if (inList) {
          inList.evaluacion_entrevista_json = res.data;
          if (this.datosEvaluacion.decision_final) {
            inList.estado_postulante = this.datosEvaluacion.decision_final;
          }
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
    const url = this.postulacionService.getDownloadUrl(filename);
    window.open(url, '_blank');
  }

  downloadHojaVidaCorporativa(postulacion: Postulacion): void {
    if (!postulacion.candidato_id) return;
    const url = this.postulacionService.getHojaVidaCorporativaUrl(
      postulacion.candidato_id,
      postulacion.vacante_titulo || '',
      postulacion.fecha_postulacion || ''
    );
    window.open(url, '_blank');
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

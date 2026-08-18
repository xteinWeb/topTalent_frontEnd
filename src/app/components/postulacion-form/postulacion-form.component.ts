import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CandidatoService } from '../../services/candidato.service';
import { VacanteService, Vacante } from '../../services/vacante.service';
import { PostulacionService } from '../../services/postulacion.service';
import { InformacionBasicaComponent } from './subcomponents/informacion-basica/informacion-basica.component';
import { DatosAdicionalesComponent } from './subcomponents/datos-adicionales/datos-adicionales.component';
import { NivelEducativoComponent } from './subcomponents/nivel-educativo/nivel-educativo.component';
import { ExperienciaLaboralComponent } from './subcomponents/experiencia-laboral/experiencia-laboral.component';
import { EducacionInformalComponent } from './subcomponents/educacion-informal/educacion-informal.component';
import { IdiomasHabilidadesComponent } from './subcomponents/idiomas-habilidades/idiomas-habilidades.component';
import { PreguntasCargoComponent } from './subcomponents/preguntas-cargo/preguntas-cargo.component';

@Component({
  selector: 'app-postulacion-form',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    InformacionBasicaComponent,
    DatosAdicionalesComponent,
    NivelEducativoComponent,
    ExperienciaLaboralComponent,
    EducacionInformalComponent,
    IdiomasHabilidadesComponent,
    PreguntasCargoComponent
  ],
  templateUrl: './postulacion-form.component.html',
  styleUrls: ['./postulacion-form.component.css']
})
export class PostulacionFormComponent implements OnInit {
  vacanteId: string = '';
  vacante?: Vacante;
  loading: boolean = true;
  submitting: boolean = false;
  successMsg: boolean = false;
  errorMsg: string = '';
  showIncompleteWarningModal: boolean = false;
  showErrorModal: boolean = false;
  errorMessageModalText: string = '';
  isLoggedIn: boolean = false;

  // Calcular porcentaje de completitud del perfil/postulación
  getCompletitudPorcentaje(): number {
    let puntos = 0;
    let totalPuntosPosibles = 0;

    // 1. Información Básica (Siempre requerida, máx 40%)
    totalPuntosPosibles += 40;
    if (this.nombre_completo.trim()) puntos += 10;
    if (this.correo.trim()) puntos += 10;
    if (this.telefono.trim()) puntos += 10;
    if (this.archivoHv) {
      puntos += 10;
    } else if (this.archivoNombre) {
      puntos += 10;
    }

    // 2. Datos Personales Adicionales (siempre requerida)
    totalPuntosPosibles += 20;
    if (this.camposAdicionalesCompletos()) {
      puntos += 20;
    }

    // 3. Nivel Educativo (si está activo en campos requeridos)
    if (this.campos_requeridos.nivel_educativo !== false) {
      totalPuntosPosibles += 20;
      if (this.estudios && this.estudios.length > 0) {
        puntos += 20;
      }
    }

    // 4. Experiencia Laboral (si está activo en campos requeridos)
    if (this.campos_requeridos.experiencia_laboral !== false) {
      totalPuntosPosibles += 20;
      if (this.experiencias && this.experiencias.length > 0) {
        puntos += 20;
      }
    }

    // 5. Idiomas y habilidades (si está activo en campos requeridos)
    if (this.campos_requeridos.idiomas_habilidades !== false) {
      totalPuntosPosibles += 20;
      let habilidadesLlenas = (this.habilidades.tecnicas.length > 0 || this.habilidades.interpersonales.length > 0 || this.habilidades.otros.length > 0);
      if (habilidadesLlenas || this.idiomas.length > 0) {
        puntos += 20;
      }
    }

    if (totalPuntosPosibles === 0) return 0;
    return Math.round((puntos / totalPuntosPosibles) * 100);
  }

  // Form Fields (Basic Information)
  nombre_completo: string = '';
  correo: string = '';
  telefono: string = '';
  cedula: string = '';
  fecha_nacimiento: string = '';
  edad: string = '';
  eps: string = '';
  fondo_pension: string = '';
  direccion: string = '';
  barrio: string = '';
  ciudad: string = '';
  estado_civil: string = '';
  talla_camisa: string = '';
  talla_pantalon: string = '';
  talla_zapato: string = '';
  personas_a_cargo: any[] = [];


  // Tab navigation
  activeTab: string = 'basica';
  candidato_id: string | null = null;
  requiere_registro: boolean = true;
  campos_requeridos: any = {
    informacion_basica: true,
    nivel_educativo: true,
    experiencia_laboral: true,
    educacion_informal: true,
    idiomas_habilidades: true
  };

  // Section indicators (Si/No)
  tieneEducacionFormal: string = 'No';
  tieneEducacionInformal: string = 'No';

  // Dynamic lists
  estudios: any[] = [];
  experiencias: any[] = [];
  capacitaciones: any[] = [];
  idiomas: any[] = [];
  habilidades: {
    tecnicas: string[];
    interpersonales: string[];
    otros: string[];
  } = {
      tecnicas: [],
      interpersonales: [],
      otros: []
    };

  // Selectors list
  listaEstadosEducacion: string[] = ['Graduado', 'En curso', 'Suspendido / Aplazado'];
  listaPaises: string[] = ['Colombia', 'Venezuela', 'Ecuador', 'Perú', 'Argentina', 'Chile', 'España', 'Estados Unidos', 'Otro'];

  listaTiposExperiencia: string[] = [
    'Laboral',
    'Práctica Profesional / Pasantía',
    'Independiente / Emprendimiento',
    'Voluntariado'
  ];

  listaSectores: string[] = [
    'Administración / Oficina',
    'Ventas / Comercial',
    'Producción / Operarios',
    'Sistemas / Tecnología',
    'Contabilidad / Finanzas',
    'Logística / Distribución',
    'Recursos Humanos',
    'Salud',
    'Educación',
    'Otros'
  ];

  listaIdiomas: string[] = ['Español', 'Inglés', 'Portugués', 'Alemán', 'Francés', 'Italiano', 'Mandarín', 'Otro'];

  // Temporary objects for forms
  showEstudioForm: boolean = false;
  nuevoEstudio: any = {
    nivel: '',
    nucleo: '',
    titulo: '',
    homologado: 'No',
    pais: 'Colombia',
    institucion: '',
    estado: '',
    observaciones: '',
    practicaEmpresarial: false
  };

  showExperienciaForm: boolean = false;
  nuevaExperiencia: any = {
    tipo: '',
    empresa: '',
    sector: '',
    telefono: '',
    pais: 'Colombia',
    cargo: '',
    cargoEquivalente: '',
    mesIngreso: '',
    anioIngreso: '',
    actualmente: false,
    mesRetiro: '',
    anioRetiro: '',
    funciones: ''
  };

  showCapacitacionForm: boolean = false;
  nuevaCapacitacion: any = {
    tipo: '',
    nombre: '',
    institucion: '',
    pais: 'Colombia',
    estado: '',
    duracionHoras: ''
  };

  nuevoIdioma: any = {
    idioma: '',
    nivel: 0
  };

  nuevaHerramienta: any = {
    nombre: '',
    tipo: '',
    nivel: 0
  };

  // Helper arrays for months and years
  listaMeses: string[] = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  listaAnios: number[] = [];

  // CV File Upload
  archivoHv?: File;
  archivoNombre: string = '';
  archivoInvalido: boolean = false;

  // Preguntas del cargo (vienen del perfil de cargo vinculado a la vacante)
  preguntas: any[] = [];

  // Tratamiento de Datos Personales
  aceptoTratamientoDatos: boolean = false;
  showTratamientoDatosModal: boolean = false;
  tratamientoDatosModalMode: 'ver' | 'aceptar' = 'ver';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private vacanteService: VacanteService,
    private postulacionService: PostulacionService,
    private candidatoService: CandidatoService
  ) {
    // Fill years from current year down to 1970
    const currentYear = new Date().getFullYear();
    for (let y = currentYear; y >= 1970; y--) {
      this.listaAnios.push(y);
    }
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.vacanteId = params['vacanteId'];
      if (this.vacanteId) {
        this.loadVacante(this.vacanteId);
      } else {
        this.errorMsg = 'ID de vacante no especificado.';
        this.loading = false;
      }
    });
  }

  loadVacante(id: string): void {
    this.loading = true;
    this.vacanteService.getVacante(id).subscribe({
      next: (data) => {
        this.vacante = data;
        this.preguntas = (data.perfil_completo_json?.preguntas || []).map((p: any) => ({ ...p, respuesta: '' }));

        if (data.estado === 'INACTIVA') {
          this.errorMsg = 'Esta oferta de empleo ya no se encuentra activa.';
          this.loading = false;
          return;
        }

        this.requiere_registro = data.requiere_registro !== undefined ? data.requiere_registro : true;
        if (data.configuracion_json) {
          try {
            this.campos_requeridos = typeof data.configuracion_json === 'string'
              ? JSON.parse(data.configuracion_json)
              : data.configuracion_json;
          } catch (e) {
            console.error('Error parsing configuracion_json:', e);
          }
        }

        // Intercept flows
        const isUserLoggedIn = this.candidatoService.isLoggedIn();
        this.isLoggedIn = isUserLoggedIn;
        if (this.requiere_registro && !isUserLoggedIn) {
          // Redirect to login page
          this.router.navigate(['/candidato/login'], { queryParams: { returnUrl: `/postular/${this.vacanteId}` } });
          return;
        }

        if (isUserLoggedIn) {
          // Load logged in candidate profile data
          this.candidato_id = this.candidatoService.getCurrentUser()?.id || null;
          this.candidatoService.getPerfil().subscribe({
            next: (profile) => {
              this.correo = profile.email;
              this.archivoNombre = profile.hv_archivo_nombre || '';
              this.aceptoTratamientoDatos = !!profile.acepto_tratamiento_datos;
              if (profile.perfil_completo_json) {
                let p = profile.perfil_completo_json;
                if (typeof p === 'string') {
                  try {
                    p = JSON.parse(p);
                  } catch (e) {
                    console.error('Error parsing candidate profile json:', e);
                  }
                }
                this.nombre_completo = p.nombre_completo || '';
                this.telefono = p.telefono || '';
                this.cedula = p.cedula || '';
                this.fecha_nacimiento = p.fecha_nacimiento || '';
                this.edad = p.edad || '';
                this.eps = p.eps || '';
                this.fondo_pension = p.fondo_pension || '';
                this.direccion = p.direccion || '';
                this.barrio = p.barrio || '';
                this.ciudad = p.ciudad || '';
                this.estado_civil = p.estado_civil || '';
                this.talla_camisa = p.talla_camisa || '';
                this.talla_pantalon = p.talla_pantalon || '';
                this.talla_zapato = p.talla_zapato || '';
                this.personas_a_cargo = p.personas_a_cargo || [];
                this.tieneEducacionFormal = p.tieneEducacionFormal || 'No';
                this.tieneEducacionInformal = p.tieneEducacionInformal || 'No';
                this.estudios = p.estudios || [];
                this.experiencias = p.experiencias || [];
                this.capacitaciones = p.capacitaciones || [];
                this.idiomas = p.idiomas || [];
                this.habilidades = p.habilidades || { tecnicas: [], interpersonales: [], otros: [] };
              }
              this.loading = false;
            },
            error: (err) => {
              console.error('Error loading candidate profile:', err);
              this.loading = false;
            }
          });
        } else {
          this.loading = false;
        }
      },
      error: (err) => {
        this.errorMsg = 'No se pudo obtener la información de la vacante seleccionada.';
        this.loading = false;
        console.error(err);
      }
    });
  }

  // Tab navigation helpers
  setTab(tab: string): void {
    this.activeTab = tab;
  }

  isTabHabilitada(tabName: string): boolean {
    if (tabName === 'preguntas') {
      return this.preguntas.length > 0;
    }
    const tabMapping: { [key: string]: string } = {
      'basica': 'informacion_basica',
      'educacion': 'nivel_educativo',
      'experiencia': 'experiencia_laboral',
      'informal': 'educacion_informal',
      'idiomas': 'idiomas_habilidades'
    };
    const configKey = tabMapping[tabName];
    return this.campos_requeridos[configKey] !== false;
  }

  nextTab(): void {
    const tabs = ['basica', 'educacion', 'experiencia', 'informal', 'idiomas', 'preguntas'];
    const idx = tabs.indexOf(this.activeTab);
    if (idx < tabs.length - 1) {
      // Basic validations before changing tabs
      if (this.activeTab === 'basica') {
        if (!this.nombre_completo.trim() || !this.correo.trim()) {
          alert('Por favor complete la información obligatoria de contacto.');
          return;
        }
        if (!this.archivoHv && !this.archivoNombre) {
          alert('Debe adjuntar su archivo de Hoja de Vida para continuar.');
          return;
        }
      }

      // Find the next available tab that is required
      let nextIdx = idx + 1;
      while (nextIdx < tabs.length) {
        const nextTabName = tabs[nextIdx];
        if (this.isTabHabilitada(nextTabName)) {
          this.activeTab = nextTabName;
          break;
        }
        nextIdx++;
      }
    }
  }

  prevTab(): void {
    const tabs = ['basica', 'educacion', 'experiencia', 'informal', 'idiomas', 'preguntas'];
    const idx = tabs.indexOf(this.activeTab);
    if (idx > 0) {
      let prevIdx = idx - 1;
      while (prevIdx >= 0) {
        const prevTabName = tabs[prevIdx];
        if (this.isTabHabilitada(prevTabName)) {
          this.activeTab = prevTabName;
          break;
        }
        prevIdx--;
      }
    }
  }

  // Dynamic Add / Remove handlers
  toggleEstudioForm(show: boolean): void {
    this.showEstudioForm = show;
    if (show) {
      this.nuevoEstudio = {
        nivel: '',
        nucleo: '',
        titulo: '',
        pais: 'Colombia',
        institucion: '',
        estado: '',
        observaciones: '',
        practicaEmpresarial: false
      };
    }
  }

  addEstudioRecord(): void {
    if (!this.nuevoEstudio.nivel || !this.nuevoEstudio.titulo || !this.nuevoEstudio.institucion || !this.nuevoEstudio.estado) {
      alert('Por favor complete todos los campos obligatorios del nivel educativo.');
      return;
    }
    this.estudios.push({ ...this.nuevoEstudio });
    this.toggleEstudioForm(false);
  }

  removeEstudioRecord(index: number): void {
    this.estudios.splice(index, 1);
  }

  toggleExperienciaForm(show: boolean): void {
    this.showExperienciaForm = show;
    if (show) {
      this.nuevaExperiencia = {
        tipo: '',
        empresa: '',
        sector: '',
        telefono: '',
        pais: 'Colombia',
        cargo: '',
        cargoEquivalente: '',
        mesIngreso: '',
        anioIngreso: '',
        actualmente: false,
        mesRetiro: '',
        anioRetiro: '',
        funciones: ''
      };
    }
  }

  addExperienciaRecord(): void {
    if (!this.nuevaExperiencia.tipo || !this.nuevaExperiencia.empresa || !this.nuevaExperiencia.sector || !this.nuevaExperiencia.cargo || !this.nuevaExperiencia.mesIngreso || !this.nuevaExperiencia.anioIngreso) {
      alert('Por favor complete todos los campos obligatorios de la experiencia laboral.');
      return;
    }
    if (!this.nuevaExperiencia.actualmente && (!this.nuevaExperiencia.mesRetiro || !this.nuevaExperiencia.anioRetiro)) {
      alert('Por favor complete la fecha de retiro.');
      return;
    }
    this.experiencias.push({ ...this.nuevaExperiencia });
    this.toggleExperienciaForm(false);
  }

  removeExperienciaRecord(index: number): void {
    this.experiencias.splice(index, 1);
  }

  toggleCapacitacionForm(show: boolean): void {
    this.showCapacitacionForm = show;
    if (show) {
      this.nuevaCapacitacion = {
        tipo: '',
        nombre: '',
        institucion: '',
        pais: 'Colombia',
        estado: '',
        duracionHoras: ''
      };
    }
  }

  addCapacitacionRecord(): void {
    if (!this.nuevaCapacitacion.tipo || !this.nuevaCapacitacion.nombre || !this.nuevaCapacitacion.institucion) {
      alert('Por favor complete todos los campos obligatorios de la capacitación.');
      return;
    }
    this.capacitaciones.push({ ...this.nuevaCapacitacion });
    this.toggleCapacitacionForm(false);
  }

  removeCapacitacionRecord(index: number): void {
    this.capacitaciones.splice(index, 1);
  }

  setStarRating(obj: any, rating: number): void {
    obj.nivel = rating;
  }

  addIdiomaRecord(): void {
    if (!this.nuevoIdioma.idioma || this.nuevoIdioma.nivel === 0) {
      alert('Por favor seleccione un idioma y asigne un nivel en estrellas.');
      return;
    }
    const existe = this.idiomas.some(i => i.idioma.toLowerCase() === this.nuevoIdioma.idioma.toLowerCase());
    if (existe) {
      alert('Este idioma ya ha sido añadido.');
      return;
    }
    const nivelTextos = ['Muy Básico', 'Básico', 'Intermedio', 'Avanzado', 'Nativo'];
    this.idiomas.push({
      idioma: this.nuevoIdioma.idioma,
      nivel: nivelTextos[this.nuevoIdioma.nivel - 1] || 'Básico',
      estrellas: this.nuevoIdioma.nivel
    });
    this.nuevoIdioma = { idioma: '', nivel: 0 };
  }

  removeIdiomaRecord(index: number): void {
    this.idiomas.splice(index, 1);
  }

  addHerramientaRecord(): void {
    if (!this.nuevaHerramienta.nombre || this.nuevaHerramienta.nivel === 0 || !this.nuevaHerramienta.tipo) {
      alert('Por favor ingrese el nombre de la herramienta, seleccione un tipo y asigne un nivel.');
      return;
    }

    const tipo = this.nuevaHerramienta.tipo as 'tecnicas' | 'interpersonales' | 'otros';
    if (!this.habilidades[tipo]) {
      this.habilidades[tipo] = [];
    }

    const itemStr = `${this.nuevaHerramienta.nombre} (Nivel: ${this.nuevaHerramienta.nivel}/3)`;
    this.habilidades[tipo].push(itemStr);

    this.nuevaHerramienta = { nombre: '', tipo: '', nivel: 0 };
  }

  removeHerramientaRecord(tipo: 'tecnicas' | 'interpersonales' | 'otros', index: number): void {
    if (this.habilidades[tipo]) {
      this.habilidades[tipo].splice(index, 1);
    }
  }

  // File Upload Handlers
  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file) {
      const extension = file.name.split('.').pop()?.toLowerCase();
      const validExtensions = ['pdf', 'docx', 'doc'];

      if (!validExtensions.includes(extension || '')) {
        this.archivoInvalido = true;
        this.archivoHv = undefined;
        this.archivoNombre = '';
        alert('Solo se permiten archivos con extensión PDF, DOCX o DOC.');
        return;
      }

      // Peso máximo 10MB
      if (file.size > 10 * 1024 * 1024) {
        this.archivoInvalido = true;
        this.archivoHv = undefined;
        this.archivoNombre = '';
        alert('El archivo supera el límite de peso permitido (10MB).');
        return;
      }

      this.archivoInvalido = false;
      this.archivoHv = file;
      this.archivoNombre = file.name;
    }
  }

  isProfileIncomplete(): boolean {
    if (this.campos_requeridos.nivel_educativo !== false && (!this.estudios || this.estudios.length === 0)) {
      return true;
    }
    if (this.campos_requeridos.experiencia_laboral !== false && (!this.experiencias || this.experiencias.length === 0)) {
      return true;
    }
    if (this.campos_requeridos.idiomas_habilidades !== false) {
      const habilidadesLlenas = this.habilidades && (
        (this.habilidades.tecnicas && this.habilidades.tecnicas.length > 0) ||
        (this.habilidades.interpersonales && this.habilidades.interpersonales.length > 0) ||
        (this.habilidades.otros && this.habilidades.otros.length > 0)
      );
      if (!habilidadesLlenas && (!this.idiomas || this.idiomas.length === 0)) {
        return true;
      }
    }
    return false;
  }

  confirmPostulateAnyway(): void {
    this.showIncompleteWarningModal = false;
    this.executePostulation();
  }

  triggerErrorModal(msg: string): void {
    this.errorMessageModalText = msg;
    this.showErrorModal = true;
  }

  closeErrorModal(): void {
    this.showErrorModal = false;
    this.errorMessageModalText = '';
  }

  tienePreguntasObligatoriasSinResponder(): boolean {
    return this.preguntas.some(p => p.obligatoria && !String(p.respuesta || '').trim());
  }

  camposAdicionalesCompletos(): boolean {
    return !!(this.edad && String(this.edad).trim() && this.estado_civil.trim() && this.eps.trim() &&
      this.fondo_pension.trim() && this.direccion.trim() && this.barrio.trim() && this.ciudad.trim() &&
      this.talla_camisa.trim() && this.talla_pantalon.trim() && this.talla_zapato.trim());
  }

  openTratamientoDatosModal(event?: Event): void {
    if (event) event.preventDefault();
    this.tratamientoDatosModalMode = 'ver';
    this.showTratamientoDatosModal = true;
  }

  closeTratamientoDatosModal(): void {
    this.showTratamientoDatosModal = false;
  }

  confirmarAceptacionTratamientoDatos(): void {
    this.aceptoTratamientoDatos = true;
    this.showTratamientoDatosModal = false;
    this.onSubmit();
  }

  onSubmit(): void {
    if (!this.nombre_completo.trim() || !this.correo.trim()) {
      this.triggerErrorModal('Por favor complete la información obligatoria de contacto.');
      return;
    }

    if (!this.archivoHv && !this.archivoNombre) {
      this.triggerErrorModal('Debe adjuntar su archivo de Hoja de Vida (PDF) para completar la postulación.');
      return;
    }

    if (!this.camposAdicionalesCompletos()) {
      this.triggerErrorModal('Debe completar todos los datos personales adicionales obligatorios (edad, estado civil, EPS, fondo de pensión, dirección, barrio, ciudad y tallas).');
      return;
    }

    if (this.tienePreguntasObligatoriasSinResponder()) {
      this.triggerErrorModal('Debe responder todas las preguntas obligatorias del cargo para completar la postulación.');
      return;
    }

    if (!this.aceptoTratamientoDatos) {
      this.tratamientoDatosModalMode = 'aceptar';
      this.showTratamientoDatosModal = true;
      return;
    }

    if (this.isProfileIncomplete()) {
      this.showIncompleteWarningModal = true;
      return;
    }

    this.executePostulation();
  }

  executePostulation(): void {
    this.submitting = true;

    // Map studies_json, experiencias_json, idiomas_json, habilidades_json properly
    const mappedEstudios = this.tieneEducacionFormal === 'Si' ? this.estudios.map(est => ({
      nivel: est.nivel,
      institucion: est.institucion,
      fecha_inicio: est.estado || '', // Map to existing schema keys as best as possible
      fecha_fin: (est.mesFin && est.anioFin) ? `${est.mesFin} de ${est.anioFin}` : (est.observaciones || ''),
      en_curso: est.estado === 'En curso',
      // Store additional metadata
      nucleo: est.nucleo,
      titulo: est.titulo,
      homologado: est.homologado,
      pais: est.pais,
      practicaEmpresarial: est.practicaEmpresarial,
      mesFin: est.mesFin || '',
      anioFin: est.anioFin || '',
      tarjetaProfesional: est.tarjetaProfesional || 'No',
      tarjetaProfesionalNumero: est.tarjetaProfesionalNumero || ''
    })) : [];

    const mappedExperiencias = this.experiencias.map(exp => ({
      cargo: exp.cargo,
      empresa: exp.empresa,
      descripcion: exp.telefono ? `Tel: ${exp.telefono}. Funciones: ${exp.funciones || ''}` : `Funciones: ${exp.funciones || ''}`,
      fecha_inicio: (exp.mesIngreso && exp.anioIngreso) ? `${exp.mesIngreso} ${exp.anioIngreso}` : '',
      fecha_fin: exp.actualmente ? 'Actualidad' : ((exp.mesRetiro && exp.anioRetiro) ? `${exp.mesRetiro} ${exp.anioRetiro}` : ''),
      actualmente: exp.actualmente,
      tipo: exp.tipo,
      pais: exp.pais
    }));

    // Include informal training (capacitaciones) inside estudios_json or as metadata
    if (this.tieneEducacionInformal === 'Si') {
      this.capacitaciones.forEach(cap => {
        mappedEstudios.push({
          nivel: `Cursos y Certificaciones - ${cap.tipo}`,
          institucion: cap.institucion,
          fecha_inicio: cap.estado,
          fecha_fin: cap.mesFin && cap.anioFin 
            ? `${cap.mesFin} de ${cap.anioFin} (Duración: ${cap.duracionHoras} horas. País: ${cap.pais})` 
            : `Duración: ${cap.duracionHoras} horas. País: ${cap.pais}`,
          en_curso: cap.estado === 'En curso',
          nucleo: '',
          titulo: cap.nombre,
          homologado: 'No',
          pais: cap.pais,
          practicaEmpresarial: false,
          mesFin: cap.mesFin || '',
          anioFin: cap.anioFin || '',
          tarjetaProfesional: 'No',
          tarjetaProfesionalNumero: ''
        });
      });
    }

    const postulacionPayload = {
      vacante_id: this.vacanteId,
      nombre_completo: this.nombre_completo,
      correo: this.correo,
      telefono: this.telefono,
      cedula: this.cedula,
      fecha_nacimiento: this.fecha_nacimiento,
      edad: this.edad,
      eps: this.eps,
      fondo_pension: this.fondo_pension,
      direccion: this.direccion,
      barrio: this.barrio,
      ciudad: this.ciudad,
      estado_civil: this.estado_civil,
      talla_camisa: this.talla_camisa,
      talla_pantalon: this.talla_pantalon,
      talla_zapato: this.talla_zapato,
      personas_a_cargo: this.personas_a_cargo,
      perfil_profesional: {
        titulo: 'Postulación Detallada',
        resumen: `Candidato (CC: ${this.cedula}, F.Nac: ${this.fecha_nacimiento}) completó el formulario de postulación dinámico estructurado.`
      },
      experiencias_json: mappedExperiencias,
      estudios_json: mappedEstudios,
      idiomas_json: this.idiomas,
      habilidades_json: this.habilidades,
      preguntas_respondidas: this.preguntas.map(p => ({
        id: p.id,
        categoria: p.categoria,
        titulo: p.titulo,
        pregunta: p.pregunta,
        tipo: p.tipo,
        obligatoria: p.obligatoria,
        respuesta: p.respuesta,
        rubrica_criterios: p.rubrica_criterios,
        rubrica_evaluacion: p.rubrica_evaluacion
      })),
      acepto_tratamiento_datos: this.aceptoTratamientoDatos,
      candidato_id: this.candidato_id
    };

    this.postulacionService.postular(postulacionPayload, this.archivoHv as File).subscribe({
      next: (res) => {
        this.submitting = false;
        this.successMsg = true;
      },
      error: (err) => {
        this.triggerErrorModal('Error al enviar la postulación: ' + (err.error?.error || err.message));
        this.submitting = false;
        console.error(err);
      }
    });
  }
}


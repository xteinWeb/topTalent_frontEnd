import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { CandidatoService, CandidatoPerfil } from '../../../services/candidato.service';
import { InformacionBasicaComponent } from '../../postulacion-form/subcomponents/informacion-basica/informacion-basica.component';
import { NivelEducativoComponent } from '../../postulacion-form/subcomponents/nivel-educativo/nivel-educativo.component';
import { ExperienciaLaboralComponent } from '../../postulacion-form/subcomponents/experiencia-laboral/experiencia-laboral.component';
import { EducacionInformalComponent } from '../../postulacion-form/subcomponents/educacion-informal/educacion-informal.component';
import { IdiomasHabilidadesComponent } from '../../postulacion-form/subcomponents/idiomas-habilidades/idiomas-habilidades.component';

@Component({
  selector: 'app-candidato-perfil',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    RouterModule,
    InformacionBasicaComponent,
    NivelEducativoComponent,
    ExperienciaLaboralComponent,
    EducacionInformalComponent,
    IdiomasHabilidadesComponent
  ],
  templateUrl: './candidato-perfil.component.html',
  styleUrls: ['./candidato-perfil.component.css']
})
export class CandidatoPerfilComponent implements OnInit {
  currentUserEmail = '';
  loading = true;
  saving = false;
  activeTab = 'basica';

  // Calcular porcentaje de completitud del perfil de candidato (100% total)
  getCompletitudPorcentaje(): number {
    let puntos = 0;
    const totalPuntosPosibles = 100; // Estructura fija en perfil personal

    // 1. Información básica (40%)
    if (this.nombre_completo.trim()) puntos += 10;
    if (this.correo.trim()) puntos += 10;
    if (this.telefono.trim()) puntos += 10;
    if (this.archivoHv || this.archivoNombre) puntos += 10;

    // 2. Nivel Educativo (20%)
    if (this.estudios && this.estudios.length > 0) puntos += 20;

    // 3. Experiencia Laboral (20%)
    if (this.experiencias && this.experiencias.length > 0) puntos += 20;

    // 4. Idiomas y Habilidades (20%)
    let habilidadesLlenas = (this.habilidades.tecnicas.length > 0 || this.habilidades.interpersonales.length > 0 || this.habilidades.otros.length > 0);
    if (habilidadesLlenas || this.idiomas.length > 0) puntos += 20;

    return puntos;
  }

  // Profile data fields
  nombre_completo = '';
  correo = '';
  telefono = '';
  cedula = '';
  fecha_nacimiento = '';
  tieneEducacionFormal = 'No';
  tieneEducacionInformal = 'No';

  estudios: any[] = [];
  experiencias: any[] = [];
  capacitaciones: any[] = [];
  idiomas: any[] = [];
  habilidades: any = { tecnicas: [], interpersonales: [], otros: [] };

  // Selectors list (Shared with main form)
  listaNivelesEducativos = [
    'Bachillerato / Educación Media',
    'Técnico Profesional',
    'Tecnólogo',
    'Universitario / Profesional',
    'Especialización',
    'Maestría',
    'Doctorado'
  ];
  listaEstadosEducacion = ['Graduado', 'En curso', 'Suspendido / Aplazado'];
  listaPaises = ['Colombia', 'Venezuela', 'Ecuador', 'Perú', 'Argentina', 'Chile', 'España', 'Estados Unidos', 'Otro'];
  listaTiposCapacitacion = ['Curso', 'Diplomado', 'Seminario', 'Congreso', 'Certificación', 'Otro'];
  listaTiposExperiencia = ['Laboral', 'Práctica Profesional / Pasantía', 'Independiente / Emprendimiento', 'Voluntariado'];
  listaSectores = ['Administración / Oficina', 'Ventas / Comercial', 'Producción / Operarios', 'Sistemas / Tecnología', 'Contabilidad / Finanzas', 'Logística / Distribución', 'Recursos Humanos', 'Salud', 'Educación', 'Otros'];
  listaIdiomas = ['Español', 'Inglés', 'Portugués', 'Alemán', 'Francés', 'Italiano', 'Mandarín', 'Otro'];
  listaMeses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  listaAnios: number[] = [];

  showEstudioForm = false;
  nuevoEstudio = { nivel: '', nucleo: '', titulo: '', homologado: 'No', pais: 'Colombia', institucion: '', estado: '', observaciones: '', practicaEmpresarial: false };

  showExperienciaForm = false;
  nuevaExperiencia = { tipo: '', empresa: '', sector: '', telefono: '', pais: 'Colombia', cargo: '', cargoEquivalente: '', mesIngreso: '', anioIngreso: '', actualmente: false, mesRetiro: '', anioRetiro: '', funciones: '' };

  showCapacitacionForm = false;
  nuevaCapacitacion = { tipo: '', nombre: '', institucion: '', pais: 'Colombia', estado: '', duracionHoras: '' };

  nuevoIdioma = { idioma: '', nivel: 0 };
  nuevaHerramienta = { nombre: '', tipo: '', nivel: 0 };

  archivoHv?: File;
  archivoNombre = '';
  archivoInvalido = false;
  showSuccessModal = false;

  returnUrl: string | null = null;

  constructor(
    private candidatoService: CandidatoService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    const currentYear = new Date().getFullYear();
    for (let y = currentYear; y >= 1970; y--) {
      this.listaAnios.push(y);
    }
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.returnUrl = params['returnUrl'] || null;
    });

    const user = this.candidatoService.getCurrentUser();
    if (!user) {
      this.router.navigate(['/candidato/login']);
      return;
    }
    this.currentUserEmail = user.email;
    this.loadProfile();
  }

  loadProfile(): void {
    this.loading = true;
    this.candidatoService.getPerfil().subscribe({
      next: (profile: CandidatoPerfil) => {
        this.correo = profile.email;
        this.archivoNombre = profile.hv_archivo_nombre || '';
        
        if (profile.perfil_completo_json) {
          let p = profile.perfil_completo_json;
          if (typeof p === 'string') {
            try {
              p = JSON.parse(p);
            } catch (e) {
              console.error('Error parsing perfil_completo_json string:', e);
            }
          }
          this.nombre_completo = p.nombre_completo || '';
          this.telefono = p.telefono || '';
          this.cedula = p.cedula || '';
          this.fecha_nacimiento = p.fecha_nacimiento || '';
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
        console.error('Error al cargar perfil:', err);
        this.loading = false;
      }
    });
  }

  onArchivoHvChange(file: File | undefined): void {
    this.archivoHv = file;
    this.archivoNombre = file ? file.name : '';
  }

  setTab(tab: string): void {
    this.activeTab = tab;
  }

  nextTab(): void {
    const tabs = ['basica', 'educacion', 'experiencia', 'informal', 'idiomas'];
    const idx = tabs.indexOf(this.activeTab);
    if (idx < tabs.length - 1) {
      if (this.activeTab === 'basica' && (!this.nombre_completo.trim() || !this.correo.trim())) {
        alert('Por favor complete la información obligatoria de contacto.');
        return;
      }
      this.activeTab = tabs[idx + 1];
    }
  }

  prevTab(): void {
    const tabs = ['basica', 'educacion', 'experiencia', 'informal', 'idiomas'];
    const idx = tabs.indexOf(this.activeTab);
    if (idx > 0) {
      this.activeTab = tabs[idx - 1];
    }
  }

  saveProfile(): void {
    // Auto-commit pending studies form if filled out
    if (this.showEstudioForm && this.nuevoEstudio.nivel && this.nuevoEstudio.titulo && this.nuevoEstudio.institucion && this.nuevoEstudio.estado) {
      this.estudios.push({ ...this.nuevoEstudio });
      this.showEstudioForm = false;
    }

    // Auto-commit pending training (capacitaciones) form if filled out
    if (this.showCapacitacionForm && this.nuevaCapacitacion.tipo && this.nuevaCapacitacion.nombre && this.nuevaCapacitacion.institucion) {
      this.capacitaciones.push({ ...this.nuevaCapacitacion });
      this.showCapacitacionForm = false;
    }

    // Auto-commit pending experiences form if filled out
    if (this.showExperienciaForm && this.nuevaExperiencia.cargo && this.nuevaExperiencia.empresa && this.nuevaExperiencia.funciones) {
      this.experiencias.push({ ...this.nuevaExperiencia });
      this.showExperienciaForm = false;
    }

    // Auto-detect and set education flags
    this.tieneEducacionFormal = this.estudios.length > 0 ? 'Si' : 'No';
    this.tieneEducacionInformal = this.capacitaciones.length > 0 ? 'Si' : 'No';

    this.saving = true;
    const profilePayload = {
      perfil_completo_json: {
        nombre_completo: this.nombre_completo,
        telefono: this.telefono,
        cedula: this.cedula,
        fecha_nacimiento: this.fecha_nacimiento,
        tieneEducacionFormal: this.tieneEducacionFormal,
        tieneEducacionInformal: this.tieneEducacionInformal,
        estudios: this.estudios,
        experiencias: this.experiencias,
        capacitaciones: this.capacitaciones,
        idiomas: this.idiomas,
        habilidades: this.habilidades
      },
      hv_archivo_nombre: this.archivoNombre,
      hv_archivo_ruta: '' // Manejado si deciden subirlo físicamente
    };

    this.candidatoService.updatePerfil(profilePayload).subscribe({
      next: () => {
        this.saving = false;
        this.showSuccessModal = true;
      },
      error: (err) => {
        this.saving = false;
        alert('Error al guardar el perfil: ' + (err.error?.error || err.message));
        console.error(err);
      }
    });
  }

  closeModal(): void {
    this.showSuccessModal = false;
    if (this.returnUrl) {
      this.router.navigateByUrl(this.returnUrl);
    } else {
      this.router.navigate(['/ofertas']);
    }
  }

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

  logout(): void {
    this.candidatoService.logout();
    this.router.navigate(['/ofertas']);
  }
}

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { CandidatoService, CandidatoPerfil } from '../../../services/candidato.service';
import { InformacionBasicaComponent } from '../../postulacion-form/subcomponents/informacion-basica/informacion-basica.component';
import { DatosAdicionalesComponent } from '../../postulacion-form/subcomponents/datos-adicionales/datos-adicionales.component';
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
    DatosAdicionalesComponent,
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

  // Campos obligatorios de la pestaña "Datos Adicionales"
  camposAdicionalesCompletos(): boolean {
    return !!(this.edad && String(this.edad).trim() && this.estado_civil.trim() && this.eps.trim() &&
      this.fondo_pension.trim() && this.direccion.trim() && this.barrio.trim() && this.ciudad.trim() &&
      this.talla_camisa.trim() && this.talla_pantalon.trim() && this.talla_zapato.trim());
  }

  // Calcular porcentaje de completitud del perfil de candidato (100% total)
  getCompletitudPorcentaje(): number {
    let puntos = 0;

    // 1. Información básica (30%)
    if (this.nombre_completo.trim()) puntos += 7.5;
    if (this.correo.trim()) puntos += 7.5;
    if (this.telefono.trim()) puntos += 7.5;
    if (this.archivoHv || this.archivoNombre) puntos += 7.5;

    // 2. Datos Adicionales (10%)
    if (this.camposAdicionalesCompletos()) puntos += 10;

    // 3. Nivel Educativo (20%)
    if (this.estudios && this.estudios.length > 0) puntos += 20;

    // 4. Experiencia Laboral (20%)
    if (this.experiencias && this.experiencias.length > 0) puntos += 20;

    // 5. Idiomas y Habilidades (20%)
    let habilidadesLlenas = (this.habilidades.tecnicas.length > 0 || this.habilidades.interpersonales.length > 0 || this.habilidades.otros.length > 0);
    if (habilidadesLlenas || this.idiomas.length > 0) puntos += 20;

    return Math.round(puntos);
  }

  // Profile data fields
  nombre_completo = '';
  correo = '';
  telefono = '';
  cedula = '';
  fecha_nacimiento = '';
  edad = '';
  eps = '';
  fondo_pension = '';
  direccion = '';
  barrio = '';
  ciudad = '';
  estado_civil = '';
  talla_camisa = '';
  talla_pantalon = '';
  talla_zapato = '';
  personas_a_cargo: any[] = [];
  tieneEducacionFormal = 'No';
  tieneEducacionInformal = 'No';

  estudios: any[] = [];
  experiencias: any[] = [];
  capacitaciones: any[] = [];
  idiomas: any[] = [];
  habilidades: any = { tecnicas: [], interpersonales: [], otros: [] };

  // Selectors list (Shared with main form)
  listaEstadosEducacion = ['Graduado', 'En curso', 'Suspendido / Aplazado'];
  listaPaises = ['Colombia', 'Venezuela', 'Ecuador', 'Perú', 'Argentina', 'Chile', 'España', 'Estados Unidos', 'Otro'];
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
    const tabs = ['basica', 'adicional', 'educacion', 'experiencia', 'informal', 'idiomas'];
    const idx = tabs.indexOf(this.activeTab);
    if (idx < tabs.length - 1) {
      if (this.activeTab === 'basica' && (!this.nombre_completo.trim() || !this.correo.trim())) {
        alert('Por favor complete la información obligatoria de contacto.');
        return;
      }
      if (this.activeTab === 'adicional' && !this.camposAdicionalesCompletos()) {
        alert('Por favor complete todos los datos personales adicionales obligatorios.');
        return;
      }
      this.activeTab = tabs[idx + 1];
    }
  }

  prevTab(): void {
    const tabs = ['basica', 'adicional', 'educacion', 'experiencia', 'informal', 'idiomas'];
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
        tieneEducacionFormal: this.tieneEducacionFormal,
        tieneEducacionInformal: this.tieneEducacionInformal,
        estudios: this.estudios,
        experiencias: this.experiencias,
        capacitaciones: this.capacitaciones,
        idiomas: this.idiomas,
        habilidades: this.habilidades
      }
    };

    this.candidatoService.updatePerfil(profilePayload, this.archivoHv).subscribe({
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

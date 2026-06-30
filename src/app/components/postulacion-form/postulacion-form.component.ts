import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { VacanteService, Vacante } from '../../services/vacante.service';
import { PostulacionService } from '../../services/postulacion.service';

@Component({
  selector: 'app-postulacion-form',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
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

  // Form Fields
  nombre_completo: string = '';
  correo: string = '';
  telefono: string = '';
  
  // Section 1: Professional Profile
  perfil_titulo: string = '';
  perfil_resumen: string = '';

  // Section 2: Work Experience
  experiencias: Array<{
    cargo: string;
    empresa: string;
    descripcion: string;
    fecha_inicio: string;
    fecha_fin: string;
    actualmente: boolean;
  }> = [
    { cargo: '', empresa: '', descripcion: '', fecha_inicio: '', fecha_fin: '', actualmente: false }
  ];

  // Section 3: Studies
  estudios: Array<{
    nivel: string;
    institucion: string;
    fecha_inicio: string;
    fecha_fin: string;
    en_curso: boolean;
  }> = [
    { nivel: '', institucion: '', fecha_inicio: '', fecha_fin: '', en_curso: false }
  ];

  // Section 4: Languages
  idiomaSeleccionado: string = '';
  nivelSeleccionado: string = '';
  idiomas: Array<{ idioma: string; nivel: string }> = [];

  listaIdiomas: string[] = ['Español', 'Inglés', 'Portugués', 'Alemán', 'Francés', 'Italiano', 'Mandarín', 'Otro'];
  listaNiveles: string[] = ['Nativo', 'Avanzado (C1/C2)', 'Intermedio (B1/B2)', 'Básico (A1/A2)'];

  // Section 5: Skills
  habilidadGrupo: 'tecnicas' | 'interpersonales' | 'otros' = 'tecnicas';
  habilidadTexto: string = '';
  habilidades: {
    tecnicas: string[];
    interpersonales: string[];
    otros: string[];
  } = {
    tecnicas: [],
    interpersonales: [],
    otros: []
  };

  // CV File Upload
  archivoHv?: File;
  archivoNombre: string = '';
  archivoInvalido: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private vacanteService: VacanteService,
    private postulacionService: PostulacionService
  ) {}

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
        if (data.estado === 'INACTIVA') {
          this.errorMsg = 'Esta oferta de empleo ya no se encuentra activa.';
        }
        this.loading = false;
      },
      error: (err) => {
        this.errorMsg = 'No se pudo obtener la información de la vacante seleccionada.';
        this.loading = false;
        console.error(err);
      }
    });
  }

  // Section 2: Experiencias Methods
  addExperiencia(): void {
    this.experiencias.push({
      cargo: '',
      empresa: '',
      descripcion: '',
      fecha_inicio: '',
      fecha_fin: '',
      actualmente: false
    });
  }

  removeExperiencia(index: number): void {
    this.experiencias.splice(index, 1);
    if (this.experiencias.length === 0) {
      this.addExperiencia();
    }
  }

  onActualmenteChange(exp: any): void {
    if (exp.actualmente) {
      exp.fecha_fin = '';
    }
  }

  // Section 3: Estudios Methods
  addEstudio(): void {
    this.estudios.push({
      nivel: '',
      institucion: '',
      fecha_inicio: '',
      fecha_fin: '',
      en_curso: false
    });
  }

  removeEstudio(index: number): void {
    this.estudios.splice(index, 1);
    if (this.estudios.length === 0) {
      this.addEstudio();
    }
  }

  onEnCursoChange(est: any): void {
    if (est.en_curso) {
      est.fecha_fin = '';
    }
  }

  // Section 4: Idiomas Methods
  addIdioma(): void {
    if (!this.idiomaSeleccionado || !this.nivelSeleccionado) {
      alert('Seleccione un idioma y su respectivo nivel.');
      return;
    }

    // Evitar duplicados
    const existe = this.idiomas.some(
      i => i.idioma.toLowerCase() === this.idiomaSeleccionado.toLowerCase()
    );

    if (existe) {
      alert('Este idioma ya ha sido añadido.');
      return;
    }

    this.idiomas.push({
      idioma: this.idiomaSeleccionado,
      nivel: this.nivelSeleccionado
    });

    this.idiomaSeleccionado = '';
    this.nivelSeleccionado = '';
  }

  removeIdioma(index: number): void {
    this.idiomas.splice(index, 1);
  }

  // Section 5: Habilidades Methods
  addHabilidad(): void {
    if (!this.habilidadTexto.trim()) return;

    const texto = this.habilidadTexto.trim();
    const grupo = this.habilidadGrupo;

    // Evitar duplicados en el grupo
    if (this.habilidades[grupo].some(h => h.toLowerCase() === texto.toLowerCase())) {
      alert('Esta habilidad ya ha sido añadida en este grupo.');
      return;
    }

    this.habilidades[grupo].push(texto);
    this.habilidadTexto = '';
  }

  removeHabilidad(grupo: 'tecnicas' | 'interpersonales' | 'otros', index: number): void {
    this.habilidades[grupo].splice(index, 1);
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

  onSubmit(): void {
    if (!this.nombre_completo.trim() || !this.correo.trim() || !this.perfil_titulo.trim() || !this.perfil_resumen.trim()) {
      alert('Por favor complete la información obligatoria de identificación y perfil profesional.');
      return;
    }

    if (!this.archivoHv) {
      alert('Debe adjuntar su archivo de Hoja de Vida (PDF, DOCX o DOC) para completar la postulación.');
      return;
    }

    this.submitting = true;

    // Filter empty experience/study rows if the user didn't write anything
    const cleanExperiencias = this.experiencias.filter(
      e => e.cargo.trim() || e.empresa.trim() || e.descripcion.trim()
    );
    const cleanEstudios = this.estudios.filter(
      es => es.nivel.trim() || es.institucion.trim()
    );

    const postulacionPayload = {
      vacante_id: this.vacanteId,
      nombre_completo: this.nombre_completo,
      correo: this.correo,
      telefono: this.telefono,
      perfil_profesional: {
        titulo: this.perfil_titulo,
        resumen: this.perfil_resumen
      },
      experiencias_json: cleanExperiencias,
      estudios_json: cleanEstudios,
      idiomas_json: this.idiomas,
      habilidades_json: this.habilidades
    };

    this.postulacionService.postular(postulacionPayload, this.archivoHv).subscribe({
      next: (res) => {
        this.submitting = false;
        this.successMsg = true;
      },
      error: (err) => {
        alert('Error al enviar la postulación: ' + (err.error?.error || err.message));
        this.submitting = false;
        console.error(err);
      }
    });
  }
}

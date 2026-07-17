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

  // Form Fields (Basic Information)
  nombre_completo: string = '';
  correo: string = '';
  telefono: string = '';

  // Cargo questions loaded from the vacancy profile
  preguntas: any[] = [];

  // CV File Upload
  archivoHv?: File;
  archivoNombre: string = '';
  archivoInvalido: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private vacanteService: VacanteService,
    private postulacionService: PostulacionService
  ) { }

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

        // Load cargo questions from the vacancy's profile JSON
        if (data.perfil_completo_json?.preguntas) {
          this.preguntas = data.perfil_completo_json.preguntas.map((q: any) => ({
            ...q,
            respuesta: ''
          }));
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
    if (!this.nombre_completo.trim() || !this.correo.trim()) {
      alert('Por favor complete la información obligatoria de contacto.');
      return;
    }

    if (!this.archivoHv) {
      alert('Debe adjuntar su archivo de Hoja de Vida (PDF) para completar la postulación.');
      return;
    }

    // Validate that all mandatory cargo questions have an answer
    const missingRequired = this.preguntas.filter(
      q => q.obligatoria && (!q.respuesta || !q.respuesta.trim())
    );

    if (missingRequired.length > 0) {
      alert('Por favor responde a todas las preguntas obligatorias del cargo antes de continuar.');
      return;
    }

    this.submitting = true;

    // Build the payload keeping DB constraints satisfied
    const postulacionPayload = {
      vacante_id: this.vacanteId,
      nombre_completo: this.nombre_completo,
      correo: this.correo,
      telefono: this.telefono,
      perfil_profesional: {
        titulo: 'Postulación Básica',
        resumen: 'Postulante aplicó cargando CV y respondiendo al banco de preguntas del cargo.'
      },
      experiencias_json: [],
      estudios_json: [],
      idiomas_json: [],
      habilidades_json: {
        preguntas_respondidas: this.preguntas
      }
    };

    this.postulacionService.postular(postulacionPayload, this.archivoHv).subscribe({
      next: (res) => {

        this.postulacionService.postularWebhook(postulacionPayload, this.archivoHv!).subscribe({
          next: (res) => console.log('Postulcion guardada correctamente:', res),
          error: (err) => console.error('Error al enviar la postulación:', err)
        });

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

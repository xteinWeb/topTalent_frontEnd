import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { VacanteService, Vacante } from '../../services/vacante.service';
import { PerfilService, PerfilCargo } from '../../services/perfil.service';

@Component({
  selector: 'app-vacante-form',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './vacante-form.component.html',
  styleUrls: ['./vacante-form.component.css']
})
export class VacanteFormComponent implements OnInit {
  isEditMode: boolean = false;
  id?: string;

  // Form Fields
  perfil_id: string = '';
  titulo: string = '';
  descripcion: string = '';
  estado: string = 'ACTIVA';
  requiere_registro: boolean = true;
  campos_requeridos: any = {
    informacion_basica: true,
    nivel_educativo: true,
    experiencia_laboral: true,
    educacion_informal: true,
    idiomas_habilidades: true
  };

  // Requerimientos extendidos Octubre 2026
  seccion_area: string = '';
  tipo_requerimiento: 'NUEVO_CARGO' | 'REEMPLAZO' = 'NUEVO_CARGO';
  nombre_reemplaza: string = '';
  salario_min: number | null = null;
  salario_max: number | null = null;
  perfil_oculto: {
    edad_preferida: string;
    turnos: string;
    observaciones_confidenciales: string;
  } = {
    edad_preferida: '',
    turnos: 'Diurno Ordinario',
    observaciones_confidenciales: ''
  };

  perfiles: PerfilCargo[] = [];
  submitting: boolean = false;
  loading: boolean = false;
  errorMsg: string = '';

  constructor(
    private vacanteService: VacanteService,
    private perfilService: PerfilService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.loadPerfiles();
    
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.id = params['id'];
        this.loadVacante(this.id!);
      }
    });
  }

  loadPerfiles(): void {
    this.perfilService.getPerfiles().subscribe({
      next: (data) => {
        this.perfiles = data;
      },
      error: (err) => {
        console.error('Error al cargar perfiles:', err);
      }
    });
  }

  onPerfilChange(): void {
    const sel = this.perfiles.find(p => p.id === this.perfil_id);
    if (sel) {
      if (!this.titulo) this.titulo = sel.cargo;
      if (!this.seccion_area) this.seccion_area = sel.area;
      if (!this.descripcion && sel.perfil_json?.proposito) {
        this.descripcion = sel.perfil_json.proposito;
      }
    }
  }

  loadVacante(id: string): void {
    this.loading = true;
    this.vacanteService.getVacante(id).subscribe({
      next: (data) => {
        this.perfil_id = data.perfil_id;
        this.titulo = data.titulo;
        this.descripcion = data.descripcion;
        this.estado = data.estado || 'ACTIVA';
        this.requiere_registro = data.requiere_registro !== undefined ? data.requiere_registro : true;
        this.seccion_area = data.seccion_area || '';
        this.tipo_requerimiento = (data.tipo_requerimiento as any) || 'NUEVO_CARGO';
        this.nombre_reemplaza = data.nombre_reemplaza || '';
        this.salario_min = data.salario_min ? Number(data.salario_min) : null;
        this.salario_max = data.salario_max ? Number(data.salario_max) : null;

        if (data.perfil_oculto_json) {
          try {
            const raw = typeof data.perfil_oculto_json === 'string'
              ? JSON.parse(data.perfil_oculto_json)
              : data.perfil_oculto_json;
            this.perfil_oculto = {
              edad_preferida: raw.edad_preferida || '',
              turnos: raw.turnos || 'Diurno Ordinario',
              observaciones_confidenciales: raw.observaciones_confidenciales || ''
            };
          } catch (e) {
            console.error('Error al parsear perfil_oculto_json:', e);
          }
        }

        if (data.configuracion_json) {
          try {
            this.campos_requeridos = typeof data.configuracion_json === 'string' 
              ? JSON.parse(data.configuracion_json) 
              : data.configuracion_json;
          } catch (e) {
            console.error('Error parsing configuracion_json:', e);
          }
        }
        this.loading = false;
      },
      error: (err) => {
        this.errorMsg = 'No se pudo cargar la vacante seleccionada.';
        this.loading = false;
        console.error(err);
      }
    });
  }

  onSubmit(): void {
    if (!this.perfil_id || !this.titulo.trim() || !this.descripcion.trim()) {
      alert('Por favor complete todos los campos obligatorios: Perfil de Cargo, Título y Descripción.');
      return;
    }

    if (this.tipo_requerimiento === 'REEMPLAZO' && !this.nombre_reemplaza.trim()) {
      alert('Por favor indique el nombre de la persona a quien reemplaza.');
      return;
    }

    this.submitting = true;

    const payload: Vacante = {
      perfil_id: this.perfil_id,
      titulo: this.titulo,
      descripcion: this.descripcion,
      estado: this.estado,
      requiere_registro: this.requiere_registro,
      configuracion_json: this.campos_requeridos,
      seccion_area: this.seccion_area,
      tipo_requerimiento: this.tipo_requerimiento,
      nombre_reemplaza: this.tipo_requerimiento === 'REEMPLAZO' ? this.nombre_reemplaza : undefined,
      salario_min: this.salario_min || undefined,
      salario_max: this.salario_max || undefined,
      perfil_oculto_json: this.perfil_oculto
    };

    const request$ = this.isEditMode
      ? this.vacanteService.updateVacante(this.id!, payload)
      : this.vacanteService.createVacante(payload);

    request$.subscribe({
      next: () => {
        this.submitting = false;
        this.router.navigate(['/vacantes']);
      },
      error: (err) => {
        alert('Error al guardar la vacante: ' + (err.error?.error || err.message));
        this.submitting = false;
        console.error(err);
      }
    });
  }
}

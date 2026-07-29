import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-postulacion-experiencia-laboral',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './experiencia-laboral.component.html',
  styleUrls: ['../../postulacion-form.component.css']
})
export class ExperienciaLaboralComponent {
  @Input() experiencias: any[] = [];
  @Output() experienciasChange = new EventEmitter<any[]>();

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

  listaPaises: string[] = ['Colombia', 'Venezuela', 'Ecuador', 'Perú', 'Argentina', 'Chile', 'España', 'Estados Unidos', 'Otro'];

  listaMeses: string[] = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  listaAnios: number[] = [];

  showExperienciaForm: boolean = false;
  nuevaExperiencia: any = {
    tipo: '',
    empresa: '',
    telefono: '',
    pais: 'Colombia',
    cargo: '',
    mesIngreso: '',
    anioIngreso: '',
    actualmente: false,
    mesRetiro: '',
    anioRetiro: '',
    funciones: ''
  };

  constructor() {
    const currentYear = new Date().getFullYear();
    for (let y = currentYear; y >= 1970; y--) {
      this.listaAnios.push(y);
    }
  }

  toggleExperienciaForm(show: boolean): void {
    this.showExperienciaForm = show;
    if (show) {
      this.nuevaExperiencia = {
        tipo: '',
        empresa: '',
        telefono: '',
        pais: 'Colombia',
        cargo: '',
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
    if (!this.nuevaExperiencia.tipo || !this.nuevaExperiencia.empresa || !this.nuevaExperiencia.cargo || !this.nuevaExperiencia.mesIngreso || !this.nuevaExperiencia.anioIngreso) {
      alert('Por favor complete todos los campos obligatorios de la experiencia laboral.');
      return;
    }
    if (!this.nuevaExperiencia.actualmente && (!this.nuevaExperiencia.mesRetiro || !this.nuevaExperiencia.anioRetiro)) {
      alert('Por favor complete la fecha de retiro.');
      return;
    }
    this.experiencias.push({ ...this.nuevaExperiencia });
    this.experienciasChange.emit(this.experiencias);
    this.toggleExperienciaForm(false);
  }

  removeExperienciaRecord(index: number): void {
    this.experiencias.splice(index, 1);
    this.experienciasChange.emit(this.experiencias);
  }
}

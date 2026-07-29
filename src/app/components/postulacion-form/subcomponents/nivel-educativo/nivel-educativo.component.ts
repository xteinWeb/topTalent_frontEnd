import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-postulacion-nivel-educativo',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './nivel-educativo.component.html',
  styleUrls: ['../../postulacion-form.component.css']
})
export class NivelEducativoComponent {
  @Input() tieneEducacionFormal: string = 'No';
  @Output() tieneEducacionFormalChange = new EventEmitter<string>();

  @Input() estudios: any[] = [];
  @Output() estudiosChange = new EventEmitter<any[]>();

  listaNivelesEducativos: string[] = [
    'Bachillerato / Educación Media',
    'Técnico Profesional',
    'Tecnólogo',
    'Universitario / Profesional',
    'Especialización',
    'Maestría',
    'Doctorado'
  ];
  
  listaEstadosEducacion: string[] = ['Graduado', 'En curso', 'Suspendido / Aplazado'];
  listaPaises: string[] = ['Colombia', 'Venezuela', 'Ecuador', 'Perú', 'Argentina', 'Chile', 'España', 'Estados Unidos', 'Otro'];

  listaMeses: string[] = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  listaAnios: number[] = [];

  showEstudioForm: boolean = false;
  nuevoEstudio: any = {
    nivel: '',
    titulo: '',
    homologado: 'No',
    pais: 'Colombia',
    institucion: '',
    estado: '',
    observaciones: '',
    mesFin: '',
    anioFin: '',
    tarjetaProfesional: 'No',
    tarjetaProfesionalNumero: ''
  };

  constructor() {
    const currentYear = new Date().getFullYear();
    for (let y = currentYear; y >= 1970; y--) {
      this.listaAnios.push(y);
    }
  }

  onTieneEducacionChange(val: string): void {
    this.tieneEducacionFormalChange.emit(val);
  }

  toggleEstudioForm(show: boolean): void {
    this.showEstudioForm = show;
    if (show) {
      this.nuevoEstudio = {
        nivel: '',
        titulo: '',
        homologado: 'No',
        pais: 'Colombia',
        institucion: '',
        estado: '',
        observaciones: '',
        mesFin: '',
        anioFin: '',
        tarjetaProfesional: 'No',
        tarjetaProfesionalNumero: ''
      };
    }
  }

  addEstudioRecord(): void {
    if (!this.nuevoEstudio.nivel || !this.nuevoEstudio.titulo || !this.nuevoEstudio.institucion || !this.nuevoEstudio.estado) {
      alert('Por favor complete todos los campos obligatorios del nivel educativo.');
      return;
    }
    
    // Validar mes y año de finalización si aplica
    if (this.nuevoEstudio.estado === 'Graduado' || this.nuevoEstudio.estado === 'Suspendido / Aplazado') {
      if (!this.nuevoEstudio.mesFin || !this.nuevoEstudio.anioFin) {
        alert('Por favor seleccione el mes y año de finalización.');
        return;
      }
    }

    // Validar número de tarjeta profesional si cuenta con ella
    if (this.nuevoEstudio.tarjetaProfesional === 'Si') {
      if (!this.nuevoEstudio.tarjetaProfesionalNumero || !this.nuevoEstudio.tarjetaProfesionalNumero.trim()) {
        alert('Por favor ingrese el número de la tarjeta profesional.');
        return;
      }
    }

    this.estudios.push({ ...this.nuevoEstudio });
    this.estudiosChange.emit(this.estudios);
    this.toggleEstudioForm(false);
  }

  removeEstudioRecord(index: number): void {
    this.estudios.splice(index, 1);
    this.estudiosChange.emit(this.estudios);
  }
}

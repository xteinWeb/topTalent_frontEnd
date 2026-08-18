import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CatalogoService } from '../../../../services/catalogo.service';

@Component({
  selector: 'app-postulacion-educacion-informal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './educacion-informal.component.html',
  styleUrls: ['../../postulacion-form.component.css']
})
export class EducacionInformalComponent implements OnInit {
  @Input() tieneEducacionInformal: string = 'No';
  @Output() tieneEducacionInformalChange = new EventEmitter<string>();

  @Input() capacitaciones: any[] = [];
  @Output() capacitacionesChange = new EventEmitter<any[]>();

  listaTiposCapacitacion: string[] = [];

  listaPaises: string[] = ['Colombia', 'Venezuela', 'Ecuador', 'Perú', 'Argentina', 'Chile', 'España', 'Estados Unidos', 'Otro'];

  listaMeses: string[] = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  listaAnios: number[] = [];

  showCapacitacionForm: boolean = false;
  nuevaCapacitacion: any = {
    tipo: '',
    nombre: '',
    institucion: '',
    pais: 'Colombia',
    estado: '',
    duracionHoras: '',
    mesFin: '',
    anioFin: ''
  };

  constructor(private catalogoService: CatalogoService) {
    const currentYear = new Date().getFullYear();
    for (let y = currentYear; y >= 1970; y--) {
      this.listaAnios.push(y);
    }
  }

  ngOnInit(): void {
    this.catalogoService.getByTipo('TIPO_CAPACITACION').subscribe({
      next: (valores) => this.listaTiposCapacitacion = valores,
      error: (err) => console.error('Error al cargar tipos de capacitación:', err)
    });
  }

  onTieneEducacionInformalChange(val: string): void {
    this.tieneEducacionInformalChange.emit(val);
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
        duracionHoras: '',
        mesFin: '',
        anioFin: ''
      };
    }
  }

  addCapacitacionRecord(): void {
    if (!this.nuevaCapacitacion.tipo || !this.nuevaCapacitacion.nombre || !this.nuevaCapacitacion.institucion || !this.nuevaCapacitacion.estado) {
      alert('Por favor complete todos los campos obligatorios de la capacitación.');
      return;
    }

    if (this.nuevaCapacitacion.estado === 'Completo' || this.nuevaCapacitacion.estado === 'Incompleto') {
      if (!this.nuevaCapacitacion.mesFin || !this.nuevaCapacitacion.anioFin) {
        alert('Por favor seleccione el mes y año de finalización.');
        return;
      }
    }

    this.capacitaciones.push({ ...this.nuevaCapacitacion });
    this.capacitacionesChange.emit(this.capacitaciones);
    this.toggleCapacitacionForm(false);
  }

  removeCapacitacionRecord(index: number): void {
    this.capacitaciones.splice(index, 1);
    this.capacitacionesChange.emit(this.capacitaciones);
  }
}

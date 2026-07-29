import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-postulacion-informacion-basica',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './informacion-basica.component.html',
  styleUrls: ['../../postulacion-form.component.css']
})
export class InformacionBasicaComponent {
  @Input() nombre_completo: string = '';
  @Output() nombre_completoChange = new EventEmitter<string>();

  @Input() correo: string = '';
  @Output() correoChange = new EventEmitter<string>();

  @Input() telefono: string = '';
  @Output() telefonoChange = new EventEmitter<string>();

  @Input() cedula: string = '';
  @Output() cedulaChange = new EventEmitter<string>();

  @Input() fecha_nacimiento: string = '';
  @Output() fecha_nacimientoChange = new EventEmitter<string>();

  @Input() archivoHv?: File;
  @Output() archivoHvChange = new EventEmitter<File | undefined>();

  @Input() archivoNombre: string = '';
  @Output() archivoNombreChange = new EventEmitter<string>();

  @Input() archivoInvalido: boolean = false;
  @Output() archivoInvalidoChange = new EventEmitter<boolean>();

  @Output() fileSelected = new EventEmitter<any>();

  onNombreChange(val: string): void {
    this.nombre_completoChange.emit(val);
  }

  onCorreoChange(val: string): void {
    this.correoChange.emit(val);
  }

  onTelefonoChange(val: string): void {
    this.telefonoChange.emit(val);
  }

  onCedulaChange(val: string): void {
    this.cedulaChange.emit(val);
  }

  onFechaNacimientoChange(val: string): void {
    this.fecha_nacimientoChange.emit(val);
  }

  onFileChange(event: any): void {
    this.fileSelected.emit(event);
  }
}

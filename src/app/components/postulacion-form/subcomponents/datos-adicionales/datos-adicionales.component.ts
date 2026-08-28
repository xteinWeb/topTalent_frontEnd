import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-postulacion-datos-adicionales',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './datos-adicionales.component.html',
  styleUrls: ['../../postulacion-form.component.css']
})
export class DatosAdicionalesComponent {
  @Input() edad: string = '';
  @Output() edadChange = new EventEmitter<string>();

  @Input() estado_civil: string = '';
  @Output() estado_civilChange = new EventEmitter<string>();

  @Input() eps: string = '';
  @Output() epsChange = new EventEmitter<string>();

  @Input() fondo_pension: string = '';
  @Output() fondo_pensionChange = new EventEmitter<string>();

  @Input() direccion: string = '';
  @Output() direccionChange = new EventEmitter<string>();

  @Input() barrio: string = '';
  @Output() barrioChange = new EventEmitter<string>();

  @Input() ciudad: string = '';
  @Output() ciudadChange = new EventEmitter<string>();

  @Input() talla_camisa: string = '';
  @Output() talla_camisaChange = new EventEmitter<string>();

  @Input() talla_pantalon: string = '';
  @Output() talla_pantalonChange = new EventEmitter<string>();

  @Input() talla_zapato: string = '';
  @Output() talla_zapatoChange = new EventEmitter<string>();

  @Input() personas_a_cargo: any[] = [];
  @Output() personas_a_cargoChange = new EventEmitter<any[]>();

  @Input() tiene_familiares_empresa: string = '';
  @Output() tiene_familiares_empresaChange = new EventEmitter<string>();

  @Input() detalle_familiares_empresa: string = '';
  @Output() detalle_familiares_empresaChange = new EventEmitter<string>();

  @Input() funciones_desempenar: string = '';
  @Output() funciones_desempenarChange = new EventEmitter<string>();

  @Input() readOnly: boolean = false;

  onEdadChange(val: string): void {
    this.edadChange.emit(val);
  }

  onEstadoCivilChange(val: string): void {
    this.estado_civilChange.emit(val);
  }

  onEpsChange(val: string): void {
    this.epsChange.emit(val);
  }

  onFondoPensionChange(val: string): void {
    this.fondo_pensionChange.emit(val);
  }

  onDireccionChange(val: string): void {
    this.direccionChange.emit(val);
  }

  onBarrioChange(val: string): void {
    this.barrioChange.emit(val);
  }

  onCiudadChange(val: string): void {
    this.ciudadChange.emit(val);
  }

  onTallaCamisaChange(val: string): void {
    this.talla_camisaChange.emit(val);
  }

  onTallaPantalonChange(val: string): void {
    this.talla_pantalonChange.emit(val);
  }

  onTallaZapatoChange(val: string): void {
    this.talla_zapatoChange.emit(val);
  }

  onTieneFamiliaresEmpresaChange(val: string): void {
    this.tiene_familiares_empresa = val;
    if (val !== 'Si') {
      this.detalle_familiares_empresa = '';
      this.detalle_familiares_empresaChange.emit('');
    }
    this.tiene_familiares_empresaChange.emit(val);
  }

  onDetalleFamiliaresEmpresaChange(val: string): void {
    this.detalle_familiares_empresaChange.emit(val);
  }

  onFuncionesDesempenarChange(val: string): void {
    this.funciones_desempenarChange.emit(val);
  }

  addPersonaCargo(): void {
    this.personas_a_cargo.push({ parentesco: '', nombres: '', numero_identificacion: '', edad: '' });
    this.personas_a_cargoChange.emit(this.personas_a_cargo);
  }

  removePersonaCargo(index: number): void {
    this.personas_a_cargo.splice(index, 1);
    this.personas_a_cargoChange.emit(this.personas_a_cargo);
  }

  onPersonaCargoChange(): void {
    this.personas_a_cargoChange.emit(this.personas_a_cargo);
  }
}

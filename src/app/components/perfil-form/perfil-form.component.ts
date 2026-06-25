import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PerfilService, PerfilCargo, PerfilJson } from '../../services/perfil.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-perfil-form',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './perfil-form.component.html',
  styleUrls: ['./perfil-form.component.css']
})
export class PerfilFormComponent implements OnInit {
  isEditMode: boolean = false;
  id?: string;
  activeTab: string = 'general';

  // Form Fields
  area: string = '';
  cargo: string = '';

  // JSON Structure fields
  contractual: string = '';
  reporta_a: string = '';
  supervisa: string = '';
  proposito: string = '';
  autoridad: string = '';
  formacion: string = '';
  experiencia: string = '';

  // Dynamic Lists
  funciones: string[] = [''];
  conocimientos_basicos: string[] = [''];
  competencias: string[] = [''];

  // Indicators
  indicadores: Array<{ nombre: string; nivel: string; formula: string }> = [
    { nombre: '', nivel: '', formula: '' }
  ];

  submitting: boolean = false;
  loading: boolean = false;
  errorMsg: string = '';

  constructor(
    private perfilService: PerfilService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.id = params['id'];
        this.loadPerfil(this.id!);
      }
    });
  }

  loadPerfil(id: string): void {
    this.loading = true;
    this.perfilService.getPerfil(id).subscribe({
      next: (data) => {
        this.area = data.area;
        this.cargo = data.cargo;

        const pj = data.perfil_json;
        this.contractual = pj.contractual || '';
        this.reporta_a = pj.reporta_a || '';
        this.supervisa = pj.supervisa || '';
        this.proposito = pj.proposito || '';
        this.autoridad = pj.autoridad || '';

        if (pj.requisitos) {
          this.formacion = pj.requisitos.formacion || '';
          this.experiencia = pj.requisitos.experiencia || '';
          this.conocimientos_basicos = pj.requisitos.conocimientos_basicos && pj.requisitos.conocimientos_basicos.length > 0
            ? [...pj.requisitos.conocimientos_basicos]
            : [''];
          this.competencias = pj.requisitos.competencias && pj.requisitos.competencias.length > 0
            ? [...pj.requisitos.competencias]
            : [''];
        }

        this.funciones = pj.funciones && pj.funciones.length > 0
          ? [...pj.funciones]
          : [''];

        this.indicadores = pj.indicadores && pj.indicadores.length > 0
          ? [...pj.indicadores]
          : [{ nombre: '', nivel: '', formula: '' }];

        this.loading = false;
      },
      error: (err) => {
        this.errorMsg = 'No se pudo cargar el perfil de cargo seleccionado.';
        this.loading = false;
        console.error(err);
      }
    });
  }

  // Dynamic Array Helper Methods
  addFunc(): void { this.funciones.push(''); }
  removeFunc(index: number): void { this.funciones.splice(index, 1); }
  trackByIndex(index: number): number { return index; }

  addConocimiento(): void { this.conocimientos_basicos.push(''); }
  removeConocimiento(index: number): void { this.conocimientos_basicos.splice(index, 1); }

  addCompetencia(): void { this.competencias.push(''); }
  removeCompetencia(index: number): void { this.competencias.splice(index, 1); }

  addIndicador(): void { this.indicadores.push({ nombre: '', nivel: '', formula: '' }); }
  removeIndicador(index: number): void { this.indicadores.splice(index, 1); }

  setTab(tab: string): void {
    this.activeTab = tab;
  }

  onSubmit(): void {
    if (!this.area.trim() || !this.cargo.trim()) {
      alert('Por favor complete los campos obligatorios: Área y Cargo.');
      return;
    }

    // Filter out empty entries from dynamic lists
    const cleanFunciones = this.funciones.filter(f => f.trim() !== '');
    const cleanConocimientos = this.conocimientos_basicos.filter(c => c.trim() !== '');
    const cleanCompetencias = this.competencias.filter(c => c.trim() !== '');
    const cleanIndicadores = this.indicadores.filter(i => i.nombre.trim() !== '' || i.nivel.trim() !== '' || i.formula.trim() !== '');

    this.submitting = true;

    const perfilJson: PerfilJson = {
      contractual: this.contractual,
      reporta_a: this.reporta_a,
      supervisa: this.supervisa,
      proposito: this.proposito,
      funciones: cleanFunciones,
      autoridad: this.autoridad,
      requisitos: {
        formacion: this.formacion,
        experiencia: this.experiencia,
        conocimientos_basicos: cleanConocimientos,
        competencias: cleanCompetencias
      },
      indicadores: cleanIndicadores
    };

    const payload: PerfilCargo = {
      area: this.area,
      cargo: this.cargo,
      perfil_json: perfilJson
    };

    const request$ = this.isEditMode
      ? this.perfilService.updatePerfil(this.id!, payload)
      : this.perfilService.createPerfil(payload);

    request$.subscribe({
      next: () => {
        this.submitting = false;
        this.router.navigate(['/']);
      },
      error: (err) => {
        alert('Error al guardar el perfil: ' + (err.error?.error || err.message));
        this.submitting = false;
        console.error(err);
      }
    });
  }

  exportToPdf(): void {
    window.print();
  }

  downloadWord(): void {
    if (!this.id) return;
    window.location.href = `${environment.apiUrl}/perfiles/${this.id}/docx`;
  }
}

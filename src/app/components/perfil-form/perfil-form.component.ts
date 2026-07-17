import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PerfilService, PerfilCargo, PerfilJson } from '../../services/perfil.service';
import { environment } from '../../../environments/environment';

import { PerfilIdentificacionComponent } from './subcomponents/identificacion/identificacion.component';
import { PerfilPropositoComponent } from './subcomponents/proposito/proposito.component';
import { PerfilFuncionesComponent } from './subcomponents/funciones/funciones.component';
import { PerfilRequisitosComponent } from './subcomponents/requisitos/requisitos.component';
import { PerfilIndicadoresComponent } from './subcomponents/indicadores/indicadores.component';
import { PerfilPreguntasComponent } from './subcomponents/preguntas/preguntas.component';

@Component({
  selector: 'app-perfil-form',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    PerfilIdentificacionComponent,
    PerfilPropositoComponent,
    PerfilFuncionesComponent,
    PerfilRequisitosComponent,
    PerfilIndicadoresComponent,
    PerfilPreguntasComponent
  ],
  templateUrl: './perfil-form.component.html',
  styleUrls: ['./perfil-form.component.css'],
  encapsulation: ViewEncapsulation.None
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
  prompt: string = '';
  preguntas: any[] = [];
  generatingQuestions: boolean = false;

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

        this.prompt = pj.prompt || '';
        this.preguntas = this.parsePreguntas(pj.preguntas);

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
  trackByIndex(index: number): number { return index; }

  setTab(tab: string): void {
    this.activeTab = tab;
    if (tab === 'preguntas' && !this.prompt) {
      this.prompt = `A partir del siguiente perfil del cargo, genera un banco de preguntas en ESPAÑOL para ser utilizado durante la postulación.

Reglas del contenido:
- Genera entre 8 y 12 preguntas en total.
- El banco DEBE incluir obligatoriamente:
  * 2 preguntas técnicas (enfocadas en conocimientos específicos del perfil).
  * 2 preguntas sobre experiencia laboral.
  * 2 preguntas sobre competencias y habilidades (ej. Proactividad, trabajo en equipo).
  * 1 caso práctico basado en una función crítica del cargo.
  * 1 pregunta de motivación.
- Preguntas adicionales solo si son realmente necesarias para evaluar el perfil.
- Si una pregunta requiere opciones (tipo cerrada), asegúrate de rellenar el campo "opciones".
- Si una pregunta es abierta o práctica, asegúrate de rellenar el campo "rubrica" con los criterios de evaluación.

[ESTRICTO] Genera absolutamente todos los textos, títulos, preguntas, rúbricas y categorías en ESPAÑOL. No incluyas introducciones, comentarios ni saludos fuera de la estructura solicitada por el sistema.`;
    }
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
      indicadores: cleanIndicadores,
      prompt: this.prompt,
      preguntas: this.preguntas
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
        console.log("se ejecuta")
        this.perfilService.createPerfilIA(payload).subscribe({
          next: (res) => console.log('Perfil IA enviado con éxito:', res),
          error: (err) => console.error('Error al enviar Perfil IA:', err)
        });
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

  generateQuestionsWithAI(): void {
    if (!this.area.trim() || !this.cargo.trim()) {
      alert('Por favor complete los campos obligatorios: Área y Cargo antes de generar preguntas.');
      return;
    }

    const cleanFunciones = this.funciones.filter(f => f.trim() !== '');
    const cleanConocimientos = this.conocimientos_basicos.filter(c => c.trim() !== '');
    const cleanCompetencias = this.competencias.filter(c => c.trim() !== '');
    const cleanIndicadores = this.indicadores.filter(i => i.nombre.trim() !== '' || i.nivel.trim() !== '' || i.formula.trim() !== '');

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
      indicadores: cleanIndicadores,
      prompt: this.prompt,
      preguntas: this.preguntas
    };

    this.generatingQuestions = true;

    this.perfilService.generateQuestions(this.area, this.cargo, perfilJson).subscribe({
      next: (preguntas) => {
        this.preguntas = this.parsePreguntas(preguntas);
        this.generatingQuestions = false;
        alert('Preguntas del cargo generadas exitosamente.');
      },
      error: (err) => {
        alert('Error al generar las preguntas: ' + (err.error?.error || err.message));
        this.generatingQuestions = false;
        console.error(err);
      }
    });
  }

  parsePreguntas(data: any): any[] {
    let list: any[] = [];
    if (!data) return [];
    if (Array.isArray(data)) {
      if (data.length > 0 && data[0].preguntas && Array.isArray(data[0].preguntas)) {
        list = data[0].preguntas;
      } else {
        list = data;
      }
    } else if (data.preguntas && Array.isArray(data.preguntas)) {
      list = data.preguntas;
    } else {
      return [];
    }

    return list.map(p => {
      const tipoNormalized = this.normalizeTipo(p.tipo);

      // Look for any key containing "rubri" case-insensitively
      const rubricaKey = Object.keys(p).find(k => k.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes('rubri'));
      const rawRubrica = rubricaKey ? p[rubricaKey] : null;

      return {
        ...p,
        tipo: tipoNormalized,
        categoria: this.normalizeCategory(p.categoria),
        rubrica_evaluacion: tipoNormalized === 'Abierta' ? this.normalizeRubrica(rawRubrica) : undefined
      };
    });
  }

  normalizeTipo(tipo: string): string {
    if (!tipo) return 'Abierta';
    const t = tipo.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (t === 'cerrada') return 'Cerrada';
    return 'Abierta';
  }

  normalizeCategory(cat: string): string {
    if (!cat) return 'Técnica';
    const c = cat.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    if (c.includes('tecnic')) return 'Técnica';
    if (c.includes('experienc')) return 'Experiencia';
    if (c.includes('competenci')) return 'Competencias';
    if (c.includes('caso') || c.includes('practic')) return 'Caso Práctico';
    if (c.includes('motivac')) return 'Motivación';
    if (c.includes('disponibil')) return 'Disponibilidad';
    return 'Técnica';
  }

  normalizeRubrica(rubrica: any): { insuficiente: string; aceptable: string; excelente: string } {
    if (!rubrica) {
      return { insuficiente: '', aceptable: '', excelente: '' };
    }
    if (typeof rubrica === 'string') {
      return {
        insuficiente: '',
        aceptable: rubrica,
        excelente: ''
      };
    }

    // Find keys case-insensitively and accent-insensitively
    const keys = Object.keys(rubrica);
    const keyIns = keys.find(k => {
      const normalizedKey = k.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      return normalizedKey.includes('insuf') || normalizedKey.includes('bajo') || normalizedKey === 'i';
    });
    const keyAce = keys.find(k => {
      const normalizedKey = k.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      return normalizedKey.includes('acept') || normalizedKey.includes('med') || normalizedKey === 'a';
    });
    const keyExc = keys.find(k => {
      const normalizedKey = k.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      return normalizedKey.includes('excel') || normalizedKey.includes('alt') || normalizedKey === 'e';
    });

    return {
      insuficiente: keyIns ? rubrica[keyIns] : '',
      aceptable: keyAce ? rubrica[keyAce] : '',
      excelente: keyExc ? rubrica[keyExc] : ''
    };
  }

}

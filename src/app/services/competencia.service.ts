import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface GrupoCargo { id: string; nombre: string; }
export interface CategoriaCompetencia { id: string; nombre: string; }

export interface NivelGrupo {
  nivel_requerido: number;
  peso: number; // fracción: 0.08 = 8 %
}

export interface Competencia {
  id?: string;
  categoria: string;
  nombre: string;
  definicion: string;
  conductas_observables: string;
  justificacion_peso: string;
  riesgo_organizacional: string;
  pregunta_seleccion: string;
  criterio_evaluacion: string;
  orden?: number;
  activo: boolean;
  grupos: { [grupo: string]: NivelGrupo };
}

export interface MatrizCompetencias {
  competencias: Competencia[];
  grupos: GrupoCargo[];
  categorias: CategoriaCompetencia[];
  principales_entrevista: number;
}

export interface CompetenciaEntrevista {
  id: string;
  categoria: string;
  nombre: string;
  definicion: string;
  conductas_observables: string;
  pregunta_seleccion: string;
  criterio_evaluacion: string;
  nivel_requerido: number;
  peso: number;
  principal: boolean;
}

export interface CompetenciasEntrevista {
  grupo: string;
  grupo_nombre: string;
  principales: number;
  competencias: CompetenciaEntrevista[];
}

// Mismos grupos que el backend (config/competencias.js); sirven para formularios sin cargar la matriz
export const GRUPOS_CARGO: GrupoCargo[] = [
  { id: 'DIRECTIVO', nombre: 'Directivo' },
  { id: 'COORDINADOR', nombre: 'Coordinador' },
  { id: 'ANALISTA', nombre: 'Analista' },
  { id: 'FACILITADOR', nombre: 'Facilitador' },
  { id: 'OPERARIO', nombre: 'Operario' }
];

export function nombreGrupoCargo(id?: string | null): string {
  return GRUPOS_CARGO.find(g => g.id === id)?.nombre || '';
}

@Injectable({
  providedIn: 'root'
})
export class CompetenciaService {
  private apiUrl = `${environment.apiUrl}/competencias`;

  constructor(private http: HttpClient) {}

  getMatriz(incluirInactivas = false): Observable<MatrizCompetencias> {
    const url = incluirInactivas ? `${this.apiUrl}?incluir_inactivas=1` : this.apiUrl;
    return this.http.get<{ data: MatrizCompetencias }>(url).pipe(map(r => r.data));
  }

  guardarMatriz(competencias: Competencia[]): Observable<Competencia[]> {
    return this.http.put<{ data: { competencias: Competencia[] } }>(this.apiUrl, { competencias }).pipe(map(r => r.data.competencias));
  }

  getParaEntrevista(grupo: string): Observable<CompetenciasEntrevista> {
    return this.http.get<{ data: CompetenciasEntrevista }>(`${this.apiUrl}/entrevista`, { params: { grupo } }).pipe(map(r => r.data));
  }
}

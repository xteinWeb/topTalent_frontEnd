import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface EtapaEmbudo { id: string; nombre: string; n: number; pct: number; }
export interface Tiempo { promedio_dias: number | null; mediciones: number; }
export interface MotivoConteo { motivo: string; n: number; pct: number; }

export interface ResumenPostulaciones {
  postulaciones: number;
  contratados: number;
  salidas: number;
  en_proceso: number;
  tasa_contratacion: number;
  embudo: EtapaEmbudo[];
}

export interface ReporteIndicadores {
  periodo: { desde: string; hasta: string };
  agrupar: 'area' | 'lider';
  agrupar_nombre: string;
  resumen: ResumenPostulaciones & { vacantes: number };
  tiempos: { solicitud_a_autorizacion: Tiempo; autorizacion_a_publicacion: Tiempo; postulacion_a_contratacion: Tiempo };
  grupos: Array<ResumenPostulaciones & {
    grupo: string;
    vacantes: number;
    tiempos: { solicitud_a_autorizacion: Tiempo; postulacion_a_contratacion: Tiempo };
    motivos: MotivoConteo[];
  }>;
  vacantes: Array<ResumenPostulaciones & {
    vacante: string; area: string; lider: string; estado_vacante: string; dias_solicitud_a_autorizacion: number | null;
  }>;
  motivos: MotivoConteo[];
}

export interface FiltrosReporte { desde: string; hasta: string; agrupar: 'area' | 'lider'; }

@Injectable({
  providedIn: 'root'
})
export class ReporteService {
  private apiUrl = `${environment.apiUrl}/reportes/indicadores`;

  constructor(private http: HttpClient) {}

  private params(f: FiltrosReporte): HttpParams {
    return new HttpParams().set('desde', f.desde).set('hasta', f.hasta).set('agrupar', f.agrupar);
  }

  getIndicadores(f: FiltrosReporte): Observable<ReporteIndicadores> {
    return this.http.get<{ data: ReporteIndicadores }>(this.apiUrl, { params: this.params(f) }).pipe(map(r => r.data));
  }

  descargarExcel(f: FiltrosReporte): Observable<HttpResponse<Blob>> {
    return this.http.get(`${this.apiUrl}/excel`, { params: this.params(f), observe: 'response', responseType: 'blob' });
  }
}

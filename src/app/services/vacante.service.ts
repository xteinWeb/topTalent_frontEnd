import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { PerfilJson } from './perfil.service';

export interface Vacante {
  id?: string;
  empresa_id?: string;
  empresa_nombre?: string;
  perfil_id: string;
  perfil_cargo?: string;
  perfil_area?: string;
  perfil_completo_json?: PerfilJson;
  matriz_competencias_json?: any;
  titulo: string;
  descripcion: string;
  estado?: string;
  requiere_registro?: boolean;
  configuracion_json?: any;

  // Extensiones Gobernanza y Requerimientos
  solicitado_por_id?: string;
  solicitado_por_nombre?: string;
  autorizado_por_id?: string;
  autorizado_por_nombre?: string;
  estado_aprobacion?: 'PENDIENTE' | 'Aprobado' | 'Aprobado con reservas' | 'No aprobado' | 'Con observaciones' | string;
  observaciones_aprobacion?: string;
  tipo_requerimiento?: 'NUEVO_CARGO' | 'REEMPLAZO' | string;
  nombre_reemplaza?: string;
  seccion_area?: string;
  salario_min?: number;
  salario_max?: number;
  perfil_oculto_json?: any;
  fecha_solicitud?: string;
  fecha_autorizacion?: string;

  fecha_creacion?: string;
  fecha_actualizacion?: string;
}

interface ApiResponse<T> {
  data: T;
  token?: string;
}

function normalizeVacante(v: any): Vacante {
  if (!v) return v;
  if (typeof v.perfil_completo_json === 'string') {
    try { v.perfil_completo_json = JSON.parse(v.perfil_completo_json); } catch (e) {}
  }
  if (typeof v.matriz_competencias_json === 'string') {
    try { v.matriz_competencias_json = JSON.parse(v.matriz_competencias_json); } catch (e) {}
  }
  if (typeof v.perfil_oculto_json === 'string') {
    try { v.perfil_oculto_json = JSON.parse(v.perfil_oculto_json); } catch (e) {}
  }
  if (typeof v.configuracion_json === 'string') {
    try { v.configuracion_json = JSON.parse(v.configuracion_json); } catch (e) {}
  }
  return v;
}

@Injectable({
  providedIn: 'root'
})
export class VacanteService {
  private apiUrl = `${environment.apiUrl}/vacantes`;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  getVacantes(empresaId?: string, solicitadoPorId?: string): Observable<Vacante[]> {
    const user = this.authService.getCurrentUser();
    const targetEmpresa = empresaId || user?.empresa_id;
    let params = new HttpParams();
    if (targetEmpresa) {
      params = params.set('empresa_id', targetEmpresa);
    }
    if (solicitadoPorId) {
      params = params.set('solicitado_por_id', solicitadoPorId);
    }
    return this.http.get<ApiResponse<Vacante[]>>(this.apiUrl, { params }).pipe(
      map(res => (res.data || []).map(normalizeVacante))
    );
  }

  getVacantesActivas(empresaId?: string): Observable<Vacante[]> {
    let params = new HttpParams();
    if (empresaId) {
      params = params.set('empresa_id', empresaId);
    }
    return this.http.get<ApiResponse<Vacante[]>>(`${this.apiUrl}/public`, { params }).pipe(
      map(res => (res.data || []).map(normalizeVacante))
    );
  }

  getPendientesAutorizacion(empresaId?: string): Observable<Vacante[]> {
    const user = this.authService.getCurrentUser();
    const targetEmpresa = empresaId || user?.empresa_id;
    let params = new HttpParams();
    if (targetEmpresa) {
      params = params.set('empresa_id', targetEmpresa);
    }
    return this.http.get<ApiResponse<Vacante[]>>(`${this.apiUrl}/pendientes-autorizacion`, { params }).pipe(
      map(res => (res.data || []).map(normalizeVacante))
    );
  }

  getVacante(id: string): Observable<Vacante> {
    return this.http.get<ApiResponse<Vacante>>(`${this.apiUrl}/${id}`).pipe(
      map(res => normalizeVacante(res.data))
    );
  }

  solicitarVacante(payload: Partial<Vacante>): Observable<any> {
    const user = this.authService.getCurrentUser();
    if (!payload.empresa_id && user?.empresa_id) {
      payload.empresa_id = user.empresa_id;
    }
    if (!payload.solicitado_por_id && user?.id) {
      payload.solicitado_por_id = user.id;
    }
    return this.http.post<any>(`${this.apiUrl}/solicitar`, payload);
  }

  autorizarVacante(id: string, payload: {
    estado_aprobacion: string;
    observaciones_aprobacion?: string;
    autorizado_por_id?: string;
  }): Observable<any> {
    const user = this.authService.getCurrentUser();
    if (!payload.autorizado_por_id && user?.id) {
      payload.autorizado_por_id = user.id;
    }
    return this.http.put<any>(`${this.apiUrl}/${id}/autorizar`, payload);
  }

  activarVacante(id: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}/activar`, {});
  }

  desactivarVacante(id: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}/desactivar`, {});
  }

  createVacante(vacante: Vacante): Observable<any> {
    const user = this.authService.getCurrentUser();
    if (!vacante.empresa_id && user?.empresa_id) {
      vacante.empresa_id = user.empresa_id;
    }
    return this.http.post<ApiResponse<any>>(this.apiUrl, vacante).pipe(
      map(res => res.data)
    );
  }

  updateVacante(id: string, vacante: Vacante): Observable<any> {
    return this.http.put<ApiResponse<any>>(`${this.apiUrl}/${id}`, vacante).pipe(
      map(res => res.data)
    );
  }

  deleteVacante(id: string): Observable<any> {
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/${id}`).pipe(
      map(res => res.data)
    );
  }
}

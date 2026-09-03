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
  perfil_completo_json?: PerfilJson;
  titulo: string;
  descripcion: string;
  estado?: string;
  requiere_registro?: boolean;
  configuracion_json?: any;
  fecha_creacion?: string;
  fecha_actualizacion?: string;
}

interface ApiResponse<T> {
  data: T;
  token?: string;
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

  getVacantes(empresaId?: string): Observable<Vacante[]> {
    const user = this.authService.getCurrentUser();
    const targetEmpresa = empresaId || user?.empresa_id;
    let params = new HttpParams();
    if (targetEmpresa) {
      params = params.set('empresa_id', targetEmpresa);
    }
    return this.http.get<ApiResponse<Vacante[]>>(this.apiUrl, { params }).pipe(
      map(res => res.data)
    );
  }

  getVacantesActivas(empresaId?: string): Observable<Vacante[]> {
    let params = new HttpParams();
    if (empresaId) {
      params = params.set('empresa_id', empresaId);
    }
    return this.http.get<ApiResponse<Vacante[]>>(`${this.apiUrl}/public`, { params }).pipe(
      map(res => res.data)
    );
  }

  getVacante(id: string): Observable<Vacante> {
    return this.http.get<ApiResponse<Vacante>>(`${this.apiUrl}/${id}`).pipe(
      map(res => res.data)
    );
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

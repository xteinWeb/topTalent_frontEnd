import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface PerfilJson {
  contractual?: string;
  reporta_a?: string;
  supervisa?: string;
  proposito?: string;
  funciones?: string[];
  autoridad?: string;
  requisitos?: {
    formacion?: string;
    experiencia?: string;
    conocimientos_basicos?: string[];
    competencias?: string[];
  };
  indicadores?: Array<{
    nombre: string;
    nivel: string;
    formula: string;
  }>;
}

export interface PerfilCargo {
  id?: string;
  area: string;
  cargo: string;
  perfil_json: PerfilJson;
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
export class PerfilService {
  private apiUrl = `${environment.apiUrl}/perfiles`;

  constructor(private http: HttpClient) {}

  getPerfiles(): Observable<PerfilCargo[]> {
    return this.http.get<ApiResponse<PerfilCargo[]>>(this.apiUrl).pipe(
      map(res => res.data)
    );
  }

  getPerfil(id: string): Observable<PerfilCargo> {
    return this.http.get<ApiResponse<PerfilCargo>>(`${this.apiUrl}/${id}`).pipe(
      map(res => res.data)
    );
  }

  createPerfil(perfil: PerfilCargo): Observable<any> {
    return this.http.post<ApiResponse<any>>(this.apiUrl, perfil).pipe(
      map(res => res.data)
    );
  }

  updatePerfil(id: string, perfil: PerfilCargo): Observable<any> {
    return this.http.put<ApiResponse<any>>(`${this.apiUrl}/${id}`, perfil).pipe(
      map(res => res.data)
    );
  }

  deletePerfil(id: string): Observable<any> {
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/${id}`).pipe(
      map(res => res.data)
    );
  }
}

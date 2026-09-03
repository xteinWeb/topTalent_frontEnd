import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

export interface PerfilJson {
  contractual?: string;
  reporta_a?: string;
  supervisa?: string;
  proposito?: string;
  funciones?: string[];
  autoridad?: string;
  identificacion?: {
    ubicacion?: string;
    salario?: string;
    modalidad?: string;
    tipo_contrato?: string;
  };
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
  prompt?: string;
  preguntas?: any;
}

export interface PerfilCargo {
  id?: string;
  empresa_id?: string;
  empresa_nombre?: string;
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

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

  getPerfiles(empresaId?: string): Observable<PerfilCargo[]> {
    const user = this.authService.getCurrentUser();
    const targetEmpresa = empresaId || user?.empresa_id;
    let params = new HttpParams();
    if (targetEmpresa) {
      params = params.set('empresa_id', targetEmpresa);
    }
    return this.http.get<ApiResponse<PerfilCargo[]>>(this.apiUrl, { params }).pipe(
      map(res => res.data)
    );
  }

  getPerfil(id: string): Observable<PerfilCargo> {
    return this.http.get<ApiResponse<PerfilCargo>>(`${this.apiUrl}/${id}`).pipe(
      map(res => res.data)
    );
  }

  createPerfil(perfil: PerfilCargo): Observable<any> {
    const user = this.authService.getCurrentUser();
    if (!perfil.empresa_id && user?.empresa_id) {
      perfil.empresa_id = user.empresa_id;
    }
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

  generateQuestions(id: string | undefined, area: string, cargo: string, perfilJson: PerfilJson): Observable<any> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/generate-questions`, { id, area, cargo, perfil_json: perfilJson }).pipe(
      map(res => res.data)
    );
  }

  createPerfilIA(perfil: PerfilCargo): Observable<any> {

    return this.http.post<any>('https://agentes.colchonessunmoon.com/webhook/206de3fe-864d-43ba-994c-d0d7b2544ac9', perfil);
  }
}

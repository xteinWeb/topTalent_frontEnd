import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, tap, map } from 'rxjs';
import { environment } from '../../environments/environment';

export interface CandidatoSession {
  id: string;
  email: string;
  role: string;
}

export interface CandidatoResponse {
  success: boolean;
  token: string;
  user: CandidatoSession;
}

export interface CandidatoPerfil {
  id: string;
  email: string;
  perfil_completo_json?: any;
  hv_archivo_nombre?: string;
  hv_archivo_ruta?: string;
  acepto_tratamiento_datos?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class CandidatoService {
  private apiUrl = `${environment.apiUrl}/candidatos`;

  private loggedInSubject = new BehaviorSubject<boolean>(this.hasToken());
  public isLoggedIn$ = this.loggedInSubject.asObservable();

  constructor(private http: HttpClient) {}

  private hasToken(): boolean {
    return !!localStorage.getItem('candidato_token');
  }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('candidato_token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  registro(email: string, password: string, aceptoTratamientoDatos: boolean): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/registro`, { email, password, acepto_tratamiento_datos: aceptoTratamientoDatos });
  }

  verificarCodigo(email: string, codigo: string): Observable<CandidatoResponse> {
    return this.http.post<CandidatoResponse>(`${this.apiUrl}/verificar`, { email, codigo }).pipe(
      tap(res => {
        if (res && res.token) {
          localStorage.setItem('candidato_token', res.token);
          localStorage.setItem('candidato_user', JSON.stringify(res.user));
          this.loggedInSubject.next(true);
        }
      })
    );
  }

  login(email: string, password: string): Observable<CandidatoResponse> {
    return this.http.post<CandidatoResponse>(`${this.apiUrl}/login`, { email, password }).pipe(
      tap(res => {
        if (res && res.token) {
          localStorage.setItem('candidato_token', res.token);
          localStorage.setItem('candidato_user', JSON.stringify(res.user));
          this.loggedInSubject.next(true);
        }
      })
    );
  }

  logout(): void {
    localStorage.removeItem('candidato_token');
    localStorage.removeItem('candidato_user');
    this.loggedInSubject.next(false);
  }

  isLoggedIn(): boolean {
    return this.loggedInSubject.value;
  }

  getToken(): string | null {
    return localStorage.getItem('candidato_token');
  }

  getCurrentUser(): CandidatoSession | null {
    const userStr = localStorage.getItem('candidato_user');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  getPerfil(): Observable<CandidatoPerfil> {
    return this.http.get<{ data: CandidatoPerfil }>(`${this.apiUrl}/perfil`, { headers: this.getHeaders() }).pipe(
      map(res => res.data)
    );
  }

  updatePerfil(perfil: { perfil_completo_json: any }, archivo?: File): Observable<any> {
    const formData = new FormData();
    formData.append('perfil_completo_json', JSON.stringify(perfil.perfil_completo_json));
    if (archivo) {
      formData.append('hv_archivo', archivo, archivo.name);
    }
    return this.http.put(`${this.apiUrl}/perfil`, formData, { headers: this.getHeaders() });
  }
}

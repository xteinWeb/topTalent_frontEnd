import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap, map } from 'rxjs';
import { environment } from '../../environments/environment';

export interface UserSession {
  id?: string;
  username: string;
  nombre?: string;
  email?: string;
  empresa_id?: string;
  empresa_nombre?: string;
  role: string;
  area?: string;
}

export interface LiderArea {
  id: string;
  nombre: string;
  area?: string;
  email?: string;
}

export interface LoginResponse {
  success: boolean;
  token: string;
  user: UserSession;
}

export interface AdminProfileResponse {
  data: {
    id: string;
    empresa_id: string;
    empresa_nombre: string;
    empresa_activo?: boolean;
    empresa_fecha_creacion?: string;
    nombre: string;
    username: string;
    email: string;
    rol: string;
    activo: boolean;
    fecha_creacion: string;
    fecha_actualizacion: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private baseAuthUrl = `${environment.apiUrl}/auth`;
  
  // Keep track of logged in status
  private loggedInSubject = new BehaviorSubject<boolean>(this.hasToken());
  public isLoggedIn$ = this.loggedInSubject.asObservable();

  constructor(private http: HttpClient) {}

  private hasToken(): boolean {
    return !!localStorage.getItem('auth_token');
  }

  login(username: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.baseAuthUrl}/login`, { username, password }).pipe(
      tap(res => {
        if (res && res.token) {
          localStorage.setItem('auth_token', res.token);
          localStorage.setItem('auth_user', JSON.stringify(res.user));
          this.loggedInSubject.next(true);
        }
      })
    );
  }

  getPerfilAdmin(id: string): Observable<AdminProfileResponse> {
    return this.http.get<AdminProfileResponse>(`${this.baseAuthUrl}/perfil/${id}`);
  }

  updateCredenciales(payload: {
    id: string;
    nombre?: string;
    email?: string;
    password_actual?: string;
    password_nuevo?: string;
  }): Observable<{ success: boolean; message: string; user: UserSession }> {
    return this.http.put<{ success: boolean; message: string; user: UserSession }>(
      `${this.baseAuthUrl}/credenciales`,
      payload
    ).pipe(
      tap(res => {
        if (res && res.user) {
          this.updateLocalSessionUser(res.user);
        }
      })
    );
  }

  updateLocalSessionUser(updatedUser: UserSession): void {
    const current = this.getCurrentUser() || {} as UserSession;
    const merged = { ...current, ...updatedUser };
    localStorage.setItem('auth_user', JSON.stringify(merged));
  }

  getLideres(): Observable<LiderArea[]> {
    return this.http.get<{ data: LiderArea[] }>(`${this.baseAuthUrl}/lideres`).pipe(
      map(res => res.data || [])
    );
  }

  solicitarRecuperacion(usuario: string): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(`${this.baseAuthUrl}/recuperar`, { usuario });
  }

  restablecerPassword(usuario: string, codigo: string, passwordNuevo: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.baseAuthUrl}/restablecer`, { usuario, codigo, password_nuevo: passwordNuevo }).pipe(
      tap(res => {
        if (res && res.token) {
          localStorage.setItem('auth_token', res.token);
          localStorage.setItem('auth_user', JSON.stringify(res.user));
          this.loggedInSubject.next(true);
        }
      })
    );
  }

  logout(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    this.loggedInSubject.next(false);
  }

  isLoggedIn(): boolean {
    return this.loggedInSubject.value;
  }

  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  getCurrentUser(): UserSession | null {
    const userStr = localStorage.getItem('auth_user');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  isSuperAdmin(): boolean {
    const role = this.getCurrentUser()?.role?.toUpperCase();
    return role === 'SUPERADMIN' || role === 'ADMIN' || role === 'ADMINISTRATOR';
  }

  isGerencia(): boolean {
    const role = this.getCurrentUser()?.role?.toUpperCase();
    return role === 'GERENCIA' || this.isSuperAdmin();
  }

  isTalentoHumano(): boolean {
    const role = this.getCurrentUser()?.role?.toUpperCase();
    return role === 'TALENTO_HUMANO' || role === 'TALENTO' || this.isSuperAdmin();
  }

  isLiderArea(): boolean {
    const role = this.getCurrentUser()?.role?.toUpperCase();
    return role === 'LIDER_AREA';
  }
}

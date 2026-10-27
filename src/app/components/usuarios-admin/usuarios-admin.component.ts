import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { UsuarioAdminService, UsuarioAdmin, UsuarioAdminForm, RolAdmin } from '../../services/usuario-admin.service';

// Gestión de usuarios administrativos (Talento Humano y Superadmin): crear líderes y otros administradores,
// editar sus datos, restablecer la contraseña y activarlos o desactivarlos.
@Component({
  selector: 'app-usuarios-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './usuarios-admin.component.html',
  styleUrls: ['./usuarios-admin.component.css']
})
export class UsuariosAdminComponent implements OnInit {
  usuarios: UsuarioAdmin[] = [];
  roles: Array<{ id: RolAdmin; nombre: string }> = [];
  cargando = false;
  error = '';
  aviso = '';

  busqueda = '';
  filtroRol: RolAdmin | '' = '';
  verInactivos = false;

  // Formulario (crear o editar)
  formAbierto = false;
  editando: UsuarioAdmin | null = null;
  form: UsuarioAdminForm = this.formVacio();
  guardando = false;
  errorForm = '';

  constructor(private usuarioService: UsuarioAdminService, public authService: AuthService) {}

  ngOnInit(): void {
    this.cargar();
  }

  get esSuperAdmin(): boolean {
    return this.authService.isSuperAdmin();
  }

  get miId(): string {
    return String(this.authService.getCurrentUser()?.id || '').toLowerCase();
  }

  esYo(u: UsuarioAdmin): boolean {
    return u.id.toLowerCase() === this.miId;
  }

  // Talento Humano no puede gestionar ni asignar el rol de superadmin
  puedeGestionar(u: UsuarioAdmin): boolean {
    return u.rol !== 'SUPERADMIN' || this.esSuperAdmin;
  }

  get rolesAsignables() {
    return this.roles.filter(r => r.id !== 'SUPERADMIN' || this.esSuperAdmin);
  }

  get areasConocidas(): string[] {
    return [...new Set(this.usuarios.map(u => u.area).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es'));
  }

  get usuariosFiltrados(): UsuarioAdmin[] {
    const q = this.busqueda.trim().toLowerCase();
    return this.usuarios.filter(u =>
      (this.verInactivos || u.activo) &&
      (!this.filtroRol || u.rol === this.filtroRol) &&
      (!q || [u.nombre, u.username, u.email, u.area].some(v => (v || '').toLowerCase().includes(q)))
    );
  }

  get totalInactivos(): number {
    return this.usuarios.filter(u => !u.activo).length;
  }

  nombreRol(rol: RolAdmin): string {
    return this.roles.find(r => r.id === rol)?.nombre || rol;
  }

  cargar(): void {
    this.cargando = true;
    this.error = '';
    this.usuarioService.listar().subscribe({
      next: (r) => {
        this.usuarios = r.data;
        this.roles = r.roles;
        this.cargando = false;
      },
      error: (err) => {
        this.cargando = false;
        this.error = err.error?.error || 'No se pudieron cargar los usuarios.';
      }
    });
  }

  private formVacio(): UsuarioAdminForm {
    return { nombre: '', username: '', email: '', rol: 'LIDER_AREA', area: '', password: '' };
  }

  abrirNuevo(): void {
    this.editando = null;
    this.form = this.formVacio();
    this.errorForm = '';
    this.formAbierto = true;
  }

  abrirEdicion(u: UsuarioAdmin): void {
    this.editando = u;
    this.form = { nombre: u.nombre, username: u.username, email: u.email, rol: u.rol, area: u.area, password: '' };
    this.errorForm = '';
    this.formAbierto = true;
  }

  cerrarForm(): void {
    if (this.guardando) return;
    this.formAbierto = false;
  }

  // Sugerencia de usuario a partir del nombre (nombre.apellido, sin tildes)
  sugerirUsuario(): void {
    if (this.editando || this.form.username) return;
    const partes = this.form.nombre.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
      .replace(/[^a-z\s]/g, '').trim().split(/\s+/).filter(Boolean);
    if (partes.length > 0) this.form.username = partes.length > 1 ? `${partes[0]}.${partes[1]}` : partes[0];
  }

  guardar(): void {
    this.errorForm = '';
    if (!this.form.nombre.trim() || !this.form.email.trim() || (!this.editando && !this.form.username?.trim())) {
      this.errorForm = 'Complete nombre, usuario y correo.';
      return;
    }
    if (this.form.rol === 'LIDER_AREA' && !this.form.area.trim()) {
      this.errorForm = 'Indique el área del líder.';
      return;
    }
    if (!this.editando && (this.form.password || '').length < 6) {
      this.errorForm = 'La contraseña inicial debe tener al menos 6 caracteres.';
      return;
    }
    if (this.editando && this.form.password && this.form.password.length < 6) {
      this.errorForm = 'La nueva contraseña debe tener al menos 6 caracteres.';
      return;
    }

    this.guardando = true;
    const { username, password, ...resto } = this.form;
    const peticion = this.editando
      ? this.usuarioService.actualizar(this.editando.id, { ...resto, ...(password ? { password } : {}) })
      : this.usuarioService.crear(this.form);

    peticion.subscribe({
      next: (u) => {
        this.guardando = false;
        this.formAbierto = false;
        this.aviso = this.editando
          ? `Se actualizó a ${u.nombre}.`
          : `Se creó el usuario ${u.username}. Compártale la contraseña inicial; podrá cambiarla en "Empresa y credenciales".`;
        this.cargar();
      },
      error: (err) => {
        this.guardando = false;
        this.errorForm = err.error?.error || 'No se pudo guardar el usuario.';
      }
    });
  }

  cambiarActivo(u: UsuarioAdmin): void {
    const accion = u.activo ? 'desactivar' : 'activar';
    if (u.activo && !confirm(`¿Desactivar a ${u.nombre}? No podrá iniciar sesión hasta que se active de nuevo.`)) return;
    this.usuarioService.actualizar(u.id, { activo: !u.activo }).subscribe({
      next: (actualizado) => {
        u.activo = actualizado.activo;
        this.aviso = `Se ${u.activo ? 'activó' : 'desactivó'} a ${u.nombre}.`;
      },
      error: (err) => {
        this.error = err.error?.error || `No se pudo ${accion} el usuario.`;
      }
    });
  }
}

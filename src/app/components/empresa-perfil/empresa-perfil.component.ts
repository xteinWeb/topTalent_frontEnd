import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService, UserSession } from '../../services/auth.service';

@Component({
  selector: 'app-empresa-perfil',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './empresa-perfil.component.html',
  styleUrls: ['./empresa-perfil.component.css']
})
export class EmpresaPerfilComponent implements OnInit {
  loading: boolean = true;
  saving: boolean = false;
  successMessage: string = '';
  errorMessage: string = '';

  // Company and Admin profile data
  adminData: any = {
    id: '',
    empresa_id: '',
    empresa_nombre: '',
    empresa_activo: true,
    empresa_fecha_creacion: '',
    nombre: '',
    username: '',
    email: '',
    rol: 'ADMIN',
    activo: true,
    fecha_creacion: ''
  };

  // Form fields for editing
  editNombre: string = '';
  editEmail: string = '';
  passwordActual: string = '';
  passwordNuevo: string = '';
  passwordConfirm: string = '';

  showPasswordActual: boolean = false;
  showPasswordNuevo: boolean = false;
  showPasswordConfirm: boolean = false;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.cargarPerfil();
  }

  cargarPerfil(): void {
    this.loading = true;
    this.errorMessage = '';
    const currentUser = this.authService.getCurrentUser();

    if (!currentUser || !currentUser.id) {
      this.errorMessage = 'No se encontró una sesión activa válida.';
      this.loading = false;
      return;
    }

    this.authService.getPerfilAdmin(currentUser.id).subscribe({
      next: (res) => {
        this.loading = false;
        if (res && res.data) {
          this.adminData = res.data;
          this.editNombre = res.data.nombre || '';
          this.editEmail = res.data.email || '';
        }
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.error || 'Error al cargar los datos del perfil.';
        console.error(err);
      }
    });
  }

  onSubmit(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.editNombre.trim()) {
      this.errorMessage = 'El nombre del administrador es obligatorio.';
      return;
    }

    if (this.passwordNuevo) {
      if (!this.passwordActual) {
        this.errorMessage = 'Debe ingresar su contraseña actual para establecer una nueva.';
        return;
      }
      if (this.passwordNuevo.length < 6) {
        this.errorMessage = 'La nueva contraseña debe tener al menos 6 caracteres.';
        return;
      }
      if (this.passwordNuevo !== this.passwordConfirm) {
        this.errorMessage = 'La nueva contraseña y su confirmación no coinciden.';
        return;
      }
    }

    this.saving = true;
    const payload: any = {
      id: this.adminData.id,
      nombre: this.editNombre.trim(),
      email: this.editEmail.trim()
    };

    if (this.passwordNuevo) {
      payload.password_actual = this.passwordActual;
      payload.password_nuevo = this.passwordNuevo;
    }

    this.authService.updateCredenciales(payload).subscribe({
      next: (res) => {
        this.saving = false;
        this.successMessage = res.message || 'Credenciales y perfil actualizados exitosamente.';
        this.passwordActual = '';
        this.passwordNuevo = '';
        this.passwordConfirm = '';
        this.cargarPerfil();
      },
      error: (err) => {
        this.saving = false;
        this.errorMessage = err.error?.error || 'Error al actualizar las credenciales.';
        console.error(err);
      }
    });
  }
}

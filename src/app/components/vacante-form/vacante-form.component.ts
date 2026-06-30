import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { VacanteService, Vacante } from '../../services/vacante.service';
import { PerfilService, PerfilCargo } from '../../services/perfil.service';

@Component({
  selector: 'app-vacante-form',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './vacante-form.component.html',
  styleUrls: ['./vacante-form.component.css']
})
export class VacanteFormComponent implements OnInit {
  isEditMode: boolean = false;
  id?: string;

  // Form Fields
  perfil_id: string = '';
  titulo: string = '';
  descripcion: string = '';
  estado: string = 'ACTIVA';

  perfiles: PerfilCargo[] = [];
  submitting: boolean = false;
  loading: boolean = false;
  errorMsg: string = '';

  constructor(
    private vacanteService: VacanteService,
    private perfilService: PerfilService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.loadPerfiles();
    
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.id = params['id'];
        this.loadVacante(this.id!);
      }
    });
  }

  loadPerfiles(): void {
    this.perfilService.getPerfiles().subscribe({
      next: (data) => {
        this.perfiles = data;
      },
      error: (err) => {
        console.error('Error al cargar perfiles:', err);
      }
    });
  }

  loadVacante(id: string): void {
    this.loading = true;
    this.vacanteService.getVacante(id).subscribe({
      next: (data) => {
        this.perfil_id = data.perfil_id;
        this.titulo = data.titulo;
        this.descripcion = data.descripcion;
        this.estado = data.estado || 'ACTIVA';
        this.loading = false;
      },
      error: (err) => {
        this.errorMsg = 'No se pudo cargar la vacante seleccionada.';
        this.loading = false;
        console.error(err);
      }
    });
  }

  onSubmit(): void {
    if (!this.perfil_id || !this.titulo.trim() || !this.descripcion.trim()) {
      alert('Por favor complete todos los campos obligatorios: Perfil de Cargo, Título y Descripción.');
      return;
    }

    this.submitting = true;

    const payload: Vacante = {
      perfil_id: this.perfil_id,
      titulo: this.titulo,
      descripcion: this.descripcion,
      estado: this.estado
    };

    const request$ = this.isEditMode
      ? this.vacanteService.updateVacante(this.id!, payload)
      : this.vacanteService.createVacante(payload);

    request$.subscribe({
      next: () => {
        this.submitting = false;
        this.router.navigate(['/vacantes']);
      },
      error: (err) => {
        alert('Error al guardar la vacante: ' + (err.error?.error || err.message));
        this.submitting = false;
        console.error(err);
      }
    });
  }
}

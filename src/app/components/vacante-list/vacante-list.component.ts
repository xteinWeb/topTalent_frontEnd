import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { VacanteService, Vacante } from '../../services/vacante.service';

@Component({
  selector: 'app-vacante-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './vacante-list.component.html',
  styleUrls: ['./vacante-list.component.css']
})
export class VacanteListComponent implements OnInit {
  vacantes: Vacante[] = [];
  filteredVacantes: Vacante[] = [];
  searchTerm: string = '';
  loading: boolean = true;
  errorMsg: string = '';

  constructor(private vacanteService: VacanteService) {}

  ngOnInit(): void {
    this.loadVacantes();
  }

  loadVacantes(): void {
    this.loading = true;
    this.vacanteService.getVacantes().subscribe({
      next: (data) => {
        this.vacantes = data;
        this.filterVacantes();
        this.loading = false;
      },
      error: (err) => {
        this.errorMsg = 'Error al cargar las vacantes. Verifica que el backend esté ejecutándose.';
        this.loading = false;
        console.error(err);
      }
    });
  }

  filterVacantes(): void {
    if (!this.searchTerm.trim()) {
      this.filteredVacantes = this.vacantes;
      return;
    }

    const term = this.searchTerm.toLowerCase();
    this.filteredVacantes = this.vacantes.filter(v => 
      v.titulo.toLowerCase().includes(term) || 
      (v.perfil_cargo && v.perfil_cargo.toLowerCase().includes(term))
    );
  }

  toggleEstado(vacante: Vacante): void {
    if (!vacante.id) return;
    const nuevoEstado = vacante.estado === 'ACTIVA' ? 'INACTIVA' : 'ACTIVA';
    const updatedVacante = { ...vacante, estado: nuevoEstado };
    
    this.vacanteService.updateVacante(vacante.id, updatedVacante).subscribe({
      next: () => {
        vacante.estado = nuevoEstado;
      },
      error: (err) => {
        alert('Error al actualizar el estado de la vacante.');
        console.error(err);
      }
    });
  }

  deleteVacante(id: string | undefined): void {
    if (!id) return;
    if (confirm('¿Está seguro de que desea eliminar esta vacante? Todos los postulantes asociados serán eliminados.')) {
      this.vacanteService.deleteVacante(id).subscribe({
        next: () => {
          this.loadVacantes();
        },
        error: (err) => {
          alert('Error al eliminar la vacante.');
          console.error(err);
        }
      });
    }
  }
}

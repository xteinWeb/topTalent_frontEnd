import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { VacanteService, Vacante } from '../../services/vacante.service';

@Component({
  selector: 'app-ofertas-publicas-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './ofertas-publicas-list.component.html',
  styleUrls: ['./ofertas-publicas-list.component.css']
})
export class OfertasPublicasListComponent implements OnInit {
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
    this.vacanteService.getVacantesActivas().subscribe({
      next: (data) => {
        this.vacantes = data;
        this.filterVacantes();
        this.loading = false;
      },
      error: (err) => {
        this.errorMsg = 'Error al cargar las ofertas de empleo disponibles.';
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
      v.descripcion.toLowerCase().includes(term)
    );
  }
}

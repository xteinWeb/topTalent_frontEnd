import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PerfilService, PerfilCargo } from '../../services/perfil.service';

@Component({
  selector: 'app-perfil-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './perfil-list.component.html',
  styleUrls: ['./perfil-list.component.css']
})
export class PerfilListComponent implements OnInit {
  perfiles: PerfilCargo[] = [];
  filteredPerfiles: PerfilCargo[] = [];
  searchTerm: string = '';
  loading: boolean = true;
  errorMsg: string = '';

  constructor(private perfilService: PerfilService) {}

  ngOnInit(): void {
    this.loadPerfiles();
  }

  loadPerfiles(): void {
    this.loading = true;
    this.perfilService.getPerfiles().subscribe({
      next: (data) => {
        this.perfiles = data;
        this.filterPerfiles();
        this.loading = false;
      },
      error: (err) => {
        this.errorMsg = 'Error al cargar los perfiles de cargo. Verifica que el backend esté ejecutándose.';
        this.loading = false;
        console.error(err);
      }
    });
  }

  filterPerfiles(): void {
    if (!this.searchTerm.trim()) {
      this.filteredPerfiles = this.perfiles;
      return;
    }

    const term = this.searchTerm.toLowerCase();
    this.filteredPerfiles = this.perfiles.filter(p => 
      p.cargo.toLowerCase().includes(term) || 
      p.area.toLowerCase().includes(term)
    );
  }

  deletePerfil(id: string | undefined): void {
    if (!id) return;
    if (confirm('¿Está seguro de que desea eliminar este perfil de cargo?')) {
      this.perfilService.deletePerfil(id).subscribe({
        next: () => {
          this.loadPerfiles();
        },
        error: (err) => {
          alert('Error al eliminar el perfil.');
          console.error(err);
        }
      });
    }
  }
}

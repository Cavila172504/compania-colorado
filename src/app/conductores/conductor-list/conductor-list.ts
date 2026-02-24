import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConductoresService, Conductor } from '../conductores.service';
import { ExcelService } from '../../shared/excel.service';

@Component({
  selector: 'app-conductor-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './conductor-list.html',
  styleUrl: './conductor-list.scss'
})
export class ConductorListComponent implements OnInit {
  conductores: Conductor[] = [];
  loading: boolean = true;
  showModal: boolean = false;
  editingConductor: Conductor | null = null;
  newConductor: Conductor = this.resetConductor();
  filterTerm: string = '';
  saving: boolean = false;
  saveSuccess: boolean = false;
  errorMessage: string = '';

  constructor(
    private conductoresService: ConductoresService,
    private excelService: ExcelService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.loadConductores();
  }

  get filteredConductores(): Conductor[] {
    if (!this.conductores) return [];
    if (!this.filterTerm.trim()) return this.conductores;
    const term = this.filterTerm.toLowerCase();
    return this.conductores.filter(c =>
      (c.nombre || '').toLowerCase().includes(term) ||
      (c.doc_identidad || '').includes(term) ||
      (c.telefono || '').includes(term)
    );
  }

  async loadConductores() {
    this.loading = true;
    this.cdr.detectChanges();
    try {
      this.conductores = await this.conductoresService.getConductores();
    } catch (error) {
      console.error('Error loading conductores:', error);
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
      setTimeout(() => this.cdr.detectChanges(), 100);
    }
  }

  async exportToExcel() {
    this.loading = true;
    try {
      const columns = [
        { header: 'NOMBRE COMPLETO', key: 'nombre', width: 40 },
        { header: 'CÉDULA', key: 'doc_identidad', width: 20 },
        { header: 'CELULAR', key: 'telefono', width: 20 }
      ];

      await this.excelService.exportToExcel(
        this.filteredConductores,
        'Reporte_Conductores',
        'Conductores',
        columns
      );
    } catch (error) {
      console.error('Error exporting to excel:', error);
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  resetConductor(): Conductor {
    return {
      doc_identidad: '',
      nombre: '',
      telefono: ''
    };
  }

  openModal(c?: Conductor) {
    this.saveSuccess = false;
    this.saving = false;
    this.errorMessage = '';
    if (c) {
      this.editingConductor = c;
      this.newConductor = {
        id: c.id,
        doc_identidad: c.doc_identidad || '',
        nombre: c.nombre || '',
        telefono: c.telefono || ''
      };
    } else {
      this.editingConductor = null;
      this.newConductor = this.resetConductor();
    }
    this.showModal = true;
    this.cdr.detectChanges();

    // Auto focus first field
    setTimeout(() => {
      const input = document.querySelector('input[name="nombre"]') as HTMLInputElement;
      if (input) input.focus();
    }, 300);
  }

  closeModal() {
    if (this.saving) return;
    this.showModal = false;
    this.saveSuccess = false;
    this.errorMessage = '';
    this.cdr.detectChanges();
  }

  onlyNumbers(event: any) {
    const charCode = event.which ? event.which : event.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      event.preventDefault();
    }
  }

  get canSave(): boolean {
    const cedula = (this.newConductor.doc_identidad || '').trim();
    const telf = (this.newConductor.telefono || '').trim();
    const nombre = (this.newConductor.nombre || '').trim();

    return nombre.length >= 3 &&
      cedula.length === 10 &&
      telf.length >= 9 &&
      !this.saving;
  }

  async saveConductor(keepOpen: boolean = false) {
    if (!this.canSave || this.saving) return;

    this.saving = true;
    this.saveSuccess = false;
    this.errorMessage = '';
    this.cdr.detectChanges();

    try {
      const res = this.editingConductor
        ? await this.conductoresService.updateConductor(this.newConductor)
        : await this.conductoresService.addConductor(this.newConductor);

      if (res && res.success) {
        this.saveSuccess = true;

        if (keepOpen) {
          this.newConductor = this.resetConductor();
          this.editingConductor = null;
          // Return focus to name input
          setTimeout(() => {
            const input = document.querySelector('input[name="nombre"]') as HTMLInputElement;
            if (input) input.focus();
          }, 100);
        } else {
          setTimeout(() => this.closeModal(), 800);
        }

        await this.loadConductores();
      } else {
        this.errorMessage = 'Error: ' + (res?.error || 'No se pudo guardar');
      }
    } catch (e: any) {
      this.errorMessage = 'Sist.: ' + e.message;
    } finally {
      this.saving = false;
      this.cdr.detectChanges();

      if (keepOpen && this.saveSuccess) {
        setTimeout(() => {
          this.saveSuccess = false;
          this.cdr.detectChanges();
        }, 2500);
      }
    }
  }

  async deleteConductor(id: number) {
    if (!id) return;
    if (confirm('¿Está seguro de eliminar este conductor?')) {
      this.loading = true;
      try {
        const res = await this.conductoresService.deleteConductor(id);
        if (res && res.success) {
          await this.loadConductores();
        } else {
          console.error('Delete error:', res?.error);
          alert('No se puede eliminar: El conductor está siendo usado en otras secciones.');
        }
      } catch (e: any) {
        console.error('Critical Delete error:', e);
      } finally {
        this.loading = false;
        this.cdr.detectChanges();
      }
    }
  }
}

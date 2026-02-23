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

  constructor(
    private conductoresService: ConductoresService,
    private excelService: ExcelService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.loadConductores();
  }

  get filteredConductores(): Conductor[] {
    if (!this.filterTerm.trim()) return this.conductores;
    const term = this.filterTerm.toLowerCase();
    return this.conductores.filter(c =>
      c.nombre.toLowerCase().includes(term) ||
      c.doc_identidad.includes(term) ||
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
    }
  }

  async exportToExcel() {
    this.loading = true;
    try {
      const columns = [
        { header: 'DOCUMENTO', key: 'doc_identidad', width: 20 },
        { header: 'NOMBRE COMPLETO', key: 'nombre', width: 40 },
        { header: 'TELÉFONO', key: 'telefono', width: 20 },
        { header: 'DIRECCIÓN', key: 'direccion', width: 50 },
        { header: 'LICENCIA', key: 'nro_licencia', width: 20 }
      ];

      await this.excelService.exportToExcel(
        this.filteredConductores,
        'Reporte_Conductores',
        'Conductores',
        columns
      );
    } catch (error) {
      console.error('Error exporting to excel:', error);
      alert('Error al exportar a Excel');
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  resetConductor(): Conductor {
    return {
      doc_identidad: '',
      nombre: '',
      nro_licencia: '',
      direccion: '',
      telefono: '',
      calificacion: 5
    };
  }

  openModal(c?: Conductor) {
    if (c) {
      this.editingConductor = c;
      this.newConductor = {
        id: c.id,
        doc_identidad: c.doc_identidad || '',
        nombre: c.nombre || '',
        nro_licencia: c.nro_licencia || '',
        direccion: c.direccion || '',
        telefono: c.telefono || '',
        calificacion: c.calificacion || 5
      };
    } else {
      this.editingConductor = null;
      this.newConductor = this.resetConductor();
    }
    this.showModal = true;
    this.cdr.detectChanges();
    setTimeout(() => this.cdr.detectChanges(), 100);
  }

  closeModal() {
    this.showModal = false;
    this.cdr.detectChanges();
  }

  onlyNumbers(event: any) {
    // Allow if it's a number or a control key
    const charCode = event.which ? event.which : event.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      event.preventDefault();
    }
  }

  get canSave(): boolean {
    const cedula = (this.newConductor.doc_identidad || '').trim();
    const telf = (this.newConductor.telefono || '').trim();
    const nombre = (this.newConductor.nombre || '').trim();

    return nombre.length > 0 &&
      cedula.length === 10 &&
      !isNaN(Number(cedula)) &&
      telf.length === 10 &&
      !isNaN(Number(telf));
  }

  async saveConductor() {
    if (!this.canSave) return;

    try {
      const res = this.editingConductor
        ? await this.conductoresService.updateConductor(this.newConductor)
        : await this.conductoresService.addConductor(this.newConductor);

      if (res && res.success) {
        this.closeModal();
        this.loadConductores();
      } else {
        alert('Error al guardar: ' + (res?.error || 'Error desconocido'));
      }
    } catch (e: any) {
      alert('Error de sistema: ' + e.message);
    }
  }

  async deleteConductor(id: number) {
    if (confirm('¿Está seguro de eliminar este conductor?')) {
      await this.conductoresService.deleteConductor(id);
      this.loadConductores();
    }
  }
}

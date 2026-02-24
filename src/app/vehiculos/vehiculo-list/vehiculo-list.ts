import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VehiculosService, Vehiculo } from '../vehiculos.service';
import { FormsModule } from '@angular/forms';
import { ExcelService } from '../../shared/excel.service';

@Component({
  selector: 'app-vehiculo-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './vehiculo-list.html',
  styleUrl: './vehiculo-list.scss'
})
export class VehiculoListComponent implements OnInit {
  vehiculos: Vehiculo[] = [];
  loading: boolean = true;
  showModal: boolean = false;
  editingVehiculo: Vehiculo | null = null;
  newVehiculo: Vehiculo = this.resetVehiculo();
  filterTerm: string = '';
  saving: boolean = false;
  saveSuccess: boolean = false;
  errorMessage: string = '';

  constructor(
    private vehiculosService: VehiculosService,
    private excelService: ExcelService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.loadVehiculos();
  }

  get filteredVehiculos(): Vehiculo[] {
    if (!this.vehiculos) return [];
    if (!this.filterTerm.trim()) return this.vehiculos;
    const term = this.filterTerm.toLowerCase();
    return this.vehiculos.filter(v =>
      (v.nro || '').toLowerCase().includes(term) ||
      (v.placa || '').toLowerCase().includes(term) ||
      (v.anio?.toString() || '').includes(term)
    );
  }

  async loadVehiculos() {
    this.loading = true;
    this.cdr.detectChanges();
    try {
      this.vehiculos = await this.vehiculosService.getVehiculos();
    } catch (error) {
      console.error('Error loading vehiculos:', error);
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
      setTimeout(() => this.cdr.detectChanges(), 100);
    }
  }

  get canSave(): boolean {
    const nro = (this.newVehiculo.nro || '').trim();
    const placa = (this.newVehiculo.placa || '').trim();
    return nro.length > 0 && placa.length > 0 && !this.saving;
  }

  async exportToExcel() {
    this.loading = true;
    try {
      const columns = [
        { header: 'NRO UNIDAD', key: 'nro', width: 15 },
        { header: 'PLACA', key: 'placa', width: 20 },
        { header: 'AÑO', key: 'anio', width: 15 },
        { header: 'TIPO', key: 'tipo', width: 20 }
      ];

      await this.excelService.exportToExcel(
        this.filteredVehiculos,
        'Reporte_Flota',
        'Vehiculos',
        columns
      );
    } catch (error) {
      console.error('Error exporting to excel:', error);
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  resetVehiculo(): Vehiculo {
    return {
      nro: '',
      tipo: 'Furgoneta',
      placa: '',
      anio: new Date().getFullYear()
    };
  }

  openModal(v?: Vehiculo) {
    this.saveSuccess = false;
    this.saving = false;
    this.errorMessage = '';

    if (v) {
      this.editingVehiculo = v;
      this.newVehiculo = {
        id: v.id,
        nro: v.nro || '',
        tipo: v.tipo || 'Buseta',
        placa: v.placa || '',
        anio: v.anio || new Date().getFullYear()
      };
    } else {
      this.editingVehiculo = null;
      this.newVehiculo = this.resetVehiculo();
    }
    this.showModal = true;
    this.cdr.detectChanges();

    // Focus Nro Unidad
    setTimeout(() => {
      const input = document.querySelector('input[name="nro"]') as HTMLInputElement;
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

  async saveVehiculo(keepOpen: boolean = false) {
    if (!this.canSave || this.saving) return;

    this.saving = true;
    this.saveSuccess = false;
    this.errorMessage = '';
    this.cdr.detectChanges();

    try {
      const res = this.editingVehiculo
        ? await this.vehiculosService.updateVehiculo(this.newVehiculo)
        : await this.vehiculosService.addVehiculo(this.newVehiculo);

      if (res && res.success) {
        this.saveSuccess = true;

        if (keepOpen) {
          const prevAnio = this.newVehiculo.anio;
          this.newVehiculo = this.resetVehiculo();
          this.newVehiculo.anio = prevAnio;
          this.editingVehiculo = null;
          // Return focus to Nro
          setTimeout(() => {
            const input = document.querySelector('input[name="nro"]') as HTMLInputElement;
            if (input) input.focus();
          }, 100);
        } else {
          setTimeout(() => this.closeModal(), 800);
        }

        await this.loadVehiculos();
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

  async deleteVehiculo(id: number) {
    if (!id) return;
    if (confirm('¿Está seguro de eliminar esta unidad?')) {
      this.loading = true;
      try {
        const res = await this.vehiculosService.deleteVehiculo(id);
        if (res && res.success) {
          await this.loadVehiculos();
        } else {
          alert('No se puede eliminar: La unidad tiene registros asociados (Rutas/Flujo Caja).');
        }
      } catch (e: any) {
        alert('Error de sistema al eliminar: ' + e.message);
      }
    }
  }
}

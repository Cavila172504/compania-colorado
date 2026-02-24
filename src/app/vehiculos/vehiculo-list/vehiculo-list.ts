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
    return nro.length > 0 && placa.length > 0;
  }

  async exportToExcel() {
    this.loading = true;
    try {
      const columns = [
        { header: 'NRO UNIDAD', key: 'nro', width: 15 },
        { header: 'PLACA', key: 'placa', width: 20 },
        { header: 'AÑO', key: 'anio', width: 15 },
        { header: 'MARCA', key: 'marca', width: 25 },
        { header: 'MODELO', key: 'modelo', width: 25 },
        { header: 'ESTADO', key: 'estado', width: 20 }
      ];

      await this.excelService.exportToExcel(
        this.filteredVehiculos,
        'Reporte_Flota',
        'Vehiculos',
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

  resetVehiculo(): Vehiculo {
    return {
      nro: '',
      tipo: 'Furgoneta',
      marca: '',
      modelo: '',
      placa: '',
      nro_serie: '',
      color: '',
      anio: new Date().getFullYear(),
      carga_maxima: '',
      estado: 'Activo',
      ciclo_mantenimiento: '',
      km_initial: 0
    };
  }

  openModal(v?: Vehiculo) {
    console.log('[VEHICULO-LIST] Opening modal. Mode:', v ? 'Edit' : 'New');
    if (v) {
      this.editingVehiculo = v;
      this.newVehiculo = {
        id: v.id,
        nro: v.nro || '',
        tipo: v.tipo || 'Buseta',
        marca: v.marca || '',
        modelo: v.modelo || '',
        placa: v.placa || '',
        nro_serie: v.nro_serie || '',
        color: v.color || '',
        anio: v.anio || new Date().getFullYear(),
        carga_maxima: v.carga_maxima || '',
        estado: v.estado || 'Activo',
        ciclo_mantenimiento: v.ciclo_mantenimiento || '',
        km_initial: v.km_initial || 0
      };
    } else {
      this.editingVehiculo = null; // Important: ensure editing state is null
      this.newVehiculo = this.resetVehiculo();
    }
    this.showModal = true;
    this.cdr.detectChanges();
    setTimeout(() => {
      this.cdr.detectChanges();
    }, 100);
  }

  closeModal() {
    this.showModal = false;
    this.cdr.detectChanges();
  }

  async saveVehiculo(keepOpen: boolean = false) {
    if (!this.canSave) {
      console.warn('[VEHICULO-LIST] Save blocked: validation failed');
      return;
    }

    try {
      console.log('[VEHICULO-LIST] Executing SAVE. Data:', this.newVehiculo);
      const res = this.editingVehiculo
        ? await this.vehiculosService.updateVehiculo(this.newVehiculo)
        : await this.vehiculosService.addVehiculo(this.newVehiculo);

      if (res && res.success) {
        console.log('[VEHICULO-LIST] Save success. Res:', res);
        const isEditing = !!this.editingVehiculo;

        // Reset state BEFORE blocking alerts to prevent "hanging" UI
        if (keepOpen) {
          const defaultAnio = this.newVehiculo.anio;
          this.newVehiculo = this.resetVehiculo();
          this.newVehiculo.anio = defaultAnio; // Keep year convenience
          this.editingVehiculo = null;
        } else {
          this.closeModal();
        }

        // Refresh list
        await this.loadVehiculos();
        this.cdr.detectChanges();

        // Brief delay before alert to ensure UI has rendered and modal is gone/reset
        setTimeout(() => {
          alert(isEditing ? 'Unidad actualizada correctamente' : 'Unidad registrada exitosamente');
        }, 100);

      } else {
        console.error('[VEHICULO-LIST] Save error from service:', res?.error);
        alert('Error al guardar: ' + (res?.error || 'Error desconocido'));
      }
    } catch (e: any) {
      console.error('[VEHICULO-LIST] System Exception:', e);
      alert('Error de sistema crítico: ' + e.message);
    }
  }

  async deleteVehiculo(id: number) {
    if (!id) {
      alert('Error: ID de vehículo no encontrado');
      return;
    }
    if (confirm('¿Está seguro de eliminar este vehículo?')) {
      try {
        const res = await this.vehiculosService.deleteVehiculo(id);
        if (res && res.success) {
          this.loadVehiculos();
        } else {
          alert('Error al eliminar: ' + (res?.error || 'Error desconocido'));
        }
      } catch (e: any) {
        alert('Error de sistema al eliminar: ' + e.message);
      }
    }
  }
}

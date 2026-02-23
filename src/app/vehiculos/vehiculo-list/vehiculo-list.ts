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
    if (!this.filterTerm.trim()) return this.vehiculos;
    const term = this.filterTerm.toLowerCase();
    return this.vehiculos.filter(v =>
      v.nro.toLowerCase().includes(term) ||
      v.placa.toLowerCase().includes(term) ||
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
    }
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
    if (v) {
      this.editingVehiculo = v;
      this.newVehiculo = JSON.parse(JSON.stringify(v));
    } else {
      this.editingVehiculo = null;
      this.newVehiculo = this.resetVehiculo();
    }
    this.showModal = true;
    setTimeout(() => {
      this.cdr.detectChanges();
    }, 0);
  }

  closeModal() {
    this.showModal = false;
    this.cdr.detectChanges();
  }

  async saveVehiculo() {
    try {
      const res = this.editingVehiculo
        ? await this.vehiculosService.updateVehiculo(this.newVehiculo)
        : await this.vehiculosService.addVehiculo(this.newVehiculo);

      if (res && res.success) {
        alert('Vehículo guardado correctamente');
        this.closeModal();
        this.loadVehiculos();
      } else {
        alert('Error al guardar vehículo: ' + (res?.error || 'Error desconocido'));
      }
    } catch (e: any) {
      alert('Error de sistema: ' + e.message);
    }
  }

  async deleteVehiculo(id: number) {
    if (confirm('¿Está seguro de eliminar este vehículo?')) {
      await this.vehiculosService.deleteVehiculo(id);
      this.loadVehiculos();
    }
  }
}

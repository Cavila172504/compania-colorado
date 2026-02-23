import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RutasService, Ruta } from '../rutas.service';
import { ConductoresService, Conductor } from '../../conductores/conductores.service';
import { VehiculosService, Vehiculo } from '../../vehiculos/vehiculos.service';
import { ExcelService } from '../../shared/excel.service';

@Component({
  selector: 'app-ruta-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ruta-list.html',
  styleUrl: './ruta-list.scss'
})
export class RutaListComponent implements OnInit {
  rutas: Ruta[] = [];
  conductores: Conductor[] = [];
  vehiculos: Vehiculo[] = [];
  loading: boolean = true;
  showModal: boolean = false;
  editingRuta: Ruta | null = null;

  newRuta: Ruta = this.resetRuta();
  filterTerm: string = '';

  constructor(
    private rutasService: RutasService,
    private conductoresService: ConductoresService,
    private vehiculosService: VehiculosService,
    private excelService: ExcelService,
    private cdr: ChangeDetectorRef
  ) { }

  async ngOnInit() {
    await Promise.all([
      this.loadRutas(),
      this.loadResources()
    ]);
  }

  async loadRutas() {
    this.loading = true;
    this.cdr.detectChanges();
    try {
      this.rutas = await this.rutasService.getRutas();
    } catch (error) {
      console.error('Error loading rutas:', error);
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  get filteredRutas(): Ruta[] {
    if (!this.filterTerm.trim()) return this.rutas;
    const term = this.filterTerm.toLowerCase();
    return this.rutas.filter(r =>
      r.nombre.toLowerCase().includes(term) ||
      r.sector.toLowerCase().includes(term) ||
      r.institucion.toLowerCase().includes(term)
    );
  }

  async exportToExcel() {
    this.loading = true;
    try {
      const columns = [
        { header: 'NOMBRE RUTA', key: 'nombre', width: 30 },
        { header: 'SECTOR', key: 'sector', width: 30 },
        { header: 'INSTITUCIÓN', key: 'institucion', width: 30 },
        { header: 'ESTUDIANTES', key: 'num_estudiantes', width: 15 }
      ];

      await this.excelService.exportToExcel(
        this.filteredRutas,
        'Reporte_Rutas',
        'Rutas',
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

  async loadResources() {
    [this.conductores, this.vehiculos] = await Promise.all([
      this.conductoresService.getConductores(),
      this.vehiculosService.getVehiculos()
    ]);
  }

  resetRuta(): Ruta {
    return {
      nombre: '',
      sector: '',
      institucion: '',
      num_estudiantes: 0
    };
  }

  openModal(r?: Ruta) {
    if (r) {
      this.editingRuta = r;
      this.newRuta = JSON.parse(JSON.stringify(r));
    } else {
      this.editingRuta = null;
      this.newRuta = this.resetRuta();
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

  async saveRuta() {
    try {
      const res = this.editingRuta
        ? await this.rutasService.updateRuta(this.newRuta)
        : await this.rutasService.addRuta(this.newRuta);

      if (res && res.success) {
        alert('Ruta guardada correctamente');
        this.closeModal();
        this.loadRutas();
      } else {
        alert('Error al guardar ruta: ' + (res?.error || 'Error desconocido'));
      }
    } catch (e: any) {
      alert('Error de sistema: ' + e.message);
    }
  }

  async deleteRuta(id: number) {
    if (confirm('¿Está seguro de eliminar esta ruta?')) {
      await this.rutasService.deleteRuta(id);
      this.loadRutas();
    }
  }
}

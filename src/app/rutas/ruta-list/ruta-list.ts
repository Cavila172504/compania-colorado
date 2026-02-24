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
  saving: boolean = false;
  saveSuccess: boolean = false;
  errorMessage: string = '';

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
      setTimeout(() => this.cdr.detectChanges(), 100);
    }
  }

  get filteredRutas(): Ruta[] {
    if (!this.filterTerm.trim()) return this.rutas;
    const term = this.filterTerm.toLowerCase();
    return this.rutas.filter(r =>
      (r.nombre || '').toLowerCase().includes(term) ||
      (r.sector || '').toLowerCase().includes(term) ||
      (r.institucion || '').toLowerCase().includes(term)
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
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  async loadResources() {
    try {
      [this.conductores, this.vehiculos] = await Promise.all([
        this.conductoresService.getConductores(),
        this.vehiculosService.getVehiculos()
      ]);
    } catch (error) {
      console.error('Error loading resources:', error);
    }
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
    this.saveSuccess = false;
    this.saving = false;
    this.errorMessage = '';

    if (r) {
      this.editingRuta = r;
      this.newRuta = {
        id: r.id,
        nombre: r.nombre || '',
        sector: r.sector || '',
        institucion: r.institucion || '',
        num_estudiantes: r.num_estudiantes || 0,
        conductor_id: r.conductor_id,
        vehiculo_id: r.vehiculo_id
      };
    } else {
      this.editingRuta = null;
      this.newRuta = this.resetRuta();
    }
    this.showModal = true;
    this.cdr.detectChanges();

    // Auto focus name
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

  get canSave(): boolean {
    const nombre = (this.newRuta.nombre || '').trim();
    const inst = (this.newRuta.institucion || '').trim();
    return nombre.length >= 3 && inst.length >= 3 && !this.saving;
  }

  async saveRuta(keepOpen: boolean = false) {
    if (!this.canSave || this.saving) return;

    this.saving = true;
    this.saveSuccess = false;
    this.errorMessage = '';
    this.cdr.detectChanges();

    try {
      const res = this.editingRuta
        ? await this.rutasService.updateRuta(this.newRuta)
        : await this.rutasService.addRuta(this.newRuta);

      if (res && res.success) {
        this.saveSuccess = true;

        if (keepOpen) {
          this.newRuta = this.resetRuta();
          this.editingRuta = null;
          setTimeout(() => {
            const input = document.querySelector('input[name="nombre"]') as HTMLInputElement;
            if (input) input.focus();
          }, 100);
        } else {
          setTimeout(() => this.closeModal(), 800);
        }

        await this.loadRutas();
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

  async deleteRuta(id: number) {
    if (!id) return;
    if (confirm('¿Está seguro de eliminar esta ruta?')) {
      this.loading = true;
      try {
        const res = await this.rutasService.deleteRuta(id);
        if (res && res.success) {
          await this.loadRutas();
        } else {
          alert('Error al eliminar: ' + (res?.error || 'No se pudo realizar la acción'));
        }
      } catch (e: any) {
        console.error('Delete error:', e);
      } finally {
        this.loading = false;
        this.cdr.detectChanges();
      }
    }
  }
}

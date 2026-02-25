import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { RutasService, Ruta, EstudianteRuta } from '../rutas.service';
import { ExcelService } from '../../shared/excel.service';

@Component({
    selector: 'app-ruta-detail',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './ruta-detail.html',
    styleUrl: './ruta-detail.scss'
})
export class RutaDetailComponent implements OnInit {
    ruta: Ruta | null = null;
    estudiantes: EstudianteRuta[] = [];
    loading: boolean = true;
    showModal: boolean = false;
    saving: boolean = false;
    saveSuccess: boolean = false;
    errorMessage: string = '';
    filterTerm: string = '';

    editingEstudiante: EstudianteRuta | null = null;
    newEstudiante: EstudianteRuta = this.resetEstudiante();

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private rutasService: RutasService,
        private excelService: ExcelService,
        private cdr: ChangeDetectorRef
    ) { }

    async ngOnInit() {
        this.route.paramMap.subscribe(async (params) => {
            const idStr = params.get('id');
            if (idStr) {
                await this.loadRutaData(+idStr);
            }
        });
    }

    async loadRutaData(id: number) {
        this.loading = true;
        this.cdr.detectChanges();
        try {
            this.ruta = await this.rutasService.getRutaById(id);
            if (this.ruta) {
                this.estudiantes = await this.rutasService.getEstudiantesByRutaId(id);
            }
        } catch (e) {
            console.error(e);
        } finally {
            this.loading = false;
            this.cdr.detectChanges();
        }
    }

    get filteredEstudiantes(): EstudianteRuta[] {
        if (!this.filterTerm.trim()) return this.estudiantes;
        const term = this.filterTerm.toLowerCase();
        return this.estudiantes.filter(e =>
            (e.nombre_estudiante || '').toLowerCase().includes(term) ||
            (e.numero_estudiante || '').toLowerCase().includes(term) ||
            (e.nombre_representante || '').toLowerCase().includes(term)
        );
    }

    resetEstudiante(): EstudianteRuta {
        return {
            ruta_id: this.ruta?.id || 0,
            numero_estudiante: '',
            nombre_estudiante: '',
            nombre_representante: '',
            cedula_representante: '',
            correo_representante: '',
            telefono_representante: ''
        };
    }

    goBack() {
        this.router.navigate(['/rutas']);
    }

    openModal(e?: EstudianteRuta) {
        if (e) {
            this.editingEstudiante = e;
            this.newEstudiante = { ...e };
        } else {
            this.editingEstudiante = null;
            this.newEstudiante = this.resetEstudiante();
        }
        this.showModal = true;
        this.saveSuccess = false;
        this.errorMessage = '';
        this.saving = false;
        this.cdr.detectChanges();
    }

    closeModal() {
        if (this.saving) return;
        this.showModal = false;
        this.cdr.detectChanges();
    }

    get canSave(): boolean {
        return !!(this.newEstudiante.nombre_estudiante && this.newEstudiante.numero_estudiante && !this.saving);
    }

    async saveEstudiante() {
        if (!this.canSave || !this.ruta?.id) return;
        this.saving = true;
        this.errorMessage = '';
        this.cdr.detectChanges();

        try {
            this.newEstudiante.ruta_id = this.ruta.id;
            const res = this.editingEstudiante
                ? await this.rutasService.updateEstudiante(this.newEstudiante)
                : await this.rutasService.addEstudiante(this.newEstudiante);

            if (res && res.success) {
                this.saveSuccess = true;
                this.estudiantes = await this.rutasService.getEstudiantesByRutaId(this.ruta.id);

                // update route total students logic visually in memory
                this.ruta.num_estudiantes = this.estudiantes.length;
                await this.rutasService.updateRuta(this.ruta);

                setTimeout(() => this.closeModal(), 800);
            } else {
                this.errorMessage = res?.error || 'Error al guardar';
            }
        } catch (e: any) {
            this.errorMessage = e.message;
        } finally {
            this.saving = false;
            this.cdr.detectChanges();
        }
    }

    async deleteEstudiante(id: number) {
        if (confirm('¿Seguro de eliminar estudiante?')) {
            try {
                const res = await this.rutasService.deleteEstudiante(id);
                if (res && res.success && this.ruta && this.ruta.id) {
                    this.estudiantes = await this.rutasService.getEstudiantesByRutaId(this.ruta.id);
                    this.ruta.num_estudiantes = this.estudiantes.length;
                    await this.rutasService.updateRuta(this.ruta);
                    this.cdr.detectChanges();
                }
            } catch (e) {
                console.error(e);
            }
        }
    }

    async exportToExcel() {
        if (!this.ruta) return;
        this.loading = true;
        try {
            const columns = [
                { header: 'N° ESTUDIANTE', key: 'numero_estudiante', width: 20 },
                { header: 'NOMBRE ESTUDIANTE', key: 'nombre_estudiante', width: 40 },
                { header: 'REPRESENTANTE', key: 'nombre_representante', width: 40 },
                { header: 'CÉDULA', key: 'cedula_representante', width: 20 },
                { header: 'CELULAR', key: 'telefono_representante', width: 20 },
                { header: 'CORREO', key: 'correo_representante', width: 30 },
            ];

            await this.excelService.exportToExcel(
                this.filteredEstudiantes,
                `Estudiantes_${this.ruta.nombre}`,
                'Estudiantes',
                columns
            );
        } catch (error) {
            console.error('Error exporting to excel:', error);
        } finally {
            this.loading = false;
            this.cdr.detectChanges();
        }
    }
}

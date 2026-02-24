import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FlujoCajaService, FlujoCaja } from '../flujo-caja.service';
import { PdfReportService } from '../../reports/pdf-report.service';
import { ExcelService } from '../../shared/excel.service';

@Component({
    selector: 'app-flujo-caja-list',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './flujo-caja-list.html',
    styleUrl: './flujo-caja-list.scss'
})
export class FlujoCajaListComponent implements OnInit {
    flujos: FlujoCaja[] = [];
    mes: number = new Date().getMonth() + 1;
    anio: number = new Date().getFullYear();
    loading: boolean = false;

    constructor(
        private flujoService: FlujoCajaService,
        private pdfService: PdfReportService,
        private excelService: ExcelService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit() {
        this.loadConsolidado();
    }

    async loadConsolidado() {
        this.loading = true;
        this.cdr.detectChanges();
        try {
            this.flujos = await this.flujoService.getFlujosByDate(this.mes, this.anio);
        } catch (error) {
            console.error('Error loading consolidado:', error);
        } finally {
            this.loading = false;
            this.cdr.detectChanges();
        }
    }

    getTotalIngresos() {
        return this.flujos.reduce((sum, f) => sum + f.total_ingresos, 0);
    }

    getTotalEgresos() {
        return this.flujos.reduce((sum, f) => sum + f.total_egresos, 0);
    }

    getTotalPagar() {
        return this.flujos.reduce((sum, f) => sum + f.total_recibir, 0);
    }

    printRol(f: FlujoCaja) {
        this.pdfService.generateRolIndividual(f);
    }

    async exportToExcel() {
        this.loading = true;
        try {
            const columns = [
                { header: 'CONDUCTOR', key: 'conductor_nombre', width: 35 },
                { header: 'INGRESOS ($)', key: 'total_ingresos', width: 20 },
                { header: 'CUOTA ADMIN ($)', key: 'cuota_administrativa', width: 15 },
                { header: 'RENTA 1% ($)', key: 'renta_1pct', width: 15 },
                { header: 'COM. CADE ($)', key: 'comision_cade', width: 15 },
                { header: 'ANTICIPO ($)', key: 'anticipo_socio', width: 15 },
                { header: 'PRÉSTAMO ($)', key: 'abono_prestamo', width: 15 },
                { header: 'MI BUSETA ($)', key: 'aplicativo_buseta', width: 15 },
                { header: 'COM. COMPAÑÍA ($)', key: 'comision_compania', width: 15 },
                { header: 'TOTAL EGRESOS ($)', key: 'total_egresos', width: 20 },
                { header: 'TOTAL RECIBIR ($)', key: 'total_recibir', width: 20 }
            ];

            await this.excelService.exportToExcel(
                this.flujos,
                `Flujo_Caja_${this.mes}_${this.anio}`,
                'Resumen Mensual',
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
}

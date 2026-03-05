import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FlujoCajaService } from '../../flujo-caja/flujo-caja.service';
import { ExcelService } from '../../shared/excel.service';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ResumenMes {
    mes: number;
    anio: number;
    mesNombre: string;
    ingresos_totales: number;
    cuota_admin: number;
    renta_1pct: number;
    cade: number;
    anticipo: number;
    prestamo: number;
    buseta: number;
    com_cia: number;
    tot_egresos: number;
    neto_recibir: number;
    num_registros: number;
}

@Component({
    selector: 'app-resumen-consolidado',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './resumen-consolidado.html',
    styleUrl: './resumen-consolidado.scss'
})
export class ResumenConsolidadoComponent implements OnInit {
    anio: number = new Date().getFullYear();
    mes: number = new Date().getMonth() + 1;
    vista: 'mensual' | 'anual' = 'mensual';
    resumen: ResumenMes[] = [];
    loading = false;

    readonly MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

    constructor(
        private flujoCajaService: FlujoCajaService,
        private excelService: ExcelService,
        private cdr: ChangeDetectorRef
    ) { }

    async ngOnInit() { await this.load(); }

    async load() {
        this.loading = true;
        this.resumen = [];
        try {
            if (this.vista === 'mensual') {
                // One total row for the selected month (sum of all conductors)
                const flujos = await this.flujoCajaService.getFlujosByDate(Number(this.mes), this.anio);
                if (flujos.length > 0) {
                    this.resumen.push({
                        mes: Number(this.mes), anio: this.anio,
                        mesNombre: this.MESES[Number(this.mes) - 1],
                        ingresos_totales: flujos.reduce((s, f) => s + (f.total_ingresos || 0), 0),
                        cuota_admin: flujos.reduce((s, f) => s + (f.cuota_administrativa || 0), 0),
                        renta_1pct: flujos.reduce((s, f) => s + (f.renta_1pct || 0), 0),
                        cade: flujos.reduce((s, f) => s + (f.comision_cade || 0), 0),
                        anticipo: flujos.reduce((s, f) => s + (f.anticipo_socio || 0), 0),
                        prestamo: flujos.reduce((s, f) => s + (f.abono_prestamo || 0), 0),
                        buseta: flujos.reduce((s, f) => s + (f.aplicativo_buseta || 0), 0),
                        com_cia: flujos.reduce((s, f) => s + (f.comision_compania || 0), 0),
                        tot_egresos: flujos.reduce((s, f) => s + (f.total_egresos || 0), 0),
                        neto_recibir: flujos.reduce((s, f) => s + (f.total_recibir || 0), 0),
                        num_registros: flujos.length
                    });
                }
            } else {
                // One row per month for selected year
                for (let m = 1; m <= 12; m++) {
                    const flujos = await this.flujoCajaService.getFlujosByDate(m, this.anio);
                    if (flujos.length > 0) {
                        this.resumen.push({
                            mes: m, anio: this.anio, mesNombre: this.MESES[m - 1],
                            ingresos_totales: flujos.reduce((s, f) => s + (f.total_ingresos || 0), 0),
                            cuota_admin: flujos.reduce((s, f) => s + (f.cuota_administrativa || 0), 0),
                            renta_1pct: flujos.reduce((s, f) => s + (f.renta_1pct || 0), 0),
                            cade: flujos.reduce((s, f) => s + (f.comision_cade || 0), 0),
                            anticipo: flujos.reduce((s, f) => s + (f.anticipo_socio || 0), 0),
                            prestamo: flujos.reduce((s, f) => s + (f.abono_prestamo || 0), 0),
                            buseta: flujos.reduce((s, f) => s + (f.aplicativo_buseta || 0), 0),
                            com_cia: flujos.reduce((s, f) => s + (f.comision_compania || 0), 0),
                            tot_egresos: flujos.reduce((s, f) => s + (f.total_egresos || 0), 0),
                            neto_recibir: flujos.reduce((s, f) => s + (f.total_recibir || 0), 0),
                            num_registros: flujos.length
                        });
                    }
                }
            }
        } catch (e) { console.error(e); }
        this.loading = false;
        this.cdr.detectChanges();
    }

    getTotal(field: keyof ResumenMes): number {
        return this.resumen.reduce((s, r) => s + (r[field] as number || 0), 0);
    }

    get tableTitle(): string {
        return this.vista === 'mensual'
            ? `Resumen — ${this.MESES[Number(this.mes) - 1]} ${this.anio}`
            : `Resumen por Mes — Año ${this.anio}`;
    }

    get firstColLabel(): string {
        return 'Mes';
    }

    async exportToExcel() {
        const isAnual = this.vista === 'anual';
        const columns = [
            { header: 'MES', key: 'mesNombre', width: 30 },
            { header: 'SOCIOS', key: 'num_registros', width: 12 },
            { header: 'INGRESOS TOTALES', key: 'ingresos_totales', width: 18 },
            { header: 'C. ADMIN', key: 'cuota_admin', width: 14 },
            { header: 'RENTA 1%', key: 'renta_1pct', width: 14 },
            { header: 'CADE', key: 'cade', width: 12 },
            { header: 'ANTICIPO', key: 'anticipo', width: 14 },
            { header: 'PRÉSTAMO', key: 'prestamo', width: 14 },
            { header: 'BUSETA', key: 'buseta', width: 12 },
            { header: 'COM. CÍA', key: 'com_cia', width: 12 },
            { header: 'TOT. EGRESOS', key: 'tot_egresos', width: 16 },
            { header: 'NETO RECIBIR', key: 'neto_recibir', width: 16 },
        ];
        const title = isAnual ? `Resumen_Anual_${this.anio}` : `Resumen_${this.MESES[this.mes - 1]}_${this.anio}`;
        await this.excelService.exportToExcel(this.resumen, title, 'Resumen', columns);
    }

    exportToPdf() {
        const doc = new jsPDF({ orientation: 'landscape' });
        const isAnual = this.vista === 'anual';

        // Logo
        try {
            doc.addImage('img/logo.png', 'PNG', 15, 10, 25, 25);
        } catch (e) {
            console.warn('No se pudo cargar el logo:', e);
        }

        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text('COMPAÑÍA COLORADO EXPRESS S.A.', 148 + 10, 18, { align: 'center' });
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(isAnual
            ? `RESUMEN ANUAL CONSOLIDADO — AÑO ${this.anio}`
            : `CONSOLIDADO MENSUAL — ${this.MESES[this.mes - 1].toUpperCase()} ${this.anio}`,
            148 + 10, 26, { align: 'center' });
        doc.text(`Generado el: ${new Date().toLocaleDateString('es-EC')} ${new Date().toLocaleTimeString()}`, 148 + 10, 32, { align: 'center' });
        doc.line(14, 36, 282, 36);

        const head = [[
            isAnual ? 'MES' : 'SOCIO / BENEFICIARIO',
            'REG.', 'INGRESOS', 'C.ADM', 'RENTA', 'CADE',
            'ANTICIPO', 'PRÉSTAMO', 'BUSETA', 'COM.CÍA', 'TOT.EGRESOS', 'NETO RECIBIR'
        ]];

        const body = this.resumen.map(r => [
            r.mesNombre, r.num_registros,
            `$${r.ingresos_totales.toFixed(2)}`,
            `$${r.cuota_admin.toFixed(2)}`,
            `$${r.renta_1pct.toFixed(2)}`,
            `$${r.cade.toFixed(2)}`,
            `$${r.anticipo.toFixed(2)}`,
            `$${r.prestamo.toFixed(2)}`,
            `$${r.buseta.toFixed(2)}`,
            `$${r.com_cia.toFixed(2)}`,
            `$${r.tot_egresos.toFixed(2)}`,
            `$${r.neto_recibir.toFixed(2)}`
        ]);

        // Totals row
        body.push([
            { content: 'TOTAL', styles: { fontStyle: 'bold' as const, fillColor: [15, 23, 42] as [number, number, number], textColor: [255, 255, 255] as [number, number, number] } },
            { content: String(this.resumen.reduce((s, r) => s + r.num_registros, 0)), styles: { fontStyle: 'bold' as const, fillColor: [15, 23, 42] as [number, number, number], textColor: [255, 255, 255] as [number, number, number] } },
            { content: `$${this.getTotal('ingresos_totales').toFixed(2)}`, styles: { fontStyle: 'bold' as const, fillColor: [15, 23, 42] as [number, number, number], textColor: [52, 211, 153] as [number, number, number] } },
            { content: `$${this.getTotal('cuota_admin').toFixed(2)}`, styles: { fontStyle: 'bold' as const, fillColor: [15, 23, 42] as [number, number, number], textColor: [255, 255, 255] as [number, number, number] } },
            { content: `$${this.getTotal('renta_1pct').toFixed(2)}`, styles: { fontStyle: 'bold' as const, fillColor: [15, 23, 42] as [number, number, number], textColor: [255, 255, 255] as [number, number, number] } },
            { content: `$${this.getTotal('cade').toFixed(2)}`, styles: { fontStyle: 'bold' as const, fillColor: [15, 23, 42] as [number, number, number], textColor: [255, 255, 255] as [number, number, number] } },
            { content: `$${this.getTotal('anticipo').toFixed(2)}`, styles: { fontStyle: 'bold' as const, fillColor: [15, 23, 42] as [number, number, number], textColor: [255, 255, 255] as [number, number, number] } },
            { content: `$${this.getTotal('prestamo').toFixed(2)}`, styles: { fontStyle: 'bold' as const, fillColor: [15, 23, 42] as [number, number, number], textColor: [255, 255, 255] as [number, number, number] } },
            { content: `$${this.getTotal('buseta').toFixed(2)}`, styles: { fontStyle: 'bold' as const, fillColor: [15, 23, 42] as [number, number, number], textColor: [255, 255, 255] as [number, number, number] } },
            { content: `$${this.getTotal('com_cia').toFixed(2)}`, styles: { fontStyle: 'bold' as const, fillColor: [15, 23, 42] as [number, number, number], textColor: [255, 255, 255] as [number, number, number] } },
            { content: `$${this.getTotal('tot_egresos').toFixed(2)}`, styles: { fontStyle: 'bold' as const, fillColor: [15, 23, 42] as [number, number, number], textColor: [252, 165, 165] as [number, number, number] } },
            { content: `$${this.getTotal('neto_recibir').toFixed(2)}`, styles: { fontStyle: 'bold' as const, fillColor: [15, 23, 42] as [number, number, number], textColor: [147, 197, 253] as [number, number, number] } },
        ] as any[]);

        autoTable(doc, {
            startY: 40,
            head, body,
            theme: 'striped',
            headStyles: { fillColor: [30, 58, 138], fontSize: 8, halign: 'center' },
            styles: { fontSize: 8 },
            columnStyles: { 0: { cellWidth: 50 } }
        });

        const fname = isAnual
            ? `Resumen_Anual_${this.anio}.pdf`
            : `Resumen_${this.MESES[this.mes - 1]}_${this.anio}.pdf`;
        doc.save(fname);
    }
}

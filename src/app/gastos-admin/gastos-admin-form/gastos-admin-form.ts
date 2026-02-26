import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GastosAdminService, GastoAdmin } from '../gastos-admin.service';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
    selector: 'app-gastos-admin-form',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './gastos-admin-form.html',
    styleUrl: './gastos-admin-form.scss'
})
export class GastosAdminFormComponent implements OnInit {
    mes: number = new Date().getMonth() + 1;
    anio: number = new Date().getFullYear();
    loading: boolean = false;
    saving: boolean = false;
    saveSuccess: boolean = false;
    errorMessage: string = '';

    totalCuotaAdmin: number = 0;
    gasto: GastoAdmin = this.resetGasto();

    constructor(
        private gastosService: GastosAdminService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit() {
        this.loadData();
    }

    resetGasto(): GastoAdmin {
        return {
            mes: this.mes,
            anio: this.anio,
            total_cuota_admin: 0,
            insumos_oficina: 0,
            varios_valor: 0,
            varios_descripcion: '',
            nro_cheque: ''
        };
    }

    async loadData() {
        this.loading = true;
        this.saveSuccess = false;
        this.errorMessage = '';
        this.cdr.detectChanges();

        try {
            // Get sum of cuota_administrativa from all conductors
            this.totalCuotaAdmin = await this.gastosService.getTotalCuotaAdmin(this.mes, this.anio);

            // Get existing gasto record for this month
            const existing = await this.gastosService.getGastoByDate(this.mes, this.anio);
            if (existing) {
                this.gasto = { ...existing };
                this.gasto.total_cuota_admin = this.totalCuotaAdmin;
            } else {
                this.gasto = this.resetGasto();
                this.gasto.total_cuota_admin = this.totalCuotaAdmin;
            }
        } catch (e) {
            console.error('Error loading gastos:', e);
        } finally {
            this.loading = false;
            this.cdr.detectChanges();
        }
    }

    get totalGastos(): number {
        return (this.gasto.insumos_oficina || 0) + (this.gasto.varios_valor || 0);
    }

    get saldoDisponible(): number {
        return this.totalCuotaAdmin - this.totalGastos;
    }

    async save() {
        if (this.saving) return;
        this.saving = true;
        this.saveSuccess = false;
        this.errorMessage = '';
        this.cdr.detectChanges();

        try {
            this.gasto.mes = Number(this.mes);
            this.gasto.anio = Number(this.anio);
            this.gasto.total_cuota_admin = this.totalCuotaAdmin;
            const res = await this.gastosService.saveGasto(this.gasto);

            if (res && res.success) {
                this.saveSuccess = true;
                await this.loadData();
                setTimeout(() => {
                    this.saveSuccess = false;
                    this.cdr.detectChanges();
                }, 3000);
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

    printPdf() {
        const doc = new jsPDF();

        // Header
        doc.setFontSize(18);
        doc.text('COMPAÑÍA COLORADO EXPRESS S.A.', 105, 20, { align: 'center' });
        doc.setFontSize(10);
        doc.text('SANTO DOMINGO DE LOS COLORADOS - ECUADOR', 105, 26, { align: 'center' });
        doc.setFontSize(14);
        doc.text('INFORME DE GASTOS ADMINISTRATIVOS', 105, 36, { align: 'center' });
        doc.setFontSize(11);
        doc.text(`Periodo: ${this.getMesNombre(this.mes)} ${this.anio}`, 105, 43, { align: 'center' });

        doc.line(20, 48, 190, 48);

        doc.setFontSize(10);
        doc.text(`FECHA DE EMISIÓN: ${new Date().toLocaleDateString()}`, 20, 56);
        if (this.gasto.nro_cheque) {
            doc.text(`CHEQUE Nro: ${this.gasto.nro_cheque}`, 140, 56);
        }

        const bodyRows: any[][] = [
            ['Ingreso por Cuotas Administrativas ($53 c/u)', this.totalCuotaAdmin.toFixed(2)],
            ['', ''],
            [{ content: 'EGRESOS / GASTOS', styles: { fontStyle: 'bold', fillColor: [255, 240, 240] } },
            { content: '', styles: { fillColor: [255, 240, 240] } }],
            ['(-) Compra de Insumos de Oficina', (this.gasto.insumos_oficina || 0).toFixed(2)],
        ];

        if (this.gasto.varios_valor > 0) {
            const desc = this.gasto.varios_descripcion ? ` (${this.gasto.varios_descripcion})` : '';
            bodyRows.push(['(-) Varios' + desc, this.gasto.varios_valor.toFixed(2)]);
        }

        bodyRows.push([
            { content: 'TOTAL GASTOS', styles: { fontStyle: 'bold', fillColor: [255, 220, 220] } },
            { content: this.totalGastos.toFixed(2), styles: { fontStyle: 'bold', fillColor: [255, 220, 220] } }
        ]);

        bodyRows.push([
            { content: 'SALDO DISPONIBLE', styles: { fontStyle: 'bold', fillColor: [220, 255, 220] } },
            { content: this.saldoDisponible.toFixed(2), styles: { fontStyle: 'bold', fillColor: [220, 255, 220] } }
        ]);

        if (this.gasto.nro_cheque) {
            bodyRows.push([
                { content: `PAGADO CON CHEQUE Nro. ${this.gasto.nro_cheque}`, styles: { fontStyle: 'bold', fillColor: [220, 240, 255] } },
                { content: '✓', styles: { fontStyle: 'bold', fillColor: [220, 240, 255] } }
            ]);
        }

        autoTable(doc, {
            startY: 64,
            head: [['CONCEPTO', 'VALOR ($)']],
            body: bodyRows,
            theme: 'striped',
            headStyles: { fillColor: [15, 23, 42] }
        });

        // Signatures
        const finalY = (doc as any).lastAutoTable.finalY + 30;
        doc.line(30, finalY, 80, finalY);
        doc.text('ELABORADO POR', 40, finalY + 5);

        doc.line(130, finalY, 180, finalY);
        doc.text('APROBADO POR', 140, finalY + 5);

        doc.save(`Gastos_Admin_${this.mes}_${this.anio}.pdf`);
    }

    private getMesNombre(m: number): string {
        const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        return meses[m - 1];
    }
}

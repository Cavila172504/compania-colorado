import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GastosAdminService, GastoAdmin } from '../gastos-admin.service';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface GastoItem {
    label: string;
    field: keyof GastoAdmin;
    chequeField: keyof GastoAdmin;
    facturaField: keyof GastoAdmin;
    icon: string;
}

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

    readonly gastoItems: GastoItem[] = [
        { label: 'Insumos de Oficina', field: 'insumos_oficina', chequeField: 'insumos_cheque', facturaField: 'insumos_factura', icon: '📎' },
        { label: 'Arriendo', field: 'arriendo', chequeField: 'arriendo_cheque', facturaField: 'arriendo_factura', icon: '🏢' },
        //{ label: 'Papelería', field: 'papeleria', chequeField: 'papeleria_cheque', facturaField: 'papeleria_factura', icon: '📄' },
        { label: 'Sueldo del Gerente', field: 'sueldo_gerente', chequeField: 'sueldo_gerente_cheque', facturaField: 'sueldo_gerente_factura', icon: '👔' },
        { label: 'Patente', field: 'patente', chequeField: 'patente_cheque', facturaField: 'patente_factura', icon: '📋' },
        { label: 'Honorarios Contables + NIF', field: 'honorarios', chequeField: 'honorarios_cheque', facturaField: 'honorarios_factura', icon: '⚖️' },
        { label: 'Pago al IESS', field: 'pago_iess', chequeField: 'pago_iess_cheque', facturaField: 'pago_iess_factura', icon: '🏛️' },
        { label: 'Convocatorias', field: 'convocatorias', chequeField: 'convocatorias_cheque', facturaField: 'convocatorias_factura', icon: '📢' },
        { label: 'Capacitaciones', field: 'capacitaciones', chequeField: 'capacitaciones_cheque', facturaField: 'capacitaciones_factura', icon: '🎓' },
    ];

    constructor(
        private gastosService: GastosAdminService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit() {
        this.loadData();
    }

    resetGasto(): GastoAdmin {
        return {
            mes: this.mes, anio: this.anio,
            total_cuota_admin: 0,
            insumos_oficina: 0, insumos_cheque: '', insumos_factura: '',
            arriendo: 0, arriendo_cheque: '', arriendo_factura: '',
            papeleria: 0, papeleria_cheque: '', papeleria_factura: '',
            sueldo_gerente: 0, sueldo_gerente_cheque: '', sueldo_gerente_factura: '',
            patente: 0, patente_cheque: '', patente_factura: '',
            honorarios: 0, honorarios_cheque: '', honorarios_factura: '',
            pago_iess: 0, pago_iess_cheque: '', pago_iess_factura: '',
            convocatorias: 0, convocatorias_cheque: '', convocatorias_factura: '',
            capacitaciones: 0, capacitaciones_cheque: '', capacitaciones_factura: '',
            varios_valor: 0, varios_descripcion: '', varios_cheque: '', varios_factura: '',
            nro_cheque: ''
        };
    }

    async loadData() {
        this.loading = true;
        this.saveSuccess = false;
        this.errorMessage = '';
        this.cdr.detectChanges();
        try {
            this.totalCuotaAdmin = await this.gastosService.getTotalCuotaAdmin(this.mes, this.anio);
            const existing = await this.gastosService.getGastoByDate(this.mes, this.anio);
            if (existing) {
                this.gasto = { ...this.resetGasto(), ...existing };
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

    /** Get value of field from gasto object (helper for template) */
    getVal(field: keyof GastoAdmin): number {
        return (this.gasto[field] as number) || 0;
    }
    getStr(field: keyof GastoAdmin): string {
        return (this.gasto[field] as string) || '';
    }
    setVal(field: keyof GastoAdmin, val: number) {
        (this.gasto as any)[field] = val;
    }
    setStr(field: keyof GastoAdmin, val: string) {
        (this.gasto as any)[field] = val;
    }

    get totalGastos(): number {
        return this.gastoItems.reduce((sum, item) => sum + this.getVal(item.field), 0)
            + (this.gasto.varios_valor || 0);
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
                setTimeout(() => { this.saveSuccess = false; this.cdr.detectChanges(); }, 3000);
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

        // Logo
        try {
            doc.addImage('img/logo.png', 'PNG', 15, 12, 28, 28);
        } catch (e) {
            console.warn('No se pudo cargar el logo:', e);
        }

        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text('COMPAÑÍA COLORADO EXPRESS S.A.', 105 + 10, 20, { align: 'center' });
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text('SANTO DOMINGO DE LOS COLORADOS - ECUADOR', 105 + 10, 26, { align: 'center' });
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('INFORME DE GASTOS ADMINISTRATIVOS', 105 + 10, 36, { align: 'center' });
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.text(`Periodo: ${this.getMesNombre(this.mes)} ${this.anio}`, 105 + 10, 43, { align: 'center' });
        doc.line(20, 48, 190, 48);
        doc.setFontSize(10);
        doc.text(`FECHA DE EMISIÓN: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 20, 56);

        const bodyRows: any[][] = [
            [{ content: 'INGRESOS', styles: { fontStyle: 'bold', fillColor: [220, 255, 220] } }, '', '', ''],
            ['(+) Cuotas Administrativas Recaudadas', `$${this.totalCuotaAdmin.toFixed(2)}`, '', ''],
            ['', '', '', ''],
            [{ content: 'EGRESOS / GASTOS', styles: { fontStyle: 'bold', fillColor: [255, 235, 235] } }, '', '', ''],
        ];

        for (const item of this.gastoItems) {
            const val = this.getVal(item.field);
            if (val > 0) {
                const cheque = this.getStr(item.chequeField);
                const factura = this.getStr(item.facturaField);
                bodyRows.push([
                    `(-) ${item.label}`,
                    `$${val.toFixed(2)}`,
                    cheque ? `Ch: ${cheque}` : '',
                    factura ? `Fact: ${factura}` : ''
                ]);
            }
        }

        if ((this.gasto.varios_valor || 0) > 0) {
            const desc = this.gasto.varios_descripcion ? ` (${this.gasto.varios_descripcion})` : '';
            bodyRows.push([
                `📦 Gastos Varios${desc}`,
                `$${(this.gasto.varios_valor || 0).toFixed(2)}`,
                this.gasto.varios_cheque ? `Ch: ${this.gasto.varios_cheque}` : '',
                this.gasto.varios_factura ? `Fact: ${this.gasto.varios_factura}` : ''
            ]);
        }

        bodyRows.push(['', '', '', '']);
        bodyRows.push([
            { content: 'TOTAL EGRESOS', styles: { fontStyle: 'bold', fillColor: [255, 220, 220] } },
            { content: `$${this.totalGastos.toFixed(2)}`, styles: { fontStyle: 'bold', fillColor: [255, 220, 220] } },
            '', ''
        ]);
        bodyRows.push([
            { content: 'SALDO DISPONIBLE', styles: { fontStyle: 'bold', fillColor: [220, 255, 220] } },
            { content: `$${this.saldoDisponible.toFixed(2)}`, styles: { fontStyle: 'bold', fillColor: [220, 255, 220] } },
            '', ''
        ]);

        autoTable(doc, {
            startY: 64,
            head: [['CONCEPTO', 'VALOR ($)', 'N° CHEQUE', 'N° FACTURA']],
            body: bodyRows,
            theme: 'striped',
            headStyles: { fillColor: [15, 23, 42] },
            columnStyles: { 0: { cellWidth: 85 }, 1: { cellWidth: 30 }, 2: { cellWidth: 35 }, 3: { cellWidth: 35 } }
        });

        const finalY = (doc as any).lastAutoTable.finalY + 35;
        doc.line(30, finalY, 80, finalY);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('ELABORADO POR', 55, finalY + 5, { align: 'center' });

        doc.line(130, finalY, 180, finalY);
        doc.text('REVISADO POR (GERENTE)', 155, finalY + 5, { align: 'center' });
        doc.setFont('helvetica', 'normal');
        doc.text('FREIRE CAICEDO JHONY GERALD', 155, finalY + 10, { align: 'center' });

        doc.save(`Gastos_Admin_${this.mes}_${this.anio}.pdf`);
    }

    private getMesNombre(m: number): string {
        return ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'][m - 1];
    }
}

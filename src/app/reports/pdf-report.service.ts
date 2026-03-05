import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FlujoCaja } from '../flujo-caja/flujo-caja.service';
import { CreditoSocio } from '../creditos-socio/creditos.service';

@Injectable({
    providedIn: 'root'
})
export class PdfReportService {
    constructor() { }

    async generateRolIndividual(flujo: FlujoCaja, credito?: CreditoSocio | null) {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();

        // Logo
        try {
            doc.addImage('img/logo.png', 'PNG', 15, 12, 28, 28);
        } catch (e) {
            console.warn('No se pudo cargar el logo en el PDF:', e);
        }

        // Header
        doc.setFontSize(20);
        doc.setTextColor(15, 23, 42); // Slate 900
        doc.setFont('helvetica', 'bold');
        doc.text('COMPAÑÍA COLORADO EXPRESS S.A.', pageWidth / 2 + 10, 20, { align: 'center' });

        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.setFont('helvetica', 'normal');
        doc.text('SERVICIO DE TRANSPORTE ESCOLAR E INSTITUCIONAL', pageWidth / 2 + 10, 26, { align: 'center' });

        doc.setFontSize(14);
        doc.setTextColor(30, 58, 138); // Blue 900
        doc.setFont('helvetica', 'bold');
        doc.text('ROL DE PAGOS INDIVIDUAL', pageWidth / 2, 35, { align: 'center' });

        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);
        doc.text(`Periodo: ${this.getMesNombre(flujo.mes)} ${flujo.anio}`, pageWidth / 2, 42, { align: 'center' });

        doc.setDrawColor(200, 200, 200);
        doc.line(20, 48, pageWidth - 20, 48);

        // Individual Info Section
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('DETALLES DEL BENEFICIARIO', 20, 58);

        doc.setFont('helvetica', 'normal');
        doc.text(`SOCIO / BENEFICIARIO:`, 20, 65);
        doc.setFont('helvetica', 'bold');
        doc.text(`${flujo.conductor_nombre}`, 65, 65);

        doc.setFont('helvetica', 'normal');
        doc.text(`ESTUDIANTES REGISTRADOS (CADE):`, 20, 72);
        doc.setFont('helvetica', 'bold');
        doc.text(`${flujo.num_estudiantes || 0}`, 85, 72);

        doc.setFont('helvetica', 'normal');
        doc.text(`FECHA DE EMISIÓN:`, 20, 79);
        doc.text(`${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 65, 79);

        // Concept rows
        const ingresosRows = [
            ['(+) TOTAL VENTAS (INGRESOS)', flujo.total_ingresos.toFixed(2), '']
        ];

        const egresosRows = [
            ['(-) Cuota Administrativa', '', flujo.cuota_administrativa.toFixed(2)],
            ['(-) Renta Retención (1%)', '', flujo.renta_1pct.toFixed(2)],
            [`(-) Comisión CADE ($2 x ${flujo.num_estudiantes || 0})`, '', flujo.comision_cade.toFixed(2)],
            ['(-) Anticipo / Adelanto', '', flujo.anticipo_socio.toFixed(2)],
            ['(-) Abono Préstamo', '', flujo.abono_prestamo.toFixed(2)],
            ['(-) Aplicativo "Mi Buseta"', '', flujo.aplicativo_buseta.toFixed(2)],
            ['(-) Comisión Compañía (1%)', '', flujo.comision_compania.toFixed(2)]
        ];

        const bodyRows: any[][] = [
            ...ingresosRows,
            ...egresosRows,
            [
                { content: 'SUBTOTALES', styles: { fontStyle: 'bold', fillColor: [245, 245, 245] } },
                { content: flujo.total_ingresos.toFixed(2), styles: { fontStyle: 'bold', fillColor: [245, 245, 245] } },
                { content: flujo.total_egresos.toFixed(2), styles: { fontStyle: 'bold', fillColor: [245, 245, 245] } }
            ],
            [
                { content: 'NETO TOTAL A PERCIBIR', styles: { fontStyle: 'bold', fillColor: [30, 58, 138], textColor: [255, 255, 255] }, colSpan: 2 },
                { content: `$ ${flujo.total_recibir.toFixed(2)}`, styles: { fontStyle: 'bold', fillColor: [30, 58, 138], textColor: [255, 255, 255], fontSize: 12 } }
            ]
        ];

        autoTable(doc, {
            startY: 85,
            head: [['DESCRIPCIÓN DE CONCEPTOS', 'INGRESOS ($)', 'EGRESOS ($)']],
            body: bodyRows,
            theme: 'grid',
            headStyles: { fillColor: [15, 23, 42], halign: 'center' },
            columnStyles: {
                0: { cellWidth: 'auto' },
                1: { halign: 'right', cellWidth: 40 },
                2: { halign: 'right', cellWidth: 40 }
            }
        });

        let finalY = (doc as any).lastAutoTable.finalY + 10;

        // Additional Information
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text('INFORMACIÓN DE PAGOS Y SALDOS:', 20, finalY);
        finalY += 6;

        doc.setFont('helvetica', 'normal');
        if (flujo.nro_cheque) {
            doc.text(`• LIQUIDACIÓN FINAL PAGADA CON CHEQUE Nº: ${flujo.nro_cheque}`, 25, finalY);
            finalY += 5;
        }

        if (flujo.nro_cheque_anticipo) {
            doc.text(`• ADELANTO PAGADO CON CHEQUE Nº: ${flujo.nro_cheque_anticipo}`, 25, finalY);
            finalY += 5;
        }

        if (credito) {
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(180, 83, 9); // Amber 700
            doc.text(`• SALDO PENDIENTE DE PRÉSTAMO ACTUAL: $ ${credito.saldo_pendiente.toFixed(2)}`, 25, finalY);
            doc.setTextColor(0, 0, 0);
            finalY += 5;
        }

        // Signatures Section
        finalY += 35;
        doc.setDrawColor(0, 0, 0);

        doc.line(30, finalY, 85, finalY);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text('FIRMA DEL SOCIO / BENEFICIARIO', 57.5, finalY + 5, { align: 'center' });
        doc.setFont('helvetica', 'normal');
        doc.text(`${flujo.conductor_nombre}`, 57.5, finalY + 10, { align: 'center' });

        doc.line(125, finalY, 180, finalY);
        doc.setFont('helvetica', 'bold');
        doc.text('FIRMA RESPONSABLE (GERENTE)', 152.5, finalY + 5, { align: 'center' });
        doc.setFont('helvetica', 'normal');
        doc.text('FREIRE CAICEDO JHONY GERALD', 152.5, finalY + 10, { align: 'center' });

        doc.save(`Rol_${flujo.conductor_nombre}_${flujo.mes}_${flujo.anio}.pdf`);
    }

    private getMesNombre(m: number): string {
        const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        return meses[m - 1];
    }
}

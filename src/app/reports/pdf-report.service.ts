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

        // Header
        doc.setFontSize(18);
        doc.text('COMPAÑÍA COLORADO EXPRESS S.A.', 105, 20, { align: 'center' });
        doc.setFontSize(12);
        doc.text('ROL DE PAGOS INDIVIDUAL', 105, 28, { align: 'center' });
        doc.text(`Periodo: ${this.getMesNombre(flujo.mes)} ${flujo.anio}`, 105, 34, { align: 'center' });

        doc.line(20, 40, 190, 40);

        // Conductor Info
        doc.setFontSize(11);
        doc.text(`CONDUCTOR: ${flujo.conductor_nombre}`, 20, 50);
        doc.text(`FECHA DE EMISIÓN: ${new Date().toLocaleDateString()}`, 130, 50);

        // Table of Concepts
        const bodyRows: any[][] = [
            ['(+) TOTAL INGRESOS (Cobrado Estudiantes)', flujo.total_ingresos.toFixed(2)],
            ['(-) Cuota Administrativa', flujo.cuota_administrativa.toFixed(2)],
            ['(-) Renta 1%', flujo.renta_1pct.toFixed(2)],
            ['(-) Comisión CADE', flujo.comision_cade.toFixed(2)],
            ['(-) Anticipo a Socio', flujo.anticipo_socio.toFixed(2)],
            ['(-) Abono Préstamo', flujo.abono_prestamo.toFixed(2)],
            ['(-) Aplicativo "Mi Buseta"', flujo.aplicativo_buseta.toFixed(2)],
            ['(-) Comisión Compañía (1%)', flujo.comision_compania.toFixed(2)],
            [{ content: 'TOTAL A RECIBIR', styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } },
            { content: flujo.total_recibir.toFixed(2), styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } }]
        ];

        // Add credit info if available
        if (credito) {
            bodyRows.push([
                { content: 'SALDO PRÉSTAMO PENDIENTE', styles: { fontStyle: 'bold', textColor: [200, 100, 0] } },
                { content: credito.saldo_pendiente.toFixed(2), styles: { fontStyle: 'bold', textColor: [200, 100, 0] } }
            ]);
        }

        // Add cheque info
        if (flujo.nro_cheque) {
            bodyRows.push([
                { content: `PAGADO CON CHEQUE Nro. ${flujo.nro_cheque}`, styles: { fontStyle: 'bold', fillColor: [220, 255, 220] } },
                { content: '✓', styles: { fontStyle: 'bold', fillColor: [220, 255, 220] } }
            ]);
        }

        autoTable(doc, {
            startY: 60,
            head: [['CONCEPTO', 'VALOR ($)']],
            body: bodyRows,
            theme: 'striped',
            headStyles: { fillColor: [15, 23, 42] }
        });

        // Signatures
        const finalY = (doc as any).lastAutoTable.finalY + 30;
        doc.line(30, finalY, 80, finalY);
        doc.text('FIRMA CONDUCTOR', 40, finalY + 5);

        doc.line(130, finalY, 180, finalY);
        doc.text('FIRMA RESPONSABLE', 135, finalY + 5);

        doc.save(`Rol_${flujo.conductor_nombre}_${flujo.mes}_${flujo.anio}.pdf`);
    }

    private getMesNombre(m: number): string {
        const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        return meses[m - 1];
    }
}

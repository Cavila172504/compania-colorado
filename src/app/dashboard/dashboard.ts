import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { VehiculosService } from '../vehiculos/vehiculos.service';
import { ConductoresService } from '../conductores/conductores.service';
import { RutasService } from '../rutas/rutas.service';
import { ExcelService } from '../shared/excel.service';
import { ElectronService } from '../shared/electron.service';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './dashboard.html'
})
export class DashboardComponent implements OnInit {
    stats = {
        vehiculos: 0,
        conductores: 0,
        rutas: 0
    };
    loading = true;

    constructor(
        private vehiculosService: VehiculosService,
        private conductoresService: ConductoresService,
        private rutasService: RutasService,
        private excelService: ExcelService,
        private electron: ElectronService,
        private cdr: ChangeDetectorRef
    ) { }

    async ngOnInit() {
        this.loading = true;
        this.cdr.detectChanges();

        try {
            const [v, c, r] = await Promise.all([
                this.vehiculosService.getVehiculos(),
                this.conductoresService.getConductores(),
                this.rutasService.getRutas()
            ]);

            this.stats.vehiculos = v.length;
            this.stats.conductores = c.length;
            this.stats.rutas = r.length;
        } catch (error) {
            console.error('Error loading dashboard stats:', error);
        } finally {
            this.loading = false;
            this.cdr.detectChanges();
        }
    }

    async exportAllChecks() {
        if (this.loading) return;
        this.loading = true;
        this.cdr.detectChanges();

        try {
            const query = `
                -- Comisiones Socio (Flujo Caja)
                SELECT 
                    f.anio || '-' || printf('%02d', f.mes) || '-01' as fecha,
                    'Pago Liquidación Mensual' as concepto,
                    c.nombre as beneficiario,
                    f.total_recibir as valor,
                    f.nro_cheque as nro_cheque
                FROM flujo_caja f
                JOIN conductores c ON f.conductor_id = c.id
                WHERE f.nro_cheque IS NOT NULL AND f.nro_cheque != ''

                UNION ALL

                -- Anticipos Socio (Flujo Caja)
                SELECT 
                    f.anio || '-' || printf('%02d', f.mes) || '-01' as fecha,
                    'Anticipo / Adelanto Socio' as concepto,
                    c.nombre as beneficiario,
                    f.anticipo_socio as valor,
                    f.nro_cheque_anticipo as nro_cheque
                FROM flujo_caja f
                JOIN conductores c ON f.conductor_id = c.id
                WHERE f.nro_cheque_anticipo IS NOT NULL AND f.nro_cheque_anticipo != ''

                UNION ALL

                -- Préstamos Socio (Créditos)
                SELECT 
                    date(fecha_registro) as fecha,
                    'Desembolso de Préstamo' as concepto,
                    c.nombre as beneficiario,
                    valor_prestamo as valor,
                    numero_cheque as nro_cheque
                FROM creditos_socio cs
                JOIN conductores c ON cs.conductor_id = c.id
                WHERE numero_cheque IS NOT NULL AND numero_cheque != ''

                UNION ALL

                -- Gastos Administrativos (Varios campos de cheque)
                -- Simplificado para los campos principales
                SELECT anio || '-' || printf('%02d', mes) || '-01', 'Gasto: Insumos de Oficina', 'Proveedor/Varios', insumos_oficina, insumos_cheque FROM gastos_administrativos WHERE insumos_cheque != ''
                UNION ALL
                SELECT anio || '-' || printf('%02d', mes) || '-01', 'Gasto: Arriendo', 'Proveedor/Varios', arriendo, arriendo_cheque FROM gastos_administrativos WHERE arriendo_cheque != ''
                UNION ALL
                SELECT anio || '-' || printf('%02d', mes) || '-01', 'Gasto: Sueldo Gerente', 'Gerencia', sueldo_gerente, sueldo_gerente_cheque FROM gastos_administrativos WHERE sueldo_gerente_cheque != ''
                UNION ALL
                SELECT anio || '-' || printf('%02d', mes) || '-01', 'Gasto: Patente', 'Municipio/Varios', patente, patente_cheque FROM gastos_administrativos WHERE patente_cheque != ''
                UNION ALL
                SELECT anio || '-' || printf('%02d', mes) || '-01', 'Gasto: Honorarios', 'Contador/Varios', honorarios, honorarios_cheque FROM gastos_administrativos WHERE honorarios_cheque != ''
                UNION ALL
                SELECT anio || '-' || printf('%02d', mes) || '-01', 'Gasto: Pago IESS', 'IESS', pago_iess, pago_iess_cheque FROM gastos_administrativos WHERE pago_iess_cheque != ''
                UNION ALL
                SELECT anio || '-' || printf('%02d', mes) || '-01', 'Gasto: Varios', varios_descripcion, varios_valor, varios_cheque FROM gastos_administrativos WHERE varios_cheque != ''
                
                ORDER BY fecha DESC
            `;

            const res = await this.electron.invoke('db-query', { query });
            if (res.success && res.data.length > 0) {
                const columns = [
                    { header: 'FECHA', key: 'fecha', width: 15 },
                    { header: 'CONCEPTO', key: 'concepto', width: 35 },
                    { header: 'BENEFICIARIO / SOCIO', key: 'beneficiario', width: 35 },
                    { header: 'VALOR ($)', key: 'valor', width: 15 },
                    { header: 'N° CHEQUE', key: 'nro_cheque', width: 20 },
                ];
                await this.excelService.exportToExcel(res.data, 'Reporte_General_Cheques', 'ChequesEmitidos', columns);
            } else {
                alert('No se encontraron registros de cheques para exportar.');
            }
        } catch (e) {
            console.error('Error exporting checks:', e);
            alert('Error al generar el reporte de cheques.');
        } finally {
            this.loading = false;
            this.cdr.detectChanges();
        }
    }
}

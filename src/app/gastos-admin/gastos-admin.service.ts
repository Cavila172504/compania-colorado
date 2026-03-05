import { Injectable } from '@angular/core';
import { ElectronService } from '../shared/electron.service';

export interface GastoAdmin {
    id?: number;
    mes: number;
    anio: number;
    total_cuota_admin: number;
    // Insumos de oficina
    insumos_oficina: number;
    insumos_cheque?: string;
    insumos_factura?: string;
    // Arriendo
    arriendo: number;
    arriendo_cheque?: string;
    arriendo_factura?: string;
    // Papelería
    papeleria: number;
    papeleria_cheque?: string;
    papeleria_factura?: string;
    // Sueldo del gerente
    sueldo_gerente: number;
    sueldo_gerente_cheque?: string;
    sueldo_gerente_factura?: string;
    // Patente
    patente: number;
    patente_cheque?: string;
    patente_factura?: string;
    // Honorarios contables + NIF
    honorarios: number;
    honorarios_cheque?: string;
    honorarios_factura?: string;
    // Pago IESS
    pago_iess: number;
    pago_iess_cheque?: string;
    pago_iess_factura?: string;
    // Convocatorias
    convocatorias: number;
    convocatorias_cheque?: string;
    convocatorias_factura?: string;
    // Capacitaciones
    capacitaciones: number;
    capacitaciones_cheque?: string;
    capacitaciones_factura?: string;
    // Varios
    varios_valor: number;
    varios_descripcion: string;
    varios_cheque?: string;
    varios_factura?: string;
    // Legacy global cheque (kept for compatibility)
    nro_cheque: string;
    fecha_registro?: string;
}

@Injectable({
    providedIn: 'root'
})
export class GastosAdminService {
    constructor(private electron: ElectronService) { }

    async getGastoByDate(mes: number, anio: number): Promise<GastoAdmin | null> {
        const res = await this.electron.invoke('db-query', {
            query: 'SELECT * FROM gastos_administrativos WHERE mes = ? AND anio = ? ORDER BY id DESC LIMIT 1',
            params: [mes, anio]
        });
        return res.success && res.data.length > 0 ? res.data[0] : null;
    }

    async getAllGastos(): Promise<GastoAdmin[]> {
        const res = await this.electron.invoke('db-query', {
            query: 'SELECT * FROM gastos_administrativos ORDER BY anio DESC, mes DESC'
        });
        return res.success ? res.data : [];
    }

    async getTotalCuotaAdmin(mes: number, anio: number): Promise<number> {
        const res = await this.electron.invoke('db-query', {
            query: `SELECT SUM(cuota_administrativa) as total FROM flujo_caja WHERE mes = ? AND anio = ?`,
            params: [mes, anio]
        });
        return res.success && res.data.length > 0 ? (res.data[0].total || 0) : 0;
    }

    async saveGasto(g: GastoAdmin) {
        const fields = [
            'total_cuota_admin', 'insumos_oficina', 'insumos_cheque', 'insumos_factura',
            'arriendo', 'arriendo_cheque', 'arriendo_factura',
            'papeleria', 'papeleria_cheque', 'papeleria_factura',
            'sueldo_gerente', 'sueldo_gerente_cheque', 'sueldo_gerente_factura',
            'patente', 'patente_cheque', 'patente_factura',
            'honorarios', 'honorarios_cheque', 'honorarios_factura',
            'pago_iess', 'pago_iess_cheque', 'pago_iess_factura',
            'convocatorias', 'convocatorias_cheque', 'convocatorias_factura',
            'capacitaciones', 'capacitaciones_cheque', 'capacitaciones_factura',
            'varios_valor', 'varios_descripcion', 'varios_cheque', 'varios_factura',
            'nro_cheque'
        ];
        const vals = fields.map(f => (g as any)[f] ?? null);

        if (g.id) {
            const setClause = fields.map(f => `${f}=?`).join(', ');
            return await this.electron.invoke('db-run', {
                query: `UPDATE gastos_administrativos SET ${setClause} WHERE id=?`,
                params: [...vals, g.id]
            });
        } else {
            const colClause = fields.join(', ');
            const placeholders = fields.map(() => '?').join(', ');
            return await this.electron.invoke('db-run', {
                query: `INSERT INTO gastos_administrativos (mes, anio, ${colClause}) VALUES (?, ?, ${placeholders})`,
                params: [g.mes, g.anio, ...vals]
            });
        }
    }

    async deleteGasto(id: number) {
        return await this.electron.invoke('db-run', {
            query: 'DELETE FROM gastos_administrativos WHERE id = ?',
            params: [id]
        });
    }
}

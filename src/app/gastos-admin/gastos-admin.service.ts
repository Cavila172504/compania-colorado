import { Injectable } from '@angular/core';
import { ElectronService } from '../shared/electron.service';

export interface GastoAdmin {
    id?: number;
    mes: number;
    anio: number;
    total_cuota_admin: number;
    insumos_oficina: number;
    varios_valor: number;
    varios_descripcion: string;
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
            query: `
        SELECT SUM(cuota_administrativa) as total
        FROM flujo_caja
        WHERE mes = ? AND anio = ?
      `,
            params: [mes, anio]
        });
        return res.success && res.data.length > 0 ? (res.data[0].total || 0) : 0;
    }

    async saveGasto(g: GastoAdmin) {
        if (g.id) {
            return await this.electron.invoke('db-run', {
                query: `UPDATE gastos_administrativos SET 
                total_cuota_admin=?, insumos_oficina=?, varios_valor=?, varios_descripcion=?, nro_cheque=?
                WHERE id=?`,
                params: [g.total_cuota_admin, g.insumos_oficina, g.varios_valor, g.varios_descripcion, g.nro_cheque, g.id]
            });
        } else {
            return await this.electron.invoke('db-run', {
                query: `INSERT INTO gastos_administrativos (mes, anio, total_cuota_admin, insumos_oficina, varios_valor, varios_descripcion, nro_cheque)
                VALUES (?, ?, ?, ?, ?, ?, ?)`,
                params: [g.mes, g.anio, g.total_cuota_admin, g.insumos_oficina, g.varios_valor, g.varios_descripcion, g.nro_cheque]
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

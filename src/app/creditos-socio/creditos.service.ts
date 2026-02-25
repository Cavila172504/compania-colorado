import { Injectable } from '@angular/core';
import { ElectronService } from '../shared/electron.service';

export interface CreditoSocio {
    id?: number;
    conductor_id: number;
    valor_prestamo: number;
    saldo_pendiente: number;
    fecha_registro?: string;
    estado?: string;
    // Joins
    conductor_nombre?: string;
}

@Injectable({
    providedIn: 'root'
})
export class CreditosService {
    constructor(private electron: ElectronService) { }

    async getCreditos(): Promise<CreditoSocio[]> {
        const res = await this.electron.invoke('db-query', {
            query: `
        SELECT cr.*, c.nombre as conductor_nombre 
        FROM creditos_socio cr
        JOIN conductores c ON cr.conductor_id = c.id
        ORDER BY cr.fecha_registro DESC
      `
        });
        return res.success ? res.data : [];
    }

    async getCreditoActivoByConductor(conductorId: number): Promise<CreditoSocio | null> {
        const res = await this.electron.invoke('db-query', {
            query: `
        SELECT * FROM creditos_socio
        WHERE conductor_id = ? AND estado = 'ACTIVO'
        ORDER BY fecha_registro DESC LIMIT 1
      `,
            params: [conductorId]
        });
        return res.success && res.data.length > 0 ? res.data[0] : null;
    }

    async setAbonoCredito(creditoId: number, montoAbono: number) {
        // Fetch the credit to deduct the payment safely.
        const getRes = await this.electron.invoke('db-query', {
            query: 'SELECT saldo_pendiente FROM creditos_socio WHERE id = ?',
            params: [creditoId]
        });

        if (getRes.success && getRes.data.length > 0) {
            let nuevoSaldo = getRes.data[0].saldo_pendiente - montoAbono;
            let estado = nuevoSaldo <= 0 ? 'PAGADO' : 'ACTIVO';
            if (nuevoSaldo < 0) nuevoSaldo = 0;

            return await this.electron.invoke('db-run', {
                query: 'UPDATE creditos_socio SET saldo_pendiente=?, estado=? WHERE id=?',
                params: [nuevoSaldo, estado, creditoId]
            });
        }
        return { success: false, error: 'Crédito no encontrado' };
    }

    async addCredito(c: CreditoSocio) {
        return await this.electron.invoke('db-run', {
            query: `INSERT INTO creditos_socio (conductor_id, valor_prestamo, saldo_pendiente) VALUES (?, ?, ?)`,
            params: [c.conductor_id, c.valor_prestamo, c.saldo_pendiente]
        });
    }

    async updateCredito(c: CreditoSocio) {
        return await this.electron.invoke('db-run', {
            query: `UPDATE creditos_socio SET conductor_id=?, valor_prestamo=?, saldo_pendiente=?, estado=? WHERE id=?`,
            params: [c.conductor_id, c.valor_prestamo, c.saldo_pendiente, c.estado, c.id]
        });
    }

    async deleteCredito(id: number) {
        return await this.electron.invoke('db-run', {
            query: 'DELETE FROM creditos_socio WHERE id = ?',
            params: [id]
        });
    }
}

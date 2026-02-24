import { Injectable } from '@angular/core';
import { ElectronService } from '../shared/electron.service';

export interface Vehiculo {
    id?: number;
    nro: string;
    tipo: string;
    placa: string;
    anio: number;
}

@Injectable({
    providedIn: 'root'
})
export class VehiculosService {
    constructor(private electron: ElectronService) { }

    async getVehiculos(): Promise<Vehiculo[]> {
        const res = await this.electron.invoke('db-query', {
            query: 'SELECT * FROM vehiculos ORDER BY nro ASC'
        });
        if (!res.success) {
            console.error('Error fetching vehiculos:', res.error);
        }
        return res.success ? res.data : [];
    }

    async addVehiculo(v: Vehiculo) {
        return await this.electron.invoke('db-run', {
            query: `INSERT INTO vehiculos (nro, tipo, placa, anio) 
              VALUES (?, ?, ?, ?)`,
            params: [v.nro, v.tipo, v.placa, v.anio]
        });
    }

    async updateVehiculo(v: Vehiculo) {
        return await this.electron.invoke('db-run', {
            query: `UPDATE vehiculos SET nro=?, tipo=?, placa=?, anio=? WHERE id=?`,
            params: [v.nro, v.tipo, v.placa, v.anio, v.id]
        });
    }

    async deleteVehiculo(id: number) {
        return await this.electron.invoke('db-run', {
            query: 'DELETE FROM vehiculos WHERE id = ?',
            params: [id]
        });
    }
}

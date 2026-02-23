import { Injectable } from '@angular/core';
import { ElectronService } from '../shared/electron.service';

export interface Ruta {
    id?: number;
    nombre: string;
    sector: string;
    institucion: string;
    num_estudiantes: number;
    conductor_id?: number;
    vehiculo_id?: number;
    // Joins
    conductor_nombre?: string;
    vehiculo_placa?: string;
}

@Injectable({
    providedIn: 'root'
})
export class RutasService {
    constructor(private electron: ElectronService) { }

    async getRutas(): Promise<Ruta[]> {
        const res = await this.electron.invoke('db-query', {
            query: `
        SELECT r.*, c.nombre as conductor_nombre, v.placa as vehiculo_placa 
        FROM rutas r
        LEFT JOIN conductores c ON r.conductor_id = c.id
        LEFT JOIN vehiculos v ON r.vehiculo_id = v.id
        ORDER BY r.nombre ASC
      `
        });
        return res.success ? res.data : [];
    }

    async addRuta(r: Ruta) {
        return await this.electron.invoke('db-run', {
            query: `INSERT INTO rutas (nombre, sector, institucion, num_estudiantes, conductor_id, vehiculo_id) 
              VALUES (?, ?, ?, ?, ?, ?)`,
            params: [r.nombre, r.sector, r.institucion, r.num_estudiantes, r.conductor_id, r.vehiculo_id]
        });
    }

    async updateRuta(r: Ruta) {
        return await this.electron.invoke('db-run', {
            query: `UPDATE rutas SET nombre=?, sector=?, institucion=?, num_estudiantes=?, conductor_id=?, vehiculo_id=? WHERE id=?`,
            params: [r.nombre, r.sector, r.institucion, r.num_estudiantes, r.conductor_id, r.vehiculo_id, r.id]
        });
    }

    async deleteRuta(id: number) {
        return await this.electron.invoke('db-run', {
            query: 'DELETE FROM rutas WHERE id = ?',
            params: [id]
        });
    }
}

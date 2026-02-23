import { Injectable } from '@angular/core';
import { ElectronService } from '../shared/electron.service';

export interface Vehiculo {
    id?: number;
    nro: string;
    tipo: string;
    marca: string;
    modelo: string;
    placa: string;
    nro_serie: string;
    color: string;
    anio: number;
    carga_maxima: string;
    estado: string;
    ciclo_mantenimiento: string;
    km_initial: number;
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
            query: `INSERT INTO vehiculos (nro, tipo, marca, modelo, placa, nro_serie, color, anio, carga_maxima, estado, ciclo_mantenimiento, km_initial) 
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            params: [v.nro, v.tipo, v.marca, v.modelo, v.placa, v.nro_serie, v.color, v.anio, v.carga_maxima, v.estado, v.ciclo_mantenimiento, v.km_initial]
        });
    }

    async updateVehiculo(v: Vehiculo) {
        return await this.electron.invoke('db-run', {
            query: `UPDATE vehiculos SET nro=?, tipo=?, marca=?, modelo=?, placa=?, nro_serie=?, color=?, anio=?, carga_maxima=?, estado=?, ciclo_mantenimiento=?, km_initial=? WHERE id=?`,
            params: [v.nro, v.tipo, v.marca, v.modelo, v.placa, v.nro_serie, v.color, v.anio, v.carga_maxima, v.estado, v.ciclo_mantenimiento, v.km_initial, v.id]
        });
    }

    async deleteVehiculo(id: number) {
        return await this.electron.invoke('db-run', {
            query: 'DELETE FROM vehiculos WHERE id = ?',
            params: [id]
        });
    }
}

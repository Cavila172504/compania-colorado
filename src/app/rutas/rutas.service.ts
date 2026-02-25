import { Injectable } from '@angular/core';
import { ElectronService } from '../shared/electron.service';

export interface EstudianteRuta {
    id?: number;
    ruta_id: number;
    numero_estudiante: string;
    nombre_estudiante: string;
    nombre_representante: string;
    cedula_representante: string;
    correo_representante: string;
    telefono_representante: string;
}

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

    async getRutaById(id: number): Promise<Ruta | null> {
        const res = await this.electron.invoke('db-query', {
            query: `
        SELECT r.*, c.nombre as conductor_nombre, v.placa as vehiculo_placa 
        FROM rutas r
        LEFT JOIN conductores c ON r.conductor_id = c.id
        LEFT JOIN vehiculos v ON r.vehiculo_id = v.id
        WHERE r.id = ?
      `,
            params: [id]
        });
        return res.success && res.data.length > 0 ? res.data[0] : null;
    }

    async getEstudiantesByRutaId(rutaId: number): Promise<EstudianteRuta[]> {
        const res = await this.electron.invoke('db-query', {
            query: 'SELECT * FROM estudiantes_ruta WHERE ruta_id = ? ORDER BY nombre_estudiante ASC',
            params: [rutaId]
        });
        return res.success ? res.data : [];
    }

    async addEstudiante(e: EstudianteRuta) {
        return await this.electron.invoke('db-run', {
            query: `INSERT INTO estudiantes_ruta (ruta_id, numero_estudiante, nombre_estudiante, nombre_representante, cedula_representante, correo_representante, telefono_representante) 
              VALUES (?, ?, ?, ?, ?, ?, ?)`,
            params: [e.ruta_id, e.numero_estudiante, e.nombre_estudiante, e.nombre_representante, e.cedula_representante, e.correo_representante, e.telefono_representante]
        });
    }

    async updateEstudiante(e: EstudianteRuta) {
        return await this.electron.invoke('db-run', {
            query: `UPDATE estudiantes_ruta SET numero_estudiante=?, nombre_estudiante=?, nombre_representante=?, cedula_representante=?, correo_representante=?, telefono_representante=? WHERE id=?`,
            params: [e.numero_estudiante, e.nombre_estudiante, e.nombre_representante, e.cedula_representante, e.correo_representante, e.telefono_representante, e.id]
        });
    }

    async deleteEstudiante(id: number) {
        return await this.electron.invoke('db-run', {
            query: 'DELETE FROM estudiantes_ruta WHERE id = ?',
            params: [id]
        });
    }
}

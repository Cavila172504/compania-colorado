import { Injectable } from '@angular/core';
import { ElectronService } from '../shared/electron.service';

export interface Conductor {
    id?: number;
    doc_identidad: string;
    nombre: string;
    nro_licencia: string;
    direccion: string;
    telefono: string;
    calificacion: number;
    ruta_id?: number;
}

@Injectable({
    providedIn: 'root'
})
export class ConductoresService {
    constructor(private electron: ElectronService) { }

    async getConductores(): Promise<Conductor[]> {
        const res = await this.electron.invoke('db-query', {
            query: 'SELECT * FROM conductores ORDER BY nombre ASC'
        });
        if (!res.success) {
            console.error('Error fetching conductores:', res.error);
        }
        return res.success ? res.data : [];
    }

    async addConductor(c: Conductor) {
        return await this.electron.invoke('db-run', {
            query: `INSERT INTO conductores (doc_identidad, nombre, nro_licencia, direccion, telefono, calificacion, ruta_id) 
              VALUES (?, ?, ?, ?, ?, ?, ?)`,
            params: [c.doc_identidad, c.nombre, c.nro_licencia, c.direccion, c.telefono, c.calificacion, c.ruta_id]
        });
    }

    async updateConductor(c: Conductor) {
        return await this.electron.invoke('db-run', {
            query: `UPDATE conductores SET doc_identidad=?, nombre=?, nro_licencia=?, direccion=?, telefono=?, calificacion=?, ruta_id=? WHERE id=?`,
            params: [c.doc_identidad, c.nombre, c.nro_licencia, c.direccion, c.telefono, c.calificacion, c.ruta_id, c.id]
        });
    }

    async deleteConductor(id: number) {
        return await this.electron.invoke('db-run', {
            query: 'DELETE FROM conductores WHERE id = ?',
            params: [id]
        });
    }
}

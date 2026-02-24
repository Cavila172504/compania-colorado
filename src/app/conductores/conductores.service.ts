import { Injectable } from '@angular/core';
import { ElectronService } from '../shared/electron.service';

export interface Conductor {
    id?: number;
    doc_identidad: string;
    nombre: string;
    telefono: string;
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
            query: `INSERT INTO conductores (doc_identidad, nombre, telefono) 
              VALUES (?, ?, ?)`,
            params: [c.doc_identidad, c.nombre, c.telefono]
        });
    }

    async updateConductor(c: Conductor) {
        return await this.electron.invoke('db-run', {
            query: `UPDATE conductores SET doc_identidad=?, nombre=?, telefono=? WHERE id=?`,
            params: [c.doc_identidad, c.nombre, c.telefono, c.id]
        });
    }

    async deleteConductor(id: number) {
        // First, nullify references in other tables to avoid foreign key constraint errors
        await this.electron.invoke('db-run', {
            query: 'UPDATE rutas SET conductor_id = NULL WHERE conductor_id = ?',
            params: [id]
        });
        await this.electron.invoke('db-run', {
            query: 'UPDATE flujo_caja SET conductor_id = NULL WHERE conductor_id = ?',
            params: [id]
        });

        // Now delete the conductor
        return await this.electron.invoke('db-run', {
            query: 'DELETE FROM conductores WHERE id = ?',
            params: [id]
        });
    }
}

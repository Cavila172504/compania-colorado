import { Injectable } from '@angular/core';
import { ElectronService } from '../shared/electron.service';

export interface FlujoCaja {
  id?: number;
  conductor_id: number;
  mes: number;
  anio: number;
  total_ingresos: number;
  cuota_administrativa: number;
  renta_1pct: number;
  comision_cade: number;
  anticipo_socio: number;
  abono_prestamo: number;
  aplicativo_buseta: number;
  comision_compania: number;
  total_egresos: number;
  total_recibir: number;
  // Join info
  conductor_nombre?: string;
}

@Injectable({
  providedIn: 'root'
})
export class FlujoCajaService {
  constructor(private electron: ElectronService) { }

  async getFlujosByDate(mes: number, anio: number): Promise<FlujoCaja[]> {
    const res = await this.electron.invoke('db-query', {
      query: `
        SELECT f.*, c.nombre as conductor_nombre 
        FROM flujo_caja f
        JOIN conductores c ON f.conductor_id = c.id
        WHERE f.mes = ? AND f.anio = ?
      `,
      params: [mes, anio]
    });
    return res.success ? res.data : [];
  }

  async saveFlujo(f: FlujoCaja) {
    if (f.id) {
      return await this.electron.invoke('db-run', {
        query: `UPDATE flujo_caja SET 
                total_ingresos=?, cuota_administrativa=?, renta_1pct=?, comision_cade=?, 
                anticipo_socio=?, abono_prestamo=?, aplicativo_buseta=?, comision_compania=?, 
                total_egresos=?, total_recibir=? 
                WHERE id=?`,
        params: [
          f.total_ingresos, f.cuota_administrativa, f.renta_1pct, f.comision_cade,
          f.anticipo_socio, f.abono_prestamo, f.aplicativo_buseta, f.comision_compania,
          f.total_egresos, f.total_recibir, f.id
        ]
      });
    } else {
      return await this.electron.invoke('db-run', {
        query: `INSERT INTO flujo_caja (
                  conductor_id, mes, anio, total_ingresos, cuota_administrativa, 
                  renta_1pct, comision_cade, anticipo_socio, abono_prestamo, 
                  aplicativo_buseta, comision_compania, total_egresos, total_recibir
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        params: [
          f.conductor_id, f.mes, f.anio, f.total_ingresos, f.cuota_administrativa,
          f.renta_1pct, f.comision_cade, f.anticipo_socio, f.abono_prestamo,
          f.aplicativo_buseta, f.comision_compania, f.total_egresos, f.total_recibir
        ]
      });
    }
  }
}

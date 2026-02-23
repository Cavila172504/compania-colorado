import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FlujoCajaService, FlujoCaja } from '../flujo-caja.service';
import { ConductoresService, Conductor } from '../../conductores/conductores.service';

@Component({
    selector: 'app-flujo-caja-form',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './flujo-caja-form.html',
    styleUrl: './flujo-caja-form.scss'
})
export class FlujoCajaFormComponent implements OnInit {
    conductores: Conductor[] = [];
    selectedConductorId?: number;
    mes: number = new Date().getMonth() + 1;
    anio: number = new Date().getFullYear();

    selectedConductor: Conductor | null = null;
    flujo: FlujoCaja = this.resetFlujo();

    constructor(
        private flujoCajaService: FlujoCajaService,
        private conductoresService: ConductoresService,
        private cdr: ChangeDetectorRef
    ) { }

    async ngOnInit() {
        this.conductores = await this.conductoresService.getConductores();
        this.cdr.detectChanges();
    }

    resetFlujo(): FlujoCaja {
        return {
            conductor_id: 0,
            mes: this.mes,
            anio: this.anio,
            total_ingresos: 0,
            cuota_administrativa: 25.00,
            renta_1pct: 0,
            comision_cade: 0,
            anticipo_socio: 0,
            abono_prestamo: 0,
            aplicativo_buseta: 0,
            comision_compania: 0,
            total_egresos: 0,
            total_recibir: 0
        };
    }

    async loadFlujo() {
        if (!this.selectedConductorId) {
            this.selectedConductor = null;
            return;
        }

        this.selectedConductor = this.conductores.find(c => c.id == this.selectedConductorId) || null;

        const flujos = await this.flujoCajaService.getFlujosByDate(this.mes, this.anio);
        const existing = flujos.find(f => f.conductor_id == this.selectedConductorId);

        if (existing) {
            this.flujo = JSON.parse(JSON.stringify(existing));
        } else {
            this.flujo = this.resetFlujo();
            this.flujo.conductor_id = Number(this.selectedConductorId);
        }

        setTimeout(() => {
            this.calculate();
            this.cdr.detectChanges();
        }, 0);
    }

    calculate() {
        this.flujo.renta_1pct = this.flujo.total_ingresos * 0.01;
        this.flujo.total_egresos =
            Number(this.flujo.cuota_administrativa) +
            Number(this.flujo.renta_1pct) +
            Number(this.flujo.comision_cade) +
            Number(this.flujo.anticipo_socio) +
            Number(this.flujo.abono_prestamo) +
            Number(this.flujo.aplicativo_buseta) +
            Number(this.flujo.comision_compania);

        this.flujo.total_recibir = this.flujo.total_ingresos - this.flujo.total_egresos;
        this.cdr.detectChanges();
    }

    async save() {
        try {
            this.calculate();
            this.flujo.mes = Number(this.mes);
            this.flujo.anio = Number(this.anio);
            const res = await this.flujoCajaService.saveFlujo(this.flujo);

            if (res && res.success) {
                alert('Datos guardados correctamente');
                this.loadFlujo(); // Reload to get ID and ensure sync
            } else {
                alert('Error al guardar datos: ' + (res?.error || 'Error desconocido'));
            }
        } catch (e: any) {
            alert('Error de sistema: ' + e.message);
        }
    }
}

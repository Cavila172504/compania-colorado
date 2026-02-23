import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { VehiculosService } from '../vehiculos/vehiculos.service';
import { ConductoresService } from '../conductores/conductores.service';
import { RutasService } from '../rutas/rutas.service';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './dashboard.html'
})
export class DashboardComponent implements OnInit {
    stats = {
        vehiculos: 0,
        conductores: 0,
        rutas: 0
    };
    loading = true;

    constructor(
        private vehiculosService: VehiculosService,
        private conductoresService: ConductoresService,
        private rutasService: RutasService,
        private cdr: ChangeDetectorRef
    ) { }

    async ngOnInit() {
        this.loading = true;
        this.cdr.detectChanges();

        try {
            const [v, c, r] = await Promise.all([
                this.vehiculosService.getVehiculos(),
                this.conductoresService.getConductores(),
                this.rutasService.getRutas()
            ]);

            this.stats.vehiculos = v.length;
            this.stats.conductores = c.length;
            this.stats.rutas = r.length;
        } catch (error) {
            console.error('Error loading dashboard stats:', error);
        } finally {
            this.loading = false;
            this.cdr.detectChanges();
        }
    }
}

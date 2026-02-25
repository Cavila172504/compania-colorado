import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ExcelService } from '../../shared/excel.service';
import { CreditosService, CreditoSocio } from '../creditos.service';
import { ConductoresService, Conductor } from '../../conductores/conductores.service';

@Component({
    selector: 'app-credito-socio-list',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './credito-socio-list.html',
    styleUrl: './credito-socio-list.scss'
})
export class CreditoSocioListComponent implements OnInit {
    creditos: CreditoSocio[] = [];
    conductores: Conductor[] = [];
    loading = true;
    showModal = false;
    saving = false;
    saveSuccess = false;
    errorMessage = '';
    filterTerm = '';
    editingCredito: CreditoSocio | null = null;
    newCredito: CreditoSocio = this.resetCredito();

    constructor(
        private creditosService: CreditosService,
        private conductoresService: ConductoresService,
        private excelService: ExcelService,
        private cdr: ChangeDetectorRef
    ) { }

    async ngOnInit() {
        await Promise.all([
            this.loadCreditos(),
            this.loadConductores()
        ]);
    }

    async loadCreditos() {
        this.loading = true;
        this.cdr.detectChanges();
        try {
            this.creditos = await this.creditosService.getCreditos();
        } catch (e) {
            console.error(e);
        } finally {
            this.loading = false;
            this.cdr.detectChanges();
        }
    }

    async loadConductores() {
        try {
            this.conductores = await this.conductoresService.getConductores();
        } catch (e) {
            console.error(e);
        }
    }

    resetCredito(): CreditoSocio {
        return {
            conductor_id: 0,
            valor_prestamo: 0,
            saldo_pendiente: 0,
            estado: 'ACTIVO'
        };
    }

    get filteredCreditos(): CreditoSocio[] {
        if (!this.filterTerm.trim()) return this.creditos;
        const term = this.filterTerm.toLowerCase();
        return this.creditos.filter(c =>
            (c.conductor_nombre || '').toLowerCase().includes(term) ||
            (c.estado || '').toLowerCase().includes(term)
        );
    }

    openModal(c?: CreditoSocio) {
        if (c) {
            this.editingCredito = c;
            this.newCredito = { ...c };
        } else {
            this.editingCredito = null;
            this.newCredito = this.resetCredito();
        }
        this.showModal = true;
        this.saveSuccess = false;
        this.errorMessage = '';
        this.cdr.detectChanges();
    }

    closeModal() {
        if (this.saving) return;
        this.showModal = false;
        this.cdr.detectChanges();
    }

    updateSaldoNuevo(val: number) {
        if (!this.editingCredito) {
            // If totally new, saldo pendiente is equal to valor_prestamo
            this.newCredito.saldo_pendiente = val;
        }
    }

    get canSave(): boolean {
        return this.newCredito.conductor_id > 0 && this.newCredito.valor_prestamo > 0 && !this.saving;
    }

    async saveCredito() {
        if (!this.canSave) return;
        this.saving = true;
        this.errorMessage = '';
        this.saveSuccess = false;
        this.cdr.detectChanges();

        try {
            const res = this.editingCredito
                ? await this.creditosService.updateCredito(this.newCredito)
                : await this.creditosService.addCredito(this.newCredito);

            if (res && res.success) {
                this.saveSuccess = true;
                await this.loadCreditos();
                setTimeout(() => this.closeModal(), 800);
            } else {
                this.errorMessage = res?.error || 'Error al guardar';
            }
        } catch (e: any) {
            this.errorMessage = e.message;
        } finally {
            this.saving = false;
            this.cdr.detectChanges();
        }
    }

    async deleteCredito(id: number) {
        if (confirm('¿Seguro de eliminar este crédito? Se puede perder el registro de préstamos.')) {
            this.loading = true;
            try {
                const res = await this.creditosService.deleteCredito(id);
                if (res && res.success) {
                    await this.loadCreditos();
                }
            } catch (e) {
                console.error(e);
            } finally {
                this.loading = false;
                this.cdr.detectChanges();
            }
        }
    }

    async exportToExcel() {
        this.loading = true;
        try {
            const map = [
                { header: 'CONDUCTOR', key: 'conductor_nombre', width: 35 },
                { header: 'PRÉSTAMO INICIAL', key: 'valor_prestamo', width: 25 },
                { header: 'SALDO PENDIENTE', key: 'saldo_pendiente', width: 25 },
                { header: 'FECHA REGISTRO', key: 'fecha_registro', width: 25 },
                { header: 'ESTADO', key: 'estado', width: 15 },
            ]
            await this.excelService.exportToExcel(
                this.filteredCreditos,
                'CreditosSocio',
                'Creditos',
                map
            )
        } catch (e) {
            console.error(e)
        } finally {
            this.loading = false;
            this.cdr.detectChanges();
        }
    }
}

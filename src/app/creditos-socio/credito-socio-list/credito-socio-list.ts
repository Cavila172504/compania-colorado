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
    isRefinancing = false;
    montoAumentar: number = 0;
    activeCreditFound: CreditoSocio | null = null;

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
            estado: 'ACTIVO',
            numero_cheque: '',
            fecha_registro: this.getTodayDateString()
        };
    }

    /** Devuelve la fecha de hoy en formato YYYY-MM-DD para el input date */
    getTodayDateString(): string {
        const now = new Date();
        const yyyy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    }

    get filteredCreditos(): CreditoSocio[] {
        if (!this.filterTerm.trim()) return this.creditos;
        const term = this.filterTerm.toLowerCase();
        return this.creditos.filter(c =>
            (c.conductor_nombre || '').toLowerCase().includes(term) ||
            (c.estado || '').toLowerCase().includes(term) ||
            (c.numero_cheque || '').toLowerCase().includes(term)
        );
    }

    openModal(c?: CreditoSocio) {
        this.isRefinancing = false;
        this.montoAumentar = 0;
        this.activeCreditFound = null;

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

    async onConductorChange() {
        if (this.editingCredito || this.newCredito.conductor_id === 0) return;

        this.isRefinancing = false;
        this.activeCreditFound = null;
        this.montoAumentar = 0;

        const active = await this.creditosService.getCreditoActivoByConductor(this.newCredito.conductor_id);
        if (active) {
            this.activeCreditFound = active;
            this.isRefinancing = true;
            // Al refinanciar, cargamos los datos del crédito existente
            this.newCredito = { ...active };
            // El número de cheque podría ser nuevo para la ampliación
            this.newCredito.numero_cheque = '';
        }
    }

    updateSaldoNuevo(val: number) {
        if (!this.editingCredito && !this.isRefinancing) {
            // Solo para créditos NUEVOS puros: saldo pendiente se puede ingresar manualmente
            // pero se inicializa igual al valor del préstamo
            this.newCredito.saldo_pendiente = val;
        }
    }

    closeModal() {
        if (this.saving) return;
        this.showModal = false;
        this.cdr.detectChanges();
    }

    updateRefinanciacion() {
        if (this.isRefinancing && this.activeCreditFound) {
            const montoExtra = parseFloat(this.montoAumentar?.toString() || '0') || 0;
            const prestamoBase = parseFloat(this.activeCreditFound.valor_prestamo?.toString() || '0') || 0;
            const saldoBase = parseFloat(this.activeCreditFound.saldo_pendiente?.toString() || '0') || 0;

            this.newCredito.valor_prestamo = prestamoBase + montoExtra;
            this.newCredito.saldo_pendiente = saldoBase + montoExtra;
        }
    }

    get canSave(): boolean {
        if (this.isRefinancing) {
            return this.newCredito.conductor_id > 0 && this.montoAumentar > 0 && !this.saving;
        }
        return this.newCredito.conductor_id > 0 && this.newCredito.valor_prestamo > 0 && !this.saving;
    }

    async saveCredito() {
        if (!this.canSave) return;
        this.saving = true;
        this.errorMessage = '';
        this.saveSuccess = false;
        this.cdr.detectChanges();

        try {
            let res;
            if (this.editingCredito) {
                res = await this.creditosService.updateCredito(this.newCredito);
            } else if (this.isRefinancing) {
                // Para refinanciar usamos el updateCredito pero con los valores aumentados
                res = await this.creditosService.updateCredito(this.newCredito);
            } else {
                res = await this.creditosService.addCredito(this.newCredito);
            }

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
                { header: 'Nº CHEQUE', key: 'numero_cheque', width: 20 },
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

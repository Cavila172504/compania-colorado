import { Injectable, NgZone } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class ElectronService {
    private ipc: any;

    constructor(private ngZone: NgZone) {
        if ((window as any).require) {
            try {
                this.ipc = (window as any).require('electron').ipcRenderer;
            } catch (e) {
                console.error('Could not load electron ipc', e);
            }
        }
    }

    public send(channel: string, ...args: any[]): void {
        if (this.ipc) {
            this.ipc.send(channel, ...args);
        }
    }

    public on(channel: string, listener: any): void {
        if (this.ipc) {
            this.ipc.on(channel, listener);
        }
    }

    public async invoke(channel: string, ...args: any[]): Promise<any> {
        if (this.ipc) {
            try {
                const res = await this.ipc.invoke(channel, ...args);
                // Force Angular to detect changes by running in the zone
                return this.ngZone.run(() => res);
            } catch (error) {
                console.error(`[IPC-INVOKE ERROR] ${channel}:`, error);
                return { success: false, error: 'IPC Error: ' + error };
            }
        }
        return { success: false, error: 'Electron not available' };
    }
}

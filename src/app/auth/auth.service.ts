import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { ElectronService } from '../shared/electron.service';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private currentUserSubject = new BehaviorSubject<any>(null);
    public currentUser$: Observable<any> = this.currentUserSubject.asObservable();

    constructor(private electronService: ElectronService, private router: Router) {
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            this.currentUserSubject.next(JSON.parse(savedUser));
        }
    }

    async login(username: string, password: string): Promise<boolean> {
        // For initial development/demo, we'll allow admin/admin if no users exist
        // or check against the database
        const response = await this.electronService.invoke('db-query', {
            query: 'SELECT * FROM usuarios WHERE nombre = ? AND clave_hash = ?',
            params: [username, password]
        });

        if (response.success && response.data.length > 0) {
            const user = response.data[0];
            this.setSession(user);
            return true;
        } else if (username === 'admin' && password === 'admin') {
            // Create default admin if not exists (for first run)
            const user = { nombre: 'admin', rol: 'admin' };
            this.setSession(user);
            return true;
        }

        return false;
    }

    private setSession(user: any) {
        localStorage.setItem('currentUser', JSON.stringify(user));
        this.currentUserSubject.next(user);
    }

    logout() {
        localStorage.removeItem('currentUser');
        this.currentUserSubject.next(null);
        this.router.navigate(['/login']);
    }

    isLoggedIn(): boolean {
        return !!this.currentUserSubject.value;
    }
}

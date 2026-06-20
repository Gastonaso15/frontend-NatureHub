import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Location } from '@angular/common';
import Swal from 'sweetalert2';
import { AutenticacionService } from '../../../core/services/autenticacion';
import { Usuario } from '../../../shared/models/wiki.modelos';

@Component({
    selector: 'app-perfil-usuario',
    standalone: true,
    imports: [],
    templateUrl: './perfil-usuario.html',
    styleUrl: './perfil-usuario.scss',
})
export class PerfilUsuarioComponent implements OnInit {
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private http = inject(HttpClient);
    private location = inject(Location);
    private authService = inject(AutenticacionService);
    private apiUrl = 'http://localhost/backend-NatureHub/src/index.php';

    usuario: Usuario | null = null;
    cargando = signal(true);
    procesando = signal(false);

    ngOnInit(): void {
        const id = Number(this.route.snapshot.paramMap.get('id'));
        if (!id) {
            this.cargando.set(false);
            return;
        }

        this.http
            .get<any[]>(`${this.apiUrl}/usuarios/listarUsuarios`)
            .subscribe({
                next: (resp) => {
                    const encontrado = resp.find((u) => u.id === id);
                    if (encontrado) {
                        this.usuario = {
                            id_usuario: encontrado.id,
                            nombre: encontrado.nombre,
                            apellido: encontrado.apellido,
                            email: encontrado.email,
                            rol: encontrado.rol,
                            activo: encontrado.activo,
                            sexo: encontrado.sexo ?? null,
                            fechaRegistro: encontrado.fechaRegistro ?? null,
                            fechaNacimiento: encontrado.fechaNacimiento ?? null,
                            pais: encontrado.pais ?? null,
                            bio: encontrado.bio ?? null,
                            fotoUrl: encontrado.fotoUrl ?? null,
                        };
                    }
                    this.cargando.set(false);
                },
                error: () => {
                    this.cargando.set(false);
                },
            });
    }

    esAdministrador(): boolean {
        return this.authService.currentUser()?.rol === 'ADMINISTRADOR';
    }

    iniciales(): string {
        return (
            (this.usuario?.nombre?.[0] ?? '') + (this.usuario?.apellido?.[0] ?? '')
        ).toUpperCase();
    }

    fechaRegistroFormateada(): string {
        const f = this.usuario?.fechaRegistro;
        if (!f) return '—';
        return new Date(f).toLocaleDateString('es-UY', {
            month: 'long',
            year: 'numeric',
        });
    }

    async darDeBaja(): Promise<void> {
        if (!this.usuario) return;

        const result = await Swal.fire({
            title: `¿Dar de baja a ${this.usuario.nombre} ${this.usuario.apellido}?`,
            text: 'La cuenta quedará desactivada. El usuario no podrá iniciar sesión.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc3545',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Sí, dar de baja',
            cancelButtonText: 'Cancelar',
        });

        if (!result.isConfirmed) return;

        this.procesando.set(true);
        this.http.delete(`${this.apiUrl}/usuarios/bajaUsuario`, {
            body: { id: this.usuario.id_usuario }
        }).subscribe({
            next: () => {
                this.procesando.set(false);
                Swal.fire({
                    title: 'Cuenta dada de baja',
                    text: `La cuenta de ${this.usuario!.nombre} ${this.usuario!.apellido} fue desactivada.`,
                    icon: 'success',
                    confirmButtonColor: '#2d6a4f',
                }).then(() => this.location.back());
            },
            error: (err) => {
                this.procesando.set(false);
                const msg = err?.error?.error ?? 'No se pudo dar de baja al usuario.';
                Swal.fire('Error', msg, 'error');
            },
        });
    }

    volver(): void {
        this.location.back();
    }

    verPublicaciones(): void {
    if (!this.usuario) return;
    this.router.navigate(['/categorias'], {
        queryParams: { autor: `${this.usuario.nombre} ${this.usuario.apellido}` }
    });
}
}
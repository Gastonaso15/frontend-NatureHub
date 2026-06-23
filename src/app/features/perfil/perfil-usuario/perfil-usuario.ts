import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Location } from '@angular/common';
import Swal from 'sweetalert2';
import { AutenticacionService } from '../../../core/services/autenticacion';
import { WikiService } from '../../../core/services/wiki';
import { Usuario } from '../../../shared/models/wiki.modelos';

@Component({
    selector: 'app-perfil-usuario',
    standalone: true,
    imports: [RouterLink],
    templateUrl: './perfil-usuario.html',
    styleUrl: './perfil-usuario.scss',
})
export class PerfilUsuarioComponent implements OnInit {
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private location = inject(Location);
    private wikiService = inject(WikiService);
    private authService = inject(AutenticacionService);

    usuario: Usuario | null = null;
    cargando = signal(true);
    procesando = signal(false);
    esFavorito = signal(false);

    ngOnInit(): void {
        const id = Number(this.route.snapshot.paramMap.get('id'));
        if (!id) {
            this.cargando.set(false);
            return;
        }

        this.wikiService.obtenerUsuarioPorId(id)
            .then((usuarioMapeado) => {
                this.usuario = usuarioMapeado ?? null;
                this.cargando.set(false);
                this.verificarSiEsFavorito();
            })
            .catch(() => {
                this.cargando.set(false);
                Swal.fire('Error', 'No se pudo cargar el perfil del usuario.', 'error');
            });
    }

    private verificarSiEsFavorito(): void {
        const idUsuarioActual = this.authService.currentUser()?.id_usuario;
        if (!idUsuarioActual || !this.usuario) return;

        this.authService.listarUsuariosFavoritosApi(idUsuarioActual).subscribe({
            next: (lista) => {
                const encontrado = lista.some((u: any) => u.id === this.usuario!.id_usuario);
                this.esFavorito.set(encontrado);
            },
            error: () => { }
        });
    }

    toggleFavorito(): void {
        const idUsuarioActual = this.authService.currentUser()?.id_usuario;
        if (!idUsuarioActual || !this.usuario) return;

        this.procesando.set(true);

        if (this.esFavorito()) {
            this.authService.eliminarUsuarioFavoritoApi(idUsuarioActual, this.usuario.id_usuario).subscribe({
                next: () => {
                    this.esFavorito.set(false);
                    this.procesando.set(false);
                },
                error: (err) => {
                    this.procesando.set(false);
                    Swal.fire('Error', err?.error?.error ?? 'No se pudo quitar de favoritos.', 'error');
                }
            });
        } else {
            this.authService.agregarUsuarioFavoritoApi(idUsuarioActual, this.usuario.id_usuario).subscribe({
                next: () => {
                    this.esFavorito.set(true);
                    this.procesando.set(false);
                },
                error: (err) => {
                    this.procesando.set(false);
                    Swal.fire('Error', err?.error?.error ?? 'No se pudo agregar a favoritos.', 'error');
                }
            });
        }
    }

    esPropioPerfilONoLogueado(): boolean {
        const idActual = this.authService.currentUser()?.id_usuario;
        return !idActual || idActual === this.usuario?.id_usuario;
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
        this.authService.bajaUsuarioApi(this.usuario.id_usuario).subscribe({
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
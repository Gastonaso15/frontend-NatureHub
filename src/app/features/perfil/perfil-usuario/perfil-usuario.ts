import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Location } from '@angular/common';
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
    private apiUrl = 'http://localhost/backend-NatureHub/src/index.php';

    usuario: Usuario | null = null;
    cargando = signal(true);

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

    volver(): void {
        this.location.back();
    }
}
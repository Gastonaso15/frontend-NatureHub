import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AutenticacionService } from '../../../core/services/autenticacion';
import { Usuario } from '../../../shared/models/wiki.modelos';

@Component({
  selector: 'app-mis-usuarios-favoritos',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './mis-usuarios-favoritos.html',
  styleUrl: './mis-usuarios-favoritos.scss',
})
export class MisUsuariosFavoritosComponent implements OnInit {
  private authService = inject(AutenticacionService);

  usuarios = signal<Usuario[]>([]);
  cargando = signal(true);
  error = signal<string | null>(null);

  ngOnInit(): void {
    const idUsuario = this.authService.currentUser()?.id_usuario;
    if (!idUsuario) {
      this.error.set('No se pudo identificar al usuario.');
      this.cargando.set(false);
      return;
    }

    this.authService.listarUsuariosFavoritosApi(idUsuario).subscribe({
      next: (resp) => {
        this.usuarios.set(resp.map((u: any) => AutenticacionService.mapUsuario(u)));
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar tus usuarios favoritos.');
        this.cargando.set(false);
      }
    });
  }

  quitarFavorito(usuario: Usuario): void {
    const idUsuario = this.authService.currentUser()!.id_usuario;
    this.authService.eliminarUsuarioFavoritoApi(idUsuario, usuario.id_usuario).subscribe({
      next: () => {
        this.usuarios.update(list => list.filter(u => u.id_usuario !== usuario.id_usuario));
      },
      error: () => {}
    });
  }

  iniciales(usuario: Usuario): string {
    return ((usuario.nombre?.[0] ?? '') + (usuario.apellido?.[0] ?? '')).toUpperCase();
  }
}
import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AutenticacionService } from '../../../core/services/autenticacion';
import { WikiService } from '../../../core/services/wiki';
import { Publicacion } from '../../../shared/models/wiki.modelos';

@Component({
  selector: 'app-mis-favoritas',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './mis-favoritas.html',
  styleUrl: './mis-favoritas.scss',
})
export class MisFavoritasComponent implements OnInit {
  private authService = inject(AutenticacionService);
  private wikiService = inject(WikiService);

  publicaciones = signal<Publicacion[]>([]);
  cargando = signal(true);
  error = signal<string | null>(null);

  ngOnInit(): void {
    const idUsuario = this.authService.currentUser()?.id_usuario;
    if (!idUsuario) {
      this.error.set('No se pudo identificar al usuario.');
      this.cargando.set(false);
      return;
    }

    this.authService.listarFavoritasApi(idUsuario).subscribe({
      next: (resp) => {
        this.publicaciones.set(resp.map((p: any) => this.wikiService.mapPublicacionDesdeApi(p)));
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar tus favoritas.');
        this.cargando.set(false);
      }
    });
  }

  quitarFavorita(pub: Publicacion): void {
    const idUsuario = this.authService.currentUser()!.id_usuario;
    this.authService.eliminarFavoritaApi(idUsuario, pub.id_publicacion).subscribe({
      next: () => {
        this.publicaciones.update(list => list.filter(p => p.id_publicacion !== pub.id_publicacion));
      },
      error: () => {}
    });
  }
}
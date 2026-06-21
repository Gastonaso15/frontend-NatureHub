import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AutenticacionService } from '../../../core/services/autenticacion';
import { Usuario } from '../../../shared/models/wiki.modelos';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-promover-usuario',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './promover-usuario.html',
  styleUrl: './promover-usuario.scss'
})
export class PromoverUsuarioComponent implements OnInit {
  private authService = inject(AutenticacionService);

  usuarios = signal<Usuario[]>([]);
  cargando = signal(true);

  ngOnInit(): void {
    this.cargarUsuarios();
  }

  cargarUsuarios(): void {
    this.cargando.set(true);
    this.authService.listarUsuarios().subscribe({
      next: (resp: any[]) => {
        this.usuarios.set(
          resp
            .filter(u => u.rol === 'USUARIO')
            .map(AutenticacionService.mapUsuario)
        );
        this.cargando.set(false);
      },
      error: () => {
        this.cargando.set(false);
        Swal.fire('Error', 'No se pudo cargar la lista de usuarios.', 'error');
      }
    });
  }

  promover(usuario: Usuario): void {
    Swal.fire({
      title: `¿Promover a ${usuario.nombre} ${usuario.apellido}?`,
      text: 'Este usuario pasará a tener permisos de moderador.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#2d6a4f',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, ascender',
      cancelButtonText: 'Cancelar'
    }).then(result => {
      if (!result.isConfirmed) return;

      this.authService.promoverUsuario(usuario.id_usuario).subscribe({
        next: () => {
          Swal.fire('Listo', 'El usuario fue ascendido a moderador.', 'success');
          this.cargarUsuarios();
        },
        error: (err) => {
          const msg = err?.error?.error ?? 'No se pudo ascender al usuario.';
          Swal.fire('Error', msg, 'error');
        }
      });
    });
  }
}
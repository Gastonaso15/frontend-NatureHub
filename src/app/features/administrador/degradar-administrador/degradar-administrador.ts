import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AutenticacionService } from '../../../core/services/autenticacion';
import { Usuario } from '../../../shared/models/wiki.modelos';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-degradar-administrador',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './degradar-administrador.html',
  styleUrl: './degradar-administrador.scss'
})
export class DegradarAdministradorComponent implements OnInit {
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
        const emailLogueado = this.authService.currentUser()?.email;
        this.usuarios.set(
          resp
            .filter(u => u.rol === 'ADMINISTRADOR' && u.email !== emailLogueado)
            .map(AutenticacionService.mapUsuario)
        );
        this.cargando.set(false);
      },
      error: () => {
        this.cargando.set(false);
        Swal.fire('Error', 'No se pudo cargar la lista de administradores.', 'error');
      }
    });
  }

  degradar(usuario: Usuario): void {
    Swal.fire({
      title: `¿Degradar a ${usuario.nombre} ${usuario.apellido}?`,
      text: 'Este administrador pasará a tener permisos de moderador.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#2d6a4f',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, degradar',
      cancelButtonText: 'Cancelar'
    }).then(result => {
      if (!result.isConfirmed) return;

      this.authService.degradarAdministrador(usuario.id_usuario).subscribe({
        next: () => {
          Swal.fire('Listo', 'El administrador fue degradado a moderador.', 'success');
          this.cargarUsuarios();
        },
        error: (err) => {
          const msg = err?.error?.error ?? 'No se pudo degradar al administrador.';
          Swal.fire('Error', msg, 'error');
        }
      });
    });
  }
}
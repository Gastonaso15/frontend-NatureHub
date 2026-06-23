import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AutenticacionService } from '../../../core/services/autenticacion';
import { Usuario } from '../../../shared/models/wiki.modelos';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-degradar-administrador',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: './degradar-administrador.html',
  styleUrl: './degradar-administrador.scss'
})
export class DegradarAdministradorComponent implements OnInit {
  private authService = inject(AutenticacionService);

  usuarios = signal<Usuario[]>([]);
  usuariosFiltrados = signal<Usuario[]>([]);
  busqueda = signal('');
  cargando = signal(true);

  ngOnInit(): void {
    this.cargarUsuarios();
  }

  cargarUsuarios(): void {
    this.cargando.set(true);
    this.authService.listarUsuarios().subscribe({
      next: (resp: any[]) => {
        const emailLogueado = this.authService.currentUser()?.email;
        const lista = resp
          .filter(u => u.rol === 'ADMINISTRADOR' && u.activo && u.email !== emailLogueado)
          .map(AutenticacionService.mapUsuario);
        this.usuarios.set(lista);
        this.usuariosFiltrados.set(lista);
        this.cargando.set(false);
      },
      error: () => {
        this.cargando.set(false);
        Swal.fire('Error', 'No se pudo cargar la lista de administradores.', 'error');
      }
    });
  }

  filtrar(termino: string): void {
    this.busqueda.set(termino);
    const t = termino.toLowerCase();
    this.usuariosFiltrados.set(
      this.usuarios().filter(u =>
        u.nombre.toLowerCase().includes(t) ||
        u.apellido.toLowerCase().includes(t) ||
        u.email.toLowerCase().includes(t)
      )
    );
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
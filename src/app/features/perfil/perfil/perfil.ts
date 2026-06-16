import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule, NgForm } from '@angular/forms';
import { AutenticacionService } from '../../../core/services/autenticacion';
import { Usuario } from '../../../shared/models/wiki.modelos';
import { HttpClient } from '@angular/common/http';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './perfil.html',
  styleUrl: './perfil.scss'
})
export class PerfilComponent implements OnInit {
  private authService = inject(AutenticacionService);
  private http = inject(HttpClient);
  private router = inject(Router);
  private apiUrl = 'http://localhost/backend-NatureHub/src/index.php';

  usuario: Usuario | null = null;
  modoEdicion = false;
  enviado = false;
  mensajeExito: string | null = null;
  mensajeError: string | null = null;

  datosEdicion: Partial<Usuario> = {};


  ngOnInit(): void {
    const u = this.authService.currentUser();
    if (u) {
      this.usuario = u;
    } else {
      this.router.navigate(['/auth/login']);
    }
  }


  obtenerImagenUrl(url: string | null | undefined): string | null {
    if (!url) return null;
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    return `http://localhost/backend-NatureHub/${url}`;
  }

  iniciales(): string {
    if (!this.usuario) return '';
    return ((this.usuario.nombre?.[0] ?? '') + (this.usuario.apellido?.[0] ?? '')).toUpperCase();
  }

  labelRol(): string {
    const map: Record<string, string> = {
      USUARIO: 'USUARIO',
      MODERADOR: 'MODERADOR',
      ADMINISTRADOR: 'ADMINISTRADOR'
    };
    return map[this.usuario?.rol ?? 'USUARIO'] ?? 'USUARIO';
  }

  labelSexo(): string {
    const map: Record<string, string> = {
      femenino: 'Femenino',
      masculino: 'Masculino',
      otro: 'Otro'
    };
    return map[(this.usuario as any)?.sexo ?? ''] ?? '';
  }

  fechaRegistroFormateada(): string {
    const f = (this.usuario as any)?.fechaRegistro as string | undefined;
    if (!f) return '';
    return new Date(f).toLocaleDateString('es-UY', { month: 'long', year: 'numeric' });
  }


  toggleEdicion(): void {
    if (!this.modoEdicion && this.usuario) {
      this.datosEdicion = { ...this.usuario } as Partial<Usuario>;
    }
    this.modoEdicion = !this.modoEdicion;
    this.mensajeExito = null;
    this.mensajeError = null;
    this.enviado = false;
  }

  guardarCambios(form: NgForm): void {
    this.enviado = true;
    this.mensajeExito = null;
    this.mensajeError = null;

    if (form.invalid) return;

    const id = this.usuario?.id_usuario ||
      (this.datosEdicion as any)?.id_usuario ||
      JSON.parse(localStorage.getItem('nh_user') ?? '{}')?.id_usuario;

    if (!id) {
      this.mensajeError = 'No se pudo identificar al usuario. Por favor, reiniciá sesión.';
      return;
    }

    const d = this.datosEdicion as any;
    const formData = new FormData();
    formData.append('id', String(id));
    formData.append('nombre', d.nombre ?? '');
    formData.append('apellido', d.apellido ?? '');
    formData.append('email', d.email ?? '');
    if (d.sexo) formData.append('sexo', d.sexo);
    if (d.fechaNacimiento) formData.append('fechaNacimiento', d.fechaNacimiento);
    if (d.pais) formData.append('pais', d.pais);
    if (d.bio) formData.append('bio', d.bio);
    if (d.fotoUrl) formData.append('fotoUrl', d.fotoUrl);

    this.http.post(`${this.apiUrl}/usuarios/modificarUsuario`, formData).subscribe({
      next: () => {
        const updated: Usuario = {
          ...this.usuario!,
          ...this.datosEdicion,
          id_usuario: id
        } as Usuario;

        this.usuario = updated;
        localStorage.setItem('nh_user', JSON.stringify(updated));
        this.authService.currentUser.set(updated);

        this.mensajeExito = 'Perfil actualizado correctamente.';
        this.modoEdicion = false;
        this.enviado = false;
      },
      error: (err: unknown) => {
        console.error('Error del servidor:', err);
        const e = err as { error?: { error?: string; message?: string }; message?: string };
        const msg = e?.error?.error ?? e?.error?.message ?? e?.message;
        this.mensajeError = typeof msg === 'string' && msg.length
          ? msg
          : 'No se pudieron guardar los cambios en el servidor.';
      }
    });
  }

  cerrarSesion(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }

  eliminarCuenta(): void {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción dará de baja tu cuenta y no podrás revertirla.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, dar de baja',
      cancelButtonText: 'Cancelar',
      background: '#fff'
    }).then((result) => {
      if (result.isConfirmed) {

        const id = this.usuario?.id_usuario ||
          JSON.parse(localStorage.getItem('nh_user') ?? '{}')?.id_usuario;

        if (!id) {
          Swal.fire('Error', 'No se pudo identificar al usuario para procesar la baja.', 'error');
          return;
        }

        const body = { id: id };

        this.http.delete(`${this.apiUrl}/usuarios/bajaUsuario`, { body }).subscribe({
          next: () => {
            Swal.fire({
              title: 'Cuenta dada de baja',
              text: 'Tu cuenta ha sido desactivada correctamente.',
              icon: 'success',
              confirmButtonText: 'Aceptar'
            }).then(() => {
              this.cerrarSesion();
            });
          },
          error: (err: unknown) => {
            console.error('Error al dar de baja:', err);
            const e = err as { error?: { error?: string; message?: string }; message?: string };
            const msg = e?.error?.error ?? e?.error?.message ?? 'No se pudo procesar la baja de la cuenta.';

            Swal.fire('Hubo un problema', msg, 'error');
          }
        });
      }
    });
  }
}
import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule, NgForm } from '@angular/forms';
import { AutenticacionService } from '../../../core/services/autenticacion';
import { Usuario } from '../../../shared/models/wiki.modelos';
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
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  usuario: Usuario | null = null;
  modoEdicion = false;
  enviado = false;
  mensajeExito: string | null = null;
  mensajeError: string | null = null;

  datosEdicion: Partial<Usuario & { sexo?: string; fechaNacimiento?: string }> = {};

  fotoFile?: File;
  fotoPreview: string | null = null;
  dragActive = false;

  nuevoEmail = '';
  confirmarEmail = '';
  enviadoEmail = false;
  emailMismatch = false;
  mensajeExitoEmail: string | null = null;
  mensajeErrorEmail: string | null = null;

  passwordNueva = '';
  passwordConfirm = '';
  enviadoPass = false;
  passwordMismatch = false;
  mensajeExitoPass: string | null = null;
  mensajeErrorPass: string | null = null;

  ngOnInit(): void {
    const u = this.authService.currentUser();
    if (u) {
      this.usuario = u;
    } else {
      this.router.navigate(['/auth/login']);
    }
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
      const u = this.usuario as any;
      this.datosEdicion = { ...this.usuario } as any;

      if (u.fechaNacimiento) {
        (this.datosEdicion as any).fechaNacimiento = u.fechaNacimiento.split(' ')[0];
      }

      this.fotoFile = undefined;
      this.fotoPreview = null;
      this.nuevoEmail = '';
      this.confirmarEmail = '';
      this.passwordNueva = '';
      this.passwordConfirm = '';
    }
    this.modoEdicion = !this.modoEdicion;
    this.mensajeExito = null;
    this.mensajeError = null;
    this.mensajeExitoEmail = null;
    this.mensajeErrorEmail = null;
    this.mensajeExitoPass = null;
    this.mensajeErrorPass = null;
    this.enviado = false;
    this.enviadoEmail = false;
    this.enviadoPass = false;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.handleFile(input.files?.[0]);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.dragActive = true;
  }

  onDragLeave(): void {
    this.dragActive = false;
  }

  onFileDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragActive = false;
    this.handleFile(event.dataTransfer?.files?.[0]);
  }

  handleFile(file?: File): void {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      this.mensajeError = 'Solo se permiten imágenes (JPG, PNG, GIF, WEBP).';
      return;
    }
    this.mensajeError = null;
    if (this.fotoPreview) URL.revokeObjectURL(this.fotoPreview);
    this.fotoFile = file;
    this.fotoPreview = URL.createObjectURL(file);
    this.datosEdicion.fotoUrl = '';
  }

  removeFoto(): void {
    if (this.fotoPreview) URL.revokeObjectURL(this.fotoPreview);
    this.fotoPreview = null;
    this.fotoFile = undefined;
  }

  onFotoUrlChange(): void {
    if (this.datosEdicion.fotoUrl) {
      this.fotoFile = undefined;
      if (this.fotoPreview) {
        URL.revokeObjectURL(this.fotoPreview);
        this.fotoPreview = null;
      }
    }
  }

  private async solicitarPasswordActual(titulo: string, inputLabel: string): Promise<string | null> {
    const result = await Swal.fire({
      title: titulo,
      input: 'password',
      inputLabel,
      inputPlaceholder: 'Tu contraseña actual',
      inputAttributes: {
        autocapitalize: 'off',
        autocorrect: 'off',
        autocomplete: 'current-password',
      },
      showCancelButton: true,
      confirmButtonColor: '#2d6a4f',
      confirmButtonText: 'Confirmar',
      cancelButtonText: 'Cancelar',
      inputValidator: (value) => {
        if (!value?.trim()) {
          return 'Debés ingresar tu contraseña actual.';
        }
        return null;
      },
    });

    if (!result.isConfirmed || !result.value?.trim()) {
      return null;
    }

    return result.value.trim();
  }

  private appendPasswordActual(formData: FormData, passwordActual: string): void {
    formData.append('passwordActual', passwordActual);
    formData.append('password', passwordActual);
  }

  async guardarCambios(form: NgForm): Promise<void> {
    this.enviado = true;
    this.mensajeExito = null;
    this.mensajeError = null;

    if (form.invalid) return;

    const id = this.usuario?.id_usuario ??
      JSON.parse(localStorage.getItem('nh_user') ?? '{}')?.id_usuario;

    if (!id) {
      this.mensajeError = 'No se pudo identificar al usuario. Por favor, reiniciá sesión.';
      return;
    }

    const passwordActual = await this.solicitarPasswordActual(
      'Confirmar cambios',
      'Ingresá tu contraseña actual para guardar las modificaciones'
    );

    if (!passwordActual) {
      this.enviado = false;
      this.cdr.detectChanges();
      return;
    }

    const d = this.datosEdicion as any;
    const formData = new FormData();
    formData.append('id', String(id));
    formData.append('nombre', d.nombre ?? '');
    formData.append('apellido', d.apellido ?? '');
    formData.append('email', d.email ?? this.usuario?.email ?? '');
    this.appendPasswordActual(formData, passwordActual);
    if (d.sexo) formData.append('sexo', d.sexo);
    if (d.fechaNacimiento) formData.append('fechaNacimiento', d.fechaNacimiento);
    if (d.pais) formData.append('pais', d.pais);
    if (d.bio) formData.append('bio', d.bio);

    if (this.fotoFile) {
      formData.append('foto', this.fotoFile, this.fotoFile.name);
    } else if (d.fotoUrl) {
      formData.append('fotoUrl', d.fotoUrl);
    }

    this.authService.modificarUsuarioApi(formData).subscribe({
      next: (resp: any) => {
        const updated: Usuario = {
          ...this.usuario!,
          ...this.datosEdicion,
          id_usuario: id,
          fotoUrl: resp?.fotoUrl ?? (this.fotoFile ? this.fotoPreview : null) ?? d.fotoUrl ?? this.usuario?.fotoUrl ?? null
        } as Usuario;

        this.usuario = updated;
        localStorage.setItem('nh_user', JSON.stringify(updated));
        this.authService.currentUser.set(updated);

        this.fotoFile = undefined;
        this.fotoPreview = null;

        this.mensajeExito = 'Perfil actualizado correctamente.';
        this.enviado = false;
        this.cdr.detectChanges();
      },
      error: (err: unknown) => {
        const e = err as { error?: { error?: string; message?: string }; message?: string };
        const msg = e?.error?.error ?? e?.error?.message ?? e?.message;
        this.mensajeError = typeof msg === 'string' && msg.length
          ? msg
          : 'No se pudieron guardar los cambios en el servidor.';
        this.cdr.detectChanges();
      }
    });
  }

  async cambiarEmail(form: NgForm): Promise<void> {
    this.enviadoEmail = true;
    this.mensajeExitoEmail = null;
    this.mensajeErrorEmail = null;
    this.emailMismatch = this.nuevoEmail !== this.confirmarEmail;

    if (form.invalid || this.emailMismatch) return;

    if (this.nuevoEmail === this.usuario?.email) {
      this.mensajeErrorEmail = 'El nuevo correo es igual al actual.';
      return;
    }

    const passwordActual = await this.solicitarPasswordActual(
      'Confirmar cambio de correo',
      'Ingresá tu contraseña actual para autorizar el cambio'
    );

    if (!passwordActual) {
      this.enviadoEmail = false;
      this.cdr.detectChanges();
      return;
    }

    const id = this.usuario?.id_usuario ??
      JSON.parse(localStorage.getItem('nh_user') ?? '{}')?.id_usuario;

    const formData = new FormData();
    formData.append('id', String(id));
    formData.append('nombre', this.usuario?.nombre ?? '');
    formData.append('apellido', this.usuario?.apellido ?? '');
    formData.append('email', this.nuevoEmail);
    this.appendPasswordActual(formData, passwordActual);

    const u = this.usuario as any;
    if (u?.sexo) formData.append('sexo', u.sexo);
    if (u?.fechaNacimiento) formData.append('fechaNacimiento', u.fechaNacimiento.split(' ')[0]);
    if (u?.pais) formData.append('pais', u.pais);
    if (u?.bio) formData.append('bio', u.bio);
    if (this.usuario?.fotoUrl) formData.append('fotoUrl', this.usuario.fotoUrl);

    this.authService.modificarUsuarioApi(formData).subscribe({
      next: () => {
        const updated: Usuario = { ...this.usuario!, email: this.nuevoEmail };
        this.usuario = updated;
        localStorage.setItem('nh_user', JSON.stringify(updated));
        this.authService.currentUser.set(updated);

        this.mensajeExitoEmail = 'Correo electrónico actualizado correctamente.';
        this.nuevoEmail = '';
        this.confirmarEmail = '';
        this.enviadoEmail = false;
        this.emailMismatch = false;
        this.cdr.detectChanges();
      },
      error: (err: unknown) => {
        const e = err as { error?: { error?: string; message?: string }; message?: string };
        const msg = e?.error?.error ?? e?.error?.message ?? e?.message;

        const msgStr = typeof msg === 'string' ? msg.toLowerCase() : '';
        if (msgStr.includes('duplicate') || msgStr.includes('ya existe') || msgStr.includes('already') || msgStr.includes('exist') || msgStr.includes('email')) {
          this.mensajeErrorEmail = 'Ese correo electrónico ya está registrado. Elegí uno diferente.';
        } else {
          this.mensajeErrorEmail = typeof msg === 'string' && msg.length
            ? msg
            : 'No se pudo actualizar el correo. Intentá de nuevo.';
        }
        form.controls['nuevoEmail']?.setErrors({ serverError: true });
        this.cdr.detectChanges();
      }
    });
  }

  async cambiarPassword(form: NgForm): Promise<void> {
    this.enviadoPass = true;
    this.mensajeExitoPass = null;
    this.mensajeErrorPass = null;
    this.passwordMismatch = this.passwordNueva !== this.passwordConfirm;

    if (form.invalid || this.passwordMismatch) {
      this.cdr.detectChanges();
      return;
    }

    const passwordActual = await this.solicitarPasswordActual(
      'Confirmar cambio de contraseña',
      'Ingresá tu contraseña actual para autorizar el cambio'
    );

    if (!passwordActual) {
      this.enviadoPass = false;
      this.cdr.detectChanges();
      return;
    }

    const id = this.usuario?.id_usuario ??
      JSON.parse(localStorage.getItem('nh_user') ?? '{}')?.id_usuario;

    const formData = new FormData();
    formData.append('id', String(id));
    formData.append('nombre', this.usuario?.nombre ?? '');
    formData.append('apellido', this.usuario?.apellido ?? '');
    formData.append('email', this.usuario?.email ?? '');
    this.appendPasswordActual(formData, passwordActual);
    formData.append('nuevaPassword', this.passwordNueva);

    const u = this.usuario as any;
    if (u?.sexo) formData.append('sexo', u.sexo);
    if (u?.fechaNacimiento) formData.append('fechaNacimiento', u.fechaNacimiento.split(' ')[0]);
    if (u?.pais) formData.append('pais', u.pais);
    if (u?.bio) formData.append('bio', u.bio);
    if (this.usuario?.fotoUrl) formData.append('fotoUrl', this.usuario.fotoUrl);

    this.authService.modificarUsuarioApi(formData).subscribe({
      next: () => {
        this.mensajeExitoPass = 'Contraseña actualizada correctamente.';
        this.passwordNueva = '';
        this.passwordConfirm = '';
        this.enviadoPass = false;
        this.passwordMismatch = false;
        this.cdr.detectChanges();
      },
      error: (err: unknown) => {
        const e = err as { error?: { error?: string; message?: string }; message?: string };
        const msg = e?.error?.error ?? e?.error?.message ?? e?.message;
        this.mensajeErrorPass = typeof msg === 'string' && msg.length
          ? msg
          : 'No se pudo cambiar la contraseña. Verificá tu contraseña actual.';
        this.cdr.detectChanges();
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
      if (!result.isConfirmed) return;

      const id = this.usuario?.id_usuario ??
        JSON.parse(localStorage.getItem('nh_user') ?? '{}')?.id_usuario;

      if (!id) {
        Swal.fire('Error', 'No se pudo identificar al usuario para procesar la baja.', 'error');
        return;
      }

      this.authService.bajaUsuarioApi(id).subscribe({
        next: () => {
          Swal.fire({
            title: 'Cuenta dada de baja',
            text: 'Tu cuenta ha sido desactivada correctamente.',
            icon: 'success',
            confirmButtonText: 'Aceptar'
          }).then(() => this.cerrarSesion());
        },
        error: (err: unknown) => {
          const e = err as { error?: { error?: string; message?: string }; message?: string };
          const msg = e?.error?.error ?? e?.error?.message ?? 'No se pudo procesar la baja de la cuenta.';
          Swal.fire('Hubo un problema', msg, 'error');
        }
      });
    });
  }

  verPublicaciones(): void {
    this.router.navigate(['/wiki/mis-publicaciones']);
  }
}
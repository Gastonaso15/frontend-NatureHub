import { Component, inject, ElementRef, ViewChild, AfterViewInit, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { WikiService } from '../../../core/services/wiki';
import { AutenticacionService } from '../../../core/services/autenticacion';
import { Publicacion, Seccion, Usuario } from '../../../shared/models/wiki.modelos';

interface PublicacionConAutor extends Publicacion {
  nombreAutor?: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class HomeComponent implements AfterViewInit, OnInit {
  @ViewChild('statsCanvas') statsCanvas!: ElementRef<HTMLCanvasElement>;

  private wikiService = inject(WikiService);
  private authService = inject(AutenticacionService);
  private http = inject(HttpClient);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private apiUrl = 'http://localhost/backend-NatureHub/src/index.php';

  private chartRows: { id_seccion: number; y: number; h: number; barW: number }[] = [];
  private readonly chartLabelWidth = 110;

  secciones: Seccion[] = this.wikiService.getSecciones();
  articulosDestacados: PublicacionConAutor[] = [];
  publicaciones: PublicacionConAutor[] = [];
  usuarios: Usuario[] = [];
  consultaBusqueda = '';
  resultadosBusqueda: PublicacionConAutor[] | null = null;
  loading = true;

  private viewReady = false;

  ngOnInit(): void {
    forkJoin({
      secciones: this.wikiService.listarSeccionesApi(),
      publicaciones: this.wikiService.listarPublicacionesApi(),
      usuarios: this.http.get<any[]>(`${this.apiUrl}/usuarios/listarUsuarios`)
    }).subscribe({
      next: (resultado) => {
        this.secciones = resultado.secciones;
        this.usuarios = resultado.usuarios.map(u => ({
          id_usuario: u.id,
          nombre: u.nombre,
          apellido: u.apellido,
          email: u.email,
          rol: u.rol,
          activo: u.activo,
          sexo: u.sexo ?? null,
          fechaRegistro: u.fechaRegistro ?? null,
          fechaNacimiento: u.fechaNacimiento ?? null,
          pais: u.pais ?? null,
          bio: u.bio ?? null,
          fotoUrl: u.fotoUrl ?? null
        }));

        this.publicaciones = resultado.publicaciones.map(p => ({
          ...p,
          nombreAutor: this.getNombreAutor(p.id_autor)
        }));

        const mezclados = [...this.publicaciones].sort(() => Math.random() - 0.5);
        this.articulosDestacados = mezclados.slice(0, 4);

        this.loading = false;
        this.cdr.detectChanges();
        this.tryDrawChart();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
        this.tryDrawChart();
      }
    });
  }

  ngAfterViewInit(): void {
    this.viewReady = true;
    this.tryDrawChart();
  }

  private tryDrawChart(): void {
    if (!this.viewReady || this.loading) return;
    requestAnimationFrame(() => this.drawSectionStats());
  }

  private getNombreAutor(idAutor: number): string {
    const u = this.usuarios.find(u => u.id_usuario === idAutor);
    return u ? `${u.nombre} ${u.apellido}` : '';
  }

  onSearch(): void {
    const q = this.consultaBusqueda.trim().toLowerCase();
    if (!q) {
      this.resultadosBusqueda = null;
      return;
    }

    this.resultadosBusqueda = this.publicaciones.filter(p =>
      p.titulo.toLowerCase().includes(q) ||
      p.nombre_cientifico.toLowerCase().includes(q) ||
      p.areas_habitat.toLowerCase().includes(q) ||
      (p.nombreAutor ?? '').toLowerCase().includes(q)
    );
  }

  clearSearch(): void {
    this.consultaBusqueda = '';
    this.resultadosBusqueda = null;
  }

  private drawSectionStats(): void {
    const canvas = this.statsCanvas?.nativeElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const data = this.secciones.map(s => {
      const conteo = this.publicaciones.filter(p => {
        return Number(p.id_seccion) === Number(s.id_seccion);
      }).length;

      return {
        id_seccion: s.id_seccion,
        name: s.nombre,
        count: conteo
      };
    });

    this.chartRows = [];

    const colors = ['#2d6a4f', '#40916c', '#52b788'];
    const maxCount = Math.max(...data.map(d => d.count), 1);
    const barH = 38;
    const gap = 16;
    const pl = this.chartLabelWidth, pr = 50, pt = 16, pb = 16;

    canvas.height = data.length * (barH + gap) + pt + pb;
    const chartW = canvas.width - pl - pr;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    data.forEach((d, i) => {
      const y = pt + i * (barH + gap);
      const barW = Math.max((d.count / maxCount) * chartW, 4);

      this.chartRows.push({ id_seccion: d.id_seccion, y, h: barH, barW });

      ctx.fillStyle = colors[i % colors.length];
      ctx.beginPath();

      if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(pl, y, barW, barH, 6);
      } else {
        ctx.rect(pl, y, barW, barH);
      }
      ctx.fill();

      ctx.fillStyle = '#1b4332';
      ctx.font = '600 13px Segoe UI, sans-serif';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(d.name, pl - 10, y + barH / 2);

      const countLabel = String(d.count);
      ctx.font = 'bold 14px Segoe UI, sans-serif';
      ctx.textBaseline = 'middle';

      if (barW >= 36) {
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'right';
        ctx.fillText(countLabel, pl + barW - 10, y + barH / 2);
      } else {
        ctx.fillStyle = '#1b4332';
        ctx.textAlign = 'left';
        ctx.fillText(countLabel, pl + barW + 10, y + barH / 2);
      }
    });
  }

  onChartClick(event: MouseEvent): void {
    const canvas = this.statsCanvas?.nativeElement;
    if (!canvas || this.chartRows.length === 0) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;

    const row = this.chartRows.find(r =>
      y >= r.y &&
      y <= r.y + r.h &&
      x >= 0 &&
      x <= (this.chartLabelWidth + r.barW)
    );

    if (row) {
      this.router.navigate(['/categorias'], { queryParams: { seccion: row.id_seccion } });
    }
  }
}
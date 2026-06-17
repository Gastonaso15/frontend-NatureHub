import { Component, inject, ElementRef, ViewChild, AfterViewInit, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { WikiService } from '../../../core/services/wiki';
import { Publicacion, Seccion } from '../../../shared/models/wiki.modelos';

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
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  private chartRows: { id_seccion: number; y: number; h: number; barW: number }[] = [];
  private readonly chartLabelWidth = 110;

  secciones: Seccion[] = this.wikiService.getSecciones();
  articulosDestacados: Publicacion[] = [];
  publicaciones: Publicacion[] = [];
  consultaBusqueda = '';
  resultadosBusqueda: Publicacion[] | null = null;
  loading = true;

  private viewReady = false;

  ngOnInit(): void {
    forkJoin({
      secciones: this.wikiService.listarSeccionesApi(),
      publicaciones: this.wikiService.listarPublicacionesApi()
    }).subscribe({
      next: (resultado) => {
        this.secciones = resultado.secciones;
        this.publicaciones = resultado.publicaciones;

        const mezclados = [...resultado.publicaciones].sort(() => Math.random() - 0.5);
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

  onSearch(): void {
    if (this.consultaBusqueda.trim()) {
      this.resultadosBusqueda = this.wikiService.buscarPublicaciones(this.consultaBusqueda.trim());
    } else {
      this.resultadosBusqueda = null;
    }
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
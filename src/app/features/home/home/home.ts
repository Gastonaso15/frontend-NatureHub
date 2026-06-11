import { Component, inject, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { WikiService } from '../../../core/services/wiki';
import { Publication, Section } from '../../../shared/models/wiki.models';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class HomeComponent implements AfterViewInit {
  @ViewChild('statsCanvas') statsCanvas!: ElementRef<HTMLCanvasElement>;

  private wikiService = inject(WikiService);

  sections: Section[] = this.wikiService.getSections();
  featuredArticles: Publication[] = [];
  loading = true;
  searchQuery = '';
  searchResults: Publication[] | null = null;

  ngAfterViewInit(): void {
    this.wikiService.getPublications().subscribe(pubs => {
      this.featuredArticles = pubs.slice(0, 4);
      this.loading = false;
      this.drawSectionStats();
    });
  }

  onSearch(): void {
    if (this.searchQuery.trim()) {
      this.searchResults = this.wikiService.searchPublications(this.searchQuery.trim());
    } else {
      this.searchResults = null;
    }
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.searchResults = null;
  }

  private drawSectionStats(): void {
    const canvas = this.statsCanvas?.nativeElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const data = this.sections.map(s => ({
      name: s.nombre,
      count: this.wikiService.getPublicationsBySection(s.id_seccion).length
    }));

    const colors = ['#2d6a4f', '#40916c', '#52b788'];
    const maxCount = Math.max(...data.map(d => d.count), 1);
    const barH = 38;
    const gap = 16;
    const pl = 110, pr = 50, pt = 16, pb = 16;

    canvas.height = data.length * (barH + gap) + pt + pb;
    const chartW = canvas.width - pl - pr;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    data.forEach((d, i) => {
      const y = pt + i * (barH + gap);
      const barW = Math.max((d.count / maxCount) * chartW, 4);

      ctx.fillStyle = colors[i % colors.length];
      ctx.beginPath();
      (ctx as any).roundRect(pl, y, barW, barH, 6);
      ctx.fill();

      ctx.fillStyle = '#1b4332';
      ctx.font = '600 13px Segoe UI, sans-serif';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(d.name, pl - 10, y + barH / 2);

      ctx.fillStyle = '#fff';
      ctx.font = 'bold 14px Segoe UI, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(d.count) + ' artículo' + (d.count !== 1 ? 's' : ''), pl + barW + 10, y + barH / 2);
    });
  }
}

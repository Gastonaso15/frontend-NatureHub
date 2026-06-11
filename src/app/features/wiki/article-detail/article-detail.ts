import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { WikiService } from '../../../core/services/wiki';
import { Publication, Section } from '../../../shared/models/wiki.models';

@Component({
  selector: 'app-article-detail',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './article-detail.html',
  styleUrl: './article-detail.scss'
})
export class ArticleDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private wikiService = inject(WikiService);

  article = signal<Publication | null>(null);
  section = signal<Section | null>(null);
  loading = signal(true);

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    const cached = this.wikiService.getPublicationById(id);

    if (cached) {
      this.article.set(cached);
      this.section.set(this.wikiService.getSectionById(cached.id_seccion) ?? null);
      this.loading.set(false);
    } else {
      this.wikiService.getPublications().subscribe(() => {
        const pub = this.wikiService.getPublicationById(id);
        this.article.set(pub ?? null);
        if (pub) {
          this.section.set(this.wikiService.getSectionById(pub.id_seccion) ?? null);
        }
        this.loading.set(false);
      });
    }
  }
}

import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { WikiService } from '../../../core/services/wiki';
import { Publicacion, Seccion } from '../../../shared/models/wiki.models';

@Component({
  selector: 'app-article-detail',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './detalle-publicacion.html',
  styleUrl: './detalle-publicacion.scss'
})
export class DetallePublicacionComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private wikiService = inject(WikiService);

  articulo = signal<Publicacion | null>(null);
  seccion = signal<Seccion | null>(null);

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    const pub = this.wikiService.getPublicacionPorId(id);
    this.articulo.set(pub ?? null);
    if (pub) {
      this.seccion.set(this.wikiService.getSeccionPorId(pub.id_seccion) ?? null);
    }
  }
}

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs';
import { ApiConfiguration } from '../../../../api/api-configuration';

@Injectable({ providedIn: 'root' })
export class AiService {
  private http = inject(HttpClient);
  private config = inject(ApiConfiguration);

  polishContent$(title: string, content: string) {
    return this.http
      .post<{ polished: string }>(`${this.config.rootUrl}/admin/ai/polish`, { title, content })
      .pipe(map((r) => r.polished));
  }
}

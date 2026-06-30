import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { ApiConfiguration } from '../../../api/api-configuration';

export interface AboutData {
  id: string;
  content: string;
  updatedAt: string;
}

@Injectable({ providedIn: 'root' })
export class AboutService {
  private http = inject(HttpClient);
  private config = inject(ApiConfiguration);

  getAbout$() {
    return this.http
      .get<{ data: AboutData }>(`${this.config.rootUrl}/admin/about`)
      .pipe(map(r => r.data));
  }

  updateAbout$(content: string) {
    return this.http
      .put<{ data: AboutData }>(`${this.config.rootUrl}/admin/about`, { content })
      .pipe(map(r => r.data));
  }
}

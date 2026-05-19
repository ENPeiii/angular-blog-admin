import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { filter, map } from 'rxjs/operators';
import { ApiConfiguration } from '../../../../api/api-configuration';
import { getPosts_1 } from '../../../../api/fn/admin-posts/get-posts-1';
import { deletePost } from '../../../../api/fn/admin-posts/delete-post';
import { PaginatedResponsePostModel } from '../../../../api/models/paginated-response-post-model';

@Injectable({ providedIn: 'root' })
export class PostsService {
  private http = inject(HttpClient);
  private config = inject(ApiConfiguration);

  getPosts$(page: number, pageSize = 10) {
    return getPosts_1(this.http, this.config.rootUrl, { page, pageSize }).pipe(
      filter(r => r.ok),
      map(r => r.body as PaginatedResponsePostModel)
    );
  }

  deletePost$(id: string) {
    return deletePost(this.http, this.config.rootUrl, { id }).pipe(
      filter(r => r.ok)
    );
  }
}

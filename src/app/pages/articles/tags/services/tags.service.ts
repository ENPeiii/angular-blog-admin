import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { filter, map } from 'rxjs/operators';
import { ApiConfiguration } from '../../../../api/api-configuration';
import { getTags_1 } from '../../../../api/fn/admin-tags/get-tags-1';
import { createTag } from '../../../../api/fn/admin-tags/create-tag';
import { updateTag } from '../../../../api/fn/admin-tags/update-tag';
import { deleteTag } from '../../../../api/fn/admin-tags/delete-tag';
import { CreateTagDto } from '../../../../api/models/create-tag-dto';
import { UpdateTagDto } from '../../../../api/models/update-tag-dto';
import { PaginatedResponseTag } from '../../../../api/models/paginated-response-tag';

@Injectable({ providedIn: 'root' })
export class TagsService {
  private http = inject(HttpClient);
  private config = inject(ApiConfiguration);

  getTags$(page: number, pageSize = 20, search?: string) {
    return getTags_1(this.http, this.config.rootUrl, { page, pageSize, search }).pipe(
      filter(r => r.ok),
      map(r => r.body as PaginatedResponseTag),
    );
  }

  createTag$(dto: CreateTagDto) {
    return createTag(this.http, this.config.rootUrl, { body: dto }).pipe(
      filter(r => r.ok),
      map(r => r.body!.data),
    );
  }

  updateTag$(id: string, dto: UpdateTagDto) {
    return updateTag(this.http, this.config.rootUrl, { id, body: dto }).pipe(
      filter(r => r.ok),
      map(r => r.body!.data),
    );
  }

  deleteTag$(id: string) {
    return deleteTag(this.http, this.config.rootUrl, { id }).pipe(
      filter(r => r.ok),
    );
  }
}

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { filter, map } from 'rxjs/operators';
import { ApiConfiguration } from '../../../../api/api-configuration';
import { createPost } from '../../../../api/fn/admin-posts/create-post';
import { getPosts_1 } from '../../../../api/fn/admin-posts/get-posts-1';
import { getPost_1 } from '../../../../api/fn/admin-posts/get-post-1';
import { deletePost } from '../../../../api/fn/admin-posts/delete-post';
import { updatePost } from '../../../../api/fn/admin-posts/update-post';
import { CreatePostDto } from '../../../../api/models/create-post-dto';
import { UpdatePostDto } from '../../../../api/models/update-post-dto';
import { PaginatedResponsePostModel } from '../../../../api/models/paginated-response-post-model';
import { PostStatusType } from '../../../../api/models/post-status-type';

@Injectable({ providedIn: 'root' })
export class PostsService {
  private http = inject(HttpClient);
  private config = inject(ApiConfiguration);

  getPosts$(page: number, pageSize = 10, tagId?: string) {
    return getPosts_1(this.http, this.config.rootUrl, { page, pageSize, tagId }).pipe(
      filter(r => r.ok),
      map(r => r.body as PaginatedResponsePostModel),
    );
  }

  getPost$(id: string) {
    return getPost_1(this.http, this.config.rootUrl, { id }).pipe(
      filter(r => r.ok),
      map(r => r.body!.data),
    );
  }

  createPost$(dto: CreatePostDto) {
    return createPost(this.http, this.config.rootUrl, { body: dto }).pipe(
      filter(r => r.ok),
      map(r => r.body!.data),
    );
  }

  updatePost$(id: string, dto: UpdatePostDto) {
    return updatePost(this.http, this.config.rootUrl, { id, body: dto }).pipe(
      filter(r => r.ok),
      map(r => r.body!.data),
    );
  }

  updatePostStatus$(id: string, status: PostStatusType) {
    return this.updatePost$(id, { status });
  }

  deletePost$(id: string) {
    return deletePost(this.http, this.config.rootUrl, { id }).pipe(
      filter(r => r.ok),
    );
  }
}

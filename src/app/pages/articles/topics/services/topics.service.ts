import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { filter, map } from 'rxjs/operators';
import { ApiConfiguration } from '../../../../api/api-configuration';
import { createTopic } from '../../../../api/fn/admin-topics/create-topic';
import { getTopics_1 } from '../../../../api/fn/admin-topics/get-topics-1';
import { getTopic_1 } from '../../../../api/fn/admin-topics/get-topic-1';
import { deleteTopic } from '../../../../api/fn/admin-topics/delete-topic';
import { updateTopic } from '../../../../api/fn/admin-topics/update-topic';
import { syncTopicSections } from '../../../../api/fn/admin-topics/sync-topic-sections';
import { CreateTopicDto } from '../../../../api/models/create-topic-dto';
import { UpdateTopicDto } from '../../../../api/models/update-topic-dto';
import { SyncSectionsDto } from '../../../../api/models/sync-sections-dto';
import { PaginatedResponseTopic } from '../../../../api/models/paginated-response-topic';

@Injectable({ providedIn: 'root' })
export class TopicsService {
  private http = inject(HttpClient);
  private config = inject(ApiConfiguration);

  getTopics$(page: number, pageSize = 10) {
    return getTopics_1(this.http, this.config.rootUrl, { page, pageSize }).pipe(
      filter(r => r.ok),
      map(r => r.body as PaginatedResponseTopic),
    );
  }

  getTopicWithSections$(id: string) {
    return getTopic_1(this.http, this.config.rootUrl, { id }).pipe(
      filter(r => r.ok),
      map(r => r.body!.data),
    );
  }

  createTopic$(dto: CreateTopicDto) {
    return createTopic(this.http, this.config.rootUrl, { body: dto }).pipe(
      filter(r => r.ok),
      map(r => r.body!.data),
    );
  }

  updateTopic$(id: string, dto: UpdateTopicDto) {
    return updateTopic(this.http, this.config.rootUrl, { id, body: dto }).pipe(
      filter(r => r.ok),
      map(r => r.body!.data),
    );
  }

  syncSections$(id: string, dto: SyncSectionsDto) {
    return syncTopicSections(this.http, this.config.rootUrl, { id, body: dto }).pipe(
      filter(r => r.ok),
    );
  }

  deleteTopic$(id: string) {
    return deleteTopic(this.http, this.config.rootUrl, { id }).pipe(
      filter(r => r.ok),
    );
  }
}

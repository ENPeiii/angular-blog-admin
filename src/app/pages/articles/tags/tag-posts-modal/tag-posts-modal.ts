import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { rxResource } from '@angular/core/rxjs-interop';
import { manageResource } from '../../../../core/utilities/resource.utils';
import { PostsService } from '../../posts/services/posts.service';
import { Tag } from '../../../../api/models/tag';

export interface TagPostsModalData {
  tag: Tag;
}

const PAGE_SIZE = 10;

@Component({
  selector: 'app-tag-posts-modal',
  imports: [MatDialogModule, DatePipe],
  templateUrl: './tag-posts-modal.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TagPostsModal {
  dialogRef = inject(MatDialogRef<TagPostsModal>);
  data = inject<TagPostsModalData>(MAT_DIALOG_DATA);
  private postsService = inject(PostsService);

  currentPage = signal(1);

  postsResource = manageResource(
    rxResource({
      params: () => ({ page: this.currentPage(), tagId: this.data.tag.id }),
      stream: ({ params }) =>
        this.postsService.getPosts$(params.page, PAGE_SIZE, params.tagId),
    }),
    { errorContext: '載入文章失敗' },
  );

  posts = computed(() => this.postsResource.value()?.data ?? []);
  total = computed(() => this.postsResource.value()?.total ?? 0);
  totalPages = computed(() => this.postsResource.value()?.totalPages ?? 1);

  prevPage() { this.currentPage.update(p => Math.max(1, p - 1)); }
  nextPage() { this.currentPage.update(p => Math.min(this.totalPages(), p + 1)); }
}

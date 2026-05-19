import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { rxResource, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { debounceTime } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import { TagsService } from './services/tags.service';
import { ErrorService } from '../../../core/services/error.service';
import { manageResource } from '../../../core/utilities/resource.utils';
import { Tag } from '../../../api/models/tag';
import { TagsModal } from './tags-modal/tags-modal';
import { TagPostsModal } from './tag-posts-modal/tag-posts-modal';

@Component({
  selector: 'app-tags',
  imports: [FormsModule, DatePipe],
  templateUrl: './tags.html',
  styleUrl: './tags.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Tags {
  private service = inject(TagsService);
  private errorService = inject(ErrorService);
  private dialog = inject(MatDialog);

  // searchInput 直接綁定 template（即時更新），searchDebounced 才送 API
  searchInput = signal('');
  private searchDebounced = toSignal(
    toObservable(this.searchInput).pipe(debounceTime(300)),
    { initialValue: '' },
  );

  currentPage = signal(1);
  deletingIds = signal<Set<string>>(new Set());

  tagsResource = manageResource(
    rxResource({
      params: () => ({ q: this.searchDebounced(), page: this.currentPage() }),
      stream: ({ params }) =>
        this.service.getTags$(params.page, 20, params.q || undefined),
    }),
    { errorContext: '載入標籤失敗' },
  );

  tags = computed(() => this.tagsResource.value()?.data ?? []);
  total = computed(() => this.tagsResource.value()?.total ?? 0);
  totalPages = computed(() => this.tagsResource.value()?.totalPages ?? 1);

  constructor() {
    // debounced query 真正送出時才重設頁碼，避免翻頁中途被清掉
    effect(() => {
      this.searchDebounced();
      untracked(() => this.currentPage.set(1));
    });
  }

  clearSearch() {
    this.searchInput.set('');
  }

  openPostsModal(tag: Tag) {
    if (tag.postCount === 0) return;
    this.dialog.open(TagPostsModal, {
      width: '640px',
      maxHeight: '80vh',
      data: { tag },
    });
  }

  openModal(tag: Tag | null = null) {
    this.dialog
      .open(TagsModal, { width: '420px', data: { tag } })
      .afterClosed()
      .subscribe(result => {
        if (result === 'saved') this.tagsResource.reload();
      });
  }

  deleteTag(tag: Tag) {
    if (this.deletingIds().has(tag.id)) return;

    const msg =
      tag.postCount > 0
        ? `確定要刪除標籤「${tag.name}」嗎？\n此標籤目前有 ${tag.postCount} 篇文章，刪除後標籤將從這些文章移除。`
        : `確定要刪除標籤「${tag.name}」嗎？`;

    if (!confirm(msg)) return;

    this.deletingIds.update(ids => new Set([...ids, tag.id]));
    this.service.deleteTag$(tag.id).subscribe({
      next: () => {
        this.tagsResource.reload();
        this.deletingIds.update(ids => { const s = new Set(ids); s.delete(tag.id); return s; });
      },
      error: (err) => {
        this.errorService.report(err, '刪除標籤失敗');
        this.deletingIds.update(ids => { const s = new Set(ids); s.delete(tag.id); return s; });
      },
    });
  }

  prevPage() { this.currentPage.update(p => Math.max(1, p - 1)); }
  nextPage() { this.currentPage.update(p => Math.min(this.totalPages(), p + 1)); }
}

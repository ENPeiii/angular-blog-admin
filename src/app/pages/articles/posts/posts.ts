import { Component, signal, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { PostsService } from './services/posts.service';
import { ErrorService } from '../../../core/services/error.service';
import { manageResource } from '../../../core/utilities/resource.utils';
import { PaginatedResponsePostModel } from '../../../api/models/paginated-response-post-model';
import { PostStatusType } from '../../../api/models/post-status-type';
import { PostModel } from '../../../api/models/post-model';
import { PostsModal } from './posts-modal/posts-modal';

type SortField = 'createdAt' | 'updatedAt';
type SortDirection = 'asc' | 'desc';

const PAGE_SIZE = 10;

@Component({
  selector: 'app-posts',
  imports: [FormsModule, DatePipe],
  templateUrl: './posts.html',
  styleUrl: './posts.scss',
})
export class Posts {
  private service = inject(PostsService);
  private errorService = inject(ErrorService);
  private dialog = inject(MatDialog);

  searchQuery = signal('');
  statusFilter = signal<PostStatusType | 'all'>('all');
  sortField = signal<SortField>('updatedAt');
  sortDirection = signal<SortDirection>('desc');
  currentPage = signal(1);
  togglingIds = signal<Set<string>>(new Set());

  postsResource = manageResource(
    rxResource<PaginatedResponsePostModel, { page: number }>({
      params: () => ({ page: this.currentPage() }),
      stream: ({ params }) => this.service.getPosts$(params.page, PAGE_SIZE),
    }),
    { errorContext: '載入文章失敗' },
  );

  posts = computed(() => this.postsResource.value()?.data ?? []);
  total = computed(() => this.postsResource.value()?.total ?? 0);
  totalPages = computed(() => this.postsResource.value()?.totalPages ?? 1);

  displayedPosts = computed(() => {
    const query = this.searchQuery().toLowerCase();
    const status = this.statusFilter();
    const field = this.sortField();
    const direction = this.sortDirection();

    return this.posts()
      .filter(post => {
        const matchQuery = post.title.toLowerCase().includes(query);
        const matchStatus = status === 'all' || post.status === status;
        return matchQuery && matchStatus;
      })
      .sort((a, b) => {
        const valA = a[field];
        const valB = b[field];
        const result = valA < valB ? -1 : valA > valB ? 1 : 0;
        return direction === 'asc' ? result : -result;
      });
  });

  statusOptions: { label: string; value: PostStatusType | 'all' }[] = [
    { label: '全部', value: 'all' },
    { label: '已發布', value: 'published' },
    { label: '草稿', value: 'draft' },
  ];

  setSearch(value: string) {
    this.searchQuery.set(value);
  }

  setStatusFilter(value: PostStatusType | 'all') {
    this.statusFilter.set(value);
  }

  toggleSort(field: SortField) {
    if (this.sortField() === field) {
      this.sortDirection.update(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      this.sortField.set(field);
      this.sortDirection.set('desc');
    }
  }

  sortIcon(field: SortField): string {
    if (this.sortField() !== field) return 'fa-sort';
    return this.sortDirection() === 'asc' ? 'fa-sort-up' : 'fa-sort-down';
  }

  prevPage() {
    this.currentPage.update(p => Math.max(1, p - 1));
  }

  nextPage() {
    this.currentPage.update(p => Math.min(this.totalPages(), p + 1));
  }

  openModal(postId: string | null = null) {
    this.dialog.open(PostsModal, {
      width: '90vw',
      maxWidth: '1000px',
      maxHeight: '90vh',
      data: { postId },
    });
  }

  deletePost(id: string) {
    this.service.deletePost$(id).subscribe({
      next: () => this.postsResource.reload(),
      error: (err) => this.errorService.report(err, 'deletePost'),
    });
  }

  toggleStatus(post: PostModel) {
    if (this.togglingIds().has(post.id)) return;

    const newStatus: PostStatusType = post.status === 'published' ? 'draft' : 'published';
    this.togglingIds.update(ids => new Set([...ids, post.id]));

    this.service.updatePostStatus$(post.id, newStatus).subscribe({
      next: () => {
        this.postsResource.reload();
        this.togglingIds.update(ids => { const s = new Set(ids); s.delete(post.id); return s; });
      },
      error: (err: unknown) => {
        this.errorService.report(err, 'toggleStatus');
        this.togglingIds.update(ids => { const s = new Set(ids); s.delete(post.id); return s; });
      },
    });
  }
}

import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { TopicsService } from './services/topics.service';
import { ErrorService } from '../../../core/services/error.service';
import { ToastService } from '../../../core/services/toast.service';
import { manageResource } from '../../../core/utilities/resource.utils';
import { PaginatedResponseTopic } from '../../../api/models/paginated-response-topic';
import { Topic } from '../../../api/models/topic';
import { TopicsModal } from './topics-modal/topics-modal';
import { ConfirmModal } from '../../../shared/confirm-modal/confirm-modal';

const PAGE_SIZE = 10;

@Component({
  selector: 'app-topics',
  imports: [FormsModule, DatePipe],
  templateUrl: './topics.html',
  styleUrl: './topics.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Topics {
  private service = inject(TopicsService);
  private errorService = inject(ErrorService);
  private toastService = inject(ToastService);
  private dialog = inject(MatDialog);

  searchQuery = signal('');
  currentPage = signal(1);
  deletingIds = signal<Set<string>>(new Set());

  topicsResource = manageResource(
    rxResource<PaginatedResponseTopic, { page: number }>({
      params: () => ({ page: this.currentPage() }),
      stream: ({ params }) => this.service.getTopics$(params.page, PAGE_SIZE),
    }),
    { errorContext: '載入主題失敗' },
  );

  topics = computed(() => this.topicsResource.value()?.data ?? []);
  total = computed(() => this.topicsResource.value()?.total ?? 0);
  totalPages = computed(() => this.topicsResource.value()?.totalPages ?? 1);

  displayedTopics = computed(() => {
    const q = this.searchQuery().toLowerCase();
    return q ? this.topics().filter(t => t.name.toLowerCase().includes(q)) : this.topics();
  });

  openModal(topicId: string | null = null) {
    this.dialog.open(TopicsModal, {
      width: '90vw',
      maxWidth: '860px',
      maxHeight: '90vh',
      disableClose: true,
      data: { topicId },
    }).afterClosed().subscribe(result => {
      if (result === 'saved') this.topicsResource.reload();
    });
  }

  deleteTopic(topic: Topic) {
    if (this.deletingIds().has(topic.id)) return;

    const message = topic.postCount > 0
      ? `此主題目前有 ${topic.postCount} 篇文章，刪除後這些文章將不屬於任何主題。`
      : '此操作無法復原。';

    this.dialog.open(ConfirmModal, {
      width: '400px',
      data: { title: `刪除主題「${topic.name}」`, message, confirmLabel: '確認刪除' },
    }).afterClosed().subscribe((confirmed: boolean) => {
      if (!confirmed) return;

      this.deletingIds.update(ids => new Set([...ids, topic.id]));
      this.service.deleteTopic$(topic.id).subscribe({
        next: () => {
          this.topicsResource.reload();
          this.deletingIds.update(ids => { const s = new Set(ids); s.delete(topic.id); return s; });
          this.toastService.success('主題已刪除');
        },
        error: (err) => {
          this.errorService.report(err, '刪除主題失敗');
          this.deletingIds.update(ids => { const s = new Set(ids); s.delete(topic.id); return s; });
        },
      });
    });
  }

  prevPage() { this.currentPage.update(p => Math.max(1, p - 1)); }
  nextPage() { this.currentPage.update(p => Math.min(this.totalPages(), p + 1)); }
}

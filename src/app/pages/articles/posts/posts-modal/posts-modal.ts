import { ChangeDetectionStrategy, Component, OnInit, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { asyncScheduler, observeOn } from 'rxjs';
import { MdEditor } from '../../../../shared/tui-editor/md-editor/md-editor';
import { PostsService } from '../services/posts.service';
import { TopicsService } from '../../topics/services/topics.service';
import { ErrorService } from '../../../../core/services/error.service';
import { ToastService } from '../../../../core/services/toast.service';
import { CategoriesType } from '../../../../api/models/categories-type';
import { PostStatusType } from '../../../../api/models/post-status-type';
import { Topic } from '../../../../api/models/topic';

export interface PostsModalData {
  postId: string | null;
  defaultTopicId?: string | null;
}

@Component({
  selector: 'app-posts-modal',
  imports: [MatDialogModule, FormsModule, MdEditor],
  templateUrl: './posts-modal.html',
  styleUrl: './posts-modal.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PostsModal implements OnInit {
  dialogRef = inject(MatDialogRef<PostsModal>);
  data = inject<PostsModalData>(MAT_DIALOG_DATA);
  private service = inject(PostsService);
  private topicsService = inject(TopicsService);
  private errorService = inject(ErrorService);
  private toastService = inject(ToastService);

  isEdit = !!this.data?.postId;

  isLoadingPost = signal(this.isEdit);
  isLoadingTopics = signal(true);
  isSaving = signal(false);

  title = signal('');
  categories = signal<CategoriesType>('tech');
  status = signal<PostStatusType>('draft');
  tags = signal<string[]>([]);
  tagInputValue = signal('');
  selectedTopicId = signal<string | null>(null);

  allTopics = signal<Topic[]>([]);

  private mdEditor = viewChild(MdEditor);

  ngOnInit(): void {
    if (!this.isEdit && this.data.defaultTopicId) {
      this.selectedTopicId.set(this.data.defaultTopicId);
    }
    this.loadTopics();
    if (this.isEdit && this.data.postId) {
      this.loadPost(this.data.postId);
    }
  }

  private loadTopics(): void {
    this.topicsService.getTopics$(1, 100).subscribe({
      next: (res) => {
        this.allTopics.set(res.data);
        this.isLoadingTopics.set(false);
      },
      error: () => this.isLoadingTopics.set(false),
    });
  }

  private loadPost(id: string): void {
    this.service
      .getPost$(id)
      .pipe(observeOn(asyncScheduler))
      .subscribe({
        next: (post) => {
          this.title.set(post.title);
          this.categories.set(post.categories);
          this.status.set(post.status);
          this.tags.set(post.tags.map(t => t.name));
          this.selectedTopicId.set(post.topicId);
          this.mdEditor()?.setContent(post.content);
          this.isLoadingPost.set(false);
        },
        error: (err) => {
          this.errorService.report(err, '載入文章失敗');
          this.isLoadingPost.set(false);
        },
      });
  }

  addTag(): void {
    const tag = this.tagInputValue().trim();
    if (tag && !this.tags().includes(tag)) {
      this.tags.update(ts => [...ts, tag]);
    }
    this.tagInputValue.set('');
  }

  removeTag(tag: string): void {
    this.tags.update(ts => ts.filter(t => t !== tag));
  }

  removeLastTagIfEmpty(): void {
    if (this.tagInputValue() === '') {
      this.tags.update(ts => ts.slice(0, -1));
    }
  }

  save(): void {
    const title = this.title().trim();
    const content = this.mdEditor()?.getContent() ?? '';
    if (!title || !content.trim()) return;

    this.isSaving.set(true);
    const topicId = this.selectedTopicId();

    const obs$ = this.isEdit
      ? this.service.updatePost$(this.data.postId!, {
          title,
          content,
          categories: this.categories(),
          status: this.status(),
          tags: this.tags(),
          topicId: topicId,
        })
      : this.service.createPost$({
          title,
          content,
          categories: this.categories(),
          status: this.status(),
          tags: this.tags(),
          ...(topicId ? { topicId } : {}),
        });

    obs$.subscribe({
      next: (post) => {
        this.isSaving.set(false);
        this.toastService.success(this.isEdit ? '文章已更新' : '文章已建立');
        this.dialogRef.close(post);
      },
      error: (err) => {
        this.errorService.report(err, this.isEdit ? '更新文章失敗' : '新增文章失敗');
        this.isSaving.set(false);
      },
    });
  }

  close(): void {
    this.dialogRef.close();
  }
}

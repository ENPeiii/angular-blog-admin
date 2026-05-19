import { ChangeDetectionStrategy, Component, OnInit, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { asyncScheduler, observeOn } from 'rxjs';
import { MdEditor } from '../../../../shared/tui-editor/md-editor/md-editor';
import { PostsService } from '../services/posts.service';
import { ErrorService } from '../../../../core/services/error.service';
import { CategoriesType } from '../../../../api/models/categories-type';
import { PostStatusType } from '../../../../api/models/post-status-type';

export interface PostsModalData {
  postId: string | null;
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
  private errorService = inject(ErrorService);

  isEdit = !!this.data?.postId;

  // Signals — changes are queued to the next CD cycle, preventing NG0100
  // even when the HTTP response arrives faster than one render frame.
  // isLoadingPost is pre-set from isEdit so the overlay is visible on the
  // very first render without any mutation inside ngOnInit.
  isLoadingPost = signal(this.isEdit);
  isSaving = signal(false);

  title = signal('');
  categories = signal<CategoriesType>('tech');
  status = signal<PostStatusType>('draft');
  tags = signal<string[]>([]);
  tagInputValue = signal('');

  private mdEditor = viewChild(MdEditor);

  ngOnInit(): void {
    if (this.isEdit && this.data.postId) {
      this.loadPost(this.data.postId);
    }
  }

  private loadPost(id: string): void {
    this.service
      .getPost$(id)
      // observeOn(asyncScheduler) pushes the emission to a macrotask (setTimeout).
      // This guarantees signal.set() calls land in a fresh CD cycle — after the
      // current detectChanges + checkNoChanges pair — eliminating NG0100.
      .pipe(observeOn(asyncScheduler))
      .subscribe({
        next: (post) => {
          this.title.set(post.title);
          this.categories.set(post.categories);
          this.status.set(post.status);
          this.tags.set(post.tags.map(t => t.name));
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

    const obs$ = this.isEdit
      ? this.service.updatePost$(this.data.postId!, {
          title,
          content,
          categories: this.categories(),
          status: this.status(),
          tags: this.tags(),
        })
      : this.service.createPost$({
          title,
          content,
          categories: this.categories(),
          status: this.status(),
          tags: this.tags(),
        });

    obs$.subscribe({
      next: () => {
        this.isSaving.set(false);
        this.dialogRef.close('saved');
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

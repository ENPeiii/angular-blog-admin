import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef, MatDialog } from '@angular/material/dialog';
import { MdEditor } from '../../../../shared/tui-editor/md-editor/md-editor';
import { forkJoin, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { TopicsService } from '../services/topics.service';
import { PostsService } from '../../posts/services/posts.service';
import { PostsModal } from '../../posts/posts-modal/posts-modal';
import { ErrorService } from '../../../../core/services/error.service';
import { ToastService } from '../../../../core/services/toast.service';
import { PostModel } from '../../../../api/models/post-model';
import { PostStatusType } from '../../../../api/models/post-status-type';

export interface TopicsModalData {
  topicId: string | null;
}

interface LocalPost {
  id: string;
  title: string;
  status: PostStatusType;
}

interface LocalSection {
  id: string | null;
  name: string;
  posts: LocalPost[];
}

@Component({
  selector: 'app-topics-modal',
  imports: [MatDialogModule, FormsModule, MdEditor],
  templateUrl: './topics-modal.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopicsModal implements OnInit {
  dialogRef = inject(MatDialogRef<TopicsModal>);
  data = inject<TopicsModalData>(MAT_DIALOG_DATA);
  private topicsService = inject(TopicsService);
  private postsService = inject(PostsService);
  private dialog = inject(MatDialog);
  private errorService = inject(ErrorService);
  private toastService = inject(ToastService);

  isEdit = !!this.data?.topicId;

  isLoading = signal(true);
  isSaving = signal(false);

  name = signal('');
  private mdEditor = viewChild(MdEditor);
  sections = signal<LocalSection[]>([]);

  allPosts = signal<PostModel[]>([]);
  activePicker = signal<number | null>(null);
  pickerSearch = signal('');
  togglingIds = signal<Set<string>>(new Set());

  usedPostIds = computed(() =>
    new Set(this.sections().flatMap(s => s.posts.map(p => p.id)))
  );

  availablePosts = computed(() => {
    const used = this.usedPostIds();
    const q = this.pickerSearch().toLowerCase();
    return this.allPosts().filter(p =>
      !used.has(p.id) && (q ? p.title.toLowerCase().includes(q) : true)
    );
  });

  ngOnInit(): void {
    if (this.isEdit && this.data.topicId) {
      forkJoin([
        this.topicsService.getTopicWithSections$(this.data.topicId),
        this.postsService.getPosts$(1, 1000),
      ]).subscribe({
        next: ([topic, postsPage]) => {
          this.name.set(topic.name);
          this.mdEditor()?.setContent(topic.description ?? '');
          const statusMap = new Map(postsPage.data.map(p => [p.id, p.status]));
          this.sections.set(
            topic.sections.map(s => ({
              id: s.id,
              name: s.name,
              posts: s.posts.map(p => ({ id: p.id, title: p.title, status: statusMap.get(p.id) ?? 'draft' })),
            }))
          );
          this.allPosts.set(postsPage.data);
          this.isLoading.set(false);
        },
        error: (err) => {
          this.errorService.report(err, '載入主題失敗');
          this.isLoading.set(false);
        },
      });
    } else {
      this.postsService.getPosts$(1, 1000).subscribe({
        next: (postsPage) => {
          this.allPosts.set(postsPage.data);
          this.isLoading.set(false);
        },
        error: (err) => {
          this.errorService.report(err, '載入文章列表失敗');
          this.isLoading.set(false);
        },
      });
    }
  }

  addSection(): void {
    this.sections.update(secs => [
      ...secs,
      { id: null, name: '新章節', posts: [] },
    ]);
  }

  removeSection(idx: number): void {
    this.sections.update(secs => secs.filter((_, i) => i !== idx));
    if (this.activePicker() === idx) this.activePicker.set(null);
  }

  moveSectionUp(idx: number): void {
    if (idx === 0) return;
    this.sections.update(secs => {
      const next = [...secs];
      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      return next;
    });
  }

  moveSectionDown(idx: number): void {
    this.sections.update(secs => {
      if (idx >= secs.length - 1) return secs;
      const next = [...secs];
      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      return next;
    });
  }

  renameSection(idx: number, name: string): void {
    this.sections.update(secs => {
      const next = [...secs];
      next[idx] = { ...next[idx], name };
      return next;
    });
  }

  togglePicker(idx: number): void {
    this.activePicker.update(cur => cur === idx ? null : idx);
    this.pickerSearch.set('');
  }

  addPostToSection(sectionIdx: number, post: PostModel): void {
    this.sections.update(secs => {
      const next = [...secs];
      next[sectionIdx] = {
        ...next[sectionIdx],
        posts: [...next[sectionIdx].posts, { id: post.id, title: post.title, status: post.status }],
      };
      return next;
    });
    this.pickerSearch.set('');
  }

  editPost(postId: string): void {
    this.dialog.open(PostsModal, {
      width: '90vw',
      maxWidth: '1000px',
      maxHeight: '90vh',
      data: { postId },
    }).afterClosed().subscribe((updatedPost) => {
      if (!updatedPost) return;
      this.sections.update(secs =>
        secs.map(s => ({
          ...s,
          posts: s.posts.map(p => p.id === updatedPost.id ? { ...p, title: updatedPost.title, status: updatedPost.status } : p),
        }))
      );
      this.allPosts.update(all => all.map(p => p.id === updatedPost.id ? updatedPost : p));
    });
  }

  createAndAddPost(sectionIdx: number): void {
    this.dialog.open(PostsModal, {
      width: '90vw',
      maxWidth: '1000px',
      maxHeight: '90vh',
      data: { postId: null, defaultTopicId: this.data.topicId },
    }).afterClosed().subscribe((post: PostModel | undefined) => {
      if (!post) return;
      this.allPosts.update(all => [...all, post]);
      this.addPostToSection(sectionIdx, post);
    });
  }

  removePostFromSection(sectionIdx: number, postIdx: number): void {
    this.sections.update(secs => {
      const next = [...secs];
      const posts = next[sectionIdx].posts.filter((_, i) => i !== postIdx);
      next[sectionIdx] = { ...next[sectionIdx], posts };
      return next;
    });
  }

  movePostUp(sectionIdx: number, postIdx: number): void {
    if (postIdx === 0) return;
    this.sections.update(secs => {
      const next = [...secs];
      const posts = [...next[sectionIdx].posts];
      [posts[postIdx - 1], posts[postIdx]] = [posts[postIdx], posts[postIdx - 1]];
      next[sectionIdx] = { ...next[sectionIdx], posts };
      return next;
    });
  }

  toggleStatus(postId: string, currentStatus: PostStatusType): void {
    if (this.togglingIds().has(postId)) return;

    const newStatus: PostStatusType = currentStatus === 'published' ? 'draft' : 'published';
    this.togglingIds.update(ids => new Set([...ids, postId]));

    this.postsService.updatePostStatus$(postId, newStatus).subscribe({
      next: () => {
        this.sections.update(secs =>
          secs.map(s => ({
            ...s,
            posts: s.posts.map(p => p.id === postId ? { ...p, status: newStatus } : p),
          }))
        );
        this.allPosts.update(all => all.map(p => p.id === postId ? { ...p, status: newStatus } : p));
        this.togglingIds.update(ids => { const next = new Set(ids); next.delete(postId); return next; });
      },
      error: (err) => {
        this.errorService.report(err, '切換文章狀態失敗');
        this.togglingIds.update(ids => { const next = new Set(ids); next.delete(postId); return next; });
      },
    });
  }

  movePostDown(sectionIdx: number, postIdx: number): void {
    this.sections.update(secs => {
      const section = secs[sectionIdx];
      if (postIdx >= section.posts.length - 1) return secs;
      const next = [...secs];
      const posts = [...next[sectionIdx].posts];
      [posts[postIdx], posts[postIdx + 1]] = [posts[postIdx + 1], posts[postIdx]];
      next[sectionIdx] = { ...next[sectionIdx], posts };
      return next;
    });
  }

  save(): void {
    const name = this.name().trim();
    if (!name) return;

    const description = this.mdEditor()?.getContent().trim() || undefined;
    const syncDto = {
      sections: this.sections().map((s, i) => ({
        ...(s.id ? { id: s.id } : {}),
        name: s.name,
        order: i,
        postIds: s.posts.map(p => p.id),
      })),
    };

    this.isSaving.set(true);

    if (this.isEdit) {
      const topicId = this.data.topicId!;
      forkJoin([
        this.topicsService.updateTopic$(topicId, { name, description }),
        this.topicsService.syncSections$(topicId, syncDto),
      ]).subscribe({
        next: () => {
          this.isSaving.set(false);
          this.toastService.success('主題已更新');
          this.dialogRef.close('saved');
        },
        error: (err) => {
          this.errorService.report(err, '更新主題失敗');
          this.isSaving.set(false);
        },
      });
    } else {
      this.topicsService.createTopic$({ name, description }).pipe(
        switchMap(newTopic =>
          syncDto.sections.length > 0
            ? this.topicsService.syncSections$(newTopic.id, syncDto)
            : of(null)
        ),
      ).subscribe({
        next: () => {
          this.isSaving.set(false);
          this.toastService.success('主題已建立');
          this.dialogRef.close('saved');
        },
        error: (err) => {
          this.errorService.report(err, '新增主題失敗');
          this.isSaving.set(false);
        },
      });
    }
  }

  close(): void {
    this.dialogRef.close();
  }
}

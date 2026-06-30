import { ChangeDetectionStrategy, Component, OnInit, effect, inject, signal, untracked, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MdEditor } from '../../../shared/tui-editor/md-editor/md-editor';
import { BannerService } from '../services/banner.service';
import { ErrorService } from '../../../core/services/error.service';
import { BannerType } from '../../../api/models/banner-type';

export interface BannerModalData {
  bannerId: string | null;
}

@Component({
  selector: 'app-banner-modal',
  imports: [MatDialogModule, FormsModule, MdEditor],
  templateUrl: './banner-modal.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BannerModal implements OnInit {
  dialogRef = inject(MatDialogRef<BannerModal>);
  data = inject<BannerModalData>(MAT_DIALOG_DATA);
  private service = inject(BannerService);
  private errorService = inject(ErrorService);

  isEdit = !!this.data?.bannerId;

  isLoading = signal(this.isEdit);
  isSaving = signal(false);
  isUploading = signal(false);

  title = signal('');
  type = signal<BannerType>('img');
  imgUrl = signal('');
  imgAlt = signal('');

  private pendingContent = signal<string | null>(null);
  private mdEditor = viewChild(MdEditor);

  constructor() {
    effect(() => {
      const editor = this.mdEditor();
      if (!editor) return;
      const pending = untracked(() => this.pendingContent());
      if (pending === null) return;
      untracked(() => {
        editor.setContent(pending);
        this.pendingContent.set(null);
      });
    });
  }

  ngOnInit(): void {
    if (this.isEdit && this.data.bannerId) {
      this.service.getBanner$(this.data.bannerId).subscribe({
        next: (banner) => {
          this.title.set(banner.title);
          this.type.set(banner.type);
          this.imgUrl.set(banner.imgUrl);
          this.imgAlt.set(banner.imgAlt);
          if (banner.content) this.pendingContent.set(banner.content);
          this.isLoading.set(false);
        },
        error: (err) => {
          this.errorService.report(err, '載入 Banner 失敗');
          this.isLoading.set(false);
        },
      });
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    input.value = '';

    this.isUploading.set(true);
    this.service.uploadImage$(file).subscribe({
      next: (url) => {
        this.imgUrl.set(url);
        this.isUploading.set(false);
      },
      error: (err) => {
        this.errorService.report(err, '圖片上傳失敗');
        this.isUploading.set(false);
      },
    });
  }

  save(): void {
    const title = this.title().trim();
    const imgUrl = this.imgUrl().trim();
    const imgAlt = this.imgAlt().trim();
    if (!title || !imgUrl || !imgAlt) return;

    this.isSaving.set(true);
    const content = this.mdEditor()?.getContent().trim() || undefined;

    const obs$ = this.isEdit
      ? this.service.updateBanner$(this.data.bannerId!, { title, imgUrl, imgAlt, content })
      : this.service.createBanner$({ title, type: this.type(), imgUrl, imgAlt, content });

    obs$.subscribe({
      next: (banner) => {
        this.isSaving.set(false);
        this.dialogRef.close(banner);
      },
      error: (err) => {
        this.errorService.report(err, this.isEdit ? '更新 Banner 失敗' : '新增 Banner 失敗');
        this.isSaving.set(false);
      },
    });
  }

  close(): void {
    this.dialogRef.close();
  }
}

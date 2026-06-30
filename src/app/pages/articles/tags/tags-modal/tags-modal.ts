import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { TagsService } from '../services/tags.service';
import { ErrorService } from '../../../../core/services/error.service';
import { ToastService } from '../../../../core/services/toast.service';
import { Tag } from '../../../../api/models/tag';

export interface TagsModalData {
  tag: Tag | null;
}

@Component({
  selector: 'app-tags-modal',
  imports: [MatDialogModule, FormsModule],
  templateUrl: './tags-modal.html',
  styleUrl: './tags-modal.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TagsModal {
  dialogRef = inject(MatDialogRef<TagsModal>);
  data = inject<TagsModalData>(MAT_DIALOG_DATA);
  private service = inject(TagsService);
  private errorService = inject(ErrorService);
  private toastService = inject(ToastService);

  isEdit = !!this.data?.tag;
  isSaving = signal(false);
  name = signal(this.data?.tag?.name ?? '');

  save(): void {
    const name = this.name().trim();
    if (!name) return;

    this.isSaving.set(true);

    const obs$ = this.isEdit
      ? this.service.updateTag$(this.data.tag!.id, { name })
      : this.service.createTag$({ name });

    obs$.subscribe({
      next: () => {
        this.isSaving.set(false);
        this.toastService.success(this.isEdit ? '標籤已更新' : '標籤已建立');
        this.dialogRef.close('saved');
      },
      error: (err) => {
        this.errorService.report(err, this.isEdit ? '更新標籤失敗' : '新增標籤失敗');
        this.isSaving.set(false);
      },
    });
  }

  close(): void {
    this.dialogRef.close();
  }
}

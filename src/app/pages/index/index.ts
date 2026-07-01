import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { BannerService } from './services/banner.service';
import { ErrorService } from '../../core/services/error.service';
import { ToastService } from '../../core/services/toast.service';
import { manageResource } from '../../core/utilities/resource.utils';
import { BannerModel } from '../../api/models/banner-model';
import { BannerModal } from './banner-modal/banner-modal';
import { ConfirmModal } from '../../shared/confirm-modal/confirm-modal';

@Component({
  selector: 'app-index',
  imports: [DatePipe],
  templateUrl: './index.html',
  styleUrl: './index.scss',
})
export class Index {
  private service = inject(BannerService);
  private errorService = inject(ErrorService);
  private toastService = inject(ToastService);
  private dialog = inject(MatDialog);

  togglingIds = signal<Set<string>>(new Set());

  bannersResource = manageResource(
    rxResource<{ data: BannerModel[]; total: number }, void>({
      stream: () => this.service.getBanners$(1, 100),
    }),
    { errorContext: '載入 Banner 失敗' },
  );

  banners = computed(() => this.bannersResource.value()?.data ?? []);

  openModal(bannerId: string | null = null): void {
    this.dialog.open(BannerModal, {
      width: '560px',
      maxHeight: '90vh',
      disableClose: true,
      data: { bannerId },
    }).afterClosed().subscribe(result => {
      if (result) this.bannersResource.reload();
    });
  }

  toggleActive(banner: BannerModel): void {
    if (this.togglingIds().has(banner.id)) return;
    this.togglingIds.update(ids => new Set([...ids, banner.id]));

    this.service.toggleActive$(banner.id, !banner.isActive).subscribe({
      next: () => {
        this.bannersResource.reload();
        this.togglingIds.update(ids => { const s = new Set(ids); s.delete(banner.id); return s; });
        this.toastService.success(banner.isActive ? 'Banner 已停用' : 'Banner 已啟用');
      },
      error: (err: unknown) => {
        this.errorService.report(err, '切換 Banner 狀態失敗');
        this.togglingIds.update(ids => { const s = new Set(ids); s.delete(banner.id); return s; });
      },
    });
  }

  deleteBanner(banner: BannerModel): void {
    this.dialog.open(ConfirmModal, {
      width: '400px',
      data: {
        title: `刪除 Banner「${banner.title}」`,
        message: '此操作無法復原，Banner 將被永久移除。',
        confirmLabel: '確認刪除',
      },
    }).afterClosed().subscribe((confirmed: boolean) => {
      if (!confirmed) return;
      this.service.deleteBanner$(banner.id).subscribe({
        next: () => {
          this.bannersResource.reload();
          this.toastService.success('Banner 已刪除');
        },
        error: (err) => this.errorService.report(err, '刪除 Banner 失敗'),
      });
    });
  }
}

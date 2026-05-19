import { DestroyRef, effect, inject, ResourceRef, untracked } from '@angular/core';
import { LayoutConfig } from '../services/layout-config';
import { ErrorService } from '../services/error.service';

export interface ManageResourceOptions {
  /**
   * true 時跳過集中錯誤管理，由呼叫端自行處理 error()
   * @default false
   */
  localError?: boolean;
  /** 錯誤訊息的來源標記，顯示在 ErrorService 內方便 debug */
  errorContext?: string;
}

/**
 * 將 resource 的 loading / error 狀態自動接管到全局服務。
 * 必須在 injection context（field initializer 或 constructor）內呼叫。
 * 同時支援 httpResource() 與 rxResource()。
 */
export function manageResource<T, R extends ResourceRef<T>>(
  resource: R,
  options?: ManageResourceOptions,
): R {
  const layoutConfig = inject(LayoutConfig);
  const errorService = inject(ErrorService);
  const destroyRef = inject(DestroyRef);

  let loadingStarted = false;

  effect(() => {
    const isLoading = resource.isLoading();
    untracked(() => {
      if (isLoading && !loadingStarted) {
        layoutConfig.startLoading();
        loadingStarted = true;
      } else if (!isLoading && loadingStarted) {
        layoutConfig.stopLoading();
        loadingStarted = false;
      }
    });
  });

  destroyRef.onDestroy(() => {
    if (loadingStarted) {
      layoutConfig.stopLoading();
    }
  });

  if (!options?.localError) {
    effect(() => {
      const err = resource.error();
      if (err != null) {
        untracked(() => errorService.report(err, options?.errorContext));
      }
    });
  }

  return resource;
}

import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

export interface AiPolishModalData {
  original: string;
  polished: string;
}

@Component({
  selector: 'app-ai-polish-modal',
  imports: [MatDialogModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col w-full" style="min-width: 800px;">

      <div class="flex items-center gap-3 px-6 py-4 border-b border-gray-200">
        <div class="flex items-center justify-center w-8 h-8 rounded-full bg-violet-50">
          <i class="fa-solid fa-wand-magic-sparkles text-sm text-violet-500"></i>
        </div>
        <h2 class="text-base font-semibold text-gray-800">AI 潤飾預覽</h2>
        <span class="ml-auto text-xs text-gray-400">確認後將取代編輯器內容</span>
      </div>

      <div class="grid grid-cols-2 divide-x divide-gray-200 overflow-hidden" style="max-height: 60vh;">

        <div class="flex flex-col overflow-hidden">
          <div class="px-4 py-2 bg-gray-50 border-b border-gray-200">
            <span class="text-xs font-medium text-gray-500">原始內容</span>
          </div>
          <pre class="flex-1 overflow-auto px-4 py-3 text-xs text-gray-600 font-mono whitespace-pre-wrap leading-relaxed">{{ data.original }}</pre>
        </div>

        <div class="flex flex-col overflow-hidden">
          <div class="px-4 py-2 bg-violet-50 border-b border-gray-200">
            <span class="text-xs font-medium text-violet-600">AI 潤飾後</span>
          </div>
          <pre class="flex-1 overflow-auto px-4 py-3 text-xs text-gray-800 font-mono whitespace-pre-wrap leading-relaxed">{{ data.polished }}</pre>
        </div>

      </div>

      <div class="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
        <button
          type="button"
          (click)="dialogRef.close(false)"
          class="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:border-gray-300 hover:text-gray-800 transition-colors duration-200"
        >
          取消
        </button>
        <button
          type="button"
          (click)="dialogRef.close(true)"
          class="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-violet-500 rounded-lg hover:bg-violet-600 transition-colors duration-200"
        >
          <i class="fa-solid fa-check text-xs"></i>
          套用潤飾
        </button>
      </div>

    </div>
  `,
})
export class AiPolishModal {
  dialogRef = inject(MatDialogRef<AiPolishModal>);
  data = inject<AiPolishModalData>(MAT_DIALOG_DATA);
}

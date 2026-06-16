import {
  afterNextRender,
  Component,
  ElementRef,
  inject,
  input,
  OnDestroy,
  signal,
  ViewChild,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import type Editor from '@toast-ui/editor';
import { loadTuiEditor } from '../tui-editor.loader';
import { firstValueFrom } from 'rxjs';
import { ApiConfiguration } from '../../../api/api-configuration';
import { ErrorService } from '../../../core/services/error.service';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE = 5 * 1024 * 1024;

@Component({
  selector: 'md-editor',
  imports: [],
  template: `
    <div #editorElement></div>
    @if (uploading()) {
      <div class="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-full shadow-lg text-sm text-gray-700">
        <svg class="animate-spin h-4 w-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
        </svg>
        圖片上傳中...
      </div>
    }
  `,
  styles: [],
})
export class MdEditor implements OnDestroy {
  @ViewChild('editorElement') editorElement!: ElementRef;
  editor?: Editor;
  height = input<string>('500px');
  uploading = signal(false);

  private http = inject(HttpClient);
  private apiConfig = inject(ApiConfiguration);
  private errorService = inject(ErrorService);
  private _pendingContent: string | null = null;

  constructor() {
    afterNextRender(async () => {
      const { Editor, codeSyntaxHighlight, tableMergedCell, Prism } = await loadTuiEditor();

      const isNarrow = window.innerWidth < 1024;

      const initialValue = this._pendingContent ?? '';
      this._pendingContent = null;
      this.editor = new Editor({
        el: this.editorElement.nativeElement,
        height: this.height(),
        initialEditType: 'markdown',
        previewStyle: isNarrow ? 'tab' : 'vertical',
        initialValue,
        plugins: [[codeSyntaxHighlight, { highlighter: Prism }], tableMergedCell],

        hooks: {
          addImageBlobHook: async (
            blob: Blob,
            callback: (url: string, altText?: string) => void,
          ) => {
            const validationError = this.validateImage(blob);
            if (validationError) {
              this.errorService.report(new Error(validationError), '圖片上傳');
              return;
            }

            this.uploading.set(true);
            try {
              const imageUrl = await this.uploadImage(blob);
              callback(imageUrl, 'image');
            } catch (error) {
              this.errorService.report(error, '圖片上傳失敗');
            } finally {
              this.uploading.set(false);
            }
          },
        },
      });
    });
  }

  ngOnDestroy() {
    if (this.editor) {
      this.editor.destroy();
    }
  }

  getContent(): string {
    return this.editor?.getMarkdown() ?? '';
  }

  setContent(content: string): void {
    if (this.editor) {
      this.editor.setMarkdown(content);
    } else {
      this._pendingContent = content;
    }
  }

  private validateImage(blob: Blob): string | null {
    if (!ALLOWED_TYPES.includes(blob.type)) {
      return '不支援的格式，請上傳 JPG / PNG / WebP / GIF';
    }
    if (blob.size > MAX_SIZE) {
      return `檔案過大（${(blob.size / 1024 / 1024).toFixed(1)} MB），請小於 5 MB`;
    }
    return null;
  }

  private async uploadImage(blob: Blob): Promise<string> {
    const formData = new FormData();
    const extension = blob.type === 'image/jpeg' ? 'jpg' : blob.type.split('/')[1] || 'png';
    formData.append('file', blob, `image_${Date.now()}.${extension}`);

    const response = await firstValueFrom(
      this.http.post<{ data: { url: string } }>(
        `${this.apiConfig.rootUrl}/admin/upload/image`,
        formData,
      ),
    );
    return response.data.url;
  }
}

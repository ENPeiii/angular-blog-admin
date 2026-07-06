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

const ADMONITION_TYPES = [
  { type: 'note', label: 'Note', icon: '📝' },
  { type: 'tip', label: 'Tip', icon: '💡' },
  { type: 'important', label: 'Important', icon: '❗' },
  { type: 'warning', label: 'Warning', icon: '⚠️' },
  { type: 'caution', label: 'Caution', icon: '🔥' },
] as const;

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

  private _admonitionMenuCleanups: (() => void)[] = [];

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
        toolbarItems: [
          ['heading', 'bold', 'italic', 'strike'],
          [
            { name: 'color', tooltip: '文字顏色', el: this.createColorButton() },
            { name: 'highlight', tooltip: '螢光筆', el: this.createHighlightButton() },
            { name: 'admonition', tooltip: '插入提示框', el: this.createAdmonitionButton() },
          ],
          ['hr', 'quote'],
          ['task'],
          ['table', 'image', 'link'],
          ['code', 'codeblock'],
          ['scrollSync'],
        ],

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

  private createColorButton(): HTMLElement {
    const wrapper = document.createElement('span');
    wrapper.style.position = 'relative';
    wrapper.style.display = 'inline-flex';

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'toastui-editor-toolbar-icons';
    button.style.backgroundImage = 'none';
    button.innerHTML = '<i class="fa-solid fa-palette" style="font-size:14px;color:#555;"></i>';

    const colorInput = document.createElement('input');
    colorInput.type = 'color';
    colorInput.value = '#ff0000';
    colorInput.style.position = 'absolute';
    colorInput.style.width = '1px';
    colorInput.style.height = '1px';
    colorInput.style.opacity = '0';
    colorInput.style.pointerEvents = 'none';

    type EditorPos = ReturnType<Editor['getSelection']>[number];
    let range: { start: EditorPos; end: EditorPos; text: string } | null = null;

    button.addEventListener('click', () => {
      const text = this.editor?.getSelectedText() ?? '';
      if (!text) return;
      const selection = this.editor?.getSelection();
      if (!selection) return;
      range = { start: selection[0], end: selection[1], text };
      colorInput.click();
    });

    colorInput.addEventListener('input', () => {
      if (!range || !this.editor) return;
      this.editor.replaceSelection(
        `<span style="color:${colorInput.value}">${range.text}</span>`,
        range.start,
        range.end,
      );
      range = null;
    });

    wrapper.append(button, colorInput);
    return wrapper;
  }

  private createHighlightButton(): HTMLElement {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'toastui-editor-toolbar-icons';
    button.style.backgroundImage = 'none';
    button.innerHTML = '<i class="fa-solid fa-highlighter" style="font-size:14px;color:#555;"></i>';

    button.addEventListener('click', () => {
      const text = this.editor?.getSelectedText() ?? '';
      if (!text) return;
      const match = text.match(/^<mark>([\s\S]*)<\/mark>$/);
      const replaced = match ? match[1] : `<mark>${text}</mark>`;
      this.editor?.replaceSelection(replaced);
    });

    return button;
  }

  private createAdmonitionButton(): HTMLElement {
    const wrapper = document.createElement('span');
    wrapper.style.position = 'relative';
    wrapper.style.display = 'inline-flex';

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'toastui-editor-toolbar-icons';
    button.style.backgroundImage = 'none';
    button.innerHTML =
      '<i class="fa-solid fa-triangle-exclamation" style="font-size:14px;color:#555;"></i>';

    const menu = document.createElement('div');
    menu.style.display = 'none';
    menu.style.position = 'absolute';
    menu.style.top = '100%';
    menu.style.left = '0';
    menu.style.zIndex = '100';
    menu.style.background = '#fff';
    menu.style.border = '1px solid #e5e7eb';
    menu.style.borderRadius = '6px';
    menu.style.boxShadow = '0 4px 12px rgba(0,0,0,0.12)';
    menu.style.padding = '4px';
    menu.style.minWidth = '140px';

    const closeMenu = () => {
      menu.style.display = 'none';
    };

    for (const { type, label, icon } of ADMONITION_TYPES) {
      const item = document.createElement('button');
      item.type = 'button';
      item.textContent = `${icon} ${label}`;
      Object.assign(item.style, {
        display: 'block',
        width: '100%',
        textAlign: 'left',
        padding: '6px 10px',
        border: 'none',
        background: 'none',
        cursor: 'pointer',
        fontSize: '13px',
        borderRadius: '4px',
      });
      item.addEventListener('mouseenter', () => (item.style.background = '#f3f4f6'));
      item.addEventListener('mouseleave', () => (item.style.background = 'none'));
      item.addEventListener('click', (event) => {
        event.stopPropagation();
        closeMenu();
        if (!this.editor) return;
        const snippet = `\n\n<div class="markdown-alert markdown-alert-${type}">\n<p class="markdown-alert-title">${icon} ${label}</p>\n<p>在這裡輸入內容</p>\n</div>\n\n`;
        this.editor.insertText(snippet);
      });
      menu.appendChild(item);
    }

    button.addEventListener('click', (event) => {
      event.stopPropagation();
      menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
    });

    document.addEventListener('click', closeMenu);
    this._admonitionMenuCleanups.push(() => document.removeEventListener('click', closeMenu));

    wrapper.append(button, menu);
    return wrapper;
  }

  ngOnDestroy() {
    if (this.editor) {
      this.editor.destroy();
    }
    this._admonitionMenuCleanups.forEach((cleanup) => cleanup());
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

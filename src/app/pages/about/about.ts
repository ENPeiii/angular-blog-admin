import { ChangeDetectionStrategy, Component, OnInit, inject, signal, viewChild } from '@angular/core';
import { DatePipe } from '@angular/common';
import { asyncScheduler, observeOn } from 'rxjs';
import { MdEditor } from '../../shared/tui-editor/md-editor/md-editor';
import { AboutService } from './services/about.service';
import { ErrorService } from '../../core/services/error.service';

@Component({
  selector: 'app-about',
  imports: [MdEditor, DatePipe],
  templateUrl: './about.html',
  styleUrl: './about.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class About implements OnInit {
  private service = inject(AboutService);
  private errorService = inject(ErrorService);

  isLoading = signal(true);
  isSaving = signal(false);
  updatedAt = signal<string | null>(null);

  private mdEditor = viewChild(MdEditor);

  ngOnInit(): void {
    this.service.getAbout$().pipe(observeOn(asyncScheduler)).subscribe({
      next: (about) => {
        this.mdEditor()?.setContent(about.content);
        this.updatedAt.set(about.updatedAt);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorService.report(err, '載入關於我失敗');
        this.isLoading.set(false);
      },
    });
  }

  save(): void {
    const content = this.mdEditor()?.getContent() ?? '';
    this.isSaving.set(true);
    this.service.updateAbout$(content).subscribe({
      next: (about) => {
        this.updatedAt.set(about.updatedAt);
        this.isSaving.set(false);
      },
      error: (err) => {
        this.errorService.report(err, '儲存失敗');
        this.isSaving.set(false);
      },
    });
  }
}

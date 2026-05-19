import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'loading',
  imports: [],
  template: `
  <div
  class="fixed z-50 top-0 left-0 backdrop-blur-sm w-screen h-screen flex justify-center items-center"
>
  <div class="loading">
    <div class="loading-detail">
      <div></div>
      <div></div>
      <div></div>
    </div>
  </div>
</div>`,
  styleUrl: './loading.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Loading {}

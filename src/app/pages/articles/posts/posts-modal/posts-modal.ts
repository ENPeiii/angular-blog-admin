import { Component, inject, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MdEditor } from '../../../../shared/tui-editor/md-editor/md-editor';


export interface PostsModalData {
  postId: string | null;
}

@Component({
  selector: 'app-posts-modal',
  imports: [MatDialogModule, FormsModule,MdEditor],
  templateUrl: './posts-modal.html',
  styleUrl: './posts-modal.scss',
})
export class PostsModal {
  dialogRef = inject(MatDialogRef<PostsModal>);
  data = inject<PostsModalData>(MAT_DIALOG_DATA);

  isEdit = !!this.data?.postId;

  private mdEditor = viewChild(MdEditor);

  title = '';
  tags: string[] = [];
  tagInputValue = '';

  addTag() {
    const tag = this.tagInputValue.trim();
    if (tag && !this.tags.includes(tag)) {
      this.tags.push(tag);
    }
    this.tagInputValue = '';
  }

  removeTag(tag: string) {
    this.tags = this.tags.filter(t => t !== tag);
  }

  removeLastTagIfEmpty() {
    if (this.tagInputValue === '') {
      this.tags.pop();
    }
  }

  save() {
    const content = this.mdEditor()?.getContent() ?? '';
    console.log({ title: this.title, tags: this.tags, content });
    // TODO: 串接 API
  }

  close() {
    this.dialogRef.close();
  }
}

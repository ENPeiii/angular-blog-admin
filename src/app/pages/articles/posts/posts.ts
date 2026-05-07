import { Component, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';

type PostStatus = 'published' | 'draft';
type SortField = 'status' | 'createdAt' | 'updatedAt';
type SortDirection = 'asc' | 'desc';

interface Post {
  id: number;
  title: string;
  tags: string[];
  status: PostStatus;
  createdAt: string;
  updatedAt: string;
}

const MOCK_POSTS: Post[] = [
  { id: 1, title: 'Angular 18 新功能介紹', tags: ['Angular', 'Frontend'], status: 'published', createdAt: '2025-04-01', updatedAt: '2025-05-01' },
  { id: 2, title: 'Tailwind CSS 排版技巧', tags: ['CSS', 'Tailwind'], status: 'published', createdAt: '2025-04-10', updatedAt: '2025-04-20' },
  { id: 3, title: 'RxJS 常見操作符整理', tags: ['RxJS', 'Angular'], status: 'draft', createdAt: '2025-04-18', updatedAt: '2025-05-03' },
  { id: 4, title: 'Signal 與 Zone.js 的差異', tags: ['Angular', 'Signal'], status: 'published', createdAt: '2025-04-25', updatedAt: '2025-04-28' },
  { id: 5, title: 'TypeScript 進階型別技巧', tags: ['TypeScript'], status: 'draft', createdAt: '2025-05-01', updatedAt: '2025-05-06' },
];

const PAGE_SIZE = 10;

@Component({
  selector: 'app-posts',
  imports: [FormsModule],
  templateUrl: './posts.html',
  styleUrl: './posts.scss',
})
export class Posts {
  searchQuery = signal('');
  statusFilter = signal<PostStatus | 'all'>('all');
  sortField = signal<SortField>('updatedAt');
  sortDirection = signal<SortDirection>('desc');
  currentPage = signal(1);

  filteredPosts = computed(() => {
    const query = this.searchQuery().toLowerCase();
    const status = this.statusFilter();
    const field = this.sortField();
    const direction = this.sortDirection();

    return MOCK_POSTS
      .filter(post => {
        const matchQuery = post.title.toLowerCase().includes(query);
        const matchStatus = status === 'all' || post.status === status;
        return matchQuery && matchStatus;
      })
      .sort((a, b) => {
        const valA = a[field];
        const valB = b[field];
        const result = valA < valB ? -1 : valA > valB ? 1 : 0;
        return direction === 'asc' ? result : -result;
      });
  });

  totalPages = computed(() => Math.max(1, Math.ceil(this.filteredPosts().length / PAGE_SIZE)));

  pagedPosts = computed(() => {
    const page = this.currentPage();
    const start = (page - 1) * PAGE_SIZE;
    return this.filteredPosts().slice(start, start + PAGE_SIZE);
  });

  statusOptions: { label: string; value: PostStatus | 'all' }[] = [
    { label: '全部', value: 'all' },
    { label: '已發布', value: 'published' },
    { label: '草稿', value: 'draft' },
  ];

  setSearch(value: string) {
    this.searchQuery.set(value);
    this.currentPage.set(1);
  }

  setStatusFilter(value: PostStatus | 'all') {
    this.statusFilter.set(value);
    this.currentPage.set(1);
  }

  toggleSort(field: SortField) {
    if (this.sortField() === field) {
      this.sortDirection.update(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortField.set(field);
      this.sortDirection.set('desc');
    }
    this.currentPage.set(1);
  }

  sortIcon(field: SortField): string {
    if (this.sortField() !== field) return 'fa-sort';
    return this.sortDirection() === 'asc' ? 'fa-sort-up' : 'fa-sort-down';
  }

  prevPage() {
    this.currentPage.update(p => Math.max(1, p - 1));
  }

  nextPage() {
    this.currentPage.update(p => Math.min(this.totalPages(), p + 1));
  }
}

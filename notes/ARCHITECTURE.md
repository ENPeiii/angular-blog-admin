# Angular Blog Admin — 架構規劃

## 路由設計

### 概念對應

| 功能名稱 | 路由 | 對應 API 模組 |
|----------|------|--------------|
| Dashboard（後台首頁） | `/` | — |
| 首頁設定 | `/index` | — |
| 關於我 | `/about` | — |
| 所有文章 | `/posts` | `admin-posts` |
| 文章標籤 | `/tags` | `admin-tags` |
| 主題文章 | `/topics` | `admin-topics` |

---

### 路由清單

```
/                          Dashboard（後台首頁）
/index                     首頁設定
/about                     關於我

/posts                     所有文章列表（新增 / 編輯透過 Modal 操作）
/tags                      文章標籤列表（新增 / 編輯透過 Modal 操作）
/topics                    主題列表（新增 / 編輯透過 Modal 操作）
```

> posts / tags / topics 在資料夾內歸類為 articles 群組，
> 但路由不帶 `/articles` 前綴，透過 Angular routing `path: ''` 攤平。

---

### `ROUTES_CONSTANT` 結構

```typescript
HOME:   { base: '', url: '',       title: APP_TITLE },  // Dashboard
INDEX:  { base: 'index', url: 'index', title: '首頁設定' },
ABOUT:     { base: 'about',     url: 'about',     title: '關於我' },
POSTS:     { base: 'posts',     url: 'posts',     title: '所有文章' },
TAGS:      { base: 'tags',      url: 'tags',      title: '文章標籤' },
TOPICS:    { base: 'topics',    url: 'topics',    title: '主題文章' },
```

---

### `app.routes.ts` 路由結構

```typescript
export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: '',      loadComponent: () => import('./pages/dashboard/...') },
      { path: 'index', loadComponent: () => import('./pages/index/...') },
      { path: 'about',     loadComponent: () => import('./pages/about/...') },
      // articles 群組，path: '' 不產生額外 URL 層級
      {
        path: '',
        children: [
          { path: 'posts',  loadComponent: () => import('./pages/articles/posts/...') },
          { path: 'tags',   loadComponent: () => import('./pages/articles/tags/...') },
          { path: 'topics', loadComponent: () => import('./pages/articles/topics/...') },
        ]
      }
    ]
  }
];
```

---

## Pages 資料夾結構

```
src/app/
├── core/
│   └── constants/
│       ├── base-constant.ts
│       └── routes-constant.ts
│
├── pages/
│   ├── dashboard/                    # Dashboard
│   │   └── dashboard.component.ts
│   │
│   ├── index/                        # 首頁設定
│   │   └── index.component.ts
│   │
│   ├── about/                        # 關於我
│   │   └── about.component.ts
│   │
│   └── articles/                     # 文章相關功能群組
│       ├── posts/                    # 所有文章
│       │   ├── posts.component.ts
│       │   └── posts-modal/
│       │       └── posts-modal.component.ts
│       │
│       ├── tags/                     # 文章標籤
│       │   ├── tags.component.ts
│       │   └── tags-modal/
│       │       └── tags-modal.component.ts
│       │
│       └── topics/                   # 主題文章
│           ├── topics.component.ts
│           └── topics-modal/
│               └── topics-modal.component.ts
│
└── app.routes.ts
```

---

## 各模組功能說明

### dashboard（後台首頁，路由 `/`）
- 數據總覽：文章數、類別數、主題數等統計

### posts（所有文章）
- 列表頁：搜尋、篩選（類別 / 主題 / 狀態）、分頁
- Modal：新增 / 編輯共用，`data` 有值 → 編輯，無值 → 新增

### tags（文章標籤）
- 列表頁：類別名稱、文章數量
- Modal：類別名稱、slug、描述

### topics（主題文章）
- 列表頁：主題封面、標題、文章數量、排序
- Modal：主題封面上傳、標題、描述、排序

---

## Modal 共用策略（新增 / 編輯）

```typescript
// 列表頁
openModal(post?: PostModel) {
  this.dialog.open(PostsModalComponent, { data: post ?? null });
}
```

```typescript
// Modal component
isEdit = !!this.dialogData;

ngOnInit() {
  if (this.isEdit) this.form.patchValue(this.dialogData);
}

submit() {
  if (this.isEdit) {
    this.api.updatePost(this.dialogData.id, this.form.value);
  } else {
    this.api.createPost(this.form.value);
  }
}
```

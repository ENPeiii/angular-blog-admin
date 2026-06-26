# Admin 前端 CI/CD 部署流程（Docker 版）

> 將 `angular-blog-admin` 打包成 Nginx Docker image，
> 透過 GitHub Actions 自動部署到 GCP VM，為未來導入 K8s 預做準備。

---

## 為什麼 Admin 也要包 Docker？

Admin 是純靜態 SPA，技術上不需要 Docker。  
但選擇容器化是基於**架構一致性**與**K8s 遷移成本**的考量：

| 考量點 | 說明 |
|--------|------|
| 未來導入 K8s | 三個服務都是 container，直接寫 Deployment YAML 即可，不需要額外遷移靜態部署的 VM 設定 |
| 部署模式統一 | 後端、前台 UI、Admin 走同一套 CI/CD 心智模型（build image → push GHCR → pull & up） |
| Rollback 簡單 | 任何版本都有對應的 image tag（`sha-xxxxxxx`），一行指令即可回滾 |
| Nginx 設定版本控制 | Container 內的 Nginx config 跟程式碼一起進 CI/CD，不需要 SSH 進 VM 手動管 |

---

## 整體架構

```
GCP VM (35.222.136.176)
│
├── 系統層 Nginx（SSL 終結 + 反向代理）
│   ├── api.enpei.com.tw   → proxy → localhost:3000  (後端 Express)
│   ├── enpei.com.tw       → proxy → localhost:4000  (前台 UI SSR)
│   └── admin.enpei.com.tw → proxy → localhost:4201  (Admin Nginx in Docker) ← 新增
│
└── Docker Compose
    ├── postgres       (port 5432, internal)
    ├── app            (port 127.0.0.1:3000:3000 — 後端 Express)
    ├── angular-ui     (port 127.0.0.1:4000:4000 — 前台 UI SSR)  ← 前台 UI 的 container
    ├── angular-admin  (port 127.0.0.1:4201:80   — Admin Nginx)  ← 本次新增
    └── dozzle         (port 127.0.0.1:8080:8080 — Log viewer)
```

**Admin Docker Container 內部結構：**

```
nginx:alpine image
└── /usr/share/nginx/html/    ← ng build 產出的靜態檔
    ├── index.html
    ├── main-xxxxxxxx.js
    └── ...
    
/etc/nginx/conf.d/default.conf  ← SPA routing 設定（try_files）
```

---

## CI/CD 流程（兩段式，與後端相同模式）

```
開發者 push 到 GitHub main
          │
          ▼
┌──────────────────────────────────┐
│  Workflow 1: docker-build.yml    │
│                                  │
│  1. Checkout                     │
│  2. 登入 GHCR                     │
│  3. docker build                 │
│     (multi-stage: Node build     │
│      → Nginx serve)              │
│  4. push ghcr.io/enpeiii/        │
│     angular-blog-admin           │
│     tag: sha-xxxxx / latest      │
└───────────────┬──────────────────┘
                │ 成功後自動觸發
                ▼
┌──────────────────────────────────┐
│  Workflow 2: deploy.yml          │
│                                  │
│  1. SCP docker-compose.yml  │
│     + nginx conf → GCP VM        │
│  2. SSH: Setup nginx + SSL       │
│     (idempotent，首次才執行)       │
│  3. SSH: docker login GHCR       │
│         docker compose pull      │
│         docker compose up -d     │
│         docker image prune -f    │
└──────────────────────────────────┘
          │
          ▼
  https://admin.enpei.com.tw
  (系統 Nginx → Docker Nginx → 靜態檔)
```

---

## 需要建立的檔案

### 1. `Dockerfile`

```dockerfile
# ---- Stage 1: Build ----
FROM node:22-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npx ng build --configuration production

# ---- Stage 2: Serve ----
FROM nginx:alpine
COPY --from=builder /app/dist/angular-blog-admin/browser/ /usr/share/nginx/html/
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**兩階段說明：**
- `builder`：裝所有 node_modules、跑 `ng build`，產出靜態檔
- `nginx:alpine`：只複製靜態檔和 Nginx 設定，最終 image 不含 Node.js 和 node_modules
- 最終 image 大小約 **20-30 MB**（相較於含 Node.js 的 builder 約 500 MB）

---

### 2. `nginx.conf`（Docker 容器內部的 Nginx 設定）

```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript;
    gzip_vary on;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

> 這份是**容器內**的 Nginx 設定（處理 SPA routing）。  
> 系統層的 `admin.enpei.com.tw.conf`（處理 SSL + proxy）放在後端 repo 的 `nginx/` 目錄。

---

### 3. `docker-compose.yml`

```yaml
services:
  angular-admin:
    image: ghcr.io/enpeiii/angular-blog-admin:latest
    ports:
      - "127.0.0.1:4201:80"
    restart: unless-stopped
```

> `127.0.0.1:4201:80`：只綁定 localhost，外部無法直接訪問，
> 必須透過系統 Nginx proxy 進來（與後端 port 3000 相同模式）。

---

### 4. `.github/workflows/docker-build.yml`

```yaml
name: Build and Push Docker Image

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
      - name: Checkout repository
        uses: actions/checkout@v5

      - name: Log in to Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=sha
            type=raw,value=latest,enable={{is_default_branch}}

      - name: Build and push Docker image
        uses: docker/build-push-action@v5
        with:
          context: .
          push: ${{ github.event_name != 'pull_request' }}
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
```

> PR 時只 build 不 push（確認 Dockerfile 沒壞），push 到 main 才推上 GHCR。  
> `GITHUB_TOKEN` 由 GitHub 自動提供，不需要手動設定 secret。

---

### 5. `.github/workflows/deploy.yml`

```yaml
name: Deploy Admin to GCP

on:
  workflow_run:
    workflows: ["Build and Push Docker Image"]
    types:
      - completed
    branches:
      - main

jobs:
  deploy-to-gcp:
    runs-on: ubuntu-latest
    if: ${{ github.event.workflow_run.conclusion == 'success' }}

    steps:
      - name: Check out the code
        uses: actions/checkout@v5

      - name: Copy files to GCP VM
        uses: appleboy/scp-action@v0.1.7
        with:
          host: ${{ secrets.GCP_HOST }}
          username: ${{ secrets.GCP_USERNAME }}
          key: ${{ secrets.GCP_SSH_KEY }}
          source: "docker-compose.yml,nginx/admin.enpei.com.tw.conf"
          target: "~/angular-blog-admin/"

      - name: Setup nginx + SSL (first deploy only)
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.GCP_HOST }}
          username: ${{ secrets.GCP_USERNAME }}
          key: ${{ secrets.GCP_SSH_KEY }}
          script: |
            CERT_PATH="/etc/letsencrypt/live/admin.enpei.com.tw/fullchain.pem"

            if [ ! -f "$CERT_PATH" ]; then
              echo "=== First-time: installing nginx + certbot ==="
              sudo apt-get update -qq
              sudo apt-get install -y -qq nginx certbot python3-certbot-nginx

              sudo cp ~/angular-blog-admin/nginx/admin.enpei.com.tw.conf \
                   /etc/nginx/sites-available/admin.enpei.com.tw
              sudo ln -sf /etc/nginx/sites-available/admin.enpei.com.tw \
                          /etc/nginx/sites-enabled/
              sudo nginx -t && sudo systemctl reload nginx

              sudo certbot --nginx \
                -d admin.enpei.com.tw \
                --non-interactive \
                --agree-tos \
                -m "${{ secrets.CERTBOT_EMAIL }}" \
                --redirect
              echo "=== SSL setup complete ==="
            else
              echo "=== SSL already configured, skipping ==="
            fi

      - name: Deploy Docker container
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.GCP_HOST }}
          username: ${{ secrets.GCP_USERNAME }}
          key: ${{ secrets.GCP_SSH_KEY }}
          script: |
            echo "${{ secrets.GH_CR_TOKEN }}" | docker login ghcr.io -u ${{ github.actor }} --password-stdin

            docker compose -f ~/angular-blog-admin/docker-compose.yml pull

            docker compose -f ~/angular-blog-admin/docker-compose.yml up -d

            docker image prune -f
```

---

### 6. `nginx/admin.enpei.com.tw.conf`（Admin repo 內）

**位置：** `front-end/angular-blog-admin/nginx/admin.enpei.com.tw.conf`

deploy.yml 的 SCP 步驟會把這個檔案傳到 GCP VM，首次部署時讓 Nginx + Certbot 讀取並設定 SSL。  
內容是 **HTTP-only proxy 版**，certbot 執行後會自動在這份設定裡加入 HTTPS redirect 和 SSL 憑證路徑。

```nginx
server {
    listen 80;
    server_name admin.enpei.com.tw;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript;
    gzip_vary on;

    location / {
        proxy_pass http://localhost:4201;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

> certbot 執行後，VM 上的 `/etc/nginx/sites-available/admin.enpei.com.tw` 會被自動改成含 HTTPS 的版本，
> repo 裡的這份原始 HTTP 版本只作為首次部署的起點，不需要跟著更新。

---

### 7. 修改系統 Nginx Admin 設定（後端 repo 的檔案）

**位置：** `back-end/angular-blog-server/nginx/admin.enpei.com.tw.conf`

從「serve 靜態目錄」改成「proxy 到 Docker container」：

```nginx
# 修改前（靜態檔模式）
server {
    listen 80;
    server_name admin.enpei.com.tw;
    root /var/www/admin.enpei.com.tw;
    index index.html;
    ...
}

# 修改後（Docker proxy 模式）
server {
    listen 80;
    server_name admin.enpei.com.tw;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript;
    gzip_vary on;

    location / {
        proxy_pass http://localhost:4201;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

> 這個修改在**後端 repo** 進行，後端的 deploy workflow 會把新設定 SCP 到 VM 並 reload Nginx。  
> Admin frontend repo 只需要攜帶一份同名的 `nginx/admin.enpei.com.tw.conf`，
> 讓自己的 deploy workflow 在首次部署時 setup SSL 用。

---

### 7. 修正 Production Environment 設定

**問題：** `environment.ts`（production 預設）`apiBaseUrl: ''` 在跨 origin 的情況下無效。

```typescript
// src/environments/environment.ts（修改後）
export const environment = {
  apiBaseUrl: 'https://api.enpei.com.tw',  // ng-openapi-gen path 含 /api 前綴時
  // apiBaseUrl: 'https://api.enpei.com.tw/api',  // path 不含 /api 前綴時
};
```

> **驗證方式：** 執行 `npm run gen:api` 後，查看 `src/app/api/` 內任一 service 的 HTTP 路徑格式，
> 確認是否已含 `/api` 前綴，再決定 `apiBaseUrl` 要不要加 `/api`。

---

## 所有需要建立或修改的檔案

**Admin repo（`front-end/angular-blog-admin/`）新增：**

```
front-end/angular-blog-admin/
├── Dockerfile                              ← 新增
├── nginx.conf                              ← 新增（container 內部 Nginx）
├── docker-compose.yml                 ← 新增
├── nginx/
│   └── admin.enpei.com.tw.conf            ← 新增（給 deploy workflow 首次 SSL setup 用）
└── .github/
    └── workflows/
        ├── docker-build.yml               ← 新增
        └── deploy.yml                     ← 新增
```

**Admin repo 修改：**
```
src/environments/environment.ts            ← 修改 apiBaseUrl
```

**後端 repo（`back-end/angular-blog-server/`）修改：**
```
nginx/admin.enpei.com.tw.conf             ← 從靜態 serve 改為 proxy pass
```

---

## 完整 TODO List

### Phase 0：前置確認

- [ ] 確認 `front-end/angular-blog-admin/` 已有獨立 git repo 並推上 GitHub
- [ ] 確認 GitHub repo 名稱（決定 GHCR image 路徑，e.g., `ghcr.io/enpeiii/angular-blog-admin`）
- [ ] 確認 GCP VM 上 Docker 已安裝（後端已在用，應已有）
- [ ] 確認 DNS A record `admin.enpei.com.tw → 35.222.136.176` 已設定

---

### Phase 1：修正 Environment

- [ ] 啟動後端（`npm run dev`），執行 `npm run gen:api` 重新產生 API client
- [ ] 查看 `src/app/api/` 內任一 service 的 path 格式，確認是否含 `/api` 前綴
- [ ] 修改 `src/environments/environment.ts` 的 `apiBaseUrl`
- [ ] 執行 `ng build --configuration production` 確認本地 build 成功

---

### Phase 2：建立 Docker 相關檔案

- [ ] 在 `front-end/angular-blog-admin/` 根目錄建立 `Dockerfile`（內容見上方）
- [ ] 建立 `nginx.conf`（container 內部 SPA routing 設定）
- [ ] 建立 `docker-compose.yml`（port 4201）
- [ ] 建立 `nginx/admin.enpei.com.tw.conf`（proxy pass 版本）
- [ ] 本地測試 Docker build：
  ```bash
  docker build -t admin-test .
  docker run -p 8080:80 admin-test
  # 瀏覽器開 http://localhost:8080 確認頁面正常、路由正常
  ```

---

### Phase 3：建立 GitHub Actions Workflows

- [ ] 建立 `.github/workflows/docker-build.yml`
- [ ] 建立 `.github/workflows/deploy.yml`
- [ ] 在 GitHub repo Settings → Secrets and variables → Actions 設定：

  | Secret | 說明 |
  |--------|------|
  | `GCP_HOST` | GCP VM IP（`35.222.136.176`）|
  | `GCP_USERNAME` | SSH 帳號 |
  | `GCP_SSH_KEY` | SSH 私鑰 |
  | `GH_CR_TOKEN` | GitHub PAT（用於 VM 上 pull private image）|
  | `CERTBOT_EMAIL` | Let's Encrypt 通知 email |

---

### Phase 4：修改後端 Nginx 設定

- [ ] 修改後端 repo 的 `nginx/admin.enpei.com.tw.conf`，從靜態 serve 改為 proxy pass（內容見上方）
- [ ] 推後端的修改到 main，讓後端的 deploy workflow 把新 Nginx 設定部署到 VM
- [ ] 確認 VM 上 Nginx reload 成功：`sudo nginx -t && sudo systemctl reload nginx`

---

### Phase 5：首次部署與驗證

- [ ] Push admin repo 的修改到 main，觸發 `docker-build.yml`
- [ ] 觀察 GitHub Actions — build 成功後確認 `deploy.yml` 自動觸發
- [ ] 瀏覽器訪問 `https://admin.enpei.com.tw` 確認頁面正常載入
- [ ] 開 DevTools Network，確認 API 請求打到 `api.enpei.com.tw`
- [ ] 測試各頁面：Posts CRUD、Tags、Topics、Banner

---

## 與後端 CI/CD 的對比

| 項目 | 後端 | Admin 前端 |
|------|------|-----------|
| Workflow 數量 | 2 個 | 2 個（相同模式）|
| Build 產出 | Node.js compiled JS | Nginx + 靜態檔 image |
| Container Registry | GHCR | GHCR |
| GCP 上執行的 | Express container | Nginx container |
| 系統 Nginx 角色 | Reverse proxy → port 3000 | Reverse proxy → port 4201 |
| 需要 .env / Secrets | 多個（DB、GCS）| **只需 SSH + GHCR token** |
| K8s 遷移準備度 | ✅ 已容器化 | ✅ 已容器化 |

---

## 常見問題

### docker-build.yml 成功但 deploy.yml 沒有觸發

`workflow_run` 只在 default branch（`main`）可靠。確認 push 的是 `main`，不是其他分支。

### Container 跑起來但 API 請求失敗（CORS）

確認後端 `app.ts` 的 `allowedOrigins` 包含 `https://admin.enpei.com.tw`：

```typescript
const allowedOrigins = [
  'https://admin.enpei.com.tw',  // ← 確認這行
  ...
];
```

### 路由直接訪問回傳 502

502 通常是 proxy 找不到 upstream。確認 Docker container 有在跑：

```bash
docker ps | grep angular-admin
```

若容器未啟動：

```bash
docker compose -f ~/angular-blog-admin/docker-compose.yml up -d
```

### Rollback 到舊版本

```bash
# 在 GCP VM 上執行
docker pull ghcr.io/enpeiii/angular-blog-admin:sha-<舊的 commit hash>
docker compose -f ~/angular-blog-admin/docker-compose.yml up -d \
  --no-deps -e IMAGE_TAG=sha-<舊的 commit hash>
```

### 未來導入 K8s 的遷移路徑

目前 VM 架構 → K8s 時，每個服務已是獨立 container image，只需要：
1. 為每個服務寫 `Deployment` + `Service` YAML
2. 系統 Nginx 的角色由 K8s Ingress Controller 取代
3. SSL 由 cert-manager 取代 Certbot
4. Secrets 由 K8s Secret / GCP Secret Manager 取代 GitHub Secrets

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { filter, map } from 'rxjs/operators';
import { ApiConfiguration } from '../../../api/api-configuration';
import { getBanners } from '../../../api/fn/admin-banner/get-banners';
import { getBanner } from '../../../api/fn/admin-banner/get-banner';
import { createBanner } from '../../../api/fn/admin-banner/create-banner';
import { updateBanner } from '../../../api/fn/admin-banner/update-banner';
import { deleteBanner } from '../../../api/fn/admin-banner/delete-banner';
import { CreateBannerDto } from '../../../api/models/create-banner-dto';
import { UpdateBannerDto } from '../../../api/models/update-banner-dto';
import { PaginatedResponseBannerModel } from '../../../api/models/paginated-response-banner-model';

@Injectable({ providedIn: 'root' })
export class BannerService {
  private http = inject(HttpClient);
  private config = inject(ApiConfiguration);

  getBanners$(page: number, pageSize = 20) {
    return getBanners(this.http, this.config.rootUrl, { page, pageSize }).pipe(
      filter(r => r.ok),
      map(r => r.body as PaginatedResponseBannerModel),
    );
  }

  getBanner$(id: string) {
    return getBanner(this.http, this.config.rootUrl, { id }).pipe(
      filter(r => r.ok),
      map(r => r.body!.data),
    );
  }

  createBanner$(dto: CreateBannerDto) {
    return createBanner(this.http, this.config.rootUrl, { body: dto }).pipe(
      filter(r => r.ok),
      map(r => r.body!.data),
    );
  }

  updateBanner$(id: string, dto: UpdateBannerDto) {
    return updateBanner(this.http, this.config.rootUrl, { id, body: dto }).pipe(
      filter(r => r.ok),
      map(r => r.body!.data),
    );
  }

  uploadImage$(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return this.http
      .post<{ data: { url: string } }>(`${this.config.rootUrl}/admin/upload/image`, formData)
      .pipe(map(r => r.data.url));
  }

  toggleActive$(id: string, isActive: boolean) {
    return this.updateBanner$(id, { isActive });
  }

  deleteBanner$(id: string) {
    return deleteBanner(this.http, this.config.rootUrl, { id }).pipe(
      filter(r => r.ok),
    );
  }
}

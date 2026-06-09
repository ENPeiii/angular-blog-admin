export interface SyncSectionItem {
  id?: string;
  name: string;
  order: number;
  postIds: string[];
}

export interface SyncSectionsDto {
  sections: SyncSectionItem[];
}

import { APP_TITLE } from './base-constant';

/**基礎路由介面 */
export interface IBaseRoute {
  base?: string;
  url: string;
  title: string;
}

export const ROUTES_CONSTANT: {
  HOME: IBaseRoute;
  INDEX: IBaseRoute;
  ABOUT: IBaseRoute;
  POSTS: IBaseRoute;
  TAGS: IBaseRoute;
  TOPICS: IBaseRoute;
} = {
  /**後台首頁（Dashboard） */
  HOME: { base: '', url: '', title: `${APP_TITLE}` },
  /**前台首頁設定 */
  INDEX: { base: 'index', url: 'index', title: `首頁設定 - ${APP_TITLE}` },
  /**關於我 */
  ABOUT: { base: 'about', url: 'about', title: `關於我 - ${APP_TITLE}` },
  /**所有文章 */
  POSTS: { base: 'posts', url: 'posts', title: `所有文章 - ${APP_TITLE}` },
  /**文章類別 */
  TAGS: { base: 'tags', url: 'tags', title: `文章類別 - ${APP_TITLE}` },
  /**主題文章 */
  TOPICS: { base: 'topics', url: 'topics', title: `主題文章 - ${APP_TITLE}` },
};

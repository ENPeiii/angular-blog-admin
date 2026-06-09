export interface TopicSectionPost {
  id: string;
  title: string;
  order: number;
}

export interface TopicSection {
  id: string;
  name: string;
  order: number;
  posts: TopicSectionPost[];
}

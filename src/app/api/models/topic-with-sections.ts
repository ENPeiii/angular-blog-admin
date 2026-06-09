import { TopicSection } from './topic-section';

export interface TopicWithSections {
  id: string;
  name: string;
  description: string | null;
  postCount: number;
  createdAt: string;
  updatedAt: string;
  sections: TopicSection[];
}

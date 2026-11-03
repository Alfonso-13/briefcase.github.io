export interface KnowledgeLink {
  name: string;
  url: string;
}

export interface KnowledgeProject {
  name: string;
  summary?: string;
  summaryEs?: string;
  url?: string;
}

export interface KnowledgeExperience {
  title: string;
  time: string;
  description?: string;
  descriptionEs?: string;
  projects?: KnowledgeProject[];
  repositories?: KnowledgeLink[];
  highlights?: string[];
}

export interface KnowledgeGroup {
  name?: string;
  experience: KnowledgeExperience[];
}

export interface KnowledgeCategory {
  name: string;
  image?: string;
  description?: string;
  descriptionEs?: string;
  knowledge: KnowledgeGroup[];
}

export interface FolderRecord {
  id: string;
  name: string;
  parentId: string | null;
  pinned: boolean;
  createdAt: string;
}

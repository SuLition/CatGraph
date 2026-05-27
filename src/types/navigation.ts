export type NavId =
  | "documents"
  | "experiments"
  | "constants"
  | "graph"
  | "references"
  | "code"
  | "settings";

export interface NavRouteMeta {
  navId: NavId;
  title: string;
  description?: string;
}

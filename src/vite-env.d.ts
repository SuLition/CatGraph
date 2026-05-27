/// <reference types="vite/client" />

declare module "*?url" {
  const url: string;
  export default url;
}

declare module "markdown-it" {
  export default class MarkdownIt {
    constructor(options?: Record<string, unknown>);
    render(src: string): string;
  }
}

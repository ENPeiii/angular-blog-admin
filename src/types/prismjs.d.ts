declare module 'prismjs' {
  const Prism: {
    highlight(text: string, grammar: object, language: string): string;
    languages: Record<string, object>;
    hooks: { add(name: string, callback: (env: object) => void): void };
    [key: string]: unknown;
  };
  export default Prism;
}

declare module 'prismjs/components/*';
declare module 'prismjs/plugins/*';

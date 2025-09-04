declare module 'eslint-plugin-jsx-a11y' {
  interface ESLintPlugin {
    configs: Record<string, unknown>;
    rules: Record<string, unknown>;
    [key: string]: unknown;
  }
  const plugin: ESLintPlugin;
  export default plugin;
}
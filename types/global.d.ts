// Types for compiled templates
declare module 'ember-this-fallback/templates/*' {
  import { type TemplateFactory } from 'ember-cli-htmlbars';

  const tmpl: TemplateFactory;
  export default tmpl;
}

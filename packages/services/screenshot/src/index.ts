import { Plugin } from 'zhin';
import { Renderer } from '@/renderer';
import htmlRenderer from '@/adapters/htmlRenderer';
import vueRenderer, { IComponent } from '@/adapters/vueRenderer';
declare module 'zhin' {
  namespace App {
    interface Services {
      renderHtml<T extends Renderer.OutputType>(
        input: string,
        options: Renderer.Options<T>,
      ): Promise<Renderer.Output<T>>;
      renderVue<T extends Renderer.OutputType>(
        input: IComponent,
        options: Renderer.Options<T>,
      ): Promise<Renderer.Output<T>>;
    }
  }
}
const plugin = new Plugin('绘图工具');
plugin.service('renderHtml', htmlRenderer.rendering.bind(htmlRenderer));
plugin.service('renderVue', vueRenderer.rendering.bind(vueRenderer));
plugin.mounted(() => {
  htmlRenderer.connect();
  vueRenderer.connect();
});
export default plugin;

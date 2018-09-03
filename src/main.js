import environment from './environment';
import { Aurelia, PLATFORM } from "aurelia-framework";

export function configure(aurelia) {
  aurelia.use
    .standardConfiguration()
    .feature('resources')
    .plugin('aurelia-validation')
    .globalResources([PLATFORM.moduleName('./resources/elements/console-section')])
    .globalResources([PLATFORM.moduleName('./resources/attributes/scroll-next')])
    .globalResources([PLATFORM.moduleName('./resources/attributes/scroll-target')])
    .globalResources([PLATFORM.moduleName('./resources/attributes/scroll-transform')])
    .globalResources([PLATFORM.moduleName('./resources/attributes/polygon-transition')])
    .globalResources([PLATFORM.moduleName('./resources/elements/menu-bar')])
    ;

  if (environment.debug) {
    aurelia.use.developmentLogging();
  }

  if (environment.testing) {
    aurelia.use.plugin('aurelia-testing');
  }

  aurelia.start().then(() => aurelia.setRoot());
}

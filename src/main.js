import Vue from "vue";
import Buefy from "buefy";
import VueLogger from "vuejs-logger";
import { library } from "@fortawesome/fontawesome-svg-core";
import { fas } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import VueKeycloakJs from "@dsb-norge/vue-keycloak-js";
import router from "./router";
import App from "./App.vue";

library.add(fas);

const isProduction = process.env.NODE_ENV === "production";

const options = {
  isEnabled: true,
  logLevel: isProduction ? "error" : "debug",
  stringifyArguments: false,
  showLogLevel: true,
  showMethodName: false,
  separator: ":",
  showConsoleColors: true,
};

Vue.use(VueLogger, options);

Vue.component("vue-fontawesome", FontAwesomeIcon);

Vue.use(Buefy, {
  defaultIconComponent: "vue-fontawesome",
  defaultIconPack: "fas",
});

Vue.config.productionTip = false;

Vue.use(VueKeycloakJs, {
  config: process.env.VUE_APP_KEYCLOAK_CONFIG_URL || "/config",
  init: { onLoad: "login-required" },
  onReady: () => {
    new Vue({
      router,
      render: (h) => h(App),
    }).$mount("#app");
  },
});

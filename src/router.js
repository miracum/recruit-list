import Vue from "vue";
import Router from "vue-router";
import PatientRecommendations from "./views/PatientRecommendations.vue";

Vue.use(Router);

export default new Router({
  mode: "history",
  base: process.env.BASE_URL,
  routes: [
    {
      path: "/",
      name: "patient-recommendations",
      component: PatientRecommendations,
    },
  ],
});

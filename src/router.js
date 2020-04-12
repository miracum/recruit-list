import Vue from "vue";
import Router from "vue-router";
import PatientRecommendations from "./views/PatientRecommendations.vue";
import Recommendations from "./views/Recommendations.vue";
import ResearchSubjectHistory from "./views/ResearchSubjectHistory.vue";

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
    {
      path: "/recommendations/:id",
      name: "patient-recommendations-by-id",
      component: Recommendations,
    },
    {
      path: "/subjects/:id/history",
      name: "researchsubject-history",
      component: ResearchSubjectHistory,
    },
  ],
});

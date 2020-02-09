import Vue from "vue";
import Router from "vue-router";
import PatientRecommendations from "./views/PatientRecommendations.vue";
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
      path: "/subjects/:id/history",
      name: "researchsubject-history",
      component: ResearchSubjectHistory,
    },
  ],
});

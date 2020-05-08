import Vue from "vue";
import Router from "vue-router";

const ScreeningListOverview = () => import("./views/ScreeningListOverview.vue");
const Recommendations = () => import("./views/Recommendations.vue");
const ResearchSubjectHistory = () => import("./views/ResearchSubjectHistory.vue");
const PatientRecord = () => import("./views/PatientRecord.vue");

Vue.use(Router);

export default new Router({
  mode: "history",
  base: process.env.BASE_URL,
  routes: [
    {
      path: "/",
      name: "overview",
      component: ScreeningListOverview,
    },
    {
      path: "/recommendations/:listId",
      name: "patient-recommendations-by-id",
      component: Recommendations,
      props: true,
    },
    {
      path: "/subjects/:subjectId/history",
      name: "researchsubject-history",
      component: ResearchSubjectHistory,
      props: true,
    },
    {
      path: "/patients/:patientId/record",
      name: "patient-record",
      component: PatientRecord,
      props: true,
    },
  ],
});

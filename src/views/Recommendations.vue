<template>
  <div class="recommendations">
    <b-loading :active="isLoading" :is-full-page="false" />
    <template v-if="!isLoading">
      <b-message v-if="failedToLoad" type="is-danger">
        Rekrutierungsvorschläge konnten nicht geladen werden:
        <br />
        <pre>{{ errorMessage }}</pre>
      </b-message>
      <b-message v-else-if="noList" type="is-warning">Keine Rekrutierungsvorschläge vorhanden.</b-message>
      <template v-else>
        <header class="study-description-header">
          <h1 class="title is-3">{{ getStudyAcronymFromList(screeningList) }}</h1>
          <h3 class="subtitle is-5">{{ getStudyFromList(screeningList).title }}</h3>
          <b-message v-if="screeningList.note" has-icon type="is-warning">
            <p v-for="(note, index) in screeningList.note" :key="index">{{ note.text }}</p>
          </b-message>
        </header>
        <ScreeningList :items="screeningList.entry" />
        <p class="has-text-grey">
          Letzte Änderung:
          {{ new Date(screeningList.meta.lastUpdated).toLocaleString("de-DE") }}
        </p>
      </template>
    </template>
  </div>
</template>

<script>
import Api from "@/api";
import fhirpath from "fhirpath";
import ScreeningList from "@/components/ScreeningList.vue";
import Constants from "@/const";

export default {
  name: "Recommendations",
  components: {
    ScreeningList,
  },
  props: {
    listId: String,
  },
  data() {
    return {
      screeningList: {},
      failedToLoad: false,
      isLoading: true,
      noList: false,
      errorMessage: "",
    };
  },
  async mounted() {
    try {
      const list = await Api.fetchListById(this.listId);

      this.screeningList = Object.freeze(list);
    } catch (exc) {
      this.errorMessage = exc;
      this.failedToLoad = true;
    } finally {
      this.isLoading = false;
    }
  },
  methods: {
    getStudyAcronymFromList(list) {
      const study = this.getStudyFromList(list);
      return fhirpath.evaluate(
        study,
        "ResearchStudy.extension.where(url=%acronymSystem).valueString",
        {
          acronymSystem: Constants.SYSTEM_STUDY_ACRONYM,
        }
      )[0];
    },
    getStudyFromList: (list) => {
      return list.extension[0].valueReference;
    },
  },
};
</script>

<style scoped>
.study-description-header {
  margin-bottom: 1.25rem;
}
</style>

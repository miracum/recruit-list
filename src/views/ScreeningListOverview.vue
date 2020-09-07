<template>
  <div class="overview">
    <b-loading :active="isLoading" />
    <b-message v-if="failedToLoad" type="is-danger">
      Rekrutierungsvorschläge konnten nicht geladen werden:
      <br />
      <pre>{{ errorMessage }}</pre>
    </b-message>
    <b-message v-else-if="noLists" type="is-warning">Keine Rekrutierungsvorschläge vorhanden.</b-message>
    <div v-else>
      <h1 class="title is-3">Laufende Studien</h1>
      <div v-for="(list, index) in screeningLists" :key="index" class="card">
        <router-link :to="{ name: 'patient-recommendations-by-id', params: { listId: list.id }}">
          <div class="card-content">
            <div class="media is-vertical-center">
              <div class="media-left">
                <b-tag
                  type="is-primary"
                  size="is-large"
                  rounded
                >{{ list.entry ? list.entry.length : 0 }}</b-tag>
              </div>
              <div class="media-right">
                <h4 class="title is-4 mb-0">{{ getStudyDisplay(list) }}</h4>
              </div>
            </div>
          </div>
        </router-link>
      </div>
    </div>
  </div>
</template>

<script>
import fhirpath from "fhirpath";
import Constants from "@/const";
import Api from "@/api";

export default {
  name: "ScreeningListOverview",
  components: {},
  data() {
    return {
      screeningLists: {},
      failedToLoad: false,
      isLoading: true,
      noLists: false,
      errorMessage: "",
    };
  },
  async mounted() {
    try {
      const screeningLists = await Api.fetchLists();
      if (screeningLists.length !== 0) {
        this.screeningLists = screeningLists;
      } else {
        this.noLists = true;
      }
    } catch (exc) {
      this.errorMessage = exc;
      this.failedToLoad = true;
    } finally {
      this.isLoading = false;
    }
  },
  methods: {
    getStudyDisplay(list) {
      const study = fhirpath.evaluate(
        list,
        "List.extension.where(url=%url).valueReference",
        {
          url: Constants.URL_LIST_BELONGS_TO_STUDY_EXTENSION,
        }
      )[0];

      const acronym = fhirpath.evaluate(
        study,
        "ResearchStudy.extension.where(url=%acronymSystem).valueString",
        {
          acronymSystem: Constants.SYSTEM_STUDY_ACRONYM,
        }
      )[0];

      return acronym || study.title || study.description;
    },
  },
};
</script>

<style scoped>
.patient-recommendations {
  min-height: 100px;
  margin-top: 15px;
}

.study-description-header {
  margin-bottom: 1rem;
}

.is-vertical-center {
  display: flex;
  align-items: center;
}
</style>

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
          <h1 class="title">{{ getStudyAcronymFromList(screeningList) }}</h1>
          <h3 class="subtitle">{{ getStudyFromList(screeningList).title }}</h3>
        </header>

        <ScreeningList :fhirClient="fhirClient" :items="screeningList.entry" />
        <p class="has-text-grey">
          Letzte Änderung:
          {{ new Date(screeningList.meta.lastUpdated).toLocaleString("de-DE") }}
        </p>
      </template>
    </template>
  </div>
</template>

<script>
import FHIR from "fhirclient";
import fhirpath from "fhirpath";
import ScreeningList from "@/components/ScreeningList.vue";
import Constants from "@/const";

export default {
  name: "Recommendations",
  components: {
    ScreeningList,
  },
  data() {
    return {
      screeningList: {},
      failedToLoad: false,
      isLoading: true,
      noList: false,
      errorMessage: "",
      fhirClient: {},
    };
  },
  async mounted() {
    let fhirUrl = process.env.VUE_APP_FHIR_URL;
    if (!fhirUrl) {
      // this is an awkward workaround for FHIR.client not accepting relative paths as valid URLs
      fhirUrl = `${window.location.protocol}//${window.location.host}/fhir`;
    }

    try {
      this.fhirClient = FHIR.client(fhirUrl);
      const allResources = await this.fhirClient.request(
        `List/?_id=${this.$route.params.id}&_include=List:item`,
        {
          resolveReferences: [
            "extension.0.valueReference",
            "individual",
            "study",
          ],
          flat: true,
        }
      );

      if (allResources.length === 0) {
        this.noList = true;
        return;
      }

      const list = fhirpath.evaluate(allResources, "List")[0];

      // a manual "resolveReferences" implementation since fhir.js doesn't support
      // reference resolution on arrays, ie. the List.entry field.
      // see https://github.com/smart-on-fhir/client-js/issues/73
      list.entry = list.entry.map((entry) => {
        // let newEntry = entry;
        const r = fhirpath.evaluate(
          allResources,
          "ResearchSubject.where(id=%subjectId)",
          {
            subjectId: entry.item.reference.split("/")[1],
          }
        )[0];
        return { item: r };
      });

      this.screeningList = Object.freeze(list);
    } catch (exc) {
      this.errorMessage = exc;
      this.failedToLoad = true;
    } finally {
      this.isLoading = false;
    }
  },
  methods: {
    getStudyAcronymFromList: (list) => {
      return fhirpath.evaluate(
        list.extension[0].valueReference,
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
.patient-recommendations {
  min-height: 100px;
  margin-top: 15px;
}

.study-description-header {
  margin: 1.25rem 0;
}
</style>

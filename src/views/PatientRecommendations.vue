<template>
  <div class="patient-recommendations">
    <b-loading :active="isLoading" :is-full-page="false" />

    <b-message v-if="failedToLoad" type="is-danger">
      Rekrutierungsvorschläge konnten nicht geladen werden:
      <br />
      <pre>{{ errorMessage }}</pre>
    </b-message>
    <b-message v-else-if="noLists" type="is-warning">Keine Rekrutierungsvorschläge vorhanden.</b-message>
    <b-tabs v-else v-model="activeTab">
      <b-tab-item v-for="(list, index) in screeningLists" :key="index">
        <template slot="header">
          <span>
            {{ getStudyAcronymFromList(list) }}
            <b-tag rounded>{{ list.entry.length }}</b-tag>
          </span>
        </template>

        <header class="study-description-header">
          <h3 class="title is-4">{{ getStudyFromList(list).title }}</h3>
          <ul>
            <li v-for="(artifact, index) in getStudyFromList(list).relatedArtifact" :key="index">
              <a :href="artifact.url">{{artifact.display || artifact.label || artifact.url}}</a>
            </li>
          </ul>
        </header>

        <ScreeningList :fhirClient="fhirClient" :items="list.entry" />
        <p class="has-text-grey">
          Letzte Änderung:
          {{ new Date(list.meta.lastUpdated).toLocaleString("de-DE") }}
        </p>
      </b-tab-item>
    </b-tabs>
  </div>
</template>

<script>
import FHIR from "fhirclient";
import fhirpath from "fhirpath";
import ScreeningList from "@/components/ScreeningList.vue";
import Constants from "@/const";

export default {
  name: "PatientRecommendations",
  components: {
    ScreeningList,
  },
  data() {
    return {
      screeningLists: {},
      activeTab: 0,
      failedToLoad: false,
      isLoading: true,
      noLists: false,
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
      const screeningLists = await this.fhirClient.request(
        `List?code=${Constants.SYSTEM_SCREENING_LIST}|screening-recommendations`,
        {
          // resolveReferences: ["entry.0.item"],
          resolveReferences: ["extension.0.valueReference", ""],
          flat: true,
        }
      );

      if (screeningLists.length !== 0) {
        // resolveReferences didn't work on item.reference in the screening list
        // it did work when explicitely specifying the index: "entry.0.item"
        // so we need to manually resove the patient references...
        const res = screeningLists.map(async (list) => {
          const newList = list;
          if (newList.entry) {
            newList.entry = await Promise.all(
              list.entry.map(async (entry) => {
                const newEntry = entry;
                const subject = this.fhirClient.request(
                  newEntry.item.reference,
                  {
                    // resolveReferences: ["entry.0.item"],
                    resolveReferences: ["study", "individual"],
                    flat: true,
                    pageLimit: 0,
                  }
                );
                newEntry.item = await subject;
                return newEntry;
              })
            );
          }
          return newList;
        });
        this.screeningLists = await Promise.all(res);
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
  margin-bottom: 1rem;
}
</style>

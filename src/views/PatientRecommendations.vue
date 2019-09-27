<template>
  <div>
    <b-loading :active="isLoading" />

    <b-message
      v-if="failedToLoad"
      type="is-danger"
    >
      Rekrutierungsvorschläge konnten nicht geladen werden:<br>
      <pre>{{ errorMessage }}</pre>
    </b-message>
    <b-message
      v-else-if="noLists"
      type="is-warning"
    >
      Keine Rekrutierungsvorschläge vorhanden.
    </b-message>
    <b-tabs
      v-else
      v-model="activeTab"
    >
      <b-tab-item
        v-for="(list, index) in screeningLists"
        :key="index"
      >
        <template slot="header">
          <span>
            {{ getStudyFromList(list).title }}
            <b-tag rounded> {{ list.entry.length }}</b-tag>
          </span>
        </template>
        <p class="box">
          {{ getStudyFromList(list).description }}
        </p>
        <h2 class="subtitle">
          Rekrutierungsvorschläge
        </h2>
        <ScreeningList :items="list.entry" />
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
import ScreeningList from "@/components/ScreeningList.vue";

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
    };
  },
  async mounted() {
    let fhirUrl = process.env.VUE_APP_FHIR_URL;
    if (process.env.NODE_ENV === "production") {
      // this is an awkward workaround for FHIR.client not accepting relative paths as valid URLs
      fhirUrl = `${window.location.protocol}//${window.location.host}/fhir`;
    }
    try {
      const client = FHIR.client(fhirUrl);
      const screeningLists = await client.request(
        "List?code=http://studien.miracum.org/fhir/CodeSystem/screening-list|screening-recommendations",
        {
          // resolveReferences: ["entry.0.item"],
          resolveReferences: ["extension.0.extension.0.valueReference"],
          flat: true,
        },
      );

      if (screeningLists.length !== 0) {
        // resolveReferences didn't work on item.reference in the screening list
        // it did work when explicitely specifying the index: "entry.0.item"
        // so we need to manually resove the patient references...
        const res = screeningLists.map(async (list) => {
          const newList = list;
          newList.entry = await Promise.all(
            list.entry.map(async (entry) => {
              const newEntry = entry;
              const patient = client.request(newEntry.item.reference);
              newEntry.item = await patient;
              return newEntry;
            }),
          );
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
    getStudyFromList: list => list.extension[0].extension[0].valueReference,
  },
};
</script>

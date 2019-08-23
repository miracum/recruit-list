<template>
  <div>
    <b-tabs v-model="activeTab">
      <b-tab-item
        v-for="(list, index) in screeningLists"
        :key="index"
      >
        <template slot="header">
          <span> {{ getAcronymFromStudy(getStudyFromList(list)) }} <b-tag
            rounded
          > {{ list.entry.length }}</b-tag> </span>
        </template>
        <p class="box">
          {{ getStudyFromList(list).title }}
        </p>
        <h2 class="subtitle">
          Rekrutierungsvorschläge
        </h2>
        <ScreeningList :items="list.entry" />
      </b-tab-item>
    </b-tabs>
  </div>
</template>

<script>
import FHIR from "fhirclient";
import fhirpath from "fhirpath";
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
    };
  },
  async mounted() {
    let fhirUrl = process.env.VUE_APP_FHIR_URL;
    if (process.env.NODE_ENV === "production") {
      // this is an awkward workaround for FHIR.client not accepting relative paths as valid URLs
      fhirUrl = `${window.location.protocol}//${window.location.host}/fhir`;
    }
    const client = FHIR.client(fhirUrl);
    const screeningLists = await client.request(
      "List?code=http://studien.miracum.org/fhir/CodeSystem/screening-list|screening-recommendations",
      {
        // resolveReferences: ["entry.0.item"],
        resolveReferences: ["extension.0.extension.0.valueReference"],
      },
    );

    // resolveReferences didn't work on item.reference in the screening list
    // it did work when explicitely specifying the index: "entry.0.item"
    // so we need to manually resove the patient references...
    const res = screeningLists.entry
      .map(entry => entry.resource)
      .map(async (list) => {
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
  },
  methods: {
    getStudyFromList: list => list.extension[0].extension[0].valueReference,
    getAcronymFromStudy: (study) => {
      const acronymSystem = "http://studien.miracum.org/fhir/study-acronym";
      return fhirpath.evaluate(
        study,
        `identifier.where(system='${acronymSystem}').first().value`,
      )[0];
    },
  },
};
</script>

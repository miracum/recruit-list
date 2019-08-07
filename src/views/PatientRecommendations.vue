<template>
  <div class="home">
    <b-tabs v-model="activeTab">
      <b-tab-item
        v-for="(list, index) in screeningLists"
        :key="index"
        :label="list.id"
      >
        <ScreeningList :items="list.entry" />
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
    };
  },
  async mounted() {
    const client = FHIR.client(process.env.VUE_APP_FHIR_URL);
    const screeningLists = await client.request(
      "List?code=http://studien.miracum.org/fhir/screening-list|screening-recommendations",
    );
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
};
</script>

<template>
  <div class="researchsubject-history">
    <div class="timeline">
      <div v-for="(entry, index) in history" :key="index">
        <div class="history-item">
          <span class="dot has-background-primary"></span>
          <p
            class="history-item-date"
          >{{ new Date(entry.meta.lastUpdated).toLocaleString("de-DE") }}</p>
          <p>
            Status:
            <strong>{{ translateSubjectStatus(entry.status) }}</strong>
          </p>
          <p>Notiz: {{ getHistoryNote(entry) }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import FHIR from "fhirclient";
import fhirpath from "fhirpath";
import Constants from "@/const";

export default {
  name: "ResearchSubjectHistory",
  components: {},
  data() {
    return {
      history: {},
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
      const subjectHistory = await this.fhirClient.request(
        `ResearchSubject/${this.$route.params.id}/_history`,
        {
          flat: true,
          pageLimit: 0,
          resolveReferences: ["entry.ResearchSubject.individual"],
        }
      );

      this.history = subjectHistory;

      if (subjectHistory.length !== 0) {
        //     // resolveReferences didn't work on item.reference in the screening list
        //     // it did work when explicitely specifying the index: "entry.0.item"
        //     // so we need to manually resove the patient references...
        //     const res = screeningLists.map(async (list) => {
        //       const newList = list;
        //       if (newList.entry) {
        //         newList.entry = await Promise.all(
        //           list.entry.map(async (entry) => {
        //             const newEntry = entry;
        //             const subject = this.fhirClient.request(
        //               newEntry.item.reference,
        //               {
        //                 // resolveReferences: ["entry.0.item"],
        //                 resolveReferences: ["study", "individual"],
        //                 flat: true,
        //               }
        //             );
        //             newEntry.item = await subject;
        //             return newEntry;
        //           })
        //         );
        //       }
        //       return newList;
        //     });
        //     this.screeningLists = await Promise.all(res);
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
    getHistoryNote(researchSubject) {
      return fhirpath.evaluate(
        researchSubject,
        "ResearchSubject.extension.where(url=%noteExtensionUrl).valueString",
        {
          noteExtensionUrl: Constants.URL_NOTE_EXTENSION,
        }
      )[0];
    },
    translateSubjectStatus(status) {
      return Constants.STATUS_TRANSLATION[status];
    },
  },
};
</script>

<style scoped>
.timeline {
  position: relative;
  border-left: 1px solid black;
}

.timeline .history-item {
  position: relative;
  left: 20px;
  box-shadow: 0px 5px 10px 0px rgba(0, 0, 0, 0.2);
  border-radius: 5px;
  padding: 10px;
  margin: 10px 0;
  background-color: #ffffff;
}

.timeline .history-item .dot {
  display: block;
  position: absolute;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  left: -25.5px;
  top: calc(50% - 5px);
}
</style>

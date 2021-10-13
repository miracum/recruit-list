<template>
  <div class="last-stay">
    <template v-if="isLoading">
      <span>Lädt weitere Informationen...</span>
    </template>
    <template v-else>
      <b-field grouped group-multiline>
        <div class="control">
          <b-tooltip position="is-right" multilined>
            <b-taglist attached>
              <b-tag type="is-dark"
                ><b-icon icon="lightbulb" size="is-small" type="is-white">
                </b-icon
              ></b-tag>
              <b-tag type="is-info" class="all-recommendations-count">{{
                allRecommendedStudies.length
              }}</b-tag>
            </b-taglist>
            <template v-slot:content>
              Der Patient ist Rekrutierungsvorschlag für folgende Studien:
              <ol type="1">
                <li
                  v-for="(study, index) in allRecommendedStudies"
                  :key="index"
                >
                  {{ getAcronymFromStudy(study) || study.title }}
                </li>
              </ol>
            </template>
          </b-tooltip>
        </div>
        <div class="control" v-if="participatingStudies.length > 0">
          <b-tooltip position="is-right" multilined>
            <b-taglist attached>
              <b-tag type="is-dark"
                ><b-icon icon="graduation-cap" size="is-small" type="is-white">
                </b-icon
              ></b-tag>
              <b-tag
                type="is-danger is-light"
                class="participating-studies-count"
                >{{ participatingStudies.length }}</b-tag
              >
            </b-taglist>
            <template v-slot:content>
              Der Patient ist bereits in folgende Studien eingeschlossen:
              <ol type="1">
                <li v-for="(study, index) in participatingStudies" :key="index">
                  {{ getAcronymFromStudy(study) || study.title }}
                </li>
              </ol>
            </template>
          </b-tooltip>
        </div>
      </b-field>
    </template>
    <b-message v-if="errorMessage" type="is-danger">
      Fehler beim Laden weiterer Informationen:
      <br />
      <pre>{{ errorMessage }}</pre>
    </b-message>
  </div>
</template>

<script>
import fhirpath from "fhirpath";
import Constants from "@/const";
import Api from "@/api";

export default {
  name: "RecommendationStats",
  components: {},
  props: {
    // ResearchSubject.individual should be resolved and replaced with the actual Patient object
    patientId: { default: () => null, type: String },
  },
  data() {
    return {
      isLoading: false,
      errorMessage: "",
      allRecommendedStudies: [],
      participatingStudies: [],
    };
  },
  async mounted() {
    try {
      this.isLoading = true;
      const allRecommendations = await Api.fetchAllRecommendationsByPatientId(
        this.patientId
      );

      // include only studies where the patient is not ineligible or withdrawn from
      // the filter ensures that if a patient's recruitment status is
      // set to `ineligible`, the referenced study is not included in the list of the patient's
      // total recommendations
      this.allRecommendedStudies = allRecommendations
        .filter(
          (resource) =>
            resource.resourceType === "ResearchSubject" &&
            resource.status !== "ineligible" &&
            resource.status !== "withdrawn"
        )
        .map((researchSubject) => researchSubject.study);

      this.participatingStudies = allRecommendations
        .filter(
          (resource) =>
            resource.resourceType === "ResearchSubject" &&
            resource.status === "on-study"
        )
        .map((researchSubject) => researchSubject.study);
    } catch (exc) {
      this.$log.error(exc);
      this.errorMessage = exc.message;
    } finally {
      this.isLoading = false;
    }
  },
  methods: {
    getAcronymFromStudy(study) {
      return fhirpath.evaluate(
        study,
        "ResearchStudy.extension(%acronymSystem).valueString",
        {
          acronymSystem: Constants.SYSTEM_STUDY_ACRONYM,
        }
      )[0];
    },
  },
};
</script>

<template>
  <div class="patient-record">
    <b-loading :active="isLoading" />
    <template v-if="!isLoading">
      <b-message v-if="failedToLoad" type="is-danger">
        Patientenakte konnte nicht geladen werden:
        <br />
        <pre>{{ errorMessage }}</pre>
      </b-message>
      <template v-else>
        <header class="has-text-centered">
          <h1 class="title is-3">Patient {{ record.patient.id }}</h1>
          <h2
            class="subtitle is-5"
          >geboren {{ new Date(record.patient.birthDate).getFullYear() }}, {{ record.patient.gender === "male" ? "männlich" : "weiblich"}}</h2>
        </header>
        <b-tabs position="is-centered">
          <b-tab-item>
            <template slot="header">
              <b-icon icon="stethoscope"></b-icon>
              <span>
                Diagnosen
                <b-tag rounded>{{ record.conditions.length }}</b-tag>
              </span>
            </template>
            <condition-list :items="record.conditions" />
          </b-tab-item>
          <b-tab-item>
            <template slot="header">
              <b-icon icon="procedures"></b-icon>
              <span>
                Prozeduren
                <b-tag rounded>{{ record.procedures.length }}</b-tag>
              </span>
            </template>
            <procedure-list :items="record.procedures" />
          </b-tab-item>
          <b-tab-item>
            <template slot="header">
              <b-icon icon="pills"></b-icon>
              <span>
                Medikation
                <b-tag
                  rounded
                >{{ record.medicationStatement.length + record.medicationRequest.length }}</b-tag>
              </span>
            </template>
            <medication-list
              :medicationStatement="record.medicationStatement"
              :medicationRequest="record.medicationRequest"
            />
          </b-tab-item>
          <b-tab-item>
            <template slot="header">
              <b-icon icon="vial"></b-icon>
              <span>
                Labor & Vitalparameter
                <b-tag rounded>{{ record.observations.length }}</b-tag>
              </span>
            </template>
            <observation-list :items="record.observations" />
          </b-tab-item>
        </b-tabs>
      </template>
    </template>
  </div>
</template>

<script>
import fhirpath from "fhirpath";
import ConditionList from "@/components/record/ConditionList.vue";
import MedicationList from "@/components/record/MedicationList.vue";
import ProcedureList from "@/components/record/ProcedureList.vue";
import ObservationList from "@/components/record/ObservationList.vue";
import Api from "@/api";

export default {
  name: "PatientRecord",
  components: { ConditionList, MedicationList, ProcedureList, ObservationList },
  props: {
    patientId: String,
  },
  data() {
    return {
      noData: false,
      errorMessage: "",
      isLoading: true,
      failedToLoad: false,
      record: {
        patient: {},
        conditions: Array,
        medicationRequest: Array,
        medicationStatement: Array,
        procedures: Array,
        observations: Array,
      },
    };
  },
  async mounted() {
    try {
      const record = await Api.fetchPatientRecord(this.patientId);
      if (record.length !== 0) {
        [this.record.patient] = fhirpath.evaluate(
          record,
          "where(resourceType='Patient')"
        );

        this.record.conditions = fhirpath.evaluate(
          record,
          "where(resourceType='Condition')"
        );

        this.record.medicationRequest = fhirpath.evaluate(
          record,
          "where(resourceType='MedicationRequest')"
        );

        this.record.medicationStatement = fhirpath.evaluate(
          record,
          "where(resourceType='MedicationStatement')"
        );

        this.record.procedures = fhirpath.evaluate(
          record,
          "where(resourceType='Procedure')"
        );

        this.record.observations = fhirpath.evaluate(
          record,
          "where(resourceType='Observation')"
        );
      } else {
        this.noData = true;
      }
    } catch (exc) {
      this.errorMessage = exc;
      this.failedToLoad = true;
    } finally {
      this.isLoading = false;
    }
  },
  methods: {},
};
</script>

<style scoped>
header {
  margin-bottom: 1.25rem;
}
</style>

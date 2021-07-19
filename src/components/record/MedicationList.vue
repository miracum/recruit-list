<template>
  <div class="medication-list">
    <div class="medication-statement">
      <h2 class="title is-5">Anamnese</h2>
      <b-table
        :paginated="true"
        :per-page="10"
        :pagination-simple="true"
        :data="medicationStatements"
        :striped="true"
        sort-icon="menu-up"
      >
        <b-table-column v-slot="props" label="Medikation">{{
          props.row.medication.code.text
        }}</b-table-column>
        <b-table-column v-slot="props" label="Kodierung">{{
          props.row.medication.code.coding[0].code
        }}</b-table-column>
        <b-table-column
          v-slot="props"
          field="onsetDateTime"
          label="Krankheitsbeginn"
          sortable
          centered
        >
          <span class="tag is-success">{{
            new Date(props.row.onsetDateTime).toLocaleDateString()
          }}</span>
        </b-table-column>
        <b-table-column
          v-slot="props"
          field="recordedDate"
          label="Dokumentationszeitpunkt"
          sortable
          centered
        >
          <span class="tag is-success">{{
            new Date(props.row.recordedDate).toLocaleDateString()
          }}</span>
        </b-table-column>
        <template slot="empty">
          <section class="section">
            <div class="content has-text-grey has-text-centered">
              <p>
                <b-icon icon="frown" size="is-large" />
              </p>
              <p>Keine Daten vorhanden.</p>
            </div>
          </section>
        </template>
      </b-table>
    </div>
    <div class="medication-request">
      <h2 class="title is-5">Verabreichte Medikation</h2>
      <b-table
        :paginated="true"
        :per-page="10"
        :data="medicationAdministrations"
        :striped="true"
        :pagination-simple="true"
        sort-icon="menu-up"
      >
        <b-table-column
          v-slot="props"
          field="medicationCodeableConcept.text"
          label="Medikament"
          sortable
          >{{ props.row.medicationCodeableConcept.text }}</b-table-column
        >
        <b-table-column v-slot="props" field="status" label="Status" sortable>{{
          props.row.status
        }}</b-table-column>
        <b-table-column v-slot="props" label="Zweck">{{
          props.row.intent
        }}</b-table-column>
        <b-table-column
          v-slot="props"
          field="authoredOn"
          label="Auftragszeitpunkt"
          sortable
          centered
        >
          <b-tag type="is-primary">{{
            new Date(props.row.authoredOn).toLocaleDateString()
          }}</b-tag>
        </b-table-column>
        <template slot="empty">
          <section class="section">
            <div class="content has-text-grey has-text-centered">
              <p>
                <b-icon icon="frown" size="is-large" />
              </p>
              <p>Keine Daten vorhanden.</p>
            </div>
          </section>
        </template>
      </b-table>
    </div>
  </div>
</template>

<script>
export default {
  name: "MedicationList",
  components: {},
  props: {
    medicationStatements: Array,
    medicationAdministrations: Array,
  },
  data() {
    return {};
  },
};
</script>

<style scoped>
header {
  margin-bottom: 1.25rem;
}
</style>

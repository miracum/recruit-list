<template>
  <div class="medication-list">
    <div class="medication-statement">
      <h2 class="title is-5">Anamnese</h2>
      <b-table
        :paginated="true"
        :per-page="10"
        :pagination-simple="true"
        :data="medicationStatement"
        :striped="true"
        sort-icon="menu-up"
      >
        <template slot-scope="props">
          <b-table-column label="Diagnose">{{ props.row.code.text }}</b-table-column>
          <b-table-column label="Kodierung">{{ props.row.code.coding[0].code }}</b-table-column>
          <b-table-column field="onsetDateTime" label="Krankheitsbeginn" sortable centered>
            <span
              class="tag is-success"
            >{{ new Date(props.row.onsetDateTime).toLocaleDateString() }}</span>
          </b-table-column>
          <b-table-column field="recordedDate" label="Dokumentationszeitpunkt" sortable centered>
            <span class="tag is-success">{{ new Date(props.row.recordedDate).toLocaleDateString() }}</span>
          </b-table-column>
        </template>
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
      <h2 class="title is-5">Anforderungen</h2>
      <b-table
        :paginated="true"
        :per-page="10"
        :data="medicationRequest"
        :striped="true"
        :pagination-simple="true"
        sort-icon="menu-up"
      >
        <template slot-scope="props">
          <b-table-column
            field="medicationCodeableConcept.text"
            label="Medikament"
            sortable
          >{{ props.row.medicationCodeableConcept.text }}</b-table-column>
          <b-table-column field="status" label="Status" sortable>{{ props.row.status }}</b-table-column>
          <b-table-column label="Zweck">{{ props.row.intent }}</b-table-column>
          <b-table-column field="authoredOn" label="Auftragszeitpunkt" sortable centered>
          <b-tag type="is-primary">{{ new Date(props.row.authoredOn).toLocaleDateString() }}</b-tag>
          </b-table-column>
        </template>
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
    medicationStatement: Array,
    medicationRequest: Array,
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

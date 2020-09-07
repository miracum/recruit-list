<template>
  <div class="condition-list">
    <b-table :data="items" :striped="true" sort-icon="menu-up">
      <b-table-column v-slot="props" label="Diagnose">{{ props.row.code.text }}</b-table-column>
      <b-table-column
        v-slot="props"
        field="onsetDateTime"
        label="Krankheitsbeginn"
        sortable
        centered
      >
        <b-tag type="is-primary">{{ new Date(props.row.onsetDateTime).toLocaleDateString() }}</b-tag>
      </b-table-column>
      <b-table-column
        v-slot="props"
        field="recordedDate"
        label="Dokumentationszeitpunkt"
        sortable
        centered
      >
        <b-tag type="is-primary">{{ new Date(props.row.recordedDate).toLocaleDateString() }}</b-tag>
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
</template>

<script>
export default {
  name: "ConditionList",
  components: {},
  props: {
    items: Array,
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

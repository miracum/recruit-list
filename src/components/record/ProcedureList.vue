<template>
  <div class="procedure-list">
    <b-table :data="items" :striped="true" sort-icon="menu-up">
      <template slot-scope="props">
        <b-table-column label="Prozedur">{{ props.row.code.text }}</b-table-column>
        <b-table-column label="Status">{{ props.row.status }}</b-table-column>
        <b-table-column field="performed" label="Durchgeführt" sortable centered>
          <b-tag type="is-primary">{{ getPerformed(props.row) }}</b-tag>
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
</template>

<script>
export default {
  name: "ProcedureList",
  components: {},
  props: {
    items: Array,
  },
  data() {
    return {};
  },
  methods: {
    getPerformed(procedure) {
      if (procedure.performedPeriod) {
        const { start, end } = procedure.performedPeriod;
        return `${new Date(start).toLocaleDateString()} -
                ${new Date(end).toLocaleDateString()}`;
      }
      return "";
    },
  },
};
</script>

<style scoped>
header {
  margin-bottom: 1.25rem;
}
</style>

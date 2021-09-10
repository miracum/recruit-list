<template>
  <div class="procedure-list">
    <b-table :data="normalizedProcedures" :striped="true" sort-icon="menu-up">
      <b-table-column v-slot="props" label="Prozedur">
        <span class="procedure-display">
          <template v-if="props.row.code.text">
            {{ props.row.code.text }}
          </template>
          <template v-else>unbekannt</template></span
        ></b-table-column
      >
      <b-table-column
        v-slot="props"
        field="performed"
        label="Durchgeführt"
        sortable
        centered
      >
        <b-tag type="is-primary" class="procedure-performed"
          ><template v-if="props.row.performedDateTime">
            {{ new Date(props.row.performedDateTime).toLocaleDateString() }}
          </template>
          <template v-else>unbekannt</template></b-tag
        >
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
import fhirpath from "fhirpath";

export default {
  name: "ProcedureList",
  components: {},
  props: {
    items: Array,
  },
  data() {
    return {};
  },
  computed: {
    normalizedProcedures() {
      return this.items.map((procedure) => {
        const normalizedProceduren = procedure;

        const performedDateTime = fhirpath.evaluate(
          procedure,
          "performedDateTime | performedPeriod.start"
        )[0];

        normalizedProceduren.performedDateTime = performedDateTime;

        if (!normalizedProceduren.code) {
          normalizedProceduren.code = {};
        }

        const display = fhirpath.evaluate(
          {},
          "code.text | code.coding.display | code.coding.code"
        )[0];

        if (display) {
          normalizedProceduren.code.text = display;
        }

        return normalizedProceduren;
      });
    },
  },
};
</script>

<style scoped>
header {
  margin-bottom: 1.25rem;
}
</style>

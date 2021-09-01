<template>
  <div class="condition-list">
    <b-table :data="normalizedConditions" :striped="true" sort-icon="menu-up">
      <b-table-column v-slot="props" label="Diagnose">
        <span class="condition-display">
          <template v-if="props.row.code.text">
            {{ props.row.code.text }}
          </template>
          <template v-else>unbekannt</template></span
        >
      </b-table-column>
      <b-table-column
        v-slot="props"
        field="onsetDateTime"
        label="Krankheitsbeginn"
        sortable
        centered
      >
        <b-tag type="is-primary" class="condition-onset">
          <template v-if="props.row.onsetDateTime">
            {{
              new Date(props.row.onsetDateTime).toLocaleDateString()
            }}</template
          ><template v-else>unbekannt</template></b-tag
        >
      </b-table-column>
      <b-table-column
        v-slot="props"
        field="recordedDate"
        label="Dokumentationszeitpunkt"
        sortable
        centered
      >
        <b-tag type="is-primary" class="condition-recorded-date">
          <template v-if="props.row.recordedDate">
            {{
              new Date(props.row.recordedDate).toLocaleDateString()
            }}</template
          ><template v-else>unbekannt</template>
        </b-tag>
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
  computed: {
    normalizedConditions() {
      return this.items.map((condition) => {
        const normalizedCondition = condition;
        normalizedCondition.onsetDateTime =
          condition.onsetDateTime || condition.onsetPeriod?.start;

        if (!normalizedCondition.code) {
          normalizedCondition.code = {};
        }

        const display =
          condition.code?.text ||
          condition.code?.coding?.at(0).display ||
          condition.code?.coding?.at(0).code;
        if (display) {
          normalizedCondition.code.text = display;
        }

        return normalizedCondition;
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

<template>
  <div class="condition-list">
    <b-table :data="normalizedObservations" :striped="true" sort-icon="menu-up">
      <b-table-column v-slot="props" label="Parameter">
        <span class="observation-display">
          <template v-if="props.row.code.text">
            {{ props.row.code.text }}
          </template>
          <template v-else>unbekannt</template></span
        ></b-table-column
      >
      <b-table-column v-slot="props" label="Wert">{{
        getObservationValue(props.row)
      }}</b-table-column>
      <b-table-column v-slot="props" label="Zeitpunkt" centered>
        <b-tag type="is-primary"
          ><template v-if="props.row.effectiveDateTime">
            {{ new Date(props.row.effectiveDateTime).toLocaleDateString() }}
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
export default {
  name: "ObservationList",
  components: {},
  props: {
    items: Array,
  },
  data() {
    return {};
  },
  computed: {
    normalizedObservations() {
      return this.items.map((observation) => {
        const normalizedObservation = observation;

        normalizedObservation.effectiveDateTime =
          observation.effectiveDateTime ||
          observation.effectivePeriod?.start ||
          observation.effectiveInstant;

        if (!observation.code) {
          normalizedObservation.code = {};
        }

        const display =
          normalizedObservation.code?.text ||
          normalizedObservation.code?.coding?.at(0).display ||
          normalizedObservation.code?.coding?.at(0).code;
        if (display) {
          normalizedObservation.code.text = display;
        }

        return normalizedObservation;
      });
    },
  },
  methods: {
    getObservationValue(o) {
      if (Array.isArray(o.component)) {
        return o.component.map((c) => {
          const result = this.getObservationValue(c, true);
          return `${result}; `;
        });
      }

      if (Object.prototype.hasOwnProperty.call(o, "valueBoolean")) {
        return !o.valueBoolean || o.valueBoolean === "false"
          ? "Negative"
          : "Positive";
      }

      if (Object.prototype.hasOwnProperty.call(o, "valueString")) {
        return o.valueString;
      }

      if (Object.prototype.hasOwnProperty.call(o, "valueInteger")) {
        return o.valueInteger;
      }

      if (Object.prototype.hasOwnProperty.call(o, "valueRange")) {
        return o.valueRange;
      }

      if (Object.prototype.hasOwnProperty.call(o, "valueTime")) {
        return o.valueTime;
      }

      if (Object.prototype.hasOwnProperty.call(o, "valueDateTime")) {
        return o.valueDateTime;
      }

      if (Object.prototype.hasOwnProperty.call(o, "valuePeriod")) {
        return o.valuePeriod;
      }

      if (Object.prototype.hasOwnProperty.call(o, "valueCodeableConcept")) {
        return o.valueCodeableConcept.coding[0].display;
      }

      if (Object.prototype.hasOwnProperty.call(o, "valueQuantity")) {
        let { value } = o.valueQuantity;
        const { unit } = o.valueQuantity;

        if (!Number.isNaN(parseFloat(value))) {
          value = Math.round(value * 100) / 100;
        }

        return `${value} ${unit}`;
      }

      if (Object.prototype.hasOwnProperty.call(o, "valueRatio")) {
        return `${o.valueRatio.numerator} / ${o.valueRatio.denominator}`;
      }

      return null;
    },
  },
};
</script>

<style scoped>
header {
  margin-bottom: 1.25rem;
}
</style>

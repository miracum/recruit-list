<template>
  <div class="condition-list">
    <b-table :data="items" :striped="true" sort-icon="menu-up">
      <b-table-column v-slot="props" label="Parameter">{{
        props.row.code.text ||
        props.row.code.coding[0].text ||
        props.row.code.coding[0].code
      }}</b-table-column>
      <b-table-column v-slot="props" label="Wert">{{ getObservationValue(props.row) }}</b-table-column>
      <b-table-column v-slot="props" label="Gültigkeit" centered>
        <b-tag type="is-primary">{{ getEffective(props.row) }}</b-tag>
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
  methods: {
    getObservationLabel(o) {
      return o.code.text;
    },
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
        const units = o.valueQuantity.unit;

        if (!Number.isNaN(parseFloat(value))) {
          value = Math.round(value * 100) / 100;
        }

        return `${value} ${units}`;
      }

      if (Object.prototype.hasOwnProperty.call(o, "valueRatio")) {
        return `${o.valueRatio.numerator} / ${o.valueRatio.denominator}`;
      }

      return null;
    },
    getEffective(o) {
      if (Object.prototype.hasOwnProperty.call(o, "effectiveDateTime")) {
        return new Date(o.effectiveDateTime).toLocaleDateString();
      }
      if (Object.prototype.hasOwnProperty.call(o, "effectivePeriod")) {
        return o.effectivePeriod;
      }
      if (Object.prototype.hasOwnProperty.call(o, "effectiveTiming")) {
        return o.effectiveTiming;
      }
      if (Object.prototype.hasOwnProperty.call(o, "effectiveInstant")) {
        return o.effectiveInstant;
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

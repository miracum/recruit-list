<template>
  <section>
    <b-table :data="patientData" :loading="isLoading" :mobile-cards="true" sort-icon="menu-up">
      <template slot-scope="props">
        <b-table-column
          field="patientId"
          label="ID"
          width="40"
          sortable
          numeric
        >{{ props.row.patientId }}</b-table-column>

        <b-table-column
          field="name.given"
          label="Vorname"
          sortable
        >{{ props.row.name ? props.row.name.given.join(" ") : "?" }}</b-table-column>

        <b-table-column
          field="name.family"
          label="Nachname"
          sortable
        >{{ props.row.name ? props.row.name.family : "?" }}</b-table-column>

        <b-table-column label="Alter" field="subject.individual.birthDate" sortable>
          <span>{{ props.row.subject.individual.birthDate ? age(props.row.subject.individual.birthDate) : "?" }}</span>
        </b-table-column>

        <b-table-column label="Geschlecht">
          <span>
            {{
            props.row.subject.individual
            ? props.row.subject.individual.gender === "male"
            ? "männlich"
            : "weiblich"
            : "?"
            }}
          </span>
        </b-table-column>

        <b-table-column label="Status">
          <b-field :type="typeFromStatus(props.row.subject.status)">
            <b-select
              @input="onStatusSelectionChanged($event, props.row)"
              placeholder="Status ändern"
              v-model="props.row.subject.status"
              type="is-danger"
              class="recruitment-status-select"
            >
              <option
                v-for="option in recruitmentStatusOptions"
                :value="option.name"
                :key="option.name"
              >{{ option.display }}</option>
            </b-select>
          </b-field>
        </b-table-column>
      </template>

      <template slot="empty">
        <section class="section">
          <div class="content has-text-grey has-text-centered">
            <p>
              <b-icon icon="frown" size="is-large" />
            </p>
            <p>Keine Vorschläge vorhanden.</p>
          </div>
        </section>
      </template>
    </b-table>
  </section>
</template>

<script>
import fhirpath from "fhirpath";
import Constants from "@/const";

export default {
  name: "ScreeningList",
  props: {
    items: {
      default: () => [],
      type: Array,
    },
    fhirClient: {},
  },
  data() {
    return {
      isLoading: false,
      recruitmentStatusOptions: [
        {
          name: "candidate",
          display: "Rekrutierungsvorschlag",
        },
        {
          name: "eligible",
          display: "Erfüllt EA-Kriterien",
        },
        {
          name: "ineligible",
          display: "E/A-Kriterien wurden nicht erfüllt",
        },
        {
          name: "on-study",
          display: "Wurde eingeschlossen",
        },
        {
          name: "screening",
          display: "Wird geprüft",
        },
        {
          name: "withdrawn",
          display: "Nicht in der Lage oder nicht gewillt teilzunehmen",
        },
      ],
    };
  },
  computed: {
    patientData() {
      return this.items
        .map((entry) => entry.item)
        .map((subject) => {
          return {
            id: subject.id,
            patientId: fhirpath.evaluate(
              subject,
              "ResearchSubject.individual.identifier.where(system=%subjectIdSystem).value",
              {
                subjectIdSystem: Constants.SYSTEM_SUBJECT_IDENTIFIER,
              }
            )[0],
            name: fhirpath.evaluate(
              subject,
              "ResearchSubject.individual.name.first()"
            )[0],
            subject,
          };
        });
    },
  },
  methods: {
    age(birthDate) {
      const cur = new Date();
      const diff = cur - new Date(birthDate);
      return Math.floor(diff / 31557600000); // Divide by 1000*60*60*24*365.25
    },
    typeFromStatus(status) {
      const lookup = {
        candidate: "is-info",
        eligible: "is-success",
        ineligible: "is-danger",
        default: "",
      };

      return lookup[status] || lookup.default;
    },
    async onStatusSelectionChanged(event, row) {
      const updateResource = {
        id: row.subject.id,
        resourceType: "ResearchSubject",
        status: row.subject.status,
        study: {
          reference: `ResearchStudy/${row.subject.study.id}`,
        },
        individual: {
          reference: `Patient/${row.subject.individual.id}`,
        },
      };

      try {
        await this.fhirClient.update(updateResource);
        this.$buefy.toast.open({
          message: "Rekrutierungsstatus aktualisiert!",
          type: "is-success",
        });
      } catch (exc) {
        this.$buefy.toast.open({
          message: `Fehler beim setzen des Rekrutierungsstatus: ${exc.message}.`,
          type: "is-danger",
          duration: 15000,
        });
      }
    },
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
h3 {
  margin: 40px 0 0;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: #42b983;
}
</style>

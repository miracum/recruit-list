<template>
  <section>
    <div class="field">
      <b-checkbox v-model="hideSubjectsOnStudy">Bereits rekrutierte Patienten ausblenden</b-checkbox>
    </div>
    <b-table
      :data="filteredSubjects"
      :loading="isLoading"
      :mobile-cards="true"
      sort-icon="menu-up"
      :striped="true"
      :hoverable="true"
    >
      <template slot-scope="props">
        <b-table-column label="#" field="subject.individual.id" sortable>
          <span>{{ props.row.subject.individual.id }}</span>
        </b-table-column>

        <b-table-column label="Geburtsjahr" field="subject.individual.birthDate" sortable>
          <span>{{ props.row.subject.individual.birthDate ? new Date(props.row.subject.individual.birthDate).getFullYear() : "unbekannt" }}</span>
        </b-table-column>

        <b-table-column label="Geschlecht" field="subject.individual.gender" sortable>
          <span>
            {{
            props.row.subject.individual
            ? (props.row.subject.individual.gender === "male"
            ? "männlich"
            : "weiblich")
            : "unbekannt"
            }}
          </span>
        </b-table-column>

        <b-table-column label="Status" field="subject.status" sortable>
          <b-dropdown aria-role="list" v-model="props.row.subject.status">
            <b-button
              :class="[ 'button', 'recruitment-status-select', getTypeFromStatus(props.row.subject.status) ]"
              type="button"
              size="is-small"
              slot="trigger"
              icon-right="sort-down"
            >{{ recruitmentStatusOptions[props.row.subject.status] }}</b-button>

            <b-dropdown-item
              aria-role="listitem"
              v-for="option in Object.keys(recruitmentStatusOptions)"
              :value="option"
              :key="option"
            >
              <span class="status-option-container">
                <b-icon
                  style
                  pack="fas"
                  size="is-small"
                  icon="circle"
                  :type="getTypeFromStatus(option)"
                ></b-icon>
                <span>{{ recruitmentStatusOptions[option] }}</span>
              </span>
            </b-dropdown-item>
          </b-dropdown>
        </b-table-column>

        <b-table-column label="Notiz" field="note">
          <b-field>
            <b-input type="textarea" v-model="props.row.note"></b-input>
          </b-field>
        </b-table-column>

        <b-table-column label="Aktionen">
          <div class="buttons">
            <b-button
              @click="onSaveRowChanges($event, props.row)"
              class="save-status"
              type="is-primary"
              size="is-small"
              icon-left="save"
            >Speichern</b-button>
            <b-button
              tag="router-link"
              :to="{ name: 'researchsubject-history', params: { subjectId: props.row.id } }"
              type="is-primary"
              size="is-small"
              icon-left="history"
              outlined
              target="_blank"
              rel="noopener noreferrer"
            >Änderungshistorie öffnen</b-button>
            <b-button
              tag="router-link"
              :to="{ name: 'patient-record', params: { patientId: props.row.subject.individual.id } }"
              type="is-primary"
              size="is-small"
              icon-left="notes-medical"
              outlined
              target="_blank"
              rel="noopener noreferrer"
            >Patientenakte öffnen</b-button>
          </div>
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
import Api from "@/api";

export default {
  name: "ScreeningList",
  props: {
    items: {
      default: () => [],
      type: Array,
    },
  },
  data() {
    return {
      isLoading: false,
      hideSubjectsOnStudy: false,
      recruitmentStatusOptions: {
        candidate: "Rekrutierungsvorschlag",
        screening: "Wird geprüft",
        ineligible: "Erfüllt E/A-Kriterien nicht",
        "on-study": "Wurde eingeschlossen",
        withdrawn: "Nicht gewillt teilzunehmen",
      },
      fhirClient: {},
    };
  },
  mounted() {
    this.fhirClient = Api.getFhirClient();
  },
  computed: {
    patientData() {
      return this.items
        .map((entry) => entry.item)
        .map((subject) => {
          return {
            id: subject.id,
            name: fhirpath.evaluate(
              subject,
              "ResearchSubject.individual.name.first()"
            )[0],
            subject,
            note: fhirpath.evaluate(
              subject,
              "ResearchSubject.extension.where(url=%noteExtensionUrl).valueString",
              {
                noteExtensionUrl: Constants.URL_NOTE_EXTENSION,
              }
            )[0],
          };
        });
    },
    filteredSubjects() {
      return this.hideSubjectsOnStudy
        ? this.patientData.filter(
            (entry) => entry.subject.status !== "on-study"
          )
        : this.patientData;
    },
  },
  methods: {
    getTypeFromStatus(status) {
      const lookup = {
        candidate: "is-info",
        eligible: "is-success",
        ineligible: "is-danger",
        withdrawn: "is-dark",
        "on-study": "is-success",
        screening: "is-warning",
        default: "",
      };

      return lookup[status] || lookup.default;
    },
    async onSaveRowChanges(event, row) {
      const patch = [
        {
          op: "replace",
          path: "/status",
          value: row.subject.status,
        },
      ];

      if (row.note) {
        patch.push({
          op: "add",
          path: "/extension",
          value: [
            {
              url: Constants.URL_NOTE_EXTENSION,
              valueString: row.note,
            },
          ],
        });
      }

      try {
        await this.fhirClient.request({
          url: `ResearchSubject/${row.subject.id}`,
          method: "PATCH",
          body: JSON.stringify(patch),
          headers: { "Content-Type": "application/json-patch+json" },
        });
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

<style scoped>
.status-option-container > .icon {
  vertical-align: middle;
  margin-right: 1rem;
}

.status-option-container > span {
  vertical-align: middle;
}
</style>

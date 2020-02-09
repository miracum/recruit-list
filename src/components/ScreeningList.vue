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
        <b-table-column label="Geburtsdatum" field="subject.individual.birthDate" sortable>
          <span>{{ props.row.subject.individual.birthDate ? new Date(props.row.subject.individual.birthDate).toLocaleString("de-DE").split(",")[0] : "unbekannt" }}</span>
        </b-table-column>

        <b-table-column label="Geschlecht" field="subject.individual.gender" sortable>
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

        <b-table-column>
          <div class="buttons">
            <b-button
              @click="onSaveRowChanges($event, props.row)"
              type="is-primary"
              size="is-small"
              icon-left="save"
            >Speichern</b-button>
            <b-button
              tag="router-link"
              :to="{ name: 'researchsubject-history', params: { id: props.row.id } }"
              type="is-primary"
              size="is-small"
              icon-left="history"
              outlined
              target="_blank"
              rel="noopener noreferrer"
            >Änderungshistorie ansehen</b-button>
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
      hideSubjectsOnStudy: false,
      recruitmentStatusOptions: {
        candidate: "Rekrutierungsvorschlag",
        screening: "Wird geprüft",
        ineligible: "Erfüllt E/A-Kriterien nicht",
        "on-study": "Wurde eingeschlossen",
        withdrawn: "Nicht gewillt teilzunehmen",
      },
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
        extension: [
          {
            url: Constants.URL_NOTE_EXTENSION,
            valueString: row.note,
          },
        ],
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

<style scoped>
.status-option-container > .icon {
  vertical-align: middle;
  margin-right: 1rem;
}

.status-option-container > span {
  vertical-align: middle;
}
</style>

<template>
  <section>
    <b-dropdown v-model="selectedFilterOptions" multiple aria-role="list">
      <template #trigger>
        <b-button type="is-primary" icon-right="sort-down">
          Vorschläge nach Status ausblenden: {{ selectedFilterOptions.length }}
        </b-button>
      </template>

      <b-dropdown-item
        v-for="(deFilterStatus, enFilterStatus) in recruitmentStatusOptions"
        :key="deFilterStatus"
        aria-role="listitem"
        :value="enFilterStatus"
      >
        <span class="status-option-container">
          <b-icon
            pack="fas"
            size="is-small"
            icon="circle"
            :type="getTypeFromStatus(enFilterStatus)"
          ></b-icon>

          <span>{{ deFilterStatus }}</span>
        </span>
      </b-dropdown-item>
    </b-dropdown>

    <b-table
      :data="filteredSubjects"
      :loading="isLoading"
      :mobile-cards="true"
      sort-icon="menu-up"
      :striped="true"
      :hoverable="true"
    >
      <b-table-column v-slot="props" label="Marker">
        <recommendation-stats
          :patient-id="props.row.subject.individual.id"
        ></recommendation-stats>
      </b-table-column>

      <b-table-column
        v-slot="props"
        label="Patientennummer"
        field="mrNumber"
        sortable
      >
        <p class="patient-id">
          {{ props.row.mrNumber }}
        </p>
      </b-table-column>

      <b-table-column
        v-slot="props"
        label="Demografie"
        field="subject.individual.birthDate"
        sortable
        :visible="!hideDemographics"
      >
        <span>
          geb.
          {{
            props.row.subject.individual.birthDate
              ? new Date(props.row.subject.individual.birthDate).getFullYear()
              : "unbekannt"
          }},
          {{
            props.row.subject.individual
              ? props.row.subject.individual.gender === "male"
                ? "m"
                : props.row.subject.individual.gender === "female"
                ? "w"
                : "u"
              : "u"
          }}
        </span>
      </b-table-column>

      <b-table-column
        v-slot="props"
        label="Letzter Aufenthalt"
        :visible="!hideLastVisit"
      >
        <last-stay :subject="props.row.subject"></last-stay>
      </b-table-column>

      <b-table-column v-slot="props" label="Notiz" field="note">
        <b-field>
          <b-input v-model="props.row.note" type="textarea"></b-input>
        </b-field>
      </b-table-column>

      <b-table-column
        v-slot="props"
        label="Status"
        field="subject.status"
        sortable
      >
        <b-dropdown v-model="props.row.subject.status" aria-role="list">
          <b-button
            slot="trigger"
            :class="[
              'button',
              'recruitment-status-select',
              getTypeFromStatus(props.row.subject.status),
            ]"
            type="button"
            size="is-small"
            icon-right="sort-down"
            >{{ recruitmentStatusOptions[props.row.subject.status] }}</b-button
          >
          <b-dropdown-item
            v-for="option in Object.keys(recruitmentStatusOptions)"
            :key="option"
            aria-role="listitem"
            :value="option"
          >
            <span class="status-option-container">
              <b-icon
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

      <b-table-column v-slot="props" label="Aktionen">
        <div class="columns is-desktop">
          <div class="column">
            <b-tooltip label="Änderungen Speichern" position="is-bottom">
              <b-button
                class="save-status"
                type="is-primary"
                size="is-small"
                icon-left="save"
                @click="onSaveRowChanges($event, props.row)"
                >Speichern</b-button
              >
            </b-tooltip>
          </div>
          <div v-if="!hideEhrButton" class="column">
            <b-tooltip label="Patientenakte anzeigen" position="is-bottom">
              <b-button
                tag="router-link"
                :to="{
                  name: 'patient-record',
                  params: { patientId: props.row.subject.individual.id },
                }"
                type="is-primary"
                size="is-small"
                icon-left="notes-medical"
                outlined
                target="_blank"
                rel="noopener noreferrer"
              ></b-button>
            </b-tooltip>
          </div>
          <div class="column">
            <b-tooltip label="Änderungshistorie anzeigen" position="is-bottom">
              <b-button
                tag="router-link"
                :to="{
                  name: 'researchsubject-history',
                  params: { subjectId: props.row.id },
                }"
                type="is-primary"
                size="is-small"
                icon-left="history"
                outlined
                target="_blank"
                rel="noopener noreferrer"
              ></b-button>
            </b-tooltip>
          </div>
        </div>
      </b-table-column>

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
import LastStay from "@/components/LastStay.vue";
import RecommendationStats from "@/components/RecommendationStats.vue";

export default {
  name: "ScreeningList",
  components: {
    LastStay,
    RecommendationStats,
  },
  props: {
    items: {
      default: () => [],
      type: Array,
    },
    hideDemographics: {
      default: () => false,
      type: Boolean,
    },
    hideLastVisit: {
      default: () => false,
      type: Boolean,
    },
    hideEhrButton: {
      default: () => false,
      type: Boolean,
    },
  },
  data() {
    return {
      selectedFilterOptions: [],
      isLoading: false,
      failedToLoad: false,
      errorMessage: "",
      recruitmentStatusOptions: {
        candidate: "Rekrutierungsvorschlag",
        screening: "Wird geprüft",
        ineligible: "Erfüllt E/A-Kriterien nicht",
        "on-study": "Wurde eingeschlossen",
        withdrawn: "Studienteilnahme abgelehnt",
      },
      fhirClient: {},
    };
  },
  computed: {
    patientViewModel() {
      return this.items
        .map((entry) => entry.item)
        .map((subject) => {
          const mrNumber = fhirpath.evaluate(
            subject.individual,
            "Patient.identifier.where(type.coding.system=%identifierType and type.coding.code='MR').value",
            {
              identifierType: Constants.SYSTEM_IDENTIFIER_TYPE,
            }
          )[0];

          const note = fhirpath.evaluate(
            subject,
            "ResearchSubject.extension(%noteExtensionUrl).valueString",
            {
              noteExtensionUrl: Constants.URL_NOTE_EXTENSION,
            }
          )[0];

          return {
            id: subject.id,
            mrNumber: mrNumber || subject.individual.id,
            subject,
            note,
          };
        });
    },
    filteredSubjects() {
      return this.patientViewModel.filter(
        (entry) => !this.selectedFilterOptions.includes(entry.subject.status)
      );
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
    async onSaveRowChanges(_event, row) {
      try {
        await Api.updateResearchSubject(row.id, row.note, row.subject.status);
        this.$buefy.toast.open({
          message: "Rekrutierungsstatus aktualisiert!",
          type: "is-success",
        });
      } catch (exc) {
        this.$log.error(exc);
        this.$buefy.toast.open({
          message: `Fehler beim setzen des Rekrutierungsstatus: ${exc.message}.`,
          type: "is-danger",
          duration: 30_000,
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

.patient-id {
  word-wrap: break-word;
  max-width: 25ch;
}
</style>

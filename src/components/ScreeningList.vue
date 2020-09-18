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
      <b-table-column label="#" field="subject.individual.id" v-slot="props" sortable>
        <span>{{ props.row.mrNumber || props.row.subject.individual.id }}</span>
      </b-table-column>

      <b-table-column
        label="Demografie"
        field="subject.individual.birthDate"
        v-slot="props"
        sortable
      >
        <span>
          geb. {{ props.row.subject.individual.birthDate ? new Date(props.row.subject.individual.birthDate).getFullYear() : "unbekannt" }}, {{
          props.row.subject.individual
          ? (props.row.subject.individual.gender === "male"
          ? "m"
          : "w")
          : "u"
          }}
        </span>
      </b-table-column>

      <b-table-column label="Letzter Aufenthalt" v-slot="props">
        <template v-if="props.row.encounter">
          <span class="is-size-7 has-text-weight-semibold">
            {{ new Date(props.row.encounter.period.start).toLocaleDateString() }} -
            {{ new Date(props.row.encounter.period.end).toLocaleDateString() }}:
          </span>
          <br />
        </template>
        <address v-if="props.row.location">
          <span class="has-text-weight-semibold">{{ props.row.location.name }}</span>
          <br />
          <span v-for="(telecom, index) in props.row.location.telecom" :key="index">
            {{telecom.value}}
            <br />
          </span>
        </address>
      </b-table-column>

      <b-table-column label="Status" field="subject.status" v-slot="props" sortable>
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

      <b-table-column label="Notiz" field="note" v-slot="props">
        <b-field>
          <b-input type="textarea" v-model="props.row.note"></b-input>
        </b-field>
      </b-table-column>
      <b-table-column label="Aktionen" v-slot="props">
        <div class="columns is-desktop is-1 is-variable">
          <div class="column">
            <b-button
              @click="onSaveRowChanges($event, props.row)"
              class="save-status"
              type="is-primary"
              size="is-small"
              icon-left="save"
            >Speichern</b-button>
          </div>
          <div class="column">
            <b-button
              tag="router-link"
              :to="{ name: 'patient-record', params: { patientId: props.row.subject.individual.id } }"
              type="is-primary"
              size="is-small"
              icon-left="notes-medical"
              outlined
              target="_blank"
              rel="noopener noreferrer"
            >Patientenakte</b-button>
          </div>
          <div class="column">
            <b-button
              tag="router-link"
              :to="{ name: 'researchsubject-history', params: { subjectId: props.row.id } }"
              type="is-primary"
              size="is-small"
              icon-left="history"
              outlined
              target="_blank"
              rel="noopener noreferrer"
            >Änderungshistorie</b-button>
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
      failedToLoad: false,
      errorMessage: "",
      hideSubjectsOnStudy: false,
      recruitmentStatusOptions: {
        candidate: "Rekrutierungsvorschlag",
        screening: "Wird geprüft",
        ineligible: "Erfüllt E/A-Kriterien nicht",
        "on-study": "Wurde eingeschlossen",
        withdrawn: "Studienteilnahme abgelehnt",
      },
      fhirClient: {},
      encounterWithLocationLookup: new Map(),
    };
  },
  async mounted() {
    this.isLoading = true;

    try {
      this.fhirClient = Api.getFhirClient();
      const allSubjects = this.items.map((e) => e.item);

      const locationPromise = allSubjects.map(async (subject) => [
        subject.individual.id,
        await Api.fetchLatestEncounterWithLocation(subject.individual.id),
      ]);

      this.encounterWithLocationLookup = new Map(
        await Promise.all(locationPromise)
      );
    } catch (exc) {
      this.$log.error(exc);
      this.failedToLoad = true;
      this.errorMessage = exc.message;
    } finally {
      this.isLoading = false;
    }
  },
  computed: {
    patientViewModel() {
      return this.items
        .map((entry) => entry.item)
        .map((subject) => {
          const latestEncounterAndLocation = this.encounterWithLocationLookup.get(
            subject.individual.id
          );

          const mrNumber = fhirpath.evaluate(
            subject.individual,
            "Patient.identifier.where(type.coding.system=%identifierType and type.coding.code='MR').value",
            {
              identifierType: Constants.SYSTEM_IDENTIFIER_TYPE,
            }
          )[0];

          return {
            id: subject.id,
            mrNumber,
            subject,
            note: fhirpath.evaluate(
              subject,
              "ResearchSubject.extension.where(url=%noteExtensionUrl).valueString",
              {
                noteExtensionUrl: Constants.URL_NOTE_EXTENSION,
              }
            )[0],
            location:
              latestEncounterAndLocation && latestEncounterAndLocation.location,
            encounter:
              latestEncounterAndLocation &&
              latestEncounterAndLocation.encounter,
          };
        });
    },
    filteredSubjects() {
      return this.hideSubjectsOnStudy
        ? this.patientViewModel.filter(
            (entry) => entry.subject.status !== "on-study"
          )
        : this.patientViewModel;
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
        this.$log.error(exc);
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

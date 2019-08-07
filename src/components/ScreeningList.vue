<template>
  <section>
    <b-table
      :data="patientData"
      :loading="isLoading"
      :mobile-cards="true"
      sort-icon="menu-up"
    >
      <template slot-scope="props">
        <b-table-column
          field="id"
          label="ID"
          width="40"
          sortable
          numeric
        >
          {{ props.row.id }}
        </b-table-column>

        <b-table-column
          field="name.given"
          label="Vorname"
          sortable
        >
          {{ props.row.name.given.join(" ") }}
        </b-table-column>

        <b-table-column
          field="name.family"
          label="Nachname"
          sortable
        >
          {{ props.row.name.family }}
        </b-table-column>

        <b-table-column
          label="Alter"
          field="birthDate"
          sortable
        >
          <span>
            <span class="tag is-info">
              {{ age(props.row.birthDate) }}
            </span>
          </span>
        </b-table-column>

        <b-table-column label="Geschlecht">
          <span>
            <b-icon
              pack="fas"
              :icon="props.row.gender === 'male' ? 'mars' : 'venus'"
            />
            {{ props.row.gender }}
          </span>
        </b-table-column>
      </template>

      <template slot="empty">
        <section class="section">
          <div class="content has-text-grey has-text-centered">
            <p>
              <b-icon
                icon="frown"
                size="is-large"
              />
            </p>
            <p>Nothing here.</p>
          </div>
        </section>
      </template>
    </b-table>
  </section>
</template>

<script>
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
    };
  },
  computed: {
    patientData() {
      return this.items
        .map(entry => entry.item)
        .map(patient => ({
          id: patient.id,
          name: patient.name.find(name => name.use === "official"),
          gender: patient.gender,
          birthDate: patient.birthDate,
        }));
    },
  },
  methods: {
    age(birthDate) {
      const cur = new Date();
      const diff = cur - new Date(birthDate);
      return Math.floor(diff / 31557600000); // Divide by 1000*60*60*24*365.25
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

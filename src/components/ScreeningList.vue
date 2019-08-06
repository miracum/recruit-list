<template>
  <section>
    <b-table
      :data="data"
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
          field="first_name"
          label="First Name"
          sortable
        >
          {{ props.row.first_name }}
        </b-table-column>

        <b-table-column
          field="last_name"
          label="Last Name"
          sortable
        >
          {{ props.row.last_name }}
        </b-table-column>

        <b-table-column
          field="date"
          label="Date"
          sortable
          centered
        >
          <span class="tag is-success">
            {{ new Date(props.row.date).toLocaleDateString() }}
          </span>
        </b-table-column>

        <b-table-column label="Gender">
          <span>
            <b-icon
              pack="fas"
              :icon="props.row.gender === 'Male' ? 'mars' : 'venus'"
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
                icon="emoticon-sad"
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
const data = [
  {
    id: 1, first_name: "Jesse", last_name: "Simmons", date: "2016/10/15 13:43:27", gender: "Male",
  },
  {
    id: 2, first_name: "John", last_name: "Jacobs", date: "2016/12/15 06:00:53", gender: "Male",
  },
  {
    id: 3, first_name: "Tina", last_name: "Gilbert", date: "2016/04/26 06:26:28", gender: "Female",
  },
  {
    id: 4, first_name: "Clarence", last_name: "Flores", date: "2016/04/10 10:28:46", gender: "Male",
  },
  {
    id: 5, first_name: "Anne", last_name: "Lee", date: "2016/12/06 14:38:38", gender: "Female",
  },
];

export default {
  name: "HelloWorld",
  data() {
    return {
      data,
      isLoading: false,
    };
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

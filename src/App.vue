<template>
  <div id="app">
    <b-navbar>
      <template slot="brand">
        <b-navbar-item href="/">
          <img
            src="https://www.miracum.org/wp-content/uploads/2018/09/miracum_Logo_Titel_G_D.png"
            alt="MIRACUM"
          >
        </b-navbar-item>
      </template>
    </b-navbar>
    <main>
      <router-view />
    </main>
    <footer class="footer">
      <div class="content has-text-centered">
        <p>
          {{ version }}
        </p>
      </div>
    </footer>
  </div>
</template>

<script>
export default {
  name: "PatientRecommendations",
  computed: {
    version: () => process.env.VUE_APP_VERSION,
  },
};
</script>

<style>
#app {
  height: 100%;
  display: flex;
  min-height: 100vh;
  flex-direction: column;
}

main {
  flex: 1 0 auto;
  width: 100%;
}
</style>

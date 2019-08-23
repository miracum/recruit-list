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
      <section class="container">
        <router-view />
      </section>
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

<style lang="scss">
// Import Bulma's core
@import "~bulma/sass/utilities/_all";

// Set your colors
$primary: #1b2259;
$primary-invert: findColorInvert($primary);

// Setup $colors to use as bulma classes (e.g. 'is-twitter')
$colors: (
    "white": ($white, $black),
    "black": ($black, $white),
    "light": ($light, $light-invert),
    "dark": ($dark, $dark-invert),
    "primary": ($primary, $primary-invert),
    "info": ($info, $info-invert),
    "success": ($success, $success-invert),
    "warning": ($warning, $warning-invert),
    "danger": ($danger, $danger-invert),
);

// Links
$link: $primary;
$link-invert: $primary-invert;
$link-focus-border: $primary;

// Import Bulma and Buefy styles
@import "~bulma";
@import "~buefy/src/scss/buefy";
</style>

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

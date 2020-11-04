<template>
  <div id="app">
    <header class="has-background-primary">
      <nav
        class="navbar container has-background-primary"
        role="navigation"
        aria-label="main navigation"
      >
        <div class="navbar-brand">
          <a class="navbar-item" href="/">
            <picture>
              <source srcset="@/assets/miracum-logo.webp" type="image/webp" />
              <source srcset="@/assets/miracum-logo.png" type="image/png" />
              <img src="@/assets/miracum-logo.png" alt="MIRACUM Logo" />
            </picture>
            <span class="navbar-item has-text-white"
              >MIRACUM Rekrutierungsunterstützung</span
            >
          </a>
        </div>
        <div class="navbar-end">
          <div class="navbar-item has-text-white">
            <b-icon pack="fas" size="is-small" icon="user"></b-icon>
            <span class="mr-3 ml-3">{{ username }}</span>
            <b-button
              type="is-white"
              outlined
              @click="logout"
              v-if="isAuthenticated"
              size="is-small"
              >Ausloggen</b-button
            >
          </div>
        </div>
      </nav>
    </header>
    <main>
      <section class="container content">
        <router-view />
      </section>
    </main>
    <footer class="footer has-background-primary-muted">
      <div class="content has-text-centered is-size-7 has-text-grey-light">
        <p>{{ version }}</p>
      </div>
    </footer>
  </div>
</template>

<script>
export default {
  name: "App",
  computed: {
    version: () => process.env.VUE_APP_VERSION,
    username: function username() {
      return (this.$keycloak && this.$keycloak.fullName) || "Anonym";
    },
    isAuthenticated: function isAuthenticated() {
      return (this.$keycloak && this.$keycloak.authenticated) || false;
    },
  },
  methods: {
    logout: function logout() {
      this.$keycloak.logoutFn();
    },
  },
};
</script>

<style lang="scss">
// Import Bulma's core
@import "~bulma/sass/utilities/_all";

// Set your colors
$primary: #1b2259;
$primary-invert: findColorInvert($primary);

$primary-muted: #f0f3fb;
$primary-muted-invert: findColorInvert($primary-muted);

$success: #00a579;
$success-invert: findColorInvert($success);

// Setup $colors to use as bulma classes (e.g. 'is-twitter')
$colors: (
  "white": (
    $white,
    $black,
  ),
  "black": (
    $black,
    $white,
  ),
  "light": (
    $light,
    $light-invert,
  ),
  "dark": (
    $dark,
    $dark-invert,
  ),
  "primary": (
    $primary,
    $primary-invert,
  ),
  "primary-muted": (
    $primary-muted,
    $primary-muted-invert,
  ),
  "info": (
    $info,
    $info-invert,
  ),
  "success": (
    $success,
    $success-invert,
  ),
  "warning": (
    $warning,
    $warning-invert,
  ),
  "danger": (
    $danger,
    $danger-invert,
  ),
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
  background-color: #ffffff;
}

main {
  flex: 1 0 auto;
  width: 100%;
  margin-top: 15px;
}

.navbar-brand > .navbar-item > picture > img {
  border-radius: 50%;
  min-height: 3rem;
}

</style>

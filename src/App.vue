<template>
  <div id="app">
    <header class="has-background-white">
      <nav class="navbar container" role="navigation" aria-label="main navigation">
        <div class="navbar-brand">
          <a class="navbar-item" href="/">
            <picture>
              <source srcset="@/assets/miracum-logo.webp" type="image/webp" />
              <source srcset="@/assets/miracum-logo.png" type="image/png" />
              <img src="@/assets/miracum-logo.png" alt="Logo MIRACUM" />
            </picture>
            <span class="navbar-item has-text-white">MIRACUM Rekrutierungsvorschläge</span>
          </a>
        </div>
      </nav>
    </header>
    <main>
      <section class="container content">
        <router-view />
      </section>
    </main>
    <footer class="footer">
      <div class="content has-text-centered">
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
  },
};
</script>

<style lang="scss">
// Import Bulma's core
@import "~bulma/sass/utilities/_all";

// Set your colors
$primary: #1b2259;
$primary-invert: findColorInvert($primary);

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
  background-color: #f0f3fb;
}

main {
  flex: 1 0 auto;
  width: 100%;
  margin-top: 15px;
}
</style>

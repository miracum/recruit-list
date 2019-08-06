<template>
  <div class="home">
    <ScreeningList />
  </div>
</template>

<script>
// @ is an alias to /src
import ScreeningList from "@/components/ScreeningList.vue";

export default {
  name: "PatientRecommendations",
  components: {
    ScreeningList,
  },
};
</script>

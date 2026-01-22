<script setup lang="ts">
import PopularityHistogram from './components/PopularityHistogram.vue'
import FollowersScatter from './components/FollowersScatter.vue'
import ParallelCoords from './components/ParallelCoords.vue'
</script>

<template>
  <VContainer id="main-container" fluid class="pa-3">
    <VRow class="pb-2">
      <VCol cols="12">
        <h2 class="mb-1">Spotify Tracks Dashboard (2009–2023)</h2>
        <div class="subtext">
          Overview + focus views using track popularity, artist popularity, followers, and genres.
        </div>
      </VCol>
    </VRow>

    <VRow style="height: 42vh;">
      <VCol cols="6" class="pa-2">
        <VCard class="fill-height" elevation="2">
          <VCardText class="fill-height">
            <PopularityHistogram />
          </VCardText>
        </VCard>
      </VCol>

      <VCol cols="6" class="pa-2">
        <VCard class="fill-height" elevation="2">
          <VCardText class="fill-height">
            <ParallelCoords />
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <VRow style="height: 48vh;">
      <VCol cols="12" class="pa-2">
        <VCard class="fill-height" elevation="2">
          <VCardText class="fill-height">
            <FollowersScatter />
          </VCardText>
        </VCard>
      </VCol>
    </VRow>
  </VContainer>
</template>

<style scoped>
#main-container {
  height: 100vh;
}
.subtext {
  font-size: 0.9rem;
  opacity: 0.8;
}
.fill-height {
  height: 100%;
}
</style>

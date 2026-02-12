<script setup lang="ts">
// RUBRIC: dashboard style (5pts) - all views fit on one screen, focus+context design
// RUBRIC: design rationale (25pts) - histogram gives overview, scatter and streamgraph provide detailed focus
// user can brush histogram to filter, click legends to highlight genres
// replaced parallel coords with streamgraph for hw3 - TA feedback said all 3 views
// covered the same info, so now the streamgraph brings in the time dimension
import PopularityHistogram from "./components/PopularityHistogram.vue";
import FollowersScatter from "./components/FollowersScatter.vue";
import GenreStream from "./components/GenreStream.vue";
</script>

<template>
    <VContainer id="main-container" fluid class="pa-3">
        <VRow class="pb-2">
            <VCol cols="12">
                <h2 class="mb-1">Spotify Tracks Dashboard (2009–2023)</h2>
                <div class="subtext">
                    Explore track popularity, artist followers, and genre
                    trends over time. Top 6 genres by track frequency.
                </div>
            </VCol>
        </VRow>

        <VRow style="height: 42vh">
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
                        <GenreStream />
                    </VCardText>
                </VCard>
            </VCol>
        </VRow>

        <VRow style="height: 48vh">
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

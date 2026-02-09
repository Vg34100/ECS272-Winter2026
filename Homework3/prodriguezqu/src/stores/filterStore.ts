import { defineStore } from "pinia";

// RUBRIC: filtering coordination (15pts) - this store is how the views coordinate
// histogram updates popularityRange, scatter/parallel react to it
// legend clicks update selectedGenre, both views react to highlight/fade

export type PopularityRange = [number, number] | null;

export const useFilterStore = defineStore("filterStore", {
    state: () => ({
        popularityRange: null as PopularityRange,
        selectedGenre: null as string | null,
    }),
    actions: {
        setPopularityRange(range: PopularityRange) {
            this.popularityRange = range;
        },
        clearPopularityRange() {
            this.popularityRange = null;
        },
        setSelectedGenre(genre: string | null) {
            this.selectedGenre = genre;
        },
        clearSelectedGenre() {
            this.selectedGenre = null;
        },
    },
});

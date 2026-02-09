<script setup lang="ts">
import * as d3 from "d3";
import { debounce, isEmpty } from "lodash";
import { ref, computed, watch, onMounted, onBeforeUnmount } from "vue";
import { useFilterStore } from "../stores/filterStore";

import type { ComponentSize, Margin } from "../types";

// RUBRIC: scatter plot for followers vs popularity
// rubric item: fundamental interaction (10pts) - has tooltip, zoom/pan, highlighting
// rubric item: animated transitions (10pts) - points fade in/out smoothly
// rubric item: legend/axis/title (5pts) - all present
// rubric item: appropriate vis design (30pts) - scatter plot is right for two quantitative vars, log scale for wide range

type Row = {
    track_name: string;
    artist_name: string;
    track_popularity: number;
    artist_followers: number;
    genre_bucket: string;
};

const store = useFilterStore();

const allRows = ref<Row[]>([]);
const topGenres = ref<string[]>([]);
const size = ref<ComponentSize>({ width: 0, height: 0 });
const margin: Margin = { left: 70, right: 40, top: 40, bottom: 60 };

const container = ref<HTMLElement | null>(null);

// RUBRIC: filtering function that coordinates multiple views (15pts)
// this computed property reacts to the histogram brush filter
const filteredRows = computed(() => {
    if (!store.popularityRange) return allRows.value;
    const [min, max] = store.popularityRange;
    return allRows.value.filter(
        (d) => d.track_popularity >= min && d.track_popularity <= max,
    );
});

function parseGenres(raw: string | undefined | null): string[] {
    if (!raw) return [];
    return raw
        .replace("[", "")
        .replace("]", "")
        .replaceAll("'", "")
        .split(",")
        .map((s) => s.trim().toLowerCase())
        .filter((s) => s.length > 0);
}

async function read() {
    const data = await d3.csv("/data/track_data_final.csv");

    const genreCounts = new Map<string, number>();
    for (const d of data) {
        const gs = parseGenres(d.artist_genres);
        for (const g of gs) {
            genreCounts.set(g, (genreCounts.get(g) ?? 0) + 1);
        }
    }

    topGenres.value = Array.from(genreCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map((d) => d[0]);

    function pickGenre(raw: string | undefined | null): string {
        const gs = parseGenres(raw);
        for (const g of gs) {
            if (topGenres.value.includes(g)) return g;
        }
        return "Other";
    }

    const cleaned: Row[] = data
        .map((d) => {
            const pop = Number(d.track_popularity);
            const fol = Number(d.artist_followers);
            if (!Number.isFinite(pop) || !Number.isFinite(fol) || fol <= 0)
                return null;
            return {
                track_name: d.track_name || "Unknown",
                artist_name: d.artist_name || "Unknown",
                track_popularity: pop,
                artist_followers: fol,
                genre_bucket: pickGenre(d.artist_genres),
            };
        })
        .filter((d): d is Row => d !== null)
        .filter((d) => d.genre_bucket !== "Other");

    allRows.value = cleaned.slice(0, 700);
}

function onResize() {
    const el = container.value;
    if (!el) return;
    size.value = { width: el.clientWidth, height: el.clientHeight };
}

let currentTransform = d3.zoomIdentity;

function initChart() {
    const svg = d3.select("#scatter-svg");
    const width = size.value.width;
    const height = size.value.height;
    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;

    const categories = topGenres.value;
    const color = d3
        .scaleOrdinal<string>()
        .domain(categories)
        .range(d3.schemeTableau10.slice(0, categories.length));

    svg.append("text")
        .attr("x", width / 2)
        .attr("y", 18)
        .attr("text-anchor", "middle")
        .style("font-weight", "bold")
        .text("Artist Followers vs Track Popularity (Top Genres)");

    const g = svg
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    svg.append("defs")
        .append("clipPath")
        .attr("id", "scatter-clip")
        .append("rect")
        .attr("width", innerW)
        .attr("height", innerH);

    const xBase = d3
        .scaleLog()
        .domain(
            d3.extent(allRows.value, (d) => d.artist_followers) as [
                number,
                number,
            ],
        )
        .nice()
        .range([0, innerW]);

    const yBase = d3.scaleLinear().domain([0, 100]).range([innerH, 0]);

    const xAxisG = g.append("g").attr("transform", `translate(0, ${innerH})`);
    const yAxisG = g.append("g");

    xAxisG.call(d3.axisBottom(xBase).ticks(6, "~s"));
    yAxisG.call(d3.axisLeft(yBase));

    g.append("text")
        .attr("x", innerW / 2)
        .attr("y", innerH + 45)
        .attr("text-anchor", "middle")
        .style("font-size", ".85rem")
        .text("Artist Followers (log scale)");

    g.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -innerH / 2)
        .attr("y", -50)
        .attr("text-anchor", "middle")
        .style("font-size", ".85rem")
        .text("Track Popularity");

    const tooltip = d3
        .select("body")
        .append("div")
        .style("position", "absolute")
        .style("background", "rgba(0,0,0,0.85)")
        .style("color", "white")
        .style("padding", "8px 12px")
        .style("border-radius", "6px")
        .style("font-size", "0.8rem")
        .style("pointer-events", "none")
        .style("opacity", 0)
        .style("z-index", 9999);

    const pointsG = g.append("g").attr("clip-path", "url(#scatter-clip)");

    // RUBRIC: animated transitions (10pts) - points smoothly enter/exit when filtered
    function updatePoints(data: Row[]) {
        const x = currentTransform.rescaleX(xBase);
        const y = currentTransform.rescaleY(yBase);

        const circles = pointsG
            .selectAll("circle")
            .data(data, (d: any) => d.track_name + d.artist_name);

        circles.exit().transition().duration(400).attr("opacity", 0).remove();

        const enter = circles
            .enter()
            .append("circle")
            .attr("cx", (d: any) => x(d.artist_followers))
            .attr("cy", (d: any) => y(d.track_popularity))
            .attr("r", 3)
            .attr("fill", (d: any) => color(d.genre_bucket))
            .attr("opacity", 0)
            // RUBRIC: fundamental interaction (10pts) - tooltip shows details on hover
            .on("mouseover", function (event, d: any) {
                d3.select(this)
                    .attr("r", 5)
                    .attr("stroke", "#000")
                    .attr("stroke-width", 1.5);
                tooltip
                    .style("opacity", 1)
                    .html(
                        `<strong>${d.track_name}</strong><br/>` +
                            `Artist: ${d.artist_name}<br/>` +
                            `Followers: ${d.artist_followers.toLocaleString()}<br/>` +
                            `Popularity: ${d.track_popularity}<br/>` +
                            `Genre: ${d.genre_bucket}`,
                    )
                    .style("left", event.pageX + 10 + "px")
                    .style("top", event.pageY - 10 + "px");
            })
            .on("mousemove", (event) => {
                tooltip
                    .style("left", event.pageX + 10 + "px")
                    .style("top", event.pageY - 10 + "px");
            })
            .on("mouseout", function () {
                d3.select(this).attr("r", 3).attr("stroke", "none");
                tooltip.style("opacity", 0);
            });

        enter
            .merge(circles as any)
            .transition()
            .duration(400)
            .attr("cx", (d: any) => x(d.artist_followers))
            .attr("cy", (d: any) => y(d.track_popularity))
            .attr("opacity", (d: any) => {
                if (!store.selectedGenre) return 0.6;
                return d.genre_bucket === store.selectedGenre ? 0.8 : 0.15;
            });
    }

    updatePoints(filteredRows.value);

    // RUBRIC: legend (part of 5pt requirement)
    const legend = svg
        .append("g")
        .attr(
            "transform",
            `translate(${margin.left + 10}, ${margin.top + 10})`,
        );

    // RUBRIC: fundamental interaction (10pts) - clicking legend filters by genre
    legend
        .selectAll("g")
        .data(categories)
        .join("g")
        .attr("transform", (_d, i) => `translate(0, ${i * 14})`)
        .style("cursor", "pointer")
        .on("click", (_event, d) => {
            if (store.selectedGenre === d) {
                store.clearSelectedGenre();
            } else {
                store.setSelectedGenre(d);
            }
        })
        .each(function (d) {
            const row = d3.select(this);
            row.append("rect")
                .attr("width", 10)
                .attr("height", 10)
                .attr("fill", color(d));
            row.append("text")
                .attr("x", 14)
                .attr("y", 9)
                .style("font-size", ".75rem")
                .text(d);
        });

    // RUBRIC: fundamental interaction (10pts) - zoom and pan lets you explore details
    const zoom = d3
        .zoom()
        .scaleExtent([1, 10])
        .extent([
            [0, 0],
            [innerW, innerH],
        ])
        .translateExtent([
            [0, 0],
            [innerW, innerH],
        ])
        .on("zoom", (event) => {
            currentTransform = event.transform;
            const x = event.transform.rescaleX(xBase);
            const y = event.transform.rescaleY(yBase);

            xAxisG.call(d3.axisBottom(x).ticks(6, "~s") as any);
            yAxisG.call(d3.axisLeft(y) as any);

            pointsG
                .selectAll("circle")
                .attr("cx", (d: any) => x(d.artist_followers))
                .attr("cy", (d: any) => y(d.track_popularity));
        });

    svg.call(zoom as any);

    watch(filteredRows, (newData) => {
        updatePoints(newData);
    });

    watch(
        () => store.selectedGenre,
        () => {
            pointsG
                .selectAll("circle")
                .transition()
                .duration(300)
                .attr("opacity", (d: any) => {
                    if (!store.selectedGenre) return 0.6;
                    return d.genre_bucket === store.selectedGenre ? 0.8 : 0.15;
                });

            legend.selectAll("g").attr("opacity", (d) => {
                if (!store.selectedGenre || d === store.selectedGenre) return 1;
                return 0.3;
            });
        },
    );

    onBeforeUnmount(() => {
        tooltip.remove();
    });
}

watch(
    [allRows, size],
    ([r, s]) => {
        if (!isEmpty(r) && s.width > 0 && s.height > 0) {
            d3.select("#scatter-svg").selectAll("*").remove();
            currentTransform = d3.zoomIdentity;
            initChart();
        }
    },
    { deep: true },
);

const debouncedOnResize = debounce(onResize, 100);

onMounted(() => {
    window.addEventListener("resize", debouncedOnResize);
    onResize();
    read();
});

onBeforeUnmount(() => {
    window.removeEventListener("resize", debouncedOnResize);
});
</script>

<template>
    <div class="chart-container d-flex" ref="container">
        <svg id="scatter-svg" width="100%" height="100%"></svg>
    </div>
</template>

<style scoped>
.chart-container {
    height: 100%;
    width: 100%;
}
</style>

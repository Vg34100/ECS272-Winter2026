<script setup lang="ts">
import * as d3 from 'd3'
import { debounce, isEmpty } from 'lodash'
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'

import type { ComponentSize, Margin } from '../types'

type Row = {
    track_popularity: number
    artist_followers: number
    genre_bucket: string
}

const rows = ref<Row[]>([])
const topGenres = ref<string[]>([])
const size = ref<ComponentSize>({ width: 0, height: 0 })
const margin: Margin = { left: 70, right: 40, top: 40, bottom: 60 }

const container = ref<HTMLElement | null>(null)
const canRender = computed(() => !isEmpty(rows.value) && size.value.width > 0 && size.value.height > 0)

function parseGenres(raw: string | undefined | null): string[] {
    if (!raw) return []
    return raw
        .replace('[', '')
        .replace(']', '')
        .replaceAll("'", '')
        .split(',')
        .map((s) => s.trim().toLowerCase())
        .filter((s) => s.length > 0)
}

async function read() {
    const data = await d3.csv('/data/track_data_final.csv')

    // count genres
    const genreCounts = new Map<string, number>()
    for (const d of data) {
        const gs = parseGenres(d.artist_genres)
        for (const g of gs) {
            genreCounts.set(g, (genreCounts.get(g) ?? 0) + 1)
        }
    }

    // pick top 6 genres
    topGenres.value = Array.from(genreCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map((d) => d[0])

    function pickGenre(raw: string | undefined | null): string {
        const gs = parseGenres(raw)
        for (const g of gs) {
            if (topGenres.value.includes(g)) return g
        }
        return 'Other'
    }

    const cleaned: Row[] = data
        .map((d) => {
            const pop = Number(d.track_popularity)
            const fol = Number(d.artist_followers)
            if (!Number.isFinite(pop) || !Number.isFinite(fol) || fol <= 0) return null
            return {
                track_popularity: pop,
                artist_followers: fol,
                genre_bucket: pickGenre(d.artist_genres),
            }
        })
        .filter((d): d is Row => d !== null)
        .filter((d) => d.genre_bucket !== 'Other')

    // sample fewer points to reduce clutter
    rows.value = cleaned.slice(0, 700)
}

function onResize() {
    const el = container.value
    if (!el) return
    size.value = { width: el.clientWidth, height: el.clientHeight }
}

function initChart() {
    const svg = d3.select('#scatter-svg')

    const width = size.value.width
    const height = size.value.height

    const innerW = width - margin.left - margin.right
    const innerH = height - margin.top - margin.bottom

    const g = svg
        .append('g')
        .attr('transform', `translate(${margin.left}, ${margin.top})`)

    const x = d3
        .scaleLog()
        .domain(d3.extent(rows.value, (d) => d.artist_followers) as [number, number])
        .nice()
        .range([0, innerW])

    const y = d3
        .scaleLinear()
        .domain([0, 100])
        .range([innerH, 0])

    const categories = topGenres.value
    const color = d3
        .scaleOrdinal<string>()
        .domain(categories)
        .range(d3.schemeTableau10.slice(0, categories.length))

    // title
    svg.append('text')
        .attr('x', width / 2)
        .attr('y', 18)
        .attr('text-anchor', 'middle')
        .style('font-weight', 'bold')
        .text('Artist Followers vs Track Popularity (Top Genres)')

    // axes
    g.append('g')
        .attr('transform', `translate(0, ${innerH})`)
        .call(d3.axisBottom(x).ticks(6, '~s'))

    g.append('g').call(d3.axisLeft(y))

    // axis labels
    g.append('text')
        .attr('x', innerW / 2)
        .attr('y', innerH + 45)
        .attr('text-anchor', 'middle')
        .style('font-size', '.85rem')
        .text('Artist Followers (log scale)')

    g.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', -innerH / 2)
        .attr('y', -50)
        .attr('text-anchor', 'middle')
        .style('font-size', '.85rem')
        .text('Track Popularity')

    // points
    g.append('g')
        .selectAll('circle')
        .data(rows.value)
        .join('circle')
        .attr('cx', (d) => x(d.artist_followers))
        .attr('cy', (d) => y(d.track_popularity))
        .attr('r', 3)
        .attr('fill', (d) => color(d.genre_bucket))
        .attr('opacity', 0.6)

    // legend
    const legend = svg
        .append('g')
        .attr('transform', `translate(${margin.left + 10}, ${margin.top + 10})`)

    legend
        .selectAll('g')
        .data(categories)
        .join('g')
        .attr('transform', (_d, i) => `translate(0, ${i * 14})`)
        .each(function (d) {
            const row = d3.select(this)
            row.append('rect').attr('width', 10).attr('height', 10).attr('fill', color(d))
            row.append('text').attr('x', 14).attr('y', 9).style('font-size', '.75rem').text(d)
        })
}

watch(
    [rows, size],
    ([r, s]) => {
        if (!isEmpty(r) && s.width > 0 && s.height > 0) {
            d3.select('#scatter-svg').selectAll('*').remove()
            initChart()
        }
    },
    { deep: true }
)

const debouncedOnResize = debounce(onResize, 100)

onMounted(() => {
    window.addEventListener('resize', debouncedOnResize)
    onResize()
    read()
})

onBeforeUnmount(() => {
    window.removeEventListener('resize', debouncedOnResize)
})
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

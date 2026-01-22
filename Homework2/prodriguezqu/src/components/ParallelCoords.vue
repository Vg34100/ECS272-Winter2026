<script setup lang="ts">
import * as d3 from 'd3'
import { debounce, isEmpty } from 'lodash'
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'

import type { ComponentSize, Margin } from '../types'

type Row = {
    track_popularity: number
    artist_popularity: number
    artist_followers: number
    genre_bucket: string
}

const rows = ref<Row[]>([])
const topGenres = ref<string[]>([])
const size = ref<ComponentSize>({ width: 0, height: 0 })
const margin: Margin = { left: 55, right: 35, top: 40, bottom: 50 }

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
            const tp = Number(d.track_popularity)
            const ap = Number(d.artist_popularity)
            const fol = Number(d.artist_followers)
            if (!Number.isFinite(tp) || !Number.isFinite(ap) || !Number.isFinite(fol) || fol <= 0) return null
            return {
                track_popularity: tp,
                artist_popularity: ap,
                artist_followers: fol,
                genre_bucket: pickGenre(d.artist_genres),
            }
        })
        .filter((d): d is Row => d !== null)

    // key improvement: only draw top genres (drop most "Other" clutter)
    const filtered = cleaned.filter((d) => d.genre_bucket !== 'Other')

    // sample fewer lines so it is readable
    rows.value = filtered.slice(0, 220)
}

function onResize() {
    const el = container.value
    if (!el) return
    size.value = { width: el.clientWidth, height: el.clientHeight }
}

function initChart() {
    const svg = d3.select('#parallel-svg')

    const width = size.value.width
    const height = size.value.height

    const innerW = width - margin.left - margin.right
    const innerH = height - margin.top - margin.bottom

    const categories = [...topGenres.value]
    const color = d3
        .scaleOrdinal<string>()
        .domain(categories)
        .range(d3.schemeTableau10.slice(0, categories.length))

    const dims = ['track_popularity', 'artist_popularity', 'artist_followers'] as const

    const x = d3
        .scalePoint<string>()
        .domain(dims as unknown as string[])
        .range([0, innerW])
        .padding(0.5)

    const yScales: Record<string, d3.ScaleContinuousNumeric<number, number>> = {
        track_popularity: d3.scaleLinear().domain([0, 100]).range([innerH, 0]),
        artist_popularity: d3.scaleLinear().domain([0, 100]).range([innerH, 0]),
        artist_followers: d3
            .scaleLog()
            .domain(d3.extent(rows.value, (d) => d.artist_followers) as [number, number])
            .nice()
            .range([innerH, 0]),
    }

    const g = svg
        .append('g')
        .attr('transform', `translate(${margin.left}, ${margin.top})`)

    // title
    svg.append('text')
        .attr('x', width / 2)
        .attr('y', 18)
        .attr('text-anchor', 'middle')
        .style('font-weight', 'bold')
        .text('Parallel Coordinates (Top Genres Only, Sample)')

    function path(d: Row) {
        const pts: [number, number][] = []
        for (const dim of dims) {
            const xx = x(dim) as number
            const yy = yScales[dim](d[dim])
            pts.push([xx, yy])
        }
        return d3.line()(pts) ?? ''
    }

    // lines
    g.append('g')
        .selectAll('path')
        .data(rows.value)
        .join('path')
        .attr('d', (d) => path(d))
        .attr('fill', 'none')
        .attr('stroke', (d) => color(d.genre_bucket))
        .attr('stroke-width', 1.2)
        .attr('opacity', 0.35)

    // axes + labels
    g.append('g')
        .selectAll('g')
        .data(dims as unknown as string[])
        .join('g')
        .attr('transform', (d) => `translate(${x(d)}, 0)`)
        .each(function (d) {
            const ax = d3.select(this)
            const scale = yScales[d]

            if (d === 'artist_followers') ax.call(d3.axisLeft(scale).ticks(6, '~s'))
            else ax.call(d3.axisLeft(scale))

            const label =
                d === 'track_popularity'
                    ? 'Track Popularity'
                    : d === 'artist_popularity'
                      ? 'Artist Popularity'
                      : 'Artist Followers (log)'

            ax.append('text')
                .attr('y', innerH + 30)
                .attr('text-anchor', 'middle')
                .style('fill', 'black')
                .style('font-size', '.8rem')
                .text(label)
        })

    // legend
    const legend = svg
        .append('g')
        .attr('transform', `translate(${margin.left + 10}, ${margin.top + 5})`)

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
            d3.select('#parallel-svg').selectAll('*').remove()
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
        <svg id="parallel-svg" width="100%" height="100%"></svg>
    </div>
</template>

<style scoped>
.chart-container {
    height: 100%;
    width: 100%;
}
</style>

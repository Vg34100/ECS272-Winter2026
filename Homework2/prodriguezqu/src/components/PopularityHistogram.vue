<script setup lang="ts">
import * as d3 from 'd3'
import { debounce, isEmpty } from 'lodash'
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'

import type { ComponentSize, Margin } from '../types'

const values = ref<number[]>([])
const size = ref<ComponentSize>({ width: 0, height: 0 })
const margin: Margin = { left: 55, right: 20, top: 35, bottom: 45 }

const container = ref<HTMLElement | null>(null)

const canRender = computed(() => !isEmpty(values.value) && size.value.width > 0 && size.value.height > 0)

async function read() {
    const rows = await d3.csv('/data/track_data_final.csv')
    values.value = rows
        .map((d) => Number(d.track_popularity))
        .filter((v) => Number.isFinite(v))
}

function onResize() {
    const el = container.value
    if (!el) return
    size.value = { width: el.clientWidth, height: el.clientHeight }
}

function initChart() {
    const svg = d3.select('#pop-hist-svg')

    const width = size.value.width
    const height = size.value.height

    const innerW = width - margin.left - margin.right
    const innerH = height - margin.top - margin.bottom

    const x = d3
        .scaleLinear()
        .domain([0, 100])
        .range([0, innerW])

    const bins = d3
        .bin<number, number>()
        .domain(x.domain() as [number, number])
        .thresholds(20)(values.value)

    const y = d3
        .scaleLinear()
        .domain([0, d3.max(bins, (d) => d.length) ?? 0])
        .nice()
        .range([innerH, 0])

    const g = svg
        .append('g')
        .attr('transform', `translate(${margin.left}, ${margin.top})`)

    // title
    svg.append('text')
        .attr('x', width / 2)
        .attr('y', 18)
        .attr('text-anchor', 'middle')
        .style('font-weight', 'bold')
        .text('Track Popularity Distribution (2009–2023)')

    // axes
    g.append('g')
        .attr('transform', `translate(0, ${innerH})`)
        .call(d3.axisBottom(x))

    g.append('g')
        .call(d3.axisLeft(y))

    // axis labels
    svg.append('text')
        .attr('x', width / 2)
        .attr('y', height - 8)
        .attr('text-anchor', 'middle')
        .style('font-size', '.8rem')
        .text('Track Popularity')

    svg.append('text')
        .attr('transform', `translate(16, ${height / 2}) rotate(-90)`)
        .attr('text-anchor', 'middle')
        .style('font-size', '.8rem')
        .text('Number of Tracks')

    // bars
    g.selectAll('rect')
        .data(bins)
        .join('rect')
        .attr('x', (d) => x(d.x0 ?? 0))
        .attr('y', (d) => y(d.length))
        .attr('width', (d) => Math.max(0, x(d.x1 ?? 0) - x(d.x0 ?? 0) - 1))
        .attr('height', (d) => innerH - y(d.length))
        .attr('fill', 'teal')
}

// rerender when size or data changes
watch(
    [values, size],
    ([vals, s]) => {
        if (!isEmpty(vals) && s.width > 0 && s.height > 0) {
            d3.select('#pop-hist-svg').selectAll('*').remove()
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
        <svg id="pop-hist-svg" width="100%" height="100%"></svg>
    </div>
</template>

<style scoped>
.chart-container {
    height: 100%;
    width: 100%;
}
</style>

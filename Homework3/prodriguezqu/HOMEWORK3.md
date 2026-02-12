# Spotify Tracks Dashboard (2009–2023)

## Analysis Questions
1. How is track popularity distributed across Spotify songs from 2009–2023, and how does this differ by genre?
2. What is the relationship between an artist's follower count and the popularity of their tracks?
3. How have the top music genres grown or shifted over time on Spotify?

## Intended Audience
Listeners or analysts interested in understanding trends in popular music and artist reach on Spotify.

## Top Genres
The dashboard focuses on the 6 most common genres by track frequency in the dataset. This keeps the visualizations readable while still covering the majority of tracks. The top genres are determined automatically by counting how many tracks list each genre and taking the 6 highest.

---

## Visualizations

### Visualization 1: Track Popularity Distribution (Context View)
This histogram supports **Analysis Question 1** by showing how track popularity scores are distributed across the full dataset.

A histogram is appropriate because it clearly shows the overall shape of the distribution and highlights where most tracks fall. For HW3, the histogram now reacts to genre selection — when a genre is clicked in any view's legend, the histogram overlays that genre's distribution on top of the overall bars. This directly addresses TA feedback from HW2 that said the bar chart should reflect distributions within a specific genre to strengthen the dashboard's genre exploration theme.

The histogram also serves as the main filtering control: users can brush a popularity range, which filters both the scatter plot and the streamgraph. This makes it the entry point for the focus+context exploration flow.

---

### Visualization 2: Artist Followers vs Track Popularity (Focus View)
This scatter plot supports **Analysis Question 2** by comparing artist follower counts with track popularity, colored by genre.

A scatter plot is suitable because it reveals trends, spread, and outliers between two quantitative variables. A log scale is used for follower counts to handle the wide range between artists. For HW3, this view now shows all data points in the top genres instead of a pre-filtered sample — zoom and pan let users manage the density, and brushing from the histogram narrows the visible points. Tooltips show full track details on hover.

---

### Visualization 3: Genre Trends Over Time — Streamgraph (Focus View)
This streamgraph supports **Analysis Question 3** by showing how the number of tracks in each top genre has changed from 2009 to 2023.

The streamgraph replaced the parallel coordinates plot from HW2. The TA pointed out that all three original views covered essentially the same information (popularity, followers, and genre). The streamgraph brings in a completely new dimension — time — which makes the dashboard cover more aspects of the data. It is still an advanced visualization method: it uses D3's stack layout with a wiggle offset and basis curve interpolation.

The streamgraph responds to both filters in the store: brushing a popularity range in the histogram causes the stream layers to morph to reflect only tracks in that range, and clicking a genre in any legend highlights that genre's layer.

---

## Interactions and Transitions

### Interactions
- **Brush (Histogram):** Select a popularity range to filter the scatter plot and streamgraph. Double-click to clear.
- **Zoom and Pan (Scatter):** Scroll to zoom in/out (1x–10x), drag to pan. Axes update in real time.
- **Tooltip (Scatter):** Hover over a point to see track name, artist, followers, popularity, and genre.
- **Legend Click (All Views):** Click a genre in any legend to highlight it across all three views. The histogram shows that genre's distribution, the scatter fades other genres, and the streamgraph emphasizes that genre's layer.
- **Hover (Streamgraph):** Hover over a layer to see the genre name, year, and track count.

### Animated Transitions
- **Scatter points** fade in and out smoothly (400ms) when the popularity filter changes.
- **Streamgraph layers** morph their shape with a smooth transition (500ms) when filtered, and fade in with staggered delays on initial load.
- **Histogram overlay** bars animate in height and opacity (300–400ms) when a genre is selected or deselected.
- **Opacity transitions** (300ms) on genre highlight/unhighlight across all views for visual consistency.

### Coordinated Filtering Flow
The dashboard is designed around a drill-down exploration flow:
1. **Start with the overview**: The histogram shows the full popularity distribution. The user can see where most tracks cluster.
2. **Filter by popularity**: Brushing the histogram narrows the scatter plot and streamgraph to only show tracks in that range, letting the user focus on e.g. highly popular tracks.
3. **Explore by genre**: Clicking a genre in any legend highlights it everywhere — the histogram shows how that genre's popularity compares to the overall distribution, the scatter shows that genre's follower-popularity relationship, and the streamgraph shows how that genre has trended over time.
4. **Dive into details**: Zooming into the scatter plot and hovering for tooltips lets the user examine individual tracks.

This flow supports the focus+context paradigm: the histogram is context, and the scatter/streamgraph are focus views that respond to the user's selections.

---

## Insights

**Insight 1:**
Artists with very high follower counts tend to have tracks with higher popularity, but the relationship is not strict. Many tracks by highly followed artists still have moderate or low popularity, suggesting that follower count alone does not guarantee track success.

**Insight 2:**
The streamgraph reveals that genre representation on Spotify has shifted significantly over the years. Some genres like rap saw a major spike around 2018, while others like soundtrack have remained relatively steady. Filtering to high-popularity tracks makes these trends even more pronounced.

**Insight 3:**
When filtering to a specific genre using the legend, the histogram overlay shows that different genres have noticeably different popularity distributions. Some genres cluster at moderate popularity while others are more spread out, which is not obvious from the overall distribution alone.

---

## Reflection
The biggest change from HW2 was replacing the parallel coordinates with a streamgraph. The TA feedback that all three views covered the same information was a fair point — the parallel coordinates essentially showed the same popularity/followers/genre data as the scatter plot. The streamgraph brings in the time dimension and tells a different story about how genres have evolved.

I also removed the data sampling limits from HW2. Previously I capped the scatter plot at 700 points and the parallel coordinates at 220 to reduce clutter, but the TA said to use interactions instead. Now the scatter shows all tracks in the top genres, and zoom/pan/brushing handle the density.

Making the histogram genre-aware was a small change that improved the dashboard a lot. Before, it was just a static overview. Now it participates in the coordinated filtering and gives genre-specific insight when a genre is selected.

# Spotify Tracks Dashboard (2009–2023)

## Analysis Questions
1. How is track popularity distributed across Spotify songs from 2009–2023?
2. What is the relationship between an artist’s follower count and the popularity of their tracks?
3. How do track popularity, artist popularity, and follower count vary together across major music genres?

## Intended Audience
Listeners or analysts interested in understanding trends in popular music and artist reach on Spotify.

---

## Visualizations

### Visualization 1: Track Popularity Distribution
This histogram supports **Analysis Question 1** by showing how track popularity scores are distributed across the dataset.

A histogram is appropriate because it clearly shows the overall shape of the distribution and highlights where most tracks fall. Other methods such as a bar chart were considered, but a histogram better represents a continuous popularity scale.

---

### Visualization 2: Artist Followers vs Track Popularity
This scatter plot supports **Analysis Question 2** by comparing artist follower counts with track popularity, colored by major genres.

A scatter plot is suitable because it reveals trends, spread, and outliers between two quantitative variables. A log scale is used for follower counts to better handle large differences between artists. Other options such as a heatmap could also work, but scatter plots make individual tracks easier to interpret.

---

### Visualization 3: Parallel Coordinates (Top Genres)
This parallel coordinates plot supports **Analysis Question 3** by allowing comparison of multiple variables at once: track popularity, artist popularity, and follower count.

Parallel coordinates are appropriate for multivariate comparison and help reveal how different genres behave across several dimensions simultaneously. Other methods such as multiple small scatter plots were considered, but parallel coordinates allow all dimensions to be viewed together in a single chart.

---

## Insights

**Insight 1:**  
Artists with very high follower counts tend to have tracks with higher popularity, but the relationship is not strict. Many tracks by highly followed artists still have moderate or low popularity, suggesting that follower count alone does not guarantee track success.

**Insight 2:**  
Different genres show distinct patterns in the parallel coordinates plot. Some genres cluster tightly at high artist popularity and follower levels, while others show much wider variation, indicating differences in how popularity is distributed across genres.

---

## Reflection
One design decision I was uncertain about was how much data to include in the multivariate views. Using all tracks made some visualizations difficult to read, especially the parallel coordinates plot. To improve clarity, I limited the view to the most common genres and used a sample of tracks. With more time, I would explore interactive filtering to allow users to control how much data is displayed.

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const filter = url.searchParams.get('filter');

    // 1. Analytics Query
    const stats = await env.DB.prepare(`
      SELECT 
        COUNT(*) as total, 
        AVG(sentiment_score) as avg_score,
        SUM(CASE WHEN sentiment_label = 'POSITIVE' THEN 1 ELSE 0 END) as pos_count
      FROM feedback
    `).first();

    // 2. Data Query
    let query = "SELECT * FROM feedback";
    if (filter) query += ` WHERE sentiment_label = '${filter}'`;
    query += " ORDER BY created_at DESC LIMIT 50";

    const { results } = await env.DB.prepare(query).all();

    // 3. HTML View
    return new Response(`
      <!DOCTYPE html>
      <body style="font-family: sans-serif; max-width: 800px; margin: 2rem auto; padding: 1rem;">
        <h1>Sentiment HQ</h1>
        <div style="display:flex; gap: 20px; margin-bottom: 20px;">
            <div style="padding: 20px; background: #eee; border-radius: 8px;">
                <h2>${(stats.avg_score * 100).toFixed(0)}%</h2>
                <small>Happiness Score</small>
            </div>
            <div style="padding: 20px; background: #eee; border-radius: 8px;">
                <h2>${stats.total}</h2>
                <small>Total Reviews</small>
            </div>
        </div>

        <a href="/">All</a> | <a href="?filter=POSITIVE">Positive</a> | <a href="?filter=NEGATIVE">Negative</a>
        <hr>

        ${results.map(r => `
          <div style="padding: 10px; border-bottom: 1px solid #ccc; border-left: 5px solid ${r.sentiment_label === 'POSITIVE' ? 'green' : 'red'}; margin-bottom: 10px;">
            <strong>${r.sentiment_label}</strong> <small>(${r.source})</small><br>
            ${r.content}
          </div>
        `).join('')}
      </body>`, 
      { headers: { "Content-Type": "text/html" } }
    );
  }
};
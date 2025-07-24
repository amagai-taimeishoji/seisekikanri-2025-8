// グラフインスタンス
let barChartInstance = null;
let pieChartInstance = null;

function createBarChart(scores) {
  const ctx = document.getElementById("bar-chart").getContext("2d");
  if (barChartInstance) barChartInstance.destroy();

  const labels = ["10", "9", "8", "7", "6", "5", "4", "3", "2", "最新"];
  const reorderedScores = [
    scores[8], scores[7], scores[6], scores[5],
    scores[4], scores[3], scores[2], scores[1],
    scores[0], scores[9]
  ];

  const colors = labels.map(label =>
    label === "最新" ? "rgba(255, 206, 86, 1)" : "rgba(170, 150, 255, 1)"
  );

  barChartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [{
        label: "スコア",
        data: reorderedScores.map(s => s || 0),
        backgroundColor: colors
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      aspectRatio: 1,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { maxRotation: 0, minRotation: 0 } },
        y: { beginAtZero: true }
      }
    }
  });
}

function createPieChart(data) {
  const ctx = document.getElementById("pie-chart").getContext("2d");
  if (pieChartInstance) pieChartInstance.destroy();

  pieChartInstance = new Chart(ctx, {
    type: "pie",
    data: {
      labels: ["トップ", "にちゃ", "さんちゃ", "よんちゃ"],
      datasets: [{
        data: [
          data["トップ率"] * 100,
          data["にちゃ率"] * 100,
          data["さんちゃ率"] * 100,
          data["よんちゃ率"] * 100
        ],
        backgroundColor: [
          "rgba(255, 100, 100, 1)",
          "rgba(255, 165, 100, 1)",
          "rgba(100, 200, 100, 1)",
          "rgba(100, 150, 255, 1)"
        ]
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      aspectRatio: 1,
      plugins: { legend: { position: 'left' } }
    }
  });
}
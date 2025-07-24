// Google Apps ScriptのURL
const API_URL = "https://script.google.com/macros/s/AKfycby-JyuULrd8LD2CAoKYPR8z-CS58n6CdVBwx4YHGIDz-RWGcjw0N9mWUveCSSP1NAdK/exec";

// ラベル変換マップ
const displayLabels = {
  "総スコアランキング": "総スコア\nランキング",
  "平均スコアランキング": "平均スコア\nランキング",
  "平均着順ランキング": "平均着順\nランキング",
  "ラス回避率ランキング": "ラス回避率\nランキング"
};

function getDisplayLabel(key) {
  return displayLabels[key] || key;
}

// 年・月の選択肢を動的に作成
const yearSelect = document.getElementById("year-select");
const monthSelect = document.getElementById("month-select");

const currentYear = new Date().getFullYear();
for (let y = 2025; y <= currentYear + 1; y++) {
  const option = document.createElement("option");
  option.value = y;
  option.textContent = y;
  yearSelect.appendChild(option);
}
yearSelect.value = currentYear;

for (let m = 1; m <= 12; m++) {
  const option = document.createElement("option");
  option.value = m;
  option.textContent = `${m}月`;
  monthSelect.appendChild(option);
}
monthSelect.value = new Date().getMonth() + 1;

// イベントリスナー
document.getElementById("search-button").addEventListener("click", async () => {
  const name = document.getElementById("name-input").value.trim();
  const year = yearSelect.value;
  const month = monthSelect.value;
  const status = document.getElementById("status-message");
  const results = document.getElementById("results");

  if (!name) {
    status.textContent = "名前を入力してください";
    results.style.display = "none";
    return;
  }

  status.textContent = "ロード中…";
  results.style.display = "none";

  try {
    const response = await fetch(`${API_URL}?name=${encodeURIComponent(name)}&year=${year}&month=${month}`);
    const data = await response.json();

    if (data.error) {
      status.textContent = data.error;
      return;
    }

    status.textContent = "";
    results.style.display = "block";

    // 集計期間
    document.getElementById("period").textContent = `集計期間: ${year}年${month}月`;

    // 来店人数
    document.getElementById("visitor-count").textContent = `来店人数: ${data["来店人数"] || "不明"}`;

    // 会員No.と名前
    document.getElementById("member-info").textContent = `No. ${data["No."]}  名前 ${data["名前"]}`;

    // 右表
    createTable("right-table", [
      [
        getDisplayLabel("累計半荘数"),
        getDisplayLabel("総スコア"),
        getDisplayLabel("総スコアランキング"),
        getDisplayLabel("平均スコア"),
        getDisplayLabel("平均スコアランキング")
      ],
      [
        data["累計半荘数"],
        data["総スコア"],
        data["総スコアランキング"],
        data["平均スコア"] ? Number(data["平均スコア"]).toFixed(3) : "0.000",
        data["平均スコアランキング"]
    ],
      ["最新", "2", "3", "4", "5"],
      [data["最新スコア"], data["2"], data["3"], data["4"], data["5"]],
      ["6", "7", "8", "9", "10"],
      [data["6"], data["7"], data["8"], data["9"], data["10"]]
    ], 5);

    // 左表
    createTable("left-table", [
  [
    getDisplayLabel("平均着順"),
    getDisplayLabel("平均着順ランキング"),
    getDisplayLabel("ラス回避率"),
    getDisplayLabel("ラス回避率ランキング")
  ],
  [
    data["平均着順"] ? Number(data["平均着順"]).toFixed(3) : "0.000",
    data["平均着順ランキング"],
    data["ラス回避率"] ? Number(data["ラス回避率"]).toFixed(3) : "0.000",
    data["ラス回避率ランキング"]
  ],
  ["トップの回数", "にちゃの回数", "さんちゃの回数", "よんちゃの回数"],
      [data["トップの回数"], data["にちゃの回数"], data["さんちゃの回数"], data["よんちゃの回数"]],
      ["トップ率", "にちゃ率", "さんちゃ率", "よんちゃ率"],
      [
        `${(data["トップ率"] * 100).toFixed(3)}%`,
        `${(data["にちゃ率"] * 100).toFixed(3)}%`,
        `${(data["さんちゃ率"] * 100).toFixed(3)}%`,
        `${(data["よんちゃ率"] * 100).toFixed(3)}%`
      ]
    ], 4);

    // 棒グラフ
    createBarChart([
      data["最新スコア"], data["2"], data["3"], data["4"], data["5"],
      data["6"], data["7"], data["8"], data["9"], data["10"]
    ]);

    // 円グラフ
    createPieChart(data);

  } catch (error) {
    status.textContent = "通信エラーが発生しました";
  }
});

// 表作成
function createTable(id, rows, cols) {
  const table = document.getElementById(id);
  table.innerHTML = "";
  table.style.gridTemplateColumns = `repeat(${cols}, 20vw)`;

  rows.forEach((row, rowIndex) => {
    row.forEach(cell => {
      const div = document.createElement("div");
      div.textContent = cell;
      div.className = rowIndex % 2 === 0 ? "header" : "data";
      table.appendChild(div);
    });
  });
}

// グラフインスタンス
let barChartInstance = null;
let pieChartInstance = null;

function createBarChart(scores) {
  const ctx = document.getElementById("bar-chart").getContext("2d");
  if (barChartInstance) barChartInstance.destroy();

  const labels = ["最新", "2", "3", "4", "5", "6", "7", "8", "9", "10"].slice().reverse();
  const dataValues = scores.slice().map(v => (isNaN(v) ? 0 : Number(v))).reverse();
  const absMax = Math.max(...dataValues.map(v => Math.abs(v))) || 10;

  barChartInstance = new Chart(ctx, {
    type: "bar",
    data: { labels, datasets: [{ data: dataValues, backgroundColor: "purple" }] },
    options: {
      indexAxis: "x",
      plugins: { legend: { display: false } },
      scales: { y: { min: -absMax, max: absMax, beginAtZero: true } }
    }
  });
}

function createPieChart(data) {
  const ctx = document.getElementById("pie-chart").getContext("2d");
  if (pieChartInstance) pieChartInstance.destroy();

  pieChartInstance = new Chart(ctx, {
    type: "pie",
    data: {
      labels: ["トップ率", "にちゃ率", "さんちゃ率", "よんちゃ率"],
      datasets: [{
        data: [
          data["トップ率"],
          data["にちゃ率"],
          data["さんちゃ率"],
          data["よんちゃ率"]
        ],
        backgroundColor: ["red", "orange", "green", "blue"]
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true, // ← true に戻す
      plugins: {
        legend: {
          position: "left", // 凡例を左側に
          labels: {
            boxWidth: 20,
            padding: 15
          }
        }
      }
    }
  });
}

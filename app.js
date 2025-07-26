// // グラフインスタンス
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
    label === "最新" ? "rgba(255, 206, 86, 0.9)" : "rgba(186, 140, 255, 0.7)"
  );

  const maxVal = Math.max(...reorderedScores.map(s => s || 0));
  const minVal = Math.min(...reorderedScores.map(s => s || 0));
  const maxAbs = Math.max(Math.abs(maxVal), Math.abs(minVal)) * 1.1;

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
      layout: { padding: { top: 20, bottom: 20 } },
      plugins: { legend: { display: false } },
      scales: {
        y: {
          min: -maxAbs,  // 0を中央に
          max: maxAbs,
          ticks: { stepSize: Math.ceil(maxAbs / 5) }
        }
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
          "rgba(255, 120, 120, 1)",
          "rgba(255, 170, 100, 1)",
          "rgba(120, 200, 120, 1)",
          "rgba(100, 150, 255, 1)"
        ]
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: 'left',
          labels: { padding: 10 } // 凡例と円グラフの間隔
        }
      },
      layout: { padding: { right: 10 } }
    }
  });
}

  options: {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: 'left',
        labels: {
          padding: 10 // 凡例とグラフの間隔を10pxに設定
        }
      }
    },
    layout: {
      padding: {
        right: 10 // 円グラフ全体の右側に10pxの余白
      }
    }
  }
});

// 以降の処理（API呼び出し、テーブル生成など）はこれまでと同じ

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
    status.textContent = "名前を入力してねっ";
    results.style.display = "none";
    return;
  }

  status.textContent = "ロード、チュ…♡";
  results.style.display = "none";

  try {
    const response = await fetch(`${API_URL}?name=${encodeURIComponent(name)}&year=${year}&month=${month}`);
    if (!response.ok) throw new Error(`HTTPエラー: ${response.status}`);
    const data = await response.json();
    if (!data || typeof data !== "object") throw new Error("不正なデータ形式");

    if (data.error) {
      if (data.error.includes("シート") && data.error.includes("見つかりません")) {
        status.textContent = "選択した年月のデータは見つからないよっ";
      } else {
        status.textContent = `エラー: ${data.error}`;
      }
      return;
    }

    status.textContent = "";
    results.style.display = "block";

    document.getElementById("period").textContent = `集計期間: ${year}年${month}月`;
    document.getElementById("visitor-count").textContent = `集計人数: ${data["集計人数"] || "不明"}`;
    let memberNo = data["No."] ? String(data["No."]).padStart(4, '0') : "不明";
    document.getElementById("member-info").textContent = `No. ${memberNo}   ${data["名前"]}`;

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
        `${data["累計半荘数"]}半荘`,
        `${Number(data["総スコア"]).toFixed(1)}pt`,
        `${data["総スコアランキング"]}位`,
        `${Number(data["平均スコア"]).toFixed(3)}pt`,
        `${data["平均スコアランキング"]}位`
      ],
      ["最新スコア", "2", "3", "4", "5"],
      [
        formatScore(data["最新スコア"]),
        formatScore(data["2"]),
        formatScore(data["3"]),
        formatScore(data["4"]),
        formatScore(data["5"])
      ],
      ["6", "7", "8", "9", "10"],
      [
        formatScore(data["6"]),
        formatScore(data["7"]),
        formatScore(data["8"]),
        formatScore(data["9"]),
        formatScore(data["10"])
      ]
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
        `${Number(data["平均着順"]).toFixed(3)}着`,
        `${data["平均着順ランキング"]}位`,
        `${(data["ラス回避率"] * 100).toFixed(3)}%`,
        `${data["ラス回避率ランキング"]}位`
      ],
      ["トップの回数", "にちゃの回数", "さんちゃの回数", "よんちゃの回数"],
      [
        `${data["トップの回数"]}回`,
        `${data["にちゃの回数"]}回`,
        `${data["さんちゃの回数"]}回`,
        `${data["よんちゃの回数"]}回`
      ],
      ["トップ率", "にちゃ率", "さんちゃ率", "よんちゃ率"],
      [
        `${(data["トップ率"] * 100).toFixed(3)}%`,
        `${(data["にちゃ率"] * 100).toFixed(3)}%`,
        `${(data["さんちゃ率"] * 100).toFixed(3)}%`,
        `${(data["よんちゃ率"] * 100).toFixed(3)}%`
      ]
    ], 4);

    // グラフ描画
    createBarChart([
      data["2"], data["3"], data["4"], data["5"],
      data["6"], data["7"], data["8"], data["9"],
      data["10"], data["最新スコア"]
    ]);
    createPieChart(data);

  } catch (error) {
    console.error("Fetchエラー:", error);
    status.textContent = `通信エラーだよっ (${error.message})`;
  }
});

// スコア表示フォーマット（NaN対応）
function formatScore(value) {
  if (value === null || value === undefined || isNaN(value)) return "データ不足";
  return `${Number(value).toFixed(1)}pt`;
}

// 表作成
function createTable(id, rows, cols) {
  const table = document.getElementById(id);
  table.innerHTML = "";
  table.style.gridTemplateColumns = `repeat(${cols}, 18vw)`;

  rows.forEach((row, rowIndex) => {
    row.forEach(cell => {
      const div = document.createElement("div");
      div.textContent = cell;
      div.className = rowIndex % 2 === 0 ? "header" : "data";
      table.appendChild(div);
    });
  });
}
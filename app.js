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

// ページ読み込み時に年・月プルダウンの初期値を「今日」に合わせる
window.addEventListener('DOMContentLoaded', () => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const yearSelect = document.getElementById("year-select");
  const monthSelect = document.getElementById("month-select");

  for (const option of yearSelect.options) {
    option.selected = (Number(option.value) === currentYear);
  }

  for (const option of monthSelect.options) {
    option.selected = (Number(option.value) === currentMonth);
  }
});

document.getElementById("search-button").addEventListener("click", async () => {
  const name = document.getElementById("name-input").value.trim();
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
    const response = await fetch(`https://script.google.com/macros/s/AKfycbws_ZBbTcPVmcp0Lhr91B488Va3_weuZGjvYdHC5_G7oP5W-dF4-a2nTl_QNVV2cI-W/exec?name=${encodeURIComponent(name)}`);
    const data = await response.json();

    if (data.error) {
      status.textContent = data.error;
      return;
    }

    status.textContent = "";
    results.style.display = "block";

    // 年・月プルダウンの値を取得
    const yearSelect = document.getElementById("year-select");
    const monthSelect = document.getElementById("month-select");
    const selectedYear = yearSelect.value;
    const selectedMonth = monthSelect.value;

    // 集計期間開始日をyyyy/mm/1 00:00形式で作成
    const startDate = `${selectedYear}/${String(selectedMonth).padStart(2, "0")}/1 00:00`;
    const lastUpdated = data["最終更新"] || new Date().toLocaleString();

    document.getElementById("period").textContent = `集計期間: ${startDate} 〜 ${lastUpdated}`;

    // 来店人数（左寄せ）
    const visitorEl = document.getElementById("visitor-count");
    visitorEl.textContent = `来店人数: ${data["来店人数"] || "不明"}`;
    visitorEl.style.textAlign = "left";

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
      [data["累計半荘数"], data["総スコア"], data["総スコアランキング"], data["平均スコア"], data["平均スコアランキング"]],
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
      [data["平均着順"], data["平均着順ランキング"], data["ラス回避率"], data["ラス回避率ランキング"]],
      ["トップの回数", "にちゃの回数", "さんちゃの回数", "よんちゃの回数"],
      [data["トップの回数"], data["にちゃの回数"], data["さんちゃの回数"], data["よんちゃの回数"]],
      ["トップ率", "にちゃ率", "さんちゃ率", "よんちゃ率"],
      [
        `${(data["トップ率"] * 100).toFixed(1)}%`,
        `${(data["にちゃ率"] * 100).toFixed(1)}%`,
        `${(data["さんちゃ率"] * 100).toFixed(1)}%`,
        `${(data["よんちゃ率"] * 100).toFixed(1)}%`
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

function createBarChart(scores) {
  const ctx = document.getElementById("bar-chart").getContext("2d");

  const labels = ["最新", "2", "3", "4", "5", "6", "7", "8", "9", "10"].slice().reverse();
  const dataValues = scores.slice().reverse();

  const minValue = Math.min(...dataValues);
  const maxValue = Math.max(...dataValues);

  new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [{
        label: "スコア",
        data: dataValues,
        backgroundColor: dataValues.map((_, i) => i === dataValues.length - 1 ? "yellow" : "purple")
      }]
    },
    options: {
      indexAxis: "x",
      plugins: { legend: { display: false } },
      scales: {
        y: {
          beginAtZero: false,
          suggestedMin: minValue - 10,
          suggestedMax: maxValue + 10
        }
      }
    }
  });
}

function createPieChart(data) {
  const ctx = document.getElementById("pie-chart").getContext("2d");
  new Chart(ctx, {
    type: "pie",
    data: {
      labels: ["トップ率", "にちゃ率", "さんちゃ率", "よんちゃ率"],
      datasets: [{
        data: [data["トップ率"], data["にちゃ率"], data["さんちゃ率"], data["よんちゃ率"]],
        backgroundColor: ["red", "orange", "green", "blue"]
      }]
    }
  });
}
const API_URL = "YOUR_API_ENDPOINT"; // APIのURLに置き換え

// 年月セレクト初期化
const yearSelect = document.getElementById("year-select");
const monthSelect = document.getElementById("month-select");
const now = new Date();
for (let y = now.getFullYear(); y >= 2020; y--) {
  const opt = document.createElement("option");
  opt.value = y;
  opt.textContent = y;
  yearSelect.appendChild(opt);
}
for (let m = 1; m <= 12; m++) {
  const opt = document.createElement("option");
  opt.value = m;
  opt.textContent = m;
  monthSelect.appendChild(opt);
}
yearSelect.value = now.getFullYear();
monthSelect.value = now.getMonth() + 1;

// 表生成関数
function createTable(id, rows, cols) {
  const tableDiv = document.getElementById(id);
  tableDiv.innerHTML = "";
  rows.forEach(row => {
    row.forEach(cell => {
      const div = document.createElement("div");
      div.textContent = cell;
      tableDiv.appendChild(div);
    });
  });
}

// 棒グラフ生成
function createBarChart(scores) {
  const ctx = document.getElementById("bar-chart").getContext("2d");
  new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["2", "3", "4", "5", "6", "7", "8", "9", "10", "最新"],
      datasets: [{
        label: "スコア",
        data: scores,
        backgroundColor: "#66ccff"
      }]
    },
    options: { responsive: true }
  });
}

// 円グラフ生成
function createPieChart(data) {
  const ctx = document.getElementById("pie-chart").getContext("2d");
  new Chart(ctx, {
    type: "pie",
    data: {
      labels: ["1着率", "1.5着率", "2着率", "2.5着率", "3着率", "3.5着率", "4着率"],
      datasets: [{
        data: [
          data["1着率"], data["1.5着率"], data["2着率"], data["2.5着率"],
          data["3着率"], data["3.5着率"], data["4着率"]
        ].map(v => Number(v).toFixed(3)),
        backgroundColor: ["red", "orange", "yellow", "yellowgreen", "green", "teal", "blue"]
      }]
    },
    options: { responsive: true }
  });
}

// 検索ボタン処理
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

    if (data.error) {
      status.textContent = data.error.includes("見つかりません")
        ? "選択した年月のデータは見つからないよっ"
        : `エラー: ${data.error}`;
      return;
    }

    status.textContent = "";
    results.style.display = "block";

    const startDate = `${year}/${String(month).padStart(2, '0')}/1 00:00`;
    const lastUpdated = data["最終更新"] || "不明";
    document.getElementById("period").textContent = `集計期間: ${startDate} 〜 ${lastUpdated}`;
    document.getElementById("visitor-count").textContent = `集計人数: ${data["集計人数"] || "不明"}`;

    let memberNo = data["No."] ? String(data["No."]).padStart(4, '0') : "不明";
    document.getElementById("member-info").textContent = `No. ${memberNo}   ${data["名前"]}`;

    // 表1：ランキング
    createTable("ranking-table", [
      ["累計半荘数\nランキング", "総スコア\nランキング", "最高スコア\nランキング", "平均スコア\nランキング", "平均着順\nランキング"],
      [
        `${Number(data["累計半荘数ランキング"]).toFixed(0)}位`,
        `${Number(data["総スコアランキング"]).toFixed(0)}位`,
        `${Number(data["最高スコアランキング"]).toFixed(0)}位`,
        `${Number(data["平均スコアランキング"]).toFixed(0)}位`,
        `${Number(data["平均着順ランキング"]).toFixed(0)}位`
      ]
    ], 5);

    // 表2：スコアデータ
    createTable("scoredata-table", [
      ["累計半荘数", "総スコア", "最高スコア", "平均スコア", "平均着順"],
      [
        `${Number(data["累計半荘数"]).toFixed(0)}半荘`,
        `${Number(data["総スコア"]).toFixed(3)}pt`,
        `${Number(data["最高スコア"]).toFixed(3)}pt`,
        `${Number(data["平均スコア"]).toFixed(3)}pt`,
        `${Number(data["平均着順"]).toFixed(3)}位`
      ]
    ], 5);

    // 表3：10半荘スコア（4段）
    createTable("tenhan-table", [
      ["最新", "2", "3", "4", "5"],
      [
        `${Number(data["最新スコア"]).toFixed(1)}pt`,
        `${Number(data["2"]).toFixed(1)}pt`,
        `${Number(data["3"]).toFixed(1)}pt`,
        `${Number(data["4"]).toFixed(1)}pt`,
        `${Number(data["5"]).toFixed(1)}pt`
      ],
      ["6", "7", "8", "9", "10"],
      [
        `${Number(data["6"]).toFixed(1)}pt`,
        `${Number(data["7"]).toFixed(1)}pt`,
        `${Number(data["8"]).toFixed(1)}pt`,
        `${Number(data["9"]).toFixed(1)}pt`,
        `${Number(data["10"]).toFixed(1)}pt`
      ]
    ], 5);

    // グラフ
    createBarChart([
      data["2"], data["3"], data["4"], data["5"],
      data["6"], data["7"], data["8"], data["9"],
      data["10"], data["最新スコア"]
    ]);
    createPieChart(data);

  } catch (error) {
    console.error("Fetchエラー:", error);
    status.textContent = `成績更新チュ♡今は見れません (${error.message})`;
  }
});
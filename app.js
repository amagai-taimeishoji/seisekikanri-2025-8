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

// 検索ボタンイベント
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
      [data["累計半荘数"], data["総スコア"], data["総スコアランキング"], data["平均スコア"], data["平均スコアランキング"]],
      ["最新スコア", "2", "3", "4", "5"],
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
      [data["トップ率"], data["にちゃ率"], data["さんちゃ率"], data["よんちゃ率"]]
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

// 表作成（単位付与・データ不足判定付き）
function createTable(id, rows, cols) {
  const table = document.getElementById(id);
  table.innerHTML = "";
  table.style.gridTemplateColumns = `repeat(${cols}, 20vw)`;

  rows.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      const div = document.createElement("div");
      const headerText = rows[0][colIndex];
      let text = cell;

      // データ不足判定
      if (text === "" || text === null || text === undefined || (typeof text === "number" && isNaN(text))) {
        text = "データ不足";
      } else {
        if (["総スコア", "平均スコア", "最新スコア", "2", "3", "4", "5", "6", "7", "8", "9", "10"].includes(headerText)) {
          text = `${Number(text).toFixed(3)}pt`;
        } else if (headerText === "累計半荘数") {
          text = `${text}半荘`;
        } else if (["トップの回数", "にちゃの回数", "さんちゃの回数", "よんちゃの回数"].includes(headerText)) {
          text = `${text}回`;
        } else if (headerText === "平均着順") {
          text = `${Number(text).toFixed(3)}着`;
        } else if (["トップ率", "にちゃ率", "さんちゃ率", "よんちゃ率"].includes(headerText)) {
          text = `${(text * 100).toFixed(3)}%`;
        } else if (headerText.includes("ランキング")) {
          text = `${text}位`;
        }
      }

      div.textContent = text;
      div.className = rowIndex % 2 === 0 ? "header" : "data";
      div.style.textAlign = "right";
      div.style.verticalAlign = "bottom";
      table.appendChild(div);
    });
  });
}

// グラフ管理
let barChartInstance = null;
let pieChartInstance = null;

function createBarChart
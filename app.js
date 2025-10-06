"use strict";


let pieChartInstance = null;


function createPieChart(data) {
  const ctx = document.getElementById("pie-chart").getContext("2d");
  if (pieChartInstance) pieChartInstance.destroy();

  pieChartInstance = new Chart(ctx, {
    type: "pie",
    data: {
      labels: ["1着率","1.5着率","2着率","2.5着率","3着率","3.5着率","4着率"],
      datasets:[{
        data:[
          data["1着率"]*100,
          data["1.5着率"]*100,
          data["2着率"]*100,
          data["2.5着率"]*100,
          data["3着率"]*100,
          data["3.5着率"]*100,
          data["4着率"]*100
        ],
        backgroundColor:[
          "rgba(240,122,122,1)",
          "rgba(240,158,109,1)",
          "rgba(240,217,109,1)",
          "rgba(181,217,109,1)",
          "rgba(109,194,122,1)",
          "rgba(109,194,181,1)",
          "rgba(109,158,217,1)"
        ]
      }]
    },
    options:{
      responsive:true,
      maintainAspectRatio:true,
      plugins:{
        legend:{
          display:true,
          position:'left'
        }
      }
    }
  });
}

// Google Apps ScriptのURL
const API_URL = "https://script.google.com/macros/s/AKfycby-JyuULrd8LD2CAoKYPR8z-CS58n6CdVBwx4YHGIDz-RWGcjw0N9mWUveCSSP1NAdK/exec";

// 年・月選択肢
const yearSelect = document.getElementById("year-select");
const monthSelect = document.getElementById("month-select");
const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;

for(let y=2025;y<=currentYear+1;y++){
  const opt=document.createElement("option");
  opt.value=y;
  opt.textContent=y;
  yearSelect.appendChild(opt);
}
yearSelect.value=currentYear;

for(let m=1;m<=12;m++){
  const opt=document.createElement("option");
  opt.value=m;
  opt.textContent=`${m}月`;
  monthSelect.appendChild(opt);
}
monthSelect.value=currentMonth;

/* -------------------------
   ローディング関連
   ------------------------- */
const loadingArea = document.getElementById("loadingArea");
const loadingFill = document.getElementById("loadingFill");
const loadingText = document.getElementById("loadingText");
const updateStatusEl = document.getElementById("update-status");

let waitingForData = false;
let loadingStart = 0;
let loadingRaf = 0;
const LOADING_DURATION_MS = 10000; // 10秒でバーが100%

function startLoading() {
  // 要素がない場合は従来の status 表示にフォールバック
  const statusEl = document.getElementById("status-message");
  if (loadingArea && loadingFill && loadingText) {
    loadingArea.style.display = "flex";
    loadingFill.style.width = "0%";
    loadingText.style.display = "block";
    loadingText.textContent = "読み込みチュ...♡";
  } else {
    if (statusEl) statusEl.textContent = "ロード、チュ…♡";
  }

  if (updateStatusEl) updateStatusEl.textContent = "────────";

  waitingForData = true;
  loadingStart = performance.now();
  if (loadingRaf) cancelAnimationFrame(loadingRaf);
  loadingRaf = requestAnimationFrame(loadingTick);
}

function loadingTick(now){
  const elapsed = now - loadingStart;
  const pct = Math.min(100, (elapsed / LOADING_DURATION_MS) * 100);
  if (loadingFill) loadingFill.style.width = pct + "%";

  if (pct < 100) {
    loadingRaf = requestAnimationFrame(loadingTick);
  } else {
    if (waitingForData) {
      if (loadingText) loadingText.textContent = "もうちょっとまってほしい！";
      // そのまま表示を継続（データ到着を待つ）
    } else {
      stopLoading();
    }
  }
}

function stopLoading() {
  if (loadingRaf) cancelAnimationFrame(loadingRaf);
  if (loadingFill) loadingFill.style.width = "100%";

  setTimeout(() => {
    if (loadingArea) loadingArea.style.display = "none";
    if (loadingFill) loadingFill.style.width = "0%";
    if (loadingText) loadingText.style.display = "none";
    // status-message はここでは触らない（元ロジックを尊重）
  }, 220);
}

/* -------------------------
   検索イベント
   ------------------------- */
document.getElementById("search-button").addEventListener("click", async () => {
  const name = document.getElementById("name-input").value.trim();
  const year = yearSelect.value;
  const month = monthSelect.value;
  const status = document.getElementById("status-message");
  const results = document.getElementById("results");

  if (!name) {
    if (status) status.textContent = "名前を入力してねっ";
    if (results) results.style.display = "none";
    return;
  }

  // ローディング開始
  startLoading();
  if (results) results.style.display = "none";
  if (status) status.textContent = "";

  try {
    const res = await fetch(`${API_URL}?name=${encodeURIComponent(name)}&year=${year}&month=${month}`);
    if (!res.ok) throw new Error(`HTTPエラー: ${res.status}`);
    const data = await res.json();

    if (data.error) {
      if (status) status.textContent = data.error.includes("見つかりません") ? "選択した年月のデータは見つからないよっ" : `エラー: ${data.error}`;
      return;
    }

    // 成功時表示（update-status に「最終更新」を出す）
    if (updateStatusEl) updateStatusEl.textContent = data["最終更新"] || "不明";

    if (results) results.style.display = "block";

    // period表示は元のまま
    const periodEl = document.getElementById("period");
    if (periodEl) periodEl.textContent = `集計期間: ${year}/${String(month).padStart(2,'0')}/1 00:00 〜 ${data["最終更新"]||"不明"}`;

    const visitorEl = document.getElementById("visitor-count");
    if (visitorEl) visitorEl.textContent = `集計人数: ${data["集計人数"]||"不明"} 人`;

    const memberEl = document.getElementById("member-info");
    if (memberEl) memberEl.textContent = `No. ${data["No."]?String(data["No."]).padStart(4,'0'):"不明"}   ${data["名前"]}`;

    // ランキング
    createTable("ranking-table",[
      ["累計半荘数\nランキング","総スコア\nランキング","最高スコア\nランキング","平均スコア\nランキング","平均着順\nランキング"],
      [
        formatRank(data["累計半荘数ランキング"]),
        formatRank(data["総スコアランキング"]),
        formatRank(data["最高スコアランキング"]),
        formatRank(data["平均スコアランキング"]),
        formatRank(data["平均着順ランキング"])
      ]
    ],5);

    // スコアデータ
    createTable("scoredata-table",[
      ["累計半荘数","総スコア","最高スコア","平均スコア","平均着順"],
      [
        `${Number(data["累計半荘数"]).toFixed(0)}半荘`,
        `${Number(data["総スコア"]).toFixed(1)}pt`,
        `${Number(data["最高スコア"]).toFixed(1)}pt`,
        `${Number(data["平均スコア"]).toFixed(3)}pt`,
        `${Number(data["平均着順"]).toFixed(3)}位`
      ]
    ],5);

    // スコア先月比
// スコア先月比テーブル作成
createTable("sengetsudata-table", [
  ["累計半荘数", "総スコア", "最高スコア", "平均スコア", "平均着順"],
  [
    formatChangeValue(data["累計半荘数先月比"], "半荘", false),
    formatChangeValue(data["総スコア先月比"], "pt", false),
    formatChangeValue(data["最高スコア先月比"], "pt", false),
    formatChangeValue(data["平均スコア先月比"], "pt", false),
    formatChangeValue(data["平均着順先月比"], "位", true)
  ]
], 5);

// 表示用フォーマッタ関数
function formatChangeValue(value, unit, isRank) {
  const num = Number(value);
  if (isNaN(num)) return "-";

  // 平均着順のみ特殊表現（↑↓）
  if (isRank) {
    const arrow = num > 0 ? "↓" : "↑";
    const color = num > 0 ? "red" : "blue";
    return `<span style="color:${color};">${arrow}${Math.abs(num).toFixed(3)}${unit}</span>`;
  }

  // それ以外（±を表示）
  const sign = num > 0 ? "+" : "";
  const color = num > 0 ? "red" : (num < 0 ? "blue" : "black");
  return `<span style="color:${color};">${sign}${num.toFixed(1)}${unit}</span>`;
}
   

    // 着順回数テーブル（3列4列混在、空セル非表示）
    createTable("rank-count-table",[
      ["1着の回数","2着の回数","3着の回数","4着の回数"],
      [
        `${data["1着の回数"]||0}回`,
        `${data["2着の回数"]||0}回`,
        `${data["3着の回数"]||0}回`,
        `${data["4着の回数"]||0}回`
      ],
      ["1.5着の回数","2.5着の回数","3.5着の回数",""], // 空セル追加
      [
        `${data["1.5着の回数"]||0}回`,
        `${data["2.5着の回数"]||0}回`,
        `${data["3.5着の回数"]||0}回`,
        "" // 空セル
      ]
    ],4);

    // 円グラフ
    createPieChart(data);

  } catch (e) {
    console.error(e);
    const status = document.getElementById("status-message");
    if (status) status.textContent = `成績更新チュ♡今は見れません (${e.message})`;
  } finally {
    // データ到着を待つフラグを解除 → loadingTick が既に100%なら stopLoading が呼ばれる
    waitingForData = false;
    // 念のため少し遅延して stopLoading を実行
    setTimeout(() => stopLoading(), 50);
  }
});

function formatScore(v){return v==null||isNaN(v)?"データ不足":`${Number(v).toFixed(1)}pt`}
function formatRank(v){return v==null||isNaN(v)?"データなし":`${Number(v).toFixed(0)}位`}
function createTable(id, rows, cols) {
  const table = document.getElementById(id);
  table.innerHTML = "";
  table.style.gridTemplateColumns = `repeat(${cols}, 18vw)`;

  rows.forEach((row, rowIndex) => {
    row.forEach(cell => {
      const div = document.createElement("div");
      div.textContent = cell;
      div.className = rowIndex % 2 === 0 ? "header" : "data";

      // 空白セルなら "empty-cell" クラスを追加
      if (!cell || cell.toString().trim() === "") {
        div.classList.add("empty-cell");
      }

      table.appendChild(div);
    });
  });
}

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
          min: -maxAbs,
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

// 🔸ローディングアニメーション要素を追加
const loader = document.createElement("div");
loader.id = "loading";
loader.innerHTML = `
  <div class="loader-bar"></div>
  <p class="loading-text">読み込みチュ…♡</p>
`;
document.body.appendChild(loader);

// CSSで最初は非表示に
loader.style.display = "none";

// 検索ボタン
document.getElementById("search-button").addEventListener("click",async()=>{
  const name=document.getElementById("name-input").value.trim();
  const year=yearSelect.value;
  const month=monthSelect.value;
  const status=document.getElementById("status-message");
  const results=document.getElementById("results");

  if(!name){
    status.textContent="名前を入力してねっ";
    results.style.display="none";
    return;
  }

  // 🔹ローディング表示
  loader.style.display = "flex";
  results.style.display="none";
  status.textContent="";

  try{
    const res=await fetch(`${API_URL}?name=${encodeURIComponent(name)}&year=${year}&month=${month}`);
    if(!res.ok) throw new Error(`HTTPエラー: ${res.status}`);
    const data=await res.json();

    if(data.error){
      loader.style.display="none";
      status.textContent=data.error.includes("見つかりません")?"選択した年月のデータは見つからないよっ":`エラー: ${data.error}`;
      return;
    }

    loader.style.display="none";
    status.textContent="";
    results.style.display="block";

    const lastUpdate = (typeof data["最終更新"] === "string" && data["最終更新"].trim() !== "") ? data["最終更新"] : "不明";

    document.getElementById("period").textContent=`集計期間: ${year}/${String(month).padStart(2,'0')}/1 00:00 〜 ${lastUpdate}`;
    document.getElementById("visitor-count").textContent=`集計人数: ${data["集計人数"]||"不明"} 人`;
    document.getElementById("member-info").textContent=`No. ${data["No."]?String(data["No."]).padStart(4,'0'):"不明"}   ${data["名前"]}`;

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

    createTable("tenhan-table",[
      ["最新スコア","2","3","4","5"],
      [
        formatScore(data["最新スコア"]),
        formatScore(data["2"]),
        formatScore(data["3"]),
        formatScore(data["4"]),
        formatScore(data["5"])
      ],
      ["6","7","8","9","10"],
      [
        formatScore(data["6"]),
        formatScore(data["7"]),
        formatScore(data["8"]),
        formatScore(data["9"]),
        formatScore(data["10"])
      ]
    ],5);

    createBarChart([
      data["2"],data["3"],data["4"],data["5"],
      data["6"],data["7"],data["8"],data["9"],
      data["10"],data["最新スコア"]
    ]);

    createTable("rank-count-table",[
      ["1着の回数","2着の回数","3着の回数","4着の回数"],
      [
        `${data["1着の回数"]||0}回`,
        `${data["2着の回数"]||0}回`,
        `${data["3着の回数"]||0}回`,
        `${data["4着の回数"]||0}回`
      ],
      ["1.5着の回数","2.5着の回数","3.5着の回数",""],
      [
        `${data["1.5着の回数"]||0}回`,
        `${data["2.5着の回数"]||0}回`,
        `${data["3.5着の回数"]||0}回`,
        ""
      ]
    ],4);

    createPieChart(data);

  }catch(e){
    console.error(e);
    loader.style.display="none";
    status.textContent=`成績更新チュ♡今は見れません (${e.message})`;
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
      if (!cell || cell.toString().trim() === "") div.classList.add("empty-cell");
      table.appendChild(div);
    });
  });
}
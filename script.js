let midiData;

const dropArea = document.getElementById("dropArea");
const fileStatus = document.getElementById("fileStatus");
const midiInput = document.getElementById("midiInput");
const delayInput = document.getElementById("delayInput");

// ファイル選択クリック
document.getElementById("clickToSelect").addEventListener("click", () => {
  midiInput.click();
});

// ファイル変更時
midiInput.addEventListener("change", handleFileSelect);

// ドラッグオーバー
dropArea.addEventListener("dragover", (e) => {
  e.preventDefault();
  dropArea.style.backgroundColor = "#f7c8a4";
});

// ドラッグ解除
dropArea.addEventListener("dragleave", () => {
  dropArea.style.backgroundColor = "#fff5e1";
});

// ドロップ処理
dropArea.addEventListener("drop", async (e) => {
  e.preventDefault();
  const file = e.dataTransfer.files[0];
  await processMIDIFile(file);
});

// ファイル選択処理
async function handleFileSelect(e) {
  const file = e.target.files[0];
  await processMIDIFile(file);
}

// MIDIファイル読み込み＆表示
async function processMIDIFile(file) {
  if (file && (file.type === "audio/midi" || file.name.endsWith(".mid") || file.name.endsWith(".midi"))) {
    const arrayBuffer = await file.arrayBuffer();
    midiData = new Midi(arrayBuffer);
    fileStatus.textContent = `ファイル「${file.name}」が読み込まれました！`;
    dropArea.style.backgroundColor = "#fff5e1";
  } else {
    fileStatus.textContent = "MIDIファイルを選択してください。";
  }
}

// Strum処理実行ボタン
document.getElementById("strumButton").addEventListener("click", () => {
  if (!midiData) {
    alert("先にMIDIファイルをアップロードしてください。");
    return;
  }

  const mode = document.querySelector('input[name="strumMode"]:checked').value;
  const delayMs = parseFloat(delayInput.value) || 10;
  const delayStep = delayMs / 1000; // ミリ秒 → 秒に変換

  applyStrum(midiData, mode, delayStep);
  downloadStrummedMIDI(midiData);
});

// Strumの適用
function applyStrum(midi, mode, delayStep) {
  let isTop = (mode === "alternateTop"); // 初回の方向を設定

  midi.tracks.forEach(track => {
    const noteGroups = {};

    // ノートを時間ごとにグループ化
    track.notes.forEach(note => {
      const t = note.time.toFixed(4);
      if (!noteGroups[t]) noteGroups[t] = [];
      noteGroups[t].push(note);
    });

    // 各グループにディレイ適用
    Object.values(noteGroups).forEach(noteGroup => {
      let direction = "top";

      // モードに応じて並び順を決定
      if (mode === "alternateTop" || mode === "alternateBottom") {
        direction = isTop ? "top" : "bottom";
        isTop = !isTop;
      } else if (mode === "alwaysBottom") {
        direction = "bottom";
      }

      // 上から or 下から 並び替え
      noteGroup.sort((a, b) => {
        return direction === "top" ? b.midi - a.midi : a.midi - b.midi;
      });

      // 遅延を加える
      noteGroup.forEach((note, i) => {
        note.time += i * delayStep;
      });
    });
  });
}

// ダウンロード処理
function downloadStrummedMIDI(midi) {
  const bytes = midi.toArray();
  const blob = new Blob([new Uint8Array(bytes)], { type: "audio/midi" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "strummed.mid";
  a.click();
  URL.revokeObjectURL(url);
}

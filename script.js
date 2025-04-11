/* script.js */

let midiData;

const dropArea = document.getElementById("dropArea");
const fileStatus = document.getElementById("fileStatus");

dropArea.addEventListener("dragover", (e) => {
  e.preventDefault();
  dropArea.style.backgroundColor = "#f7c8a4"; // ドラッグ中の色変更
});

dropArea.addEventListener("dragleave", () => {
  dropArea.style.backgroundColor = "#fff5e1"; // ドラッグ離れた時
});

dropArea.addEventListener("drop", async (e) => {
  e.preventDefault();
  const file = e.dataTransfer.files[0];
  if (file && file.type === "audio/midi") {
    const arrayBuffer = await file.arrayBuffer();
    midiData = new Midi(arrayBuffer);

    // ファイル名とステータスの表示
    fileStatus.textContent = `ファイル「${file.name}」が正常に読み込まれました！`;
    dropArea.style.backgroundColor = "#fff5e1"; // ドロップ後に色を元に戻す
  } else {
    fileStatus.textContent = "MIDIファイルをドロップしてください。";
  }
});

document.getElementById("strumButton").addEventListener("click", () => {
  if (!midiData) {
    alert("Please upload a MIDI file first.");
    return;
  }

  const direction = document.querySelector('input[name="startDirection"]:checked').value;
  applyAlternatingStrum(midiData, direction === "top");
  downloadStrummedMIDI(midiData);
});

function applyAlternatingStrum(midi, startFromTop) {
  let isTop = startFromTop;
  const delayStep = 0.01; // 各ノートに対して10msのディレイ

  midi.tracks.forEach(track => {
    // 同じタイミングのノートをグループ化
    const noteGroups = {};

    track.notes.forEach(note => {
      const t = note.time.toFixed(4); // 小数点以下の桁数を揃えてグループ化
      if (!noteGroups[t]) noteGroups[t] = [];
      noteGroups[t].push(note);
    });

    // 各グループにストラムディレイを適用
    Object.values(noteGroups).forEach(noteGroup => {
      // MIDIのピッチに基づいて並び替え（選択された方向に応じて）
      noteGroup.sort((a, b) => isTop ? b.midi - a.midi : a.midi - b.midi);

      noteGroup.forEach((note, i) => {
        note.time += i * delayStep;
      });

      // 次のグループでは反対の方向を使用
      isTop = !isTop;
    });
  });
}

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

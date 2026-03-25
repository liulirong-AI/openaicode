import { onMount, For, createSignal } from "solid-js"

const WUBI_CHARS = [
  "王",
  "土",
  "大",
  "木",
  "工",
  "目",
  "日",
  "曰",
  "口",
  "田",
  "山",
  "石",
  "禾",
  "竹",
  "白",
  "血",
  "人",
  "亻",
  "入",
  "八",
  "儿",
  "匕",
  "几",
  "九",
  "刀",
  "力",
  "七",
  "乃",
  "又",
  "囗",
  "夂",
  "夊",
  "夕",
  "女",
  "子",
  "宀",
  "寸",
  "小",
  "尢",
  "屮",
  "巛",
  "己",
  "巾",
  "干",
  "幺",
  "广",
  "廴",
  "廾",
  "弋",
  "弓",
  "彐",
  "彡",
  "彳",
  "心",
  "戈",
  "戸",
  "手",
  "支",
  "攴",
  "文",
  "斗",
  "斤",
  "方",
  "无",
  "月",
  "欠",
  "止",
  "歹",
  "殳",
  "毋",
  "比",
  "毛",
  "氏",
  "气",
  "水",
  "火",
  "爪",
  "父",
  "爻",
  "爿",
  "片",
  "牙",
  "牛",
  "犬",
  "玄",
  "玉",
  "瓜",
  "瓦",
  "甘",
  "生",
  "用",
  "疋",
  "疒",
  "癶",
  "皿",
  "矛",
  "矢",
  "示",
  "禸",
  "穴",
  "立",
  "米",
  "糸",
  "纟",
  "缶",
  "网",
  "羊",
  "羽",
  "老",
  "而",
  "耒",
  "耳",
  "聿",
  "肉",
  "臣",
  "自",
  "至",
  "臼",
  "舌",
  "舛",
  "舟",
  "艮",
  "色",
  "艸",
  "虍",
  "虫",
  "行",
  "衣",
  "襾",
  "訁",
  "言",
  "決",
  "谷",
  "豆",
  "豕",
  "豸",
  "貝",
  "赤",
  "走",
  "足",
  "身",
  "車",
  "辛",
  "辰",
  "辵",
  "邑",
  "酉",
  "釆",
  "里",
  "金",
  "長",
  "門",
  "阜",
  "隶",
  "隹",
  "雨",
  "靑",
  "非",
  "面",
  "革",
  "韋",
  "韭",
  "音",
  "頁",
  "風",
  "飛",
  "食",
  "首",
  "香",
  "馬",
  "骨",
  "高",
  "髟",
  "鬥",
  "鬯",
  "鬲",
  "鬼",
  "魚",
  "鳥",
  "鹵",
  "鹿",
  "麥",
  "麻",
  "黃",
  "黍",
  "黑",
  "黹",
  "黽",
  "鼎",
  "鼓",
  "鼠",
  "鼻",
  "齊",
  "龍",
  "龜",
  "龠",
  "0",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "a",
  "b",
  "c",
  "d",
  "e",
  "f",
  "g",
  "h",
  "i",
  "j",
  "k",
  "l",
  "m",
  "n",
  "o",
  "p",
  "q",
  "r",
  "s",
  "t",
  "u",
  "v",
  "w",
  "x",
  "y",
  "z",
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
  "M",
  "N",
  "O",
  "P",
  "Q",
  "R",
  "S",
  "T",
  "U",
  "V",
  "W",
  "X",
  "Y",
  "Z",
]

interface Column {
  id: number
  x: number
  chars: string[]
  delay: number
  duration: number
  fontSize: number
}

export function WubiFallingBackground() {
  const [columns, setColumns] = createSignal<Column[]>([])
  const numColumns = 150

  const initColumns = () => {
    const data: Column[] = []
    const colWidth = 100 / numColumns
    for (let i = 0; i < numColumns; i++) {
      const charCount = 8 + Math.floor(Math.random() * 12)
      const chars: string[] = []
      for (let j = 0; j < charCount; j++) {
        chars.push(WUBI_CHARS[Math.floor(Math.random() * WUBI_CHARS.length)])
      }
      data.push({
        id: i,
        x: i * colWidth + Math.random() * (colWidth * 0.5),
        chars,
        delay: Math.random() * -15,
        duration: 8 + Math.random() * 6,
        fontSize: 14 + Math.random() * 8,
      })
    }
    setColumns(data)
  }

  onMount(() => {
    initColumns()
  })

  return (
    <div class="absolute inset-0 overflow-hidden pointer-events-none" style={{ "z-index": 0 }}>
      <For each={columns()}>
        {(col) => (
          <div
            class="absolute select-none"
            style={{
              left: `${col.x}%`,
              top: 0,
              "font-family": "monospace",
              "font-size": `${col.fontSize}px`,
              animation: `matrixFall ${col.duration}s linear infinite`,
              "animation-delay": `${col.delay}s`,
            }}
          >
            <For each={col.chars}>
              {(char, index) => (
                <div
                  style={{
                    color:
                      index() === col.chars.length - 1 ? "#ffd700" : `rgba(255, 215, 0, ${0.1 + Math.random() * 0.15})`,
                    "text-shadow":
                      index() === col.chars.length - 1
                        ? `0 0 8px rgba(255, 215, 0, ${0.4 + Math.random() * 0.6}), 0 0 15px rgba(255, 215, 0, ${0.2 + Math.random() * 0.4})`
                        : `0 0 ${3 + Math.random() * 3}px rgba(255, 215, 0, ${0.1 + Math.random() * 0.15})`,
                    opacity: 0.4 + Math.random() * 0.2,
                    "line-height": "1.2",
                  }}
                >
                  {char}
                </div>
              )}
            </For>
          </div>
        )}
      </For>
      <style>{`
        @keyframes matrixFall {
          0% {
            transform: translateY(-100%);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(100vh);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  )
}

# Themes 配置

## 概述

Themes 允许自定义 OpenAiCode 的外观主题。

## 主题目录

主题文件位于 `.opencode/themes/` 目录：

```
.opencode/
└── themes/
    └── mytheme.json
```

## 主题文件格式

```jsonc
{
  "name": "My Theme",
  "type": "dark", // 或 "light"
  "variables": {
    "--background-base": "#1a1a1a",
    "--background-stronger": "#2a2a2a",
    "--text-base": "#ffffff",
    "--text-weak": "#aaaaaa",
    "--accent-base": "#007acc",
    "--accent-strong": "#0098ff",
    "--border-base": "#3a3a3a",
    "--border-weak": "#2a2a2a",
    "--icon-base": "#888888",
    "--icon-interactive-base": "#cccccc",
  },
}
```

## 变量列表

### 背景色

| 变量                    | 说明         |
| ----------------------- | ------------ |
| `--background-base`     | 主背景色     |
| `--background-stronger` | 更深的背景色 |
| `--background-weaker`   | 更浅的背景色 |

### 文本色

| 变量            | 说明       |
| --------------- | ---------- |
| `--text-base`   | 主文本色   |
| `--text-strong` | 强调文本色 |
| `--text-weak`   | 弱化文本色 |

### 强调色

| 变量              | 说明     |
| ----------------- | -------- |
| `--accent-base`   | 主强调色 |
| `--accent-strong` | 强强调色 |
| `--accent-weaker` | 弱强调色 |

### 边框色

| 变量              | 说明       |
| ----------------- | ---------- |
| `--border-base`   | 主边框色   |
| `--border-strong` | 强调边框色 |
| `--border-weak`   | 弱化边框色 |

### 图标色

| 变量                      | 说明         |
| ------------------------- | ------------ |
| `--icon-base`             | 主图标色     |
| `--icon-strong`           | 强调图标色   |
| `--icon-weak`             | 弱化图标色   |
| `--icon-interactive-base` | 可交互图标色 |

## 使用主题

在配置文件中指定主题：

```jsonc
{
  "theme": "mytheme",
}
```

或者使用完整路径：

```jsonc
{
  "theme": "./themes/mytheme.json",
}
```

## 创建自定义主题

1. 在 `.opencode/themes/` 目录创建 JSON 文件
2. 定义主题名称和类型
3. 定制颜色变量
4. 在配置中启用主题

## 示例：深色主题

```jsonc
{
  "name": "Midnight",
  "type": "dark",
  "variables": {
    "--background-base": "#0d1117",
    "--background-stronger": "#161b22",
    "--text-base": "#c9d1d9",
    "--accent-base": "#58a6ff",
  },
}
```

## 示例：浅色主题

```jsonc
{
  "name": "Light",
  "type": "light",
  "variables": {
    "--background-base": "#ffffff",
    "--background-stronger": "#f6f8fa",
    "--text-base": "#24292f",
    "--accent-base": "#0969da",
  },
}
```

## 相关资源

- [配置帮助](./config.md)

# 架构与交互设计说明书 (Design) - 代码风水罗盘

## 1. 整体架构拓扑
```
[ 浏览器客户端: 赛博罗盘 HUD (HTML5 + Web Audio + CSS3) ]
                           │
                 POST /api/analyze (JSON)
                 POST /api/consecrate (JSON)
                           ▼
[ Python 轻量后端 API 网关: server.py (Port 8788) ]
                           │
              调用真实词法与 AST 解析器
                           ▼
[ 硬核 AST 堪舆引擎: fengshui_ast.py (Python ast + Regex Tokenizer) ]
```

## 2. 罗盘动力学与五行色彩规范
- **底色 (Deep Ink Obsidian)**: `#07080b`
- **卡片底色 (Surface Elevated)**: `#151824`
- **五行色谱**:
  - 火 (火煞/祖坟黑烟): `#f43f5e` (辰砂红)
  - 金 (金煞/困龙死锁): `#f59e0b` (鎏金)
  - 水 (水煞/九阴穿心): `#3b82f6` (天青)
  - 木 (木煞/破财失窃): `#10b981` (碧玉)
  - 土 (土煞/龙脉淤塞): `#8b5cf6` (玄紫)

## 3. Web Audio 原生法器声学模型
- **铜磬 (Bowing Bowl)**: `587.33Hz (D5)` 正弦波，指数衰减 1.2s；
- **木鱼 (Temple Block)**: `440Hz → 160Hz` 三角波快速跌落，0.2s 敲击；
- **雷霆化煞金钟 (Consecration Thunder Bell)**: 双振荡器 `220Hz + 880Hz` 复合泛音。

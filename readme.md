# MathMap

MathMap 是一个基于 React 的交互式数学推导图谱编辑器。它采用节点化（Node-based）的方式组织数学概念，支持通过动态插槽将静态公式转化为可交互、可导航的知识网络。

## 核心特性


*   **LaTeX 模板引擎**：支持在 LaTeX 公式中插入动态“插槽” (`{{key}}`)，插槽可以是文本、其他节点的链接或交互式变量。
*   **实时渲染**：所见即所得的数学公式编辑，支持复杂的数学符号。
*   **富文本提示框 (Tooltips)**：鼠标悬停在公式变量上时，可显示 Markdown 文本、LaTeX 公式甚至 **SVG 矢量图**（非常适合展示函数图像）。
*   **场景与内容分离**：一个核心概念（Content）可以在画布（Scene）中被多次引用，方便构建复杂的交叉引用图谱。
*   **力导向布局**：基于物理引擎的自动布局，支持拖拽、缩放和节点锁定。
*   **Git 风格大纲**：左侧侧边栏提供类似 Git Graph 的线性大纲视图，方便快速导航。


## 使用指南

### 创建交互节点

以定义 **德布罗意关系 (De Broglie Relations)** 为例：

1.  **编写模板**
    在编辑器中输入 LaTeX 模板：
    ```latex
    \begin{cases} p = \hbar k & \text{ {{k_rel}} } \\ E = \hbar \omega & \text{ {{w_rel}} } \end{cases}
    ```

2.  **配置片段 (Segments)**
    系统解析出 `k_rel` 和 `w_rel` 后，进行如下配置：

    *   **k_rel**:
        *   Type: `Link`
        *   Text: `(p \to k)`
        *   Target: 选择或创建 `tut_plane_wave` (平面波函数节点)
    *   **w_rel**:
        *   Type: `Text`
        *   Text: `(E \to \omega)`

3.  **渲染结果**
    在画布中，公式中的 `(p -> k)` 将变为可点击链接，引导用户查看平面波函数的定义，从而建立从粒子性到波动性的推导逻辑。

### 节点类型规范

| 类型 | 标识颜色 | 语义用途 |
| :--- | :--- | :--- |
| **Axiom** | Red | 公理、定律、起始假设 (如能量守恒) |
| **Definition** | Purple | 定义式 (如平面波函数) |
| **Derivation** | Blue | 推导过程、算子提取 (如时间/空间导数) |
| **Theorem** | Green | 最终定理/结论 (如薛定谔方程) |
| **Note** | Gray | 纯文本说明、背景介绍 |

## 🚀 快速开始

1.  **导入示例**：点击右下角的 **Import** 按钮，选择 `example.mathmap` 文件。
2.  **新建节点**：点击左上角的 **+** 按钮或使用快捷键，选择节点类型。
3.  **编辑内容**：双击节点或右键选择 "Edit" 进入编辑模式。
4.  **连接节点**：在编辑器的 "Segments" 中将类型设置为 "Link"，并输入目标节点的 ID。

---

## 🎓 教程：如何创建一个交互式节点

以创建一个 **“速度定义”** 节点为例：

### 第一步：定义模板
在编辑器的 **LaTeX Template** 区域输入：
```latex
v = \frac{d {{pos}} }{d {{time}} }
```
注意 `{{pos}}` 和 `{{time}}` 是我们预留的插槽。

### 第二步：配置交互片段 (Segments)
在右侧的 **Interactive Segments** 面板中，你会看到系统自动识别出了 `pos` 和 `time`。

1.  **配置 `pos` (位移)**:
    *   **Text**: 输入 `x`
    *   **Type**: 选择 `Link` (链接)
    *   **Target ID**: 输入另一个节点的 ID (例如 `node_position`)
    *   **Color**: 选择一个醒目的颜色 (如蓝色)

2.  **配置 `time` (时间)**:
    *   **Text**: 输入 `t`
    *   **Type**: 选择 `Text` (纯文本)
    *   **Tooltip Settings**:
        *   展开折叠面板。
        *   **Content Type**: 选择 `Markdown`。
        *   **Content**: 输入 "时间是独立变量"。

### 第三步：保存
点击保存，你现在拥有了一个动态的数学公式节点！点击 $x$ 会跳转，悬停 $t$ 会显示解释。

---

## 🧩 节点类型

| 类型 | 颜色建议 | 用途 |
| :--- | :--- | :--- |
| **Axiom (公理)** | 🔴 Red | 起始假设、核心定律 (如 F=ma)。 |
| **Default (默认)** | 🔵 Blue | 推导步骤、中间过程。 |
| **Constant (常数)** | 🟡 Amber | 物理常数 (如 G, π)。 |
| **Parameter (参数)** | 🟢 Green | 变量、输入参数 (如 x, v)。 |
| **Note (便签)** | ⚪ Gray | 纯文本备注，用于解释思路。 |

---

## 📂 文件结构 (.mathmap)

`.mathmap` 文件是标准的 JSON 格式，包含三个主要部分：

1.  **`metadata`**: 文件名、描述和生成时间。
2.  **`library`**: **内容库**。存储所有节点的“灵魂”（标题、LaTeX 模板、交互逻辑）。Key 是唯一的 `contentId`。
3.  **`scene`**: **场景布局**。存储节点的“肉体”（位置坐标 `x, y`、颜色、是否固定 `fx, fy`）以及节点之间的连线 `links`。

这种分离设计意味着你可以修改一个公理的内容，所有引用该公理的节点都会自动更新。

---
# for Developers

## TODO

- [x] add pixel theme 
- [x] update "minimal" style, only show formula with a simple border, the title and note are hidden by default, only show when hover. we need the node line connect formular interactive math elements with same key and next node border with a solid line.
- [x] add node libary management panel (at right side). for now, node can has new properties: tags (array of string). we can filter node in library panel by tags. and also we can create node folder in library panel to organize node better. node library can be search by title/content/tags. and also we can drag node from library panel to canvas to create new node, or drag node in libaray. this library can be load/save to a mathmap file, which metadata show that is a library file. and we can import/export library file to share node library with other user. all this need UI design. 
- [x] muilt select nodes and drag to move, and give right click menu to align nodes (left, right, top, bottom, center), and also add muilt select options in the node panel (explorer, library)
- [x] auto save and keep setting history
- [x] add do/undo functionality
- [ ] add export to png/svg/pdf
- [ ] build as electron app

## FixMe

- [ ] when we open explorer - item - right click - show, it take a long time to response. find bug

## Data Structures and File Format

MathMap project files (`.mathmap`) are stored in JSON format. The core is composed of `library` and `scene` sections, reflecting a Model (library) / View (scene) separation.

### 1. Library (Content Library)
Stores node metadata, LaTeX templates, and interactive logic. Keys are globally unique `contentId`s.

```json
"library": {
    "tut_classical_energy": {
        "title": "Classical Total Energy",
        "type": "axiom",
        "template": "E = {{kinetic}} + {{potential}}",
        "segments": {
            "kinetic": {
                "text": "\\frac{p^2}{2m}",
                "type": "link",
                "target": "tut_de_broglie",
                "connectionLabel": "Quantize"
            },
            "potential": {
                "text": "V(x)",
                "type": "text",
                "tooltip": {
                    "contentType": "svg",
                    "content": "<svg>...</svg>" // SVG path data
                }
            }
        }
    }
}
```

- `template`: Defines the formula structure; `{{kinetic}}` and `{{potential}}` are dynamic slots.
- `segments`: Defines behavior for each slot.
    - `kinetic` is defined as a Link that navigates to `tut_de_broglie`.
    - `potential` is defined as Text and shows an SVG image on hover.

### 2. Scene (Scene Layout)
Stores instantiated node state on the canvas, coordinates, and connection relationships.

```json
"scene": {
    "nodes": [
        {
            "id": "n2",
            "contentId": "tut_classical_energy",
            "x": 839.31,
            "y": 234.51
        }
    ],
    "links": [
        {
            "source": "n1",
            "target": "n2"
        }
    ],
    "expandedState": {
        "n2-kinetic": "tut_de_broglie_1767000614528"
    }
}
```

- `nodes`: Instances referencing `contentId`. Multiple nodes can reference the same `contentId`.
- `expandedState`: Records current interactive state (for example: which target node the `kinetic` slot of node `n2` is expanded to).

This separation allows editing a content entry to update all scene instances that reference it.

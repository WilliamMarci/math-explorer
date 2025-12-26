# MathMap - 可视化数学推导编辑器

MathMap 是一个基于节点的非线性思维导图工具，专为数学推导、物理公式解析和知识图谱构建而设计。它允许你通过 LaTeX 编写动态公式，并通过可视化连线将概念、公理和推导步骤有机地连接起来。

## ✨ 核心特性

*   **LaTeX 模板引擎**：支持在 LaTeX 公式中插入动态“插槽” (`{{key}}`)，插槽可以是文本、其他节点的链接或交互式变量。
*   **实时渲染**：所见即所得的数学公式编辑，支持复杂的数学符号。
*   **富文本提示框 (Tooltips)**：鼠标悬停在公式变量上时，可显示 Markdown 文本、LaTeX 公式甚至 **SVG 矢量图**（非常适合展示函数图像）。
*   **场景与内容分离**：一个核心概念（Content）可以在画布（Scene）中被多次引用，方便构建复杂的交叉引用图谱。
*   **力导向布局**：基于物理引擎的自动布局，支持拖拽、缩放和节点锁定。
*   **Git 风格大纲**：左侧侧边栏提供类似 Git Graph 的线性大纲视图，方便快速导航。

---

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

## features

### mathnode


## TODO

- [ ] muilt select nodes and drag to move, and give right click menu to align nodes (left, right, top, bottom, center), and also add muilt select options in the node panel (explorer, library)
- [ ] add "minimal" style, only show formula with a simple border, the title and note are hidden by default, only show when hover. and the node line connect formular interactive math elements with same key and next node border with a solid line.
- [ ] auto save and setting history version
- [ ] add node libary management panel
- [ ] add do/undo functionality
- [ ] add pixel theme 
- [ ] add export to png/svg/pdf
- [ ] build as electron app
# Khảo Sát, Phân Loại & Kế Hoạch Tinh Giản Toàn Bộ UI Pages & Sidebar OmniRoute Theo Mô Hình 9router

> **Tài liệu kiểm toán giao diện & kiến trúc điều hướng (Subagent 1 - UI & Navigation Audit)**  
> **Ngày thực hiện:** 28/10/2026  
> **Nhánh:** `feat/apple-minimalist-ui`  
> **Mục tiêu:** Tinh giản triệt để OmniRoute từ một giao diện cồng kềnh, phân mảnh (96 sidebar items, 124 dashboard pages) thành một **Clean Minimal Gateway chuẩn mực như 9router**, đồng thời bảo tồn trọn vẹn điểm mạnh cốt lõi là **hỗ trợ 375+ AI providers**.

---

## 1. Khảo Sát Toàn Diện Sidebar Hiện Tại (`sections.ts`)

### 1.1. Thống Kê Tổng Quan

- **Tổng số Sections cấp 1:** 10 sections (`home`, `omni-proxy`, `analytics`, `costs`, `monitoring`, `devtools`, `agentic-features`, `other-features`, `configuration`, `help`).
- **Tổng số Groups con:** 8 groups (`compression-context`, `tools`, `integrations`, `logs`, `system`, `audit`, `gamification`, `batch`).
- **Tổng số Navigation Items:** 96 items (gồm các items cấp cao và items trong nhóm con).
- **Mức độ phân mảnh:** Rất cao. Người dùng mới bị choáng ngợp bởi hàng loạt tính năng thử nghiệm, rác gamification, và sự xé nhỏ quá mức của các chức năng cơ bản.

### 1.2. Bảng Phân Bổ Chi Tiết 10 Sections

| STT | Section ID         | Tên Hiển Thị     | Số Mục | Nhóm Con (Groups)                                           | Đánh Giá Tải Nhận Thức (Cognitive Load)                                                               |
| --- | ------------------ | ---------------- | :----: | ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| 1   | `home`             | Home             |   1    | Không                                                       | Cốt lõi, tối giản.                                                                                    |
| 2   | `omni-proxy`       | OmniProxy        |   36   | `compression-context` (14), `tools` (9), `integrations` (3) | **Cực kỳ quá tải**. Nhồi nhét từ 14 trang thuật toán nén đến terminal Claude Code và mạng lưới agent. |
| 3   | `analytics`        | Analytics        |   8    | Không                                                       | Phân tán (combo health, utilization, evals, compression...).                                          |
| 4   | `costs`            | Costs            |   6    | Không                                                       | Phân tán (pricing, budget, free tiers, rankings, radar).                                              |
| 5   | `monitoring`       | Monitoring       |   13   | `logs` (5), `audit` (3), `system` (4)                       | Xé nhỏ logs thành 5 trang (proxy, console, timeline, activity...).                                    |
| 6   | `devtools`         | Dev Tools        |   3    | Không                                                       | Chứa Playground (cốt lõi) lẫn Translator, Search Tools.                                               |
| 7   | `agentic-features` | Agentic Features |   7    | Không                                                       | Tính năng thử nghiệm (Chaos mode, A2A, MCP, Memory, Skills).                                          |
| 8   | `other-features`   | Other Features   |   7    | `gamification` (4), `batch` (2)                             | **Bloat hoàn toàn** (Token ảo, leaderboard, profile, batch files).                                    |
| 9   | `configuration`    | Configuration    |   12   | Không                                                       | **Trùng lặp & dư thừa**: Liệt kê 12 tab settings trực tiếp ra menu chính.                             |
| 10  | `help`             | Help             |   3    | Không                                                       | Phù hợp làm menu phụ / footer.                                                                        |

---

## 2. So Sánh Với Kiến Trúc Chuẩn Của 9router

**9router** được đánh giá cao nhờ kiến trúc tập trung, trực quan, không thừa thãi. Mục tiêu tối thượng của một AI Gateway là: **Kết nối ứng dụng AI với các mô hình một cách ổn định, nhanh chóng, minh bạch và dễ cấu hình nhất.**

### 2.1. Đối Chiếu 7 Trụ Cột 9router vs OmniRoute Hiện Tại

| 9router (Chuẩn Tối Giản) | Mục Đích & UX Cốt Lõi                                                                     | Tình Trạng OmniRoute Hiện Tại                                                                                    | Đề Xuất Chuyển Đổi Cho OmniRoute                                                                                     |
| ------------------------ | ----------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| **1. Home / Overview**   | Xem trạng thái Gateway, Endpoint URL, Ping, Active Providers, Requests count, Quick cURL. | Có `/home` nhưng bị chèn 4 banner quảng cáo/sponsor, kèm quá nhiều metric phụ.                                   | Giữ `/home`, làm sạch banners, thẻ Quick Start Apple Minimalist, hiển thị trạng thái gateway và số provider online.  |
| **2. Providers**         | Quản lý API Key upstream của các nhà cung cấp (OpenAI, Anthropic, Gemini, Groq...).       | Có `/dashboard/providers`, hỗ trợ **375+ providers** (lợi thế số 1). Nhưng bị phân mảnh với `embedded-services`. | **GIỮ VỮNG 100% 375+ PROVIDERS**. Tối ưu lưới Provider Card phẳng, search nhanh, trạng thái kết nối rõ ràng.         |
| **3. Models & Combos**   | Xem danh mục model khả dụng, đặt model aliases, cấu hình fallback cascading.              | Bị tách thành 2 section xa nhau: `model-catalog` và `combos`, kèm `combos-live`, `combos/playground`.            | Nhóm thành một khu vực thống nhất **Models & Routing**: Danh mục model + Cascade fallback combos.                    |
| **4. API Keys**          | Cấp phát khóa Gateway (`sk-omni-...`) cho Claude Code, Cursor, Codex, OpenCode.           | Nằm ở `api-manager` với subpage `routing` và modal cấu hình phức tạp.                                            | Giữ `/dashboard/api-manager` với bảng Key tinh giản, nút Create Key nổi bật, khung copy cURL chuẩn Apple.            |
| **5. Logs & Usage**      | Nhật ký gọi API thời gian thực (status, latency, tokens, error) + Biểu đồ token usage.    | Bị băm vụn thành 13 trang khác nhau trong `monitoring` và `analytics`.                                           | Hợp nhất vào một trang **Logs & Usage** duy nhất: Bảng Request Logs thời gian thực + Drawer xem payload + Tab Usage. |
| **6. Playground**        | Giao diện chat trực tiếp để thử nghiệm prompt, kiểm tra stream SSE của model/provider.    | Bị giấu sâu trong `devtools -> playground` và `combos/playground`.                                               | Đưa **Playground** lên vị trí trang trọng hàng đầu trên menu chính.                                                  |
| **7. Settings**          | Cấu hình cổng port, proxy upstream, cache, bảo mật, giao diện sáng/tối.                   | Xé nhỏ thành 12 mục sidebar riêng biệt làm ngập tràn thanh điều hướng.                                           | Gom thành **1 mục Settings duy nhất** trên sidebar, bên trong dùng Segmented Control / Apple Tabs.                   |

---

## 3. Đánh Giá & Phân Loại Toàn Bộ 57 Thư Mục Trong `src/app/(dashboard)/dashboard/`

Toàn bộ 124 trang được phân loại thành 3 nhóm rõ rệt:

### 3.1. NHÓM 1: BLOAT TRIỆT ĐỂ (Cần Loại Bỏ Khỏi Navigation & Vô Hiệu Hóa)

Các tính năng sau đây đi ngược lại hoàn toàn với bản chất của một AI Gateway nhẹ nhàng, gây phình to mã nguồn và làm rối người dùng:

1. **Gamification & Virtual Currency (Rác 100%)**:
   - `tokens/`: Ví token ảo, lịch sử giao dịch coin, chuyển tiền token giữa người dùng.
   - `leaderboard/`: Bảng xếp hạng thành viên, đua top điểm thưởng.
   - `profile/`: Hồ sơ người dùng với huy hiệu (badges) và level XP.
   - `gamification/admin/`: Quản trị cộng trừ điểm thưởng.
2. **14 Trang Con Thuật Toán Nén Ngữ Cảnh (Fragmented Compression UI)**:
   - `context/caveman`, `context/rtk`, `context/headroom`, `context/session-dedup`, `context/ccr`, `context/llmlingua`, `context/lite`, `context/aggressive`, `context/ultra`, `context/omniglyph`, `context/combos`, `context/settings`.
   - `compression/studio`, `compression/exclusions`, `compression/live`.
     _(Đánh giá: Nén prompt là middleware backend xử lý ngầm. Không gateway nào trưng bày 14 trang web riêng cho 14 hàm nén)._
3. **Autonomous Agents Fleets & Web IDE (Nặng nề & Lạc đề)**:
   - `conductor/`: Fleet quản lý CLI agents.
   - `cloud-agents/`: Điều phối agent trên cloud.
   - `acp-agents/`: Agent Client Protocol runner.
   - `cli-agents/`: Quản lý tiến trình CLI agent.
   - `cli-code/`: Trình duyệt nhúng terminal Claude Code (chiếm 400KB code UI).
   - `orchestration/`: Bộ soạn thảo kéo thả node-graph workflow agents (248KB code UI).
   - `tools/agent-bridge/`: Cầu nối socket giữa các agent.
   - `tools/traffic-inspector/`: Bắt gói tin agent socket.
   - `discovery/`: Quét cổng mạng nội bộ.
4. **Chaos Mode & Speculative Protocols**:
   - `chaos/`: Giả lập mạng chập chờn, lỗi rớt gói, delay ngẫu nhiên.
   - `a2a/`: Giao thức thử nghiệm Agent-to-Agent.
   - `audit/a2a/` & `audit/mcp/`: Audit logs cho giao thức thử nghiệm.
   - `agent-skills/` & `omni-skills/`: Thư viện kỹ năng cho agent.
   - `memory/`: Trình duyệt bộ nhớ vector dài hạn.
5. **Batch Processing UI**:
   - `batch/` & `batch/files/`: Trình tải file JSONL và chạy batch queries (208KB).
6. **Scraping & Gimmick Features**:
   - `free-provider-rankings/`: Bảng xếp hạng các nhà cung cấp free.
   - `radar/` (setup, offers, combos, intel): Bot quét deal token giá rẻ.
   - `free-tiers/`: Theo dõi quota các gói miễn phí.
   - `translator/`: Giao diện dịch prompt.
   - `search-tools/`: Web search qua Tavily/Brave.
   - `cache/media/`: Trình duyệt ảnh/audio cache.

### 3.2. NHÓM 2: CỐT LÕI (CORE - Bảo Tồn & Tinh Giản Theo 9router)

Những trang này là xương sống của OmniRoute, bắt buộc giữ lại và nâng cấp giao diện chuẩn Apple Minimalist:

1. **Home / Dashboard Overview** (`/home`):
   - Thẻ Gateway Status (Host, Port, Ping, Trạng thái Sẵn sàng).
   - Thẻ Quick Connect (Endpoint cURL snippet + Copy 1-click).
   - Metrics tổng quan: Active Providers (vd: 35/375+), Total Requests, Token Consumed.
2. **Providers Manager** (`/dashboard/providers`):
   - **Bảo tồn toàn vẹn 375+ Providers** (OpenAI, Anthropic, Gemini, DeepSeek, Groq, Mistral, OpenRouter, Together, Fireworks, v.v.).
   - Giao diện lưới Provider Card phẳng, tìm kiếm tức thì, lọc theo trạng thái (Configured / Unconfigured).
   - Modal/Drawer cấu hình API key upstream, Base URL và test latency.
3. **Models & Fallback Combos** (`/dashboard/models` và `/dashboard/combos`):
   - Danh mục model từ tất cả provider đã kết nối.
   - Bảng thiết lập chuỗi dự phòng (Fallback Cascade): ví dụ `claude-3-5-sonnet` -> `gpt-4o` -> `deepseek-chat`.
4. **API Keys / Gateway Access** (`/dashboard/api-manager`):
   - Quản lý khóa truy cập cổng cấp cho client ứng dụng (Cursor, Claude Code, Cline, SDK).
   - Đặt giới hạn Quota, Rate Limit (RPM/TPM), Allowed Models.
5. **Logs & Analytics** (`/dashboard/logs` và `/dashboard/analytics`):
   - Bảng nhật ký gọi API thời gian thực: Thời gian, Model, Provider, Trạng thái (200/429/500), Độ trễ, Tokens.
   - Drawer xem chi tiết Request/Response payload.
   - Thống kê lượng token và chi phí ước tính.
6. **Playground** (`/dashboard/playground`):
   - Khung chat thử nghiệm trực tiếp, chọn Model/Combo, nhập prompt, test streaming SSE, kiểm tra system instructions.
7. **Settings** (`/dashboard/settings`):
   - Cài đặt tập trung hệ thống cổng: Cổng mạng, Proxy upstream, Cache, Bảo mật, Giao diện.

### 3.3. NHÓM 3: HỢP NHẤT & DỌN DẸP TRÙNG LẶP (Consolidation)

- **12 Subpages Settings** trên sidebar: Gom toàn bộ vào trong `/dashboard/settings` thông qua `SettingsLayoutShell` (đã có sẵn layout kiểu macOS Settings). Sidebar chính chỉ hiển thị đúng **1 mục Settings**.
- **Endpoints & API Endpoints**: Hợp nhất thông tin cURL/Base URL vào thẻ Quick Start trên trang Home và trang API Keys.
- **Costs, Budget & Pricing**: Tích hợp các bảng giá vào tab con của Models hoặc Analytics, không tách thành section riêng.

---

## 4. Kế Hoạch Cấu Trúc Lại Menu Điều Hướng (`SIDEBAR_SECTIONS`)

### 4.1. Cấu Trúc Menu Mới (Chuẩn 9router Tối Giản)

Thay thế hoàn toàn 10 sections cồng kềnh bằng cấu trúc phẳng **7 mục chính + 1 nhóm phụ (Footer/Help)**:

```
+----------------------------------------------+
|  OMNIROUTE (Clean Minimal Gateway)           |
+----------------------------------------------+
|  GATEWAY (Core Path)                         |
|    [Home]          Home         (/home)      |
|    [Dns]           Providers    (/dashboard/providers)     (375+ Providers)
|    [ViewList]      Models       (/dashboard/models)        (Catalog & Combos)
|    [VpnKey]        API Keys     (/dashboard/api-manager)   (Gateway Access)
|    [Description]   Logs         (/dashboard/logs)          (Realtime Traffic)
|    [Science]       Playground   (/dashboard/playground)    (Test Console)
|    [Settings]      Settings     (/dashboard/settings)      (System Config)
|                                              |
|  DOCUMENTATION & SUPPORT                     |
|    [MenuBook]      Docs         (/docs)      |
|    [BugReport]     GitHub       (External)   |
+----------------------------------------------+
```

### 4.2. Mã Nguồn Đề Xuất Cho `src/shared/constants/sidebarVisibility/sections.ts`

```typescript
import type { SidebarItemDefinition, SidebarSectionDefinition } from "./types";

// --- Core 9router Navigation Items ---

const CORE_GATEWAY_ITEMS: readonly SidebarItemDefinition[] = [
  {
    id: "home",
    href: "/home",
    i18nKey: "home",
    labelFallback: "Home",
    icon: "home",
    exact: true,
  },
  {
    id: "providers",
    href: "/dashboard/providers",
    i18nKey: "providers",
    labelFallback: "Providers",
    subtitleFallback: "375+ AI Providers",
    icon: "dns",
  },
  {
    id: "model-catalog",
    href: "/dashboard/models",
    i18nKey: "modelCatalog",
    labelFallback: "Models & Routing",
    subtitleFallback: "Models catalog & fallback combos",
    icon: "view_list",
  },
  {
    id: "api-manager",
    href: "/dashboard/api-manager",
    i18nKey: "apiManager",
    labelFallback: "API Keys",
    subtitleFallback: "Gateway access tokens",
    icon: "vpn_key",
  },
  {
    id: "logs",
    href: "/dashboard/logs",
    i18nKey: "logs",
    labelFallback: "Logs & Usage",
    subtitleFallback: "Realtime requests & metrics",
    icon: "description",
  },
  {
    id: "playground",
    href: "/dashboard/playground",
    i18nKey: "playground",
    labelFallback: "Playground",
    subtitleFallback: "Test chat & verify models",
    icon: "science",
  },
  {
    id: "settings-general",
    href: "/dashboard/settings",
    i18nKey: "settingsGeneral",
    labelFallback: "Settings",
    subtitleFallback: "Gateway configuration",
    icon: "settings",
  },
];

const SECONDARY_HELP_ITEMS: readonly SidebarItemDefinition[] = [
  {
    id: "docs",
    href: "/docs",
    i18nKey: "docs",
    labelFallback: "Documentation",
    icon: "menu_book",
    external: true,
  },
  {
    id: "issues",
    href: "https://github.com/Hungzazed/OmniRoute/issues",
    i18nKey: "issues",
    labelFallback: "GitHub",
    icon: "bug_report",
    external: true,
  },
];

// --- Tinh Giản Toàn Bộ Sections: Từ 10 Sections Xuống 2 Sections Gọn Gàng ---

export const SIDEBAR_SECTIONS: readonly SidebarSectionDefinition[] = [
  {
    id: "omni-proxy",
    titleKey: "gatewaySection",
    titleFallback: "Gateway",
    children: CORE_GATEWAY_ITEMS,
    showTitle: false,
  },
  {
    id: "help",
    titleKey: "helpSection",
    titleFallback: "Help & Docs",
    children: SECONDARY_HELP_ITEMS,
    showTitle: true,
  },
] as const;
```

---

## 5. Lộ Trình Triển Khai (Action Plan)

1. **Bước 1 (Navigation Refactor)**: Cập nhật `src/shared/constants/sidebarVisibility/sections.ts` và tinh chỉnh `types.ts` để thu gọn thanh điều hướng theo đúng mô hình 7 mục trên.
2. **Bước 2 (Route Protection & Back-compat)**: Giữ nguyên các handler API của 375+ providers và core router (`open-sse/`); đặt cờ chuyển hướng (redirect) cho các URL cũ sang các trang chính tương ứng để không làm đứt gãy link bookmark cũ.
3. **Bước 3 (Dọn Dẹp Layout & Trang Chủ)**: Xóa bỏ 4 banner quảng cáo/sponsor khỏi `/home/page.tsx`, tinh chỉnh thẻ Quick Start cURL và danh sách trạng thái provider online.
4. **Bước 4 (Settings Unification)**: Đảm bảo trang `/dashboard/settings` quản lý đầy đủ các thiết lập cốt lõi (General, Routing, Security, Appearance) mà không cần hiển thị các tab con lên sidebar.
5. **Bước 5 (Kiểm Thử & Đóng Gói)**: Chạy toàn bộ test suites `vitest` và `node test`, đảm bảo không có lỗi hồi quy trước khi tạo Pull Request.

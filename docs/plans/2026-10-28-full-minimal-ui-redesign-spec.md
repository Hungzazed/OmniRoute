# Đặc tả Kỹ thuật & Yêu cầu Tái thiết kế Giao diện Toàn diện OmniRoute (Minimalist UI)

## 1. Mục tiêu & Triết lý Thiết kế
Tái thiết kế toàn bộ giao diện bảng điều khiển (Dashboard) của OmniRoute theo trường phái **Apple Minimalist UI** kết hợp **Clean Minimal Architecture**:
- **Tối giản thị giác**: Loại bỏ triệt để màu mè gây rối mắt, dải gradient xiên, viền phát sáng (glow), font serif báo giấy lỗi thời và các khối quảng cáo/sponsor lộn xộn.
- **Tập trung vào dữ liệu và chức năng**: Nội dung, trạng thái gateway, số lượng model, token tiêu thụ và log truy vấn phải nổi bật, rõ ràng và dễ đọc.
- **Nhất quán qua Design System (DS)**: Tất cả các trang bắt buộc sử dụng Design Tokens và Primitives chung (`@omniroute/ui-kit` và `@/shared/components`). Tuyệt đối không hardcode inline styles hoặc tự chế component con rời rạc.

---

## 2. Tiêu chuẩn Design System (DS)

### 2.1. Bảng màu (Tokens)
- **Light Theme**:
  - Background (Canvas): `#FFFFFF`
  - Surface (Cards/Containers): `#FFFFFF` (viền `border-border/40` hoặc `#E5E5EA`)
  - Surface Muted: `#F5F5F7`
  - Text Primary: `#1D1D1F` (tương phản cao, sắc nét)
  - Text Muted: `#86868B`
  - Accent (System Blue): `#007AFF`
  - Status: Thành công (Emerald `#34C759`), Cảnh báo (Amber `#FF9500`), Lỗi (Rose `#FF3B30`), Neutral (`#8E8E93`).
- **Dark Theme (OLED Minimalist)**:
  - Background: `#000000` (True Black)
  - Surface: `#1C1C1E` / Surface 2: `#2C2C2E`
  - Text Primary: `#FFFFFF`
  - Text Muted: `#8E8E93`
  - Accent: `#0A84FF`
  - Border: `rgba(255, 255, 255, 0.08)` hoặc `#38383A`.

### 2.2. Typography (Kiểu chữ)
- Font chuẩn: `--ci-font-ui` (Inter / SF Pro / system sans-serif).
- Tuyệt đối không dùng font serif (`Instrument Serif`) cho tiêu đề dashboard.
- Thứ bậc tiêu đề (Typography Hierarchy):
  - **Page Header Title**: `font-size: 1.5rem - 1.75rem` (24px - 28px), `font-weight: 600` (semibold), tracking `-0.02em`. Không dùng font khổng lồ `clamp(3rem, ...)`.
  - **Section Title**: `font-size: 1.125rem - 1.25rem` (18px - 20px), `font-weight: 600`.
  - **Card / Table Title**: `font-size: 0.9375rem` (15px), `font-weight: 600`.
  - **Body / Content**: `font-size: 0.875rem` (14px), line-height `1.5`.
  - **Muted / Subtitle / Metadata**: `font-size: 0.8125rem` (13px) hoặc `0.75rem` (12px), `text-muted-foreground`.

### 2.3. Bo góc, Đường viền & Hiệu ứng
- Bo góc Container / Card: `12px` (`rounded-xl` / `--ci-radius-lg`).
- Bo góc Nút bấm / Input: `8px` (`rounded-lg` / `--ci-radius-md`).
- Bo góc Tag / Badge: `9999px` (`rounded-full` dạng pill thanh mảnh).
- Đường viền: Hairline 1px, màu trung tính nhạt (`border border-border/50`).
- Hiệu ứng chuyển động (Motion): Tinh tế, thời gian phản hồi `150ms - 200ms` `ease-out`, không giật cục.

---

## 3. Danh mục Primitives dùng chung (Design System Core)
Tất cả các trang con khi refactor phải dùng lại các thành phần chuẩn sau:
1. `PageHeader`: Tiêu đề trang chuẩn, có slot action góc phải, mô tả ngắn gọn bên dưới.
2. `Card`, `CardHeader`, `CardContent`: Vỏ bọc khối nội dung, nền phẳng, viền 1px tinh tế.
3. `DataTable`: Bảng dữ liệu chuẩn (sticky header, hover phẳng `bg-surface-muted`, không dùng gradient, row padding vừa vặn).
4. `Badge`: Hiển thị trạng thái (active/inactive/error/model type) dạng pill bo tròn với dot màu nhỏ.
5. `Button`: Nút Apple Minimalist (Primary: System Blue hoặc Inverted Solid; Secondary: Surface Muted viền mảnh; Ghost: trong suốt hover nhẹ).
6. `SearchInput` & `FilterSelect`: Ô tìm kiếm và lọc dữ liệu đồng nhất.

---

## 4. Phân rã Trang & Phân công Sub-Agents Thực thi Song song

| Module | Trang & Đường dẫn | Trách nhiệm Refactor theo DS |
|---|---|---|
| **Agent 1: DS Core & Primitives** | `packages/ui-kit/`, `src/shared/components/` | Cập nhật CSS tokens, bo góc surface 12px, tinh chỉnh kích thước `PageHeader` chuẩn 24-28px, dọn dẹp gradient trên Table hover. |
| **Agent 2: Home / Overview** | `src/app/(dashboard)/home/` & `src/app/(dashboard)/dashboard/HomePageClient.tsx`, `HomeProviderTopologySection.tsx`, `HomeRecentRequests.tsx` | Làm sạch giao diện trang chủ: thẻ Quick Start tối giản, danh sách trạng thái provider tinh gọn, bảng recent requests phẳng và thoáng mắt. |
| **Agent 3: Providers & Connections** | `src/app/(dashboard)/dashboard/providers/` | Lưới thẻ Provider tối giản (Apple Card style), trạng thái kết nối rõ ràng (dot xanh/đỏ), modal thêm provider tinh gọn. |
| **Agent 4: Models Catalog** | `src/app/(dashboard)/dashboard/models/` | Danh mục Model: thanh tìm kiếm phẳng, bảng model tối giản thông tin (tên, nhà cung cấp, context length, giá, tags dạng pill nhỏ). |
| **Agent 5: API Keys & Tokens** | `src/app/(dashboard)/dashboard/api-manager/`, `tokens/` | Bảng quản lý API keys tinh gọn, khung copy curl/SDK dạng monospaced hộp phẳng tối giản, nút tạo key nổi bật. |
| **Agent 6: Analytics & Usage** | `src/app/(dashboard)/dashboard/analytics/`, `usage/`, `costs/` | Biểu đồ tối giản (trục tọa độ thanh mảnh, màu đơn sắc Apple), thẻ số liệu thống kê (StatCard) gọn gàng, bảng quota/rate limits. |
| **Agent 7: Logs & Activity** | `src/app/(dashboard)/dashboard/logs/`, `activity/` | Bảng log truy vấn tốc độ cao, hiển thị mã trạng thái HTTP gọn gàng, drawer xem chi tiết payload JSON có nền tối tinh tế. |
| **Agent 8: Settings** | `src/app/(dashboard)/dashboard/settings/` | Bố cục dạng Apple Settings: tab phân đoạn (Segmented Control), các nhóm cài đặt phân cách bằng đường kẻ 1px, switch/toggle chuẩn Apple. |
| **Agent 9: Playground** | `src/app/(dashboard)/dashboard/playground/` | Khung thử nghiệm chat: bong bóng tin nhắn tối giản, thanh nhập prompt bo góc mềm mại, cột chỉnh tham số (temperature, top_p) gọn gàng. |

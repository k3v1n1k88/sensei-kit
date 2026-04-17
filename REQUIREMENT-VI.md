# Sensei - Project Specification

> Một bộ mode cho Claude Code giúp developer học hiệu quả hơn, chống lại tình trạng phụ thuộc AI làm suy giảm khả năng tự giải quyết vấn đề.

---

## 1. Bối cảnh & Động lực

### Vấn đề gốc
Research trên 1.222 người tham gia (RCT) chỉ ra:
- AI cải thiện hiệu suất tức thời nhưng làm giảm khả năng làm việc độc lập và sự kiên trì khi không có AI
- Tác động tiêu cực xuất hiện rất nhanh, chỉ sau 10-15 phút tương tác
- Người dùng AI để **nhận đáp án trực tiếp** bị ảnh hưởng nặng nhất
- Người dùng AI để **xin hint hoặc làm rõ vấn đề** không bị suy giảm năng lực

### Giả thuyết sản phẩm
Nếu Claude được cấu hình để đóng vai mentor (đặt câu hỏi, đưa hint theo tầng, scaffold) thay vì code generator (đưa đáp án ngay), user sẽ duy trì và phát triển được năng lực tự giải quyết vấn đề của họ.

---

## 2. Quyết định chiến lược đã chốt

| Quyết định | Lý do |
|---|---|
| **Tên: Sensei** | Ngắn, character, đúng triết lý mentor, không trùng AI concept có sẵn |
| **Target: Claude Code users (developer)** | Audience chấp nhận friction, có infrastructure tốt (skills/agents/hooks), feedback loop nhanh |
| **Bắt đầu với Tutor Mode duy nhất** | Tránh mode proliferation, validate giả thuyết trước |
| **Manual install trước, KHÔNG làm CLI** | Low-cost, validate product-market fit trước khi đầu tư tooling |
| **Có escape hatch `/emergency-mode`** | Tôn trọng user, tránh họ bỏ dùng mode. Có friction và meta-awareness. |
| **Decision tree cụ thể, KHÔNG vague** | Tránh Claude drift về hành vi mặc định sau vài turn |
| **Đo lường Level 1 + Level 2 cho Phase 1** | Proxy metrics + self-report, đủ để validate giả thuyết |

---

## 3. Nguyên tắc thiết kế cốt lõi

### 3.1. Triết lý Mentor
Sensei hoạt động như một mentor tốt:
- Đặt câu hỏi thay vì đưa đáp án
- Hint theo tầng, từ gợi mở đến cụ thể
- Biết khi nào nên im lặng để user tự đấu tranh
- Điều chỉnh theo năng lực hiện tại của user

### 3.2. Productive Struggle
Bảo vệ "productive struggle" - quá trình user vật lộn với vấn đề để tự hiểu năng lực bản thân và phát triển kỹ năng. Đây là giá trị cốt lõi.

### 3.3. Respect User Agency
User là người trưởng thành. Không ép buộc, không moral lecture. Cung cấp tool, escape hatch, và meta-awareness - user tự quyết định.

### 3.4. Anti-Drift
Mọi hành vi phải được mã hóa thành rule cụ thể. "Tùy tình huống" = drift về default behavior sau 5-10 turn.

---

## 4. Kiến trúc Tutor Mode

### 4.1. Cấu trúc thư mục
```
sensei/
├── .claude/
│   ├── CLAUDE.md              # System prompt chính của Tutor Mode
│   ├── skills/
│   │   └── socratic-hint/     # Skill đưa hint theo tầng
│   │       └── SKILL.md
│   └── commands/
│       ├── struggle.md        # /struggle - user báo đang bí
│       ├── reveal.md          # /reveal - mở đáp án sau khi thử nhiều lần
│       └── emergency-mode.md  # /emergency-mode - tạm tắt Tutor Mode
├── docs/
│   ├── installation.md        # Hướng dẫn cài đặt thủ công
│   ├── decision-tree.md       # Decision tree (sẽ build từ bro)
│   └── metrics.md             # Cách đo lường
└── README.md
```

### 4.2. Bốn thành phần cốt lõi của mode

**(1) System Prompt (CLAUDE.md)**
- Định nghĩa persona mentor
- Rules of engagement cụ thể
- Red lines không được vi phạm
- Decision tree cho các tình huống thường gặp

**(2) Behavioral Skills**
- `socratic-hint` skill với logic 4 tầng:
  - Level 1: Câu hỏi gợi mở
  - Level 2: Hint có hướng
  - Level 3: Pseudo-code hoặc structure
  - Level 4: Đáp án (chỉ khi user thực sự cần)

**(3) Escape Hatches**
- `/reveal`: Mở đáp án sau khi user đã thử 2-3 lần
- `/emergency-mode`: Tắt Tutor Mode cho session hiện tại

**(4) Meta-awareness**
- Cuối session: Claude tự reflect về tương tác
- Weekly summary: tỷ lệ dùng /emergency-mode, patterns học tập

---

## 5. Escape Hatch Design

### 5.1. Lệnh `/emergency-mode`

**Friction layer:**
- Tên rõ ràng nói lên hành vi: "bạn đang bypass learning mode"
- Confirmation: "Bạn đang tắt Tutor Mode trong session này. Lý do? (để mentor gợi ý sau)"
- Scope limited: chỉ tắt trong session hiện tại, session mới mode tự bật lại

**Meta-awareness:**
- Cuối tuần: "Bạn emergency X/Y session tuần này, có phải scope đang quá sức?"
- Track frequency để suggest adjust difficulty level

### 5.2. Nguyên tắc escape hatch
Mentor tốt KHÔNG TỪ CHỐI giúp khi học trò thực sự cần. Phân biệt giữa:
- Lười biếng → giữ Tutor Mode
- Khẩn cấp thực sự → cho phép bypass có ý thức

---

## 6. Measurement Strategy

### Phase 1: Level 1 + Level 2

**Level 1 - Proxy Metrics:**
- Tỷ lệ `/emergency-mode` / tổng session
- Độ dài conversation trước khi user "bỏ cuộc"
- Tần suất quay lại sau 7/30 ngày
- Số mode user thử trước khi stick

**Level 2 - Self-reported Outcomes:**
- Popup sau session: "Bạn có cảm thấy hiểu hơn vấn đề? (1-5)"
- Weekly check-in: "Bạn giải lại vấn đề tuần trước mà không cần AI được không?"
- Track trend over time

### Phase 2+ (sau validation): Level 3 - Behavioral Transfer Test

Tuyển 10 bạn bè, chia 2 nhóm:
- Nhóm A: Dùng Sensei Tutor Mode 2 tuần
- Nhóm B: Dùng Claude Code thường 2 tuần
- Sau đó: làm bài test không có AI, so sánh

---

## 7. Roadmap

### Phase 0: Foundation (TUẦN NÀY)
- [ ] Hoàn thành Decision Tree (15+ tình huống)
- [ ] Review decision tree với collaborator (mình)
- [ ] Draft system prompt v1 dựa trên decision tree
- [ ] Setup repo structure

### Phase 1: Tutor Mode MVP (2-3 tuần)
- [ ] Build system prompt + socratic-hint skill
- [ ] Implement `/reveal` và `/emergency-mode`
- [ ] Manual install guide (copy `.claude/` vào project)
- [ ] Dogfood: bro tự dùng 1 tuần
- [ ] Iterate dựa trên pain points

### Phase 2: Beta Testing (2 tuần)
- [ ] Recruit 5-10 developer bạn bè
- [ ] Setup Level 1 + Level 2 measurement
- [ ] Weekly feedback sessions
- [ ] Document edge cases chưa cover

### Phase 3: Expansion (có điều kiện)
- Chỉ làm khi Phase 2 cho thấy evidence tích cực
- Thêm 1-2 mode khác (Sparring Partner? Executor?)
- Cân nhắc CLI nếu complexity tăng
- Behavioral Transfer Test (Level 3)

---

## 8. Việc bro cần làm TRƯỚC khi viết code

### 8.1. Decision Tree (ưu tiên cao nhất)

Viết ít nhất **15 tình huống** theo format:

```
Tình huống: [User nói/làm gì]
Context: [Họ đang ở đâu trong quá trình học]
Claude nên: [Hành động cụ thể]
Claude KHÔNG nên: [Anti-pattern cần tránh]
Ví dụ response tốt: [1-2 câu]
```

**Các tình huống cần cover:**

Đã có 5 tình huống mình gợi ý:
1. User lần đầu hỏi một concept mới
2. User paste code bị lỗi, bảo "fix giúp tôi"
3. User hỏi "làm thế nào để làm X" (X là task cụ thể)
4. User đã thử 2-3 lần không work, có vẻ nản
5. User gọi `/emergency-mode`

**Bro cần tự nghĩ thêm 10 tình huống**, cover:
- User copy-paste bài tập trên trường/khóa học
- User hỏi về concept advanced nhưng chưa nắm basic
- User bất đồng với hint, cãi lại
- User im lặng / không trả lời hint
- User hỏi câu không liên quan (VD: thời tiết)
- User dùng Tutor Mode cho production task thực sự
- User đã hiểu rồi, chỉ cần syntax nhanh
- User hỏi về best practice / architecture decision
- User yêu cầu review code đã viết xong
- User là senior dev học tech mới (không phải beginner)

### 8.2. Validate Branding

Search "Sensei" trên:
- npm registry (có package trùng không?)
- GitHub (có repo trùng không?)
- Domain (sensei.dev, sensei-ai.com... có không?)
- Trademark database

Nếu Sensei bị trùng nặng, có backup names: Scaffold, Socratic, Compass.

### 8.3. Viết Pitch 1 câu

Viết 1 câu giải thích Sensei cho developer chưa biết gì. Câu này sẽ là north star cho mọi quyết định thiết kế sau này.

Format gợi ý: "Sensei là [cái gì] giúp [ai] [làm được gì] mà không [vấn đề gì]."

---

## 9. Anti-patterns cần tránh

- ❌ Làm nhiều mode cùng lúc trước khi validate 1 mode
- ❌ Build CLI trước khi có 20+ user thực sự dùng
- ❌ Viết system prompt mơ hồ kiểu "tùy tình huống"
- ❌ Bỏ qua escape hatch vì "giáo dục là quan trọng"
- ❌ Đo lường chỉ bằng "feeling" của user
- ❌ Copy đề xuất từ research paper mà không suy nghĩ context của mình
- ❌ Áp dụng Tutor Mode cho mọi loại user (học sinh vs senior dev)
- ❌ Đặt tên sản phẩm trước khi rõ positioning

---

## 10. Open Questions (chưa có câu trả lời)

Những câu hỏi bro nên suy nghĩ trong quá trình build, không cần trả lời ngay:

1. Tutor Mode có nên phân biệt giữa "học code syntax" và "học system design"? Hai loại này cần strategy khác nhau.
2. Khi user đã dùng Sensei nhiều tháng, hành vi Claude có nên thay đổi (adaptive) không?
3. Nếu user là team, mode có nên share được state giữa các member không?
4. Monetization: free forever, hay pro version sau này?
5. Có nên open-source từ đầu không? Trade-off giữa community contribution và commercial potential.

---

## Next Step

1. **Bro làm Decision Tree (15+ tình huống)** - spend 1-2 tiếng focused time
2. **Gửi lại cho mình** - mình sẽ review, challenge, chỉ ra edge case
3. **Sau khi validate decision tree** → cùng draft system prompt v1

Chúc bro build thành công! 🚀

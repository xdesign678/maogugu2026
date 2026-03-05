# Claude/Anthropic Design Specification
## Extracted from claude.ai & anthropic.com (2026-03-05)

---

## 1. Color System

### 1.1 Background Colors (4 levels only)
| Token       | Hex       | RGB                 | Usage                        |
|-------------|-----------|---------------------|------------------------------|
| `--bg-0`    | `#faf9f5` | `250, 249, 245`     | Page background              |
| `--bg-1`    | `#ffffff` | `255, 255, 255`     | Cards, inputs, elevated panels |
| `--bg-2`    | `#f5f4ed` | `245, 244, 237`     | Subtle surface / hover bg    |
| `--bg-3`    | `#f0eee6` | `240, 238, 230`     | Section alternation, badges  |

> **Key insight**: Claude uses at most 4 background tones. No extra colors.
> The entire warm cream palette comes from the same base: warm-gray with yellow undertone.

### 1.2 Text Colors (4 levels only)
| Token       | Hex       | RGB                 | Usage                        |
|-------------|-----------|---------------------|------------------------------|
| `--tx-0`    | `#141413` | `20, 20, 19`        | Headings, primary text       |
| `--tx-1`    | `#3d3d3a` | `61, 61, 58`        | Body text, nav items         |
| `--tx-2`    | `#73726c` | `115, 114, 108`     | Secondary text, muted labels |
| `--tx-3`    | `#9c9a92` | `156, 154, 146`     | Placeholder, disabled        |

> **Key insight**: All text colors are warm-gray, NOT pure gray.
> Extra muted level: `#c2c0b6` (194, 192, 182) for very faint decoration.

### 1.3 Border Colors (2 variants only)
| Token          | Value                      | Usage                        |
|----------------|----------------------------|------------------------------|
| `--border`     | `rgba(31, 30, 29, 0.10)`   | Default borders              |
| `--border-h`   | `rgba(31, 30, 29, 0.15)`   | Card borders, input borders  |
| `--border-s`   | `rgba(31, 30, 29, 0.30)`   | Strong borders (outline buttons) |

> **Key insight**: Claude NEVER uses colored borders. All borders are semi-transparent
> warm-black (`31, 30, 29`). No gold, no blue, no colored borders in light mode.

### 1.4 Accent Color (ONE only)
| Token         | Hex       | RGB                 | Usage                          |
|---------------|-----------|---------------------|--------------------------------|
| `--accent`    | `#d97757` | `217, 119, 87`      | Logo mark, primary accent only |
| `--accent-2`  | `#c6613f` | `198, 97, 63`       | Darker variant for hover       |

> **CRITICAL**: Claude light mode does NOT use gold (`#c9a227`) as an accent.
> The only accent color is the terracotta/coral from the Anthropic brand: `#d97757`.
> Our app should use this ONE accent sparingly - only for the most important actions.

### 1.5 Semantic Colors (for our app)
| Token         | Hex       | Usage                          |
|---------------|-----------|--------------------------------|
| `--green`     | `#1a8a3e` | Positive / bullish indicators  |
| `--amber`     | `#b07008` | Warning states                 |
| `--red`       | `#c73030` | Negative / bearish indicators  |

> These don't exist on Claude.ai but our app needs them for financial data.
> Use warm-toned versions that harmonize with the cream palette.

---

## 2. Typography

### 2.1 Font Families
Claude uses 3 font families mapped to specific roles:

| Claude Font         | Our Equivalent        | Role                      |
|---------------------|-----------------------|---------------------------|
| `anthropicSerif`    | `Instrument Serif`    | Display headings, quotes  |
| `anthropicSans`     | `IBM Plex Sans`       | Body text, UI, buttons    |
| `anthropicMono`     | `JetBrains Mono`      | Code, formulas, numbers   |

### 2.2 Font Sizes (Claude's actual scale)
| Size   | Usage                                    |
|--------|------------------------------------------|
| `56px` | Hero heading (weight 330, serif)         |
| `36px` | Section heading (weight 400, serif)      |
| `24px` | Card heading                             |
| `20px` | Body large (Anthropic.com)               |
| `18px` | Subtitle (serif)                         |
| `16px` | Body default (sans, weight 400)          |
| `15px` | Nav items (sans, weight 400)             |
| `14px` | Buttons, small UI (sans, weight 500)     |
| `12px` | Captions, labels (sans)                  |
| `11px` | Micro labels                             |
| `10px` | Tiny metadata                            |

### 2.3 Font Weights
| Weight | Usage                                    |
|--------|------------------------------------------|
| `330`  | Hero display heading (serif)             |
| `400`  | Default body, serif headings, most text  |
| `430`  | Input text (slightly emphasized)         |
| `500`  | Buttons, nav emphasis, medium weight     |
| `600`  | Section headers (sans), strong emphasis  |
| `700`  | Page h1 on anthropic.com (sans only)     |

> **Key insight**: Claude barely uses bold. Most text is weight 400.
> Headings use SERIF at normal weight (400) for elegance, NOT bold sans.

### 2.4 Line Heights
| Font Size | Line Height | Ratio |
|-----------|-------------|-------|
| `56px`    | `67.2px`    | 1.2   |
| `36px`    | `40px`      | 1.11  |
| `24px`    | `32px`      | 1.33  |
| `20px`    | `28px`      | 1.4   |
| `16px`    | `24px`      | 1.5   |
| `14px`    | `19.6px`    | 1.4   |
| `12px`    | `16px`      | 1.33  |

---

## 3. Spacing

### 3.1 Border Radius Scale
| Token      | Value   | Usage                                    |
|------------|---------|------------------------------------------|
| `--r-sm`   | `6px`   | Small elements, tags                     |
| `--r-md`   | `8px`   | Buttons, nav items, most UI elements     |
| `--r-lg`   | `10px`  | Input fields (9.6px rounded to 10)       |
| `--r-xl`   | `12px`  | Cards, panels                            |
| `--r-2xl`  | `16px`  | Large cards, sections                    |
| `--r-3xl`  | `24px`  | Hero cards, modals                       |
| `--r-full` | `9999px`| Pills, badges                            |

> **Key insight**: Claude uses 8px as the base radius (not 12px or 16px).
> Cards are 12px. Large cards are 16px. Very few things use 24px.

### 3.2 Padding Patterns
| Component        | Padding              |
|------------------|----------------------|
| Nav buttons      | `8px 20px`           |
| Input fields     | `0px 12px` (h: 44px) |
| Cards            | `24px - 32px`        |
| Page container   | `32px` horizontal    |

---

## 4. Shadows

### 4.1 Shadow Scale
| Token          | Value                                                              | Usage                |
|----------------|--------------------------------------------------------------------|----------------------|
| `--shadow-sm`  | `0 4px 20px rgba(0,0,0,0.04)`                                     | Subtle card lift     |
| `--shadow-md`  | `0 17px 35px rgba(0,0,0,0.15)`                                    | Cards, modals        |
| `--shadow-lg`  | `0 4px 24px rgba(0,0,0,0.016), 0 4px 32px rgba(0,0,0,0.016), 0 2px 64px rgba(0,0,0,0.01), 0 16px 32px rgba(0,0,0,0.01)` | Hero panels |

> **Key insight**: Shadows are very subtle and use pure black (not colored).
> No gold glows. No colored shadows in light mode. Just warm, soft depth.

---

## 5. Component Patterns

### 5.1 Buttons
**Primary (CTA)**:
- Background: `#141413` (near-black)
- Color: `#ffffff`
- Border: none
- Border-radius: `8px` (nav) / `10px` (form)
- Font: sans, 14-16px, weight 500
- Height: `36px` (nav) / `44px` (form)
- Padding: `8px 20px`
- Shadow: none
- Hover: no color change, subtle lift

**Secondary (outline)**:
- Background: transparent
- Color: `#73726c`
- Border: `1px solid rgba(31, 30, 29, 0.15)`
- Border-radius: `8px`
- Font: sans, 14px, weight 500
- Padding: `8px 20px`

**Tertiary (ghost)**:
- Background: transparent
- Color: `#3d3d3a`
- Border: none
- Font: sans, 15px, weight 400

### 5.2 Cards
- Background: `#ffffff` (white)
- Border: `1px solid rgba(31, 30, 29, 0.15)`
- Border-radius: `12px`
- Shadow: `0 17px 35px rgba(0,0,0,0.15)` (elevated) or none (flat)
- Padding: `24-32px`
- NO backdrop-filter / glassmorphism in light mode

> **CRITICAL**: Light mode cards are opaque white with subtle border.
> NO glass effect. NO backdrop-filter. Clean and solid.

### 5.3 Input Fields
- Background: `#ffffff`
- Border: `1px solid rgba(31, 30, 29, 0.15)`
- Border-radius: `10px`
- Height: `44px`
- Font: sans, 16px, weight 430
- Padding: `0 12px`
- Shadow: none
- Focus: ring style (not border color change)

### 5.4 Navigation
- Background: same as page (`#faf9f5`)
- Height: `84px`
- Position: fixed
- Border: none
- Shadow: none
- Backdrop-filter: none
- Links: sans, 15px, weight 400, color `#3d3d3a`

### 5.5 Labels/Badges
Anthropic.com uses these for metadata:
- Font: sans, 12-14px
- Color: `#87867f` (135, 134, 127)
- Letter-spacing: minimal
- Background: `#f0eee6` for badge-style labels

---

## 6. Design Philosophy Summary

### What Claude DOES:
1. **Warm cream palette** - NOT pure white, NOT gray. Everything has a yellow/cream undertone
2. **Minimal color usage** - Only 4 bg levels + 4 text levels + 1 accent
3. **Serif for display** - Big headings use serif font at light weight (330-400)
4. **Sans for UI** - All interactive elements use clean sans-serif
5. **Subtle shadows** - Soft, diffuse, using pure black at very low opacity
6. **Solid backgrounds** - Opaque white cards, no transparency tricks
7. **Simple borders** - Semi-transparent warm-black, never colored
8. **Generous whitespace** - Lots of breathing room between elements

### What Claude DOES NOT do:
1. ~~Gold accents everywhere~~ - NO gold in light mode
2. ~~Glassmorphism~~ - NO backdrop-filter blur on cards in light mode
3. ~~Colored borders~~ - NO gold/blue/green borders
4. ~~Colored shadows~~ - NO glow effects
5. ~~Heavy font weights~~ - Almost no bold text
6. ~~Many accent colors~~ - ONE accent (terracotta #d97757) used sparingly
7. ~~Letter-spacing on body~~ - Normal letter-spacing for most text
8. ~~Gradient backgrounds~~ - Flat solid colors

---

## 7. Mapping to Our App

### Color Variable Mapping (Light Theme)
```css
[data-theme="light"] {
  /* Backgrounds - warm cream */
  --bg-0: #faf9f5;     /* page bg */
  --bg-1: #ffffff;     /* card bg */
  --bg-2: #f5f4ed;     /* subtle surface */
  --bg-3: #f0eee6;     /* section bg, tags */
  --bg-4: #e3dace;     /* stronger surface */

  /* Text - warm gray scale */
  --tx-0: #141413;     /* headings */
  --tx-1: #3d3d3a;     /* body */
  --tx-2: #73726c;     /* secondary */
  --tx-3: #9c9a92;     /* muted */

  /* Accent - terracotta (NOT gold) */
  --accent: #d97757;
  --accent-dim: rgba(217, 119, 87, 0.10);

  /* For our app: gold maps to accent in light mode */
  --gold: #d97757;
  --gold-dim: rgba(217, 119, 87, 0.10);
  --gold-glow: rgba(217, 119, 87, 0.06);

  /* Semantic (warm-toned) */
  --green: #1a8a3e;
  --green-dim: rgba(26, 138, 62, 0.08);
  --amber: #b07008;
  --amber-dim: rgba(176, 112, 8, 0.08);
  --red: #c73030;
  --red-dim: rgba(199, 48, 48, 0.08);

  /* Borders - semi-transparent warm-black */
  --border: rgba(31, 30, 29, 0.10);
  --border-h: rgba(31, 30, 29, 0.15);

  /* Cards - opaque white, no glass */
  --glass: #ffffff;
  --glass-border: rgba(31, 30, 29, 0.12);
  --glass-blur: 0px;   /* NO blur in light mode */

  /* Shadows - subtle, pure black */
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.04);
  --shadow-md: 0 4px 20px rgba(0,0,0,0.06);
  --shadow-lg: 0 12px 40px rgba(0,0,0,0.08);
  --shadow-glow: none;  /* NO glow in light mode */
}
```

### Typography Rules for Light Mode
- Hero: Instrument Serif, 56px equivalent, weight 400, line-height 1.2
- Section title: Instrument Serif, 2rem, weight 400
- Body: IBM Plex Sans, 16px, weight 400, line-height 1.5
- Buttons: IBM Plex Sans, 14px, weight 500
- Labels: IBM Plex Sans, 12px, weight 400-500
- Code/numbers: JetBrains Mono

### Component Rules for Light Mode
- Cards: white bg, `rgba(31,30,29,0.12)` border, `12px` radius
- Buttons primary: `#141413` bg, white text, `8px` radius
- Buttons secondary: transparent bg, border `rgba(31,30,29,0.15)`, `8px` radius
- Inputs: white bg, `rgba(31,30,29,0.15)` border, `10px` radius, `44px` height
- NO backdrop-filter on any card
- NO gradient backgrounds on surfaces
- NO colored borders or shadows

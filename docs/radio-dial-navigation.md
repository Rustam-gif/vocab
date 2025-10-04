# 📻 Radio Dial Navigation Design

## Overview
The quiz navigation bar has been redesigned with a **vintage radio dial/tuner** aesthetic. The currently selected tab always appears **in the center** (like a station marker on a radio), with other tabs sliding horizontally as you navigate.

## Key Features

### 🎯 **Center-Focused Design**
- Active tab always stays in the **center of the screen**
- Other tabs slide left/right as you navigate between phases
- Similar to tuning a radio dial to find the right station

### 🎨 **Visual Elements**

#### **Radio Track (Background)**
- Dark gray rounded background (`#2A2A2A`)
- Subtle border and shadow for depth
- **Frequency markers**: 20 evenly-spaced vertical lines
  - Short markers (6px) for regular intervals
  - Tall markers (12px) every 5th position (like FM radio markings)

#### **Center Pointer/Indicator**
- **Orange vertical pointer** (`#F2935C`) in the center
- Fixed position (never moves)
- Glowing shadow effect
- Indicates which tab is "tuned in"

#### **Tab Items**
- **Active Tab (Center)**:
  - Larger scale (1.15x)
  - Orange glow background (`rgba(242, 147, 92, 0.12)`)
  - Border with orange tint
  - Bright orange text
  - Bold font weight (700)
  - Full opacity
  
- **Inactive Tabs**:
  - Smaller scale (0.85x)
  - Gray text (`#6B7280`)
  - Reduced opacity (0.3-0.5 based on distance from center)
  - Transparent background
  - Regular font weight (500)

### ⚡ **Animation**
- **Spring animation** when switching tabs
  - Smooth, natural feel
  - Tension: 60, Friction: 12
  - Uses native driver for performance
- Tabs slide horizontally (80px per tab)
- Scale, color, and opacity animate smoothly

### 🎛️ **Interaction**
- Tap any tab to navigate
- Active tab automatically centers
- Smooth transition between phases

## Technical Implementation

### Components
- `radioDialContainer`: Main container (height: 90px)
- `radioDialTrack`: Background track with markers
- `frequencyMarkers`: 20 vertical lines (1-1.5px wide)
- `centerIndicator`: Fixed orange pointer (3px wide, 16px tall)
- `centerPointer`: The glowing line itself
- `phaseTabs`: Animated container for tab items
- `tabItem`: Individual tab (80px wide)
- `tabBubble`: Tab background/border
- `tabLabel`: Tab text

### Animation Logic
```typescript
// Horizontal translation based on current phase
transform: [{
  translateX: animatedIndex.interpolate({
    inputRange: [0, phases.length - 1],
    outputRange: [0, -(phases.length - 1) * 80], // 80px per tab
  })
}]

// Scale: larger in center
inputRange: [index - 1, index, index + 1]
outputRange: [0.85, 1.15, 0.85]

// Opacity: fade based on distance
inputRange: [index - 1.5, index - 1, index, index + 1, index + 1.5]
outputRange: [0.3, 0.5, 1, 0.5, 0.3]
```

## Design Philosophy

### ✨ **Minimal & Modern**
- No bulky elements
- Soft highlights and shadows
- Rounded edges (16-20px border radius)
- Clean typography

### 🎙️ **Vintage Radio Aesthetic**
- Frequency markers evoke old FM radios
- Center pointer like station tuner
- Dark color scheme with warm accent
- Subtle glow effects

### 🎯 **User Experience**
- Active tab always visible and centered
- Clear visual hierarchy
- Smooth, satisfying animations
- Easy to tap and navigate

## Color Palette
- **Background Track**: `#2A2A2A` (dark gray)
- **Border**: `#3A3A3A` (lighter gray)
- **Markers**: `#4A4A4A` / `#5A5A5A` (subtle gray)
- **Active Accent**: `#F2935C` (warm orange)
- **Active Background**: `rgba(242, 147, 92, 0.12)` (orange tint)
- **Active Border**: `rgba(242, 147, 92, 0.3)` (orange glow)
- **Inactive Text**: `#6B7280` (neutral gray)

## Navigation Phases
1. **Intro** - Word introduction
2. **MCQ** - Multiple choice definitions
3. **Synonym** - Synonym matching
4. **Usage** - Sentence completion
5. **Letters** - Missing letters puzzle

Each phase slides into the center when selected, creating a continuous "tuning" experience.



# Avatar Selection Feature

## Overview
Users can now choose a custom avatar from 6 cartoon profile pictures during the sign-up process.

## Implementation

### Avatar Options
Located in `/assets/prof-pictures/`:
- `cartoon-1.png`
- `cartoon-2.png`
- `cartoon-3.png`
- `cartoon-4.png`
- `cartoon-5.png`
- `cartoon-6.png`

### User Flow

#### 1. Sign-Up Process
When creating an account, users see:
1. **Full Name** input field
2. **Avatar Selection Grid** - 6 circular avatar options in a 3x2 grid
   - Unselected: Gray border
   - Selected: Orange border with checkmark badge
3. **Email** input field
4. **Password** input field
5. **Confirm Password** input field

#### 2. Avatar Storage
When a user selects an avatar:
- Avatar ID (1-6) is stored in Supabase `user_metadata.avatar_id`
- Avatar URL reference is stored as `avatar_${id}` in `user_metadata.avatar_url`

#### 3. Avatar Display
When displaying the user's profile:
- If `avatarId` exists (1-6), load the corresponding local image
- Otherwise, fall back to generated avatar or custom URL
- Avatar appears in:
  - Profile screen header (large circular avatar)
  - Any other UI showing user info

### Technical Details

#### Files Modified
- **`app/profile.tsx`**:
  - Added `AVATAR_OPTIONS` array with image imports
  - Added `selectedAvatar` state (default: 1)
  - Added avatar selection grid in sign-up form
  - Updated `mapSupabaseUser` to handle `avatarId`
  - Added `getAvatarSource()` helper to load correct image
  - Added styles for avatar grid, selection, and checkmark

- **`types.ts`**:
  - Added `avatarId?: number` to `User` interface

#### Styles Added
```typescript
avatarSection: Container for "Choose Your Avatar" section
avatarSectionTitle: "Choose Your Avatar" heading
avatarGrid: Flexbox grid for avatar options (3 per row, centered)
avatarOption: Circular avatar container (80x80, rounded)
avatarOptionSelected: Selected state with orange border
avatarOptionImage: Avatar image styling
avatarCheckmark: Orange checkmark badge (bottom-right corner)
```

### User Experience

#### Visual Design
- **Grid Layout**: 3 avatars per row, centered
- **Size**: 80x80px circular avatars
- **Selection State**:
  - Default: Subtle gray border
  - Selected: Bold orange border (#e28743)
  - Checkmark: Small orange circle with white check icon
- **Spacing**: 12px gap between avatars

#### Interaction
- Tap any avatar to select it
- Only one avatar can be selected at a time
- Selection persists when switching between Sign In/Sign Up
- Resets to avatar #1 when clearing form or going back

### Data Flow

```
User selects avatar → State updates (selectedAvatar)
                    ↓
User completes sign-up → Supabase stores:
                          - avatar_id: 1-6
                          - avatar_url: "avatar_1" (etc.)
                    ↓
User logs in → Profile loads user data
             ↓
getAvatarSource() checks avatarId
             ↓
If avatarId exists → Load local image
If not → Load remote URL or default
```

### Benefits
1. **Personalization**: Users can express their personality
2. **Visual Identity**: Easier to recognize user accounts
3. **No Upload Required**: Pre-selected images = faster, simpler
4. **Offline Ready**: Local images work without internet
5. **Consistent Style**: All avatars match app aesthetic

### Future Enhancements (Ideas)
- Allow changing avatar in profile settings
- Add more avatar options
- Group avatars by themes (animals, professions, etc.)
- Unlock special avatars based on XP/level
- Custom avatar upload for premium users

---

**Created**: 2025-01-03
**Version**: 1.0
**Status**: Implemented and Active

/**
 * Complete sticker presets — each is a curated combination of:
 * - Expression (ARKit blendshapes)
 * - Pose reference (body pose ID)
 * - Effect reference (overlay ID)
 * - Text
 * - Fine-tune blendshapes
 *
 * This is the "sticker recipe book" — every preset produces a
 * polished, well-framed sticker straight out of the box.
 */

// ─── Types ───────────────────────────────────────────────────

export interface ExpressionPreset {
  id: string
  emoji: string
  label: string
  blendshapes: Record<string, number>
  camera: 'face' | 'half'
  defaultText?: string
}

/**
 * A complete sticker definition — expression + pose + effect + text
 * Used to generate the default sticker pack.
 */
export interface CompleteStickerPreset {
  id: string
  emoji: string
  label: string
  expression: ExpressionPreset
  /** Body pose ID (from sticker-body-poses.ts) */
  poseId: string
  /** Overlay effect ID (from sticker-overlays.ts) */
  overlayId: string
  /** Default text displayed on the sticker */
  text: string
  /** Extra blendshape fine-tuning on top of expression */
  fineTune?: Record<string, number>
}

// ─── Camera constants (kept for reference) ───────────────────

export const CAMERA_PRESETS = {
  face: { y: 1.55, z: 0.65 },
  half: { y: 1.2, z: 1.5 },
} as const

// ─── Text presets for the editor ─────────────────────────────

export const TEXT_PRESETS = [
  'LOL', 'OMG', 'WOW', 'BRB', 'GG', 'THX',
  'NOPE', 'YAS', 'HAHA', 'OOPS', 'HI', 'BYE',
  'LOVE', 'OK', 'NO', 'HELP', 'SORRY', 'PLZ',
  'YAY', 'BRUH', 'SUS', 'SLAY', 'LET\'S GO',
] as const

// ─── Expression definitions ──────────────────────────────────

export const EXPRESSION_PRESETS: ExpressionPreset[] = [
  {
    id: 'laughing',
    emoji: '😂',
    label: 'Laughing',
    camera: 'half',
    defaultText: 'HAHA',
    blendshapes: {
      jawOpen: 0.7,
      mouthSmileLeft: 1,
      mouthSmileRight: 1,
      cheekSquintLeft: 0.8,
      cheekSquintRight: 0.8,
      eyeSquintLeft: 0.6,
      eyeSquintRight: 0.6,
    },
  },
  {
    id: 'surprised',
    emoji: '😲',
    label: 'Surprised',
    camera: 'face',
    defaultText: 'OMG',
    blendshapes: {
      jawOpen: 0.8,
      eyeWideLeft: 1,
      eyeWideRight: 1,
      browInnerUp: 0.9,
      browOuterUpLeft: 0.7,
      browOuterUpRight: 0.7,
    },
  },
  {
    id: 'sad',
    emoji: '😢',
    label: 'Sad',
    camera: 'face',
    defaultText: 'SORRY',
    blendshapes: {
      mouthFrownLeft: 0.8,
      mouthFrownRight: 0.8,
      browInnerUp: 0.6,
      eyeSquintLeft: 0.3,
      eyeSquintRight: 0.2,
      mouthLowerDownLeft: 0.3,
      mouthLowerDownRight: 0.3,
    },
  },
  {
    id: 'winking',
    emoji: '😉',
    label: 'Winking',
    camera: 'face',
    blendshapes: {
      eyeBlinkLeft: 1,
      mouthSmileRight: 0.6,
      mouthSmileLeft: 0.3,
      cheekSquintRight: 0.4,
      cheekSquintLeft: 0.2,
    },
  },
  {
    id: 'blowing_kiss',
    emoji: '😘',
    label: 'Blowing Kiss',
    camera: 'face',
    defaultText: 'LOVE',
    blendshapes: {
      mouthPucker: 0.9,
      eyeBlinkRight: 0.8,
      cheekSquintLeft: 0.3,
    },
  },
  {
    id: 'angry',
    emoji: '😠',
    label: 'Angry',
    camera: 'face',
    defaultText: 'NOPE',
    blendshapes: {
      browDownLeft: 1,
      browDownRight: 1,
      jawForward: 0.3,
      mouthFrownLeft: 0.5,
      mouthFrownRight: 0.5,
      noseSneerLeft: 0.7,
      noseSneerRight: 0.7,
      eyeSquintLeft: 0.4,
      eyeSquintRight: 0.4,
    },
  },
  {
    id: 'thinking',
    emoji: '🤔',
    label: 'Thinking',
    camera: 'half',
    defaultText: 'HMM',
    blendshapes: {
      browInnerUp: 0.4,
      browOuterUpLeft: 0.6,
      mouthLeft: 0.5,
      mouthPressLeft: 0.4,
      eyeLookUpLeft: 0.3,
      eyeLookUpRight: 0.3,
    },
  },
  {
    id: 'cool',
    emoji: '😎',
    label: 'Cool',
    camera: 'half',
    defaultText: 'GG',
    blendshapes: {
      mouthSmileLeft: 0.4,
      mouthSmileRight: 0.4,
      browDownLeft: 0.2,
      browDownRight: 0.2,
      cheekSquintLeft: 0.2,
      cheekSquintRight: 0.2,
    },
  },
  {
    id: 'love',
    emoji: '🥰',
    label: 'Love',
    camera: 'face',
    defaultText: 'LOVE',
    blendshapes: {
      mouthSmileLeft: 0.8,
      mouthSmileRight: 0.8,
      cheekSquintLeft: 0.6,
      cheekSquintRight: 0.6,
      eyeSquintLeft: 0.4,
      eyeSquintRight: 0.4,
    },
  },
  {
    id: 'tongue_out',
    emoji: '😛',
    label: 'Tongue Out',
    camera: 'face',
    defaultText: 'LOL',
    blendshapes: {
      tongueOut: 1,
      mouthSmileLeft: 0.5,
      mouthSmileRight: 0.5,
      jawOpen: 0.3,
      eyeWideLeft: 0.3,
      eyeWideRight: 0.3,
    },
  },
  {
    id: 'smirk',
    emoji: '😏',
    label: 'Smirk',
    camera: 'face',
    blendshapes: {
      mouthSmileRight: 0.7,
      mouthSmileLeft: 0.1,
      browDownLeft: 0.2,
      browOuterUpRight: 0.3,
      eyeSquintRight: 0.2,
    },
  },
  {
    id: 'pleading',
    emoji: '🥺',
    label: 'Pleading',
    camera: 'face',
    defaultText: 'PLZ',
    blendshapes: {
      browInnerUp: 0.9,
      eyeWideLeft: 0.6,
      eyeWideRight: 0.6,
      mouthFrownLeft: 0.4,
      mouthFrownRight: 0.4,
      mouthLowerDownLeft: 0.2,
      mouthLowerDownRight: 0.2,
    },
  },
  {
    id: 'excited',
    emoji: '🤩',
    label: 'Excited',
    camera: 'half',
    defaultText: 'WOW',
    blendshapes: {
      jawOpen: 0.5,
      mouthSmileLeft: 1,
      mouthSmileRight: 1,
      eyeWideLeft: 0.7,
      eyeWideRight: 0.7,
      browInnerUp: 0.5,
      browOuterUpLeft: 0.6,
      browOuterUpRight: 0.6,
      cheekSquintLeft: 0.5,
      cheekSquintRight: 0.5,
    },
  },
]

// ─── Curated sticker pack presets ────────────────────────────
// Each preset is carefully designed with matching:
// expression + pose + overlay + text + fine-tune

export const STICKER_PACK_PRESETS: CompleteStickerPreset[] = [
  // 1. 😂 HAHA — Laughing with slight lean back
  {
    id: 'laughing_haha',
    emoji: '😂',
    label: 'HAHA',
    expression: EXPRESSION_PRESETS.find((e) => e.id === 'laughing')!,
    poseId: 'neutral',
    overlayId: 'none',
    text: 'HAHA',
  },

  // 2. 😲 OMG — Surprised with lightning bolts
  {
    id: 'surprised_omg',
    emoji: '😲',
    label: 'OMG',
    expression: EXPRESSION_PRESETS.find((e) => e.id === 'surprised')!,
    poseId: 'neutral',
    overlayId: 'lightning',
    text: 'OMG',
  },

  // 3. 😢 Sorry — Sad with tears
  {
    id: 'sad_sorry',
    emoji: '😢',
    label: 'Sorry',
    expression: EXPRESSION_PRESETS.find((e) => e.id === 'sad')!,
    poseId: 'shy',
    overlayId: 'crying',
    text: 'SORRY',
    fineTune: { browInnerUp: 0.8 },
  },

  // 4. 😉 Winking — Cheeky wink with sparkles
  {
    id: 'winking_hey',
    emoji: '😉',
    label: 'Hey~',
    expression: EXPRESSION_PRESETS.find((e) => e.id === 'winking')!,
    poseId: 'peace',
    overlayId: 'sparkles',
    text: '',
  },

  // 5. 😘 Blowing Kiss — Kiss with hearts
  {
    id: 'blowing_kiss_love',
    emoji: '😘',
    label: 'Muah!',
    expression: EXPRESSION_PRESETS.find((e) => e.id === 'blowing_kiss')!,
    poseId: 'neutral',
    overlayId: 'hearts',
    text: 'LOVE',
  },

  // 6. 😠 Angry — Angry with crossed arms + fire
  {
    id: 'angry_nope',
    emoji: '😠',
    label: 'Nope!',
    expression: EXPRESSION_PRESETS.find((e) => e.id === 'angry')!,
    poseId: 'crossed_arms',
    overlayId: 'fire',
    text: 'NOPE',
  },

  // 7. 🤔 Thinking — Hand on chin
  {
    id: 'thinking_hmm',
    emoji: '🤔',
    label: 'Hmm...',
    expression: EXPRESSION_PRESETS.find((e) => e.id === 'thinking')!,
    poseId: 'thinking',
    overlayId: 'none',
    text: 'HMM',
  },

  // 8. 😎 Cool — Power pose with stars
  {
    id: 'cool_gg',
    emoji: '😎',
    label: 'Cool',
    expression: EXPRESSION_PRESETS.find((e) => e.id === 'cool')!,
    poseId: 'crossed_arms',
    overlayId: 'stars',
    text: 'GG',
  },

  // 9. 🥰 Love — Heart hands with hearts
  {
    id: 'love_heart',
    emoji: '🥰',
    label: 'Love You',
    expression: EXPRESSION_PRESETS.find((e) => e.id === 'love')!,
    poseId: 'heart_hands',
    overlayId: 'hearts',
    text: 'LOVE',
  },

  // 10. 😛 LOL — Tongue out with peace sign
  {
    id: 'tongue_lol',
    emoji: '😛',
    label: 'LOL',
    expression: EXPRESSION_PRESETS.find((e) => e.id === 'tongue_out')!,
    poseId: 'peace',
    overlayId: 'confetti',
    text: 'LOL',
  },

  // 11. 👋 Hi! — Excited wave with sparkles
  {
    id: 'wave_hi',
    emoji: '👋',
    label: 'Hi!',
    expression: EXPRESSION_PRESETS.find((e) => e.id === 'excited')!,
    poseId: 'wave',
    overlayId: 'sparkles',
    text: 'HI!',
  },

  // 12. 👍 OK — Thumbs up with smile
  {
    id: 'thumbs_ok',
    emoji: '👍',
    label: 'OK!',
    expression: EXPRESSION_PRESETS.find((e) => e.id === 'cool')!,
    poseId: 'thumbs_up',
    overlayId: 'stars',
    text: 'OK',
    fineTune: { mouthSmileLeft: 0.6, mouthSmileRight: 0.6 },
  },

  // 13. 🎉 Yay! — Celebrate with confetti
  {
    id: 'celebrate_yay',
    emoji: '🎉',
    label: 'Yay!',
    expression: EXPRESSION_PRESETS.find((e) => e.id === 'excited')!,
    poseId: 'celebrate',
    overlayId: 'confetti',
    text: 'YAY!',
  },

  // 14. 💪 Let's Go — Flexing with fire
  {
    id: 'flexing_go',
    emoji: '💪',
    label: "Let's Go!",
    expression: EXPRESSION_PRESETS.find((e) => e.id === 'cool')!,
    poseId: 'flexing',
    overlayId: 'fire',
    text: "LET'S GO",
    fineTune: { jawForward: 0.2, mouthSmileLeft: 0.5, mouthSmileRight: 0.5 },
  },

  // 15. 🙏 Thanks — Namaste with sparkles
  {
    id: 'thanks_thx',
    emoji: '🙏',
    label: 'Thanks',
    expression: EXPRESSION_PRESETS.find((e) => e.id === 'love')!,
    poseId: 'praying',
    overlayId: 'sparkles',
    text: 'THX',
    fineTune: { eyeSquintLeft: 0.5, eyeSquintRight: 0.5 },
  },

  // 16. 🤷 Shrug — IDK shrug
  {
    id: 'shrug_idk',
    emoji: '🤷',
    label: 'IDK',
    expression: EXPRESSION_PRESETS.find((e) => e.id === 'smirk')!,
    poseId: 'shrug',
    overlayId: 'none',
    text: 'OOPS',
  },

  // 17. 😏 Smirk — Smug pointing
  {
    id: 'smirk_point',
    emoji: '😏',
    label: 'You!',
    expression: EXPRESSION_PRESETS.find((e) => e.id === 'smirk')!,
    poseId: 'pointing',
    overlayId: 'none',
    text: '',
  },

  // 18. 🥺 PLZ — Pleading shy pose with tears
  {
    id: 'pleading_plz',
    emoji: '🥺',
    label: 'Please?',
    expression: EXPRESSION_PRESETS.find((e) => e.id === 'pleading')!,
    poseId: 'shy',
    overlayId: 'crying',
    text: 'PLZ',
  },

  // 19. 🕺 Dab — Dab with music
  {
    id: 'dab_slay',
    emoji: '🕺',
    label: 'Dab!',
    expression: EXPRESSION_PRESETS.find((e) => e.id === 'cool')!,
    poseId: 'dab',
    overlayId: 'music',
    text: 'SLAY',
  },

  // 20. 💃 Dancing — Dance party with confetti
  {
    id: 'dance_party',
    emoji: '💃',
    label: 'Dance!',
    expression: EXPRESSION_PRESETS.find((e) => e.id === 'excited')!,
    poseId: 'dancing',
    overlayId: 'confetti',
    text: '',
  },
]

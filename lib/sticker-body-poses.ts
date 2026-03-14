/**
 * Body pose presets for avatar sticker pack
 *
 * Based on ACTUAL bone analysis of RPM model:
 *
 * LeftArm rest: euler=(45.3°, 9.0°, 1.0°)  → arm hangs down at sides
 * RightArm rest: euler=(45.3°, -9.0°, -1.0°) → mirrored
 *
 * AXIS EFFECTS (delta from rest, tested empirically):
 *
 * LeftArm:
 *   -X  → arm goes UP + outward
 *   +X  → arm goes DOWN + inward
 *   +Z  → arm goes UP + FORWARD (toward camera)
 *   -Z  → arm goes BACKWARD
 *   +Y  → twist inward
 *
 * RightArm (mirrored):
 *   -X  → arm goes UP + outward
 *   +X  → arm goes DOWN + inward
 *   -Z  → arm goes UP + FORWARD
 *   +Z  → arm goes BACKWARD
 *   -Y  → twist inward
 *
 * LeftForeArm rest: euler=(2.0°, -0.6°, 27.5°)
 *   +Z  → bend elbow more (close arm)
 *
 * RightForeArm rest: euler=(2.0°, 0.6°, -27.5°)
 *   -Z  → bend elbow more (close arm)
 *
 * Fingers: +X = curl/close
 */

// ─── Types ───────────────────────────────────────────────────

export interface BoneRotation {
  x: number
  y: number
  z: number
}

export interface BodyPose {
  id: string
  label: string
  emoji: string
  bones: Record<string, BoneRotation>
  camera: 'full' | 'upper'
}

// ─── Helpers ─────────────────────────────────────────────────

const deg = (d: number) => (d * Math.PI) / 180

// ─── Pose presets ────────────────────────────────────────────

export const BODY_POSES: BodyPose[] = [
  // ── 0. Neutral ───────────────────────────────────────────
  {
    id: 'neutral',
    label: 'Neutral',
    emoji: '🧍',
    camera: 'upper',
    bones: {},
  },

  // ── 1. Thumbs Up — right arm raised to chest, fist closed, thumb out ──
  {
    id: 'thumbs_up',
    label: 'Thumbs Up',
    emoji: '👍',
    camera: 'upper',
    bones: {
      Spine: { x: deg(-2), y: deg(3), z: deg(0) },
      Head: { x: deg(3), y: deg(-5), z: deg(2) },

      // Right arm: raise UP (-X) + forward (+Z... wait right is -Z for forward)
      RightArm: { x: deg(-35), y: deg(0), z: deg(0) },
      RightForeArm: { x: deg(0), y: deg(0), z: deg(-60) }, // bend elbow

      // Close all fingers except thumb
      RightHandIndex1: { x: deg(70), y: deg(0), z: deg(0) },
      RightHandIndex2: { x: deg(70), y: deg(0), z: deg(0) },
      RightHandMiddle1: { x: deg(70), y: deg(0), z: deg(0) },
      RightHandMiddle2: { x: deg(70), y: deg(0), z: deg(0) },
      RightHandRing1: { x: deg(70), y: deg(0), z: deg(0) },
      RightHandRing2: { x: deg(70), y: deg(0), z: deg(0) },
      RightHandPinky1: { x: deg(70), y: deg(0), z: deg(0) },
      RightHandPinky2: { x: deg(70), y: deg(0), z: deg(0) },

      LeftArm: { x: deg(5), y: deg(0), z: deg(0) },
    },
  },

  // ── 2. Wave — right arm raised high, hand open ──────────
  {
    id: 'wave',
    label: 'Wave',
    emoji: '👋',
    camera: 'upper',
    bones: {
      Spine: { x: deg(-2), y: deg(3), z: deg(0) },
      Head: { x: deg(3), y: deg(-3), z: deg(3) },

      // Right arm: raise way UP (-X) and slightly forward
      RightArm: { x: deg(-55), y: deg(0), z: deg(-15) },
      RightForeArm: { x: deg(0), y: deg(0), z: deg(-40) }, // bend elbow
      RightHand: { x: deg(0), y: deg(0), z: deg(10) },

      LeftArm: { x: deg(3), y: deg(0), z: deg(0) },
    },
  },

  // ── 3. Crossed Arms — arms folded over chest ────────────
  {
    id: 'crossed_arms',
    label: 'Crossed Arms',
    emoji: '😤',
    camera: 'upper',
    bones: {
      Spine: { x: deg(2), y: deg(0), z: deg(0) },
      Spine1: { x: deg(2), y: deg(0), z: deg(0) },
      Head: { x: deg(-2), y: deg(0), z: deg(0) },

      // Left arm: raise up (-X), twist in (+Y), fold elbow
      LeftArm: { x: deg(-20), y: deg(20), z: deg(0) },
      LeftForeArm: { x: deg(0), y: deg(0), z: deg(60) }, // bend elbow closed

      // Right arm: raise up (-X), twist in (-Y), fold elbow
      RightArm: { x: deg(-20), y: deg(-20), z: deg(0) },
      RightForeArm: { x: deg(0), y: deg(0), z: deg(-60) }, // bend elbow closed
    },
  },

  // ── 4. Peace Sign — right hand up with V fingers ────────
  {
    id: 'peace',
    label: 'Peace Sign',
    emoji: '✌️',
    camera: 'upper',
    bones: {
      Spine: { x: deg(-2), y: deg(-3), z: deg(2) },
      Head: { x: deg(2), y: deg(5), z: deg(-3) },

      // Right arm: raise up and forward
      RightArm: { x: deg(-30), y: deg(0), z: deg(-10) },
      RightForeArm: { x: deg(0), y: deg(0), z: deg(-50) }, // bend elbow

      // Close ring, pinky, thumb — leave index + middle open for V
      RightHandRing1: { x: deg(70), y: deg(0), z: deg(0) },
      RightHandRing2: { x: deg(70), y: deg(0), z: deg(0) },
      RightHandPinky1: { x: deg(70), y: deg(0), z: deg(0) },
      RightHandPinky2: { x: deg(70), y: deg(0), z: deg(0) },
      RightHandThumb1: { x: deg(30), y: deg(0), z: deg(0) },

      LeftArm: { x: deg(3), y: deg(0), z: deg(0) },
    },
  },

  // ── 5. Power Pose — hands on hips ───────────────────────
  {
    id: 'hands_on_hips',
    label: 'Power Pose',
    emoji: '🦸',
    camera: 'upper',
    bones: {
      Spine: { x: deg(-3), y: deg(0), z: deg(0) },
      Spine1: { x: deg(-2), y: deg(0), z: deg(0) },
      Head: { x: deg(-3), y: deg(0), z: deg(0) },

      // Both arms: push forward (+X would go down)
      // Actually for hands on hips: arms go outward then elbows bend sharply
      LeftArm: { x: deg(10), y: deg(15), z: deg(0) },
      LeftForeArm: { x: deg(0), y: deg(0), z: deg(55) },

      RightArm: { x: deg(10), y: deg(-15), z: deg(0) },
      RightForeArm: { x: deg(0), y: deg(0), z: deg(-55) },

      LeftUpLeg: { x: deg(0), y: deg(0), z: deg(3) },
      RightUpLeg: { x: deg(0), y: deg(0), z: deg(-3) },
    },
  },

  // ── 6. Shrug — shoulders raised, forearms up and out ────
  {
    id: 'shrug',
    label: 'Shrug',
    emoji: '🤷',
    camera: 'upper',
    bones: {
      Spine: { x: deg(2), y: deg(0), z: deg(2) },
      Head: { x: deg(3), y: deg(0), z: deg(-5) },

      // Raise shoulders up
      LeftShoulder: { x: deg(-3), y: deg(0), z: deg(-10) },
      RightShoulder: { x: deg(-3), y: deg(0), z: deg(10) },

      // Arms up (-X) and bend elbows, palms up
      LeftArm: { x: deg(-30), y: deg(0), z: deg(0) },
      LeftForeArm: { x: deg(0), y: deg(0), z: deg(55) },
      LeftHand: { x: deg(0), y: deg(-20), z: deg(0) },

      RightArm: { x: deg(-30), y: deg(0), z: deg(0) },
      RightForeArm: { x: deg(0), y: deg(0), z: deg(-55) },
      RightHand: { x: deg(0), y: deg(20), z: deg(0) },
    },
  },

  // ── 7. Heart Hands — both arms raised to chest, forming heart ──
  {
    id: 'heart_hands',
    label: 'Heart Hands',
    emoji: '🫶',
    camera: 'upper',
    bones: {
      Spine: { x: deg(-3), y: deg(0), z: deg(0) },
      Head: { x: deg(3), y: deg(0), z: deg(2) },

      // Both arms: raised UP (-X) and forward, elbows bent inward
      LeftArm: { x: deg(-35), y: deg(15), z: deg(15) },
      LeftForeArm: { x: deg(0), y: deg(0), z: deg(55) }, // bend elbow closed
      LeftHand: { x: deg(0), y: deg(15), z: deg(-20) },

      RightArm: { x: deg(-35), y: deg(-15), z: deg(-15) },
      RightForeArm: { x: deg(0), y: deg(0), z: deg(-55) }, // bend elbow closed
      RightHand: { x: deg(0), y: deg(-15), z: deg(20) },

      // Fingers slightly curved for heart shape
      LeftHandIndex1: { x: deg(25), y: deg(0), z: deg(5) },
      LeftHandMiddle1: { x: deg(35), y: deg(0), z: deg(0) },
      RightHandIndex1: { x: deg(25), y: deg(0), z: deg(-5) },
      RightHandMiddle1: { x: deg(35), y: deg(0), z: deg(0) },
    },
  },

  // ── 8. Thinking — right hand on chin ────────────────────
  {
    id: 'thinking',
    label: 'Thinking',
    emoji: '🤔',
    camera: 'upper',
    bones: {
      Spine: { x: deg(3), y: deg(-2), z: deg(0) },
      Head: { x: deg(3), y: deg(8), z: deg(-2) },

      // Right arm: raised high to chin (-X strong), elbow bent
      RightArm: { x: deg(-40), y: deg(-10), z: deg(0) },
      RightForeArm: { x: deg(0), y: deg(0), z: deg(-80) }, // tight elbow bend

      // Fingers partially closed as if resting on chin
      RightHandIndex1: { x: deg(15), y: deg(0), z: deg(0) },
      RightHandMiddle1: { x: deg(25), y: deg(0), z: deg(0) },
      RightHandRing1: { x: deg(35), y: deg(0), z: deg(0) },
      RightHandPinky1: { x: deg(45), y: deg(0), z: deg(0) },

      // Left arm: slightly raised, casual
      LeftArm: { x: deg(-5), y: deg(15), z: deg(0) },
      LeftForeArm: { x: deg(0), y: deg(0), z: deg(40) },
    },
  },

  // ── 9. Celebrate — right arm raised high, fist pump ─────
  {
    id: 'celebrate',
    label: 'Celebrate!',
    emoji: '🎉',
    camera: 'upper',
    bones: {
      Spine: { x: deg(-3), y: deg(-2), z: deg(-2) },
      Head: { x: deg(-3), y: deg(-3), z: deg(2) },

      // Right arm: HIGH UP (-X big) + some forward
      RightArm: { x: deg(-55), y: deg(0), z: deg(-10) },
      RightForeArm: { x: deg(0), y: deg(0), z: deg(-30) },
      // Fist
      RightHandIndex1: { x: deg(70), y: deg(0), z: deg(0) },
      RightHandMiddle1: { x: deg(70), y: deg(0), z: deg(0) },
      RightHandRing1: { x: deg(70), y: deg(0), z: deg(0) },
      RightHandPinky1: { x: deg(70), y: deg(0), z: deg(0) },

      // Left arm: slightly raised
      LeftArm: { x: deg(-10), y: deg(8), z: deg(0) },
      LeftForeArm: { x: deg(0), y: deg(0), z: deg(25) },
    },
  },

  // ── 10. Pointing — right arm extended forward, index out ─
  {
    id: 'pointing',
    label: 'Pointing',
    emoji: '👉',
    camera: 'upper',
    bones: {
      Spine: { x: deg(-3), y: deg(3), z: deg(0) },
      Head: { x: deg(2), y: deg(-3), z: deg(0) },

      // Right arm: raised up (-X) and forward (-Z for right)
      RightArm: { x: deg(-25), y: deg(0), z: deg(-10) },
      RightForeArm: { x: deg(0), y: deg(0), z: deg(-20) }, // slight bend
      // Close all fingers except index
      RightHandMiddle1: { x: deg(70), y: deg(0), z: deg(0) },
      RightHandRing1: { x: deg(70), y: deg(0), z: deg(0) },
      RightHandPinky1: { x: deg(70), y: deg(0), z: deg(0) },
      RightHandThumb1: { x: deg(25), y: deg(0), z: deg(0) },

      // Left arm on hip
      LeftArm: { x: deg(10), y: deg(20), z: deg(0) },
      LeftForeArm: { x: deg(0), y: deg(0), z: deg(50) },
    },
  },

  // ── 11. Flexing — both arms raised, elbows bent, show muscles ──
  {
    id: 'flexing',
    label: 'Flexing',
    emoji: '💪',
    camera: 'upper',
    bones: {
      Spine: { x: deg(-3), y: deg(0), z: deg(0) },
      Spine1: { x: deg(-3), y: deg(0), z: deg(0) },
      Head: { x: deg(-2), y: deg(0), z: deg(0) },

      // Both arms: raised high (-X), elbows bent tight, fists
      LeftArm: { x: deg(-45), y: deg(8), z: deg(0) },
      LeftForeArm: { x: deg(0), y: deg(0), z: deg(70) }, // tight elbow bend
      LeftHandIndex1: { x: deg(70), y: deg(0), z: deg(0) },
      LeftHandMiddle1: { x: deg(70), y: deg(0), z: deg(0) },
      LeftHandRing1: { x: deg(70), y: deg(0), z: deg(0) },
      LeftHandPinky1: { x: deg(70), y: deg(0), z: deg(0) },

      RightArm: { x: deg(-45), y: deg(-8), z: deg(0) },
      RightForeArm: { x: deg(0), y: deg(0), z: deg(-70) }, // tight elbow bend
      RightHandIndex1: { x: deg(70), y: deg(0), z: deg(0) },
      RightHandMiddle1: { x: deg(70), y: deg(0), z: deg(0) },
      RightHandRing1: { x: deg(70), y: deg(0), z: deg(0) },
      RightHandPinky1: { x: deg(70), y: deg(0), z: deg(0) },

      LeftUpLeg: { x: deg(0), y: deg(0), z: deg(5) },
      RightUpLeg: { x: deg(0), y: deg(0), z: deg(-5) },
    },
  },

  // ── 12. Namaste — palms together at chest ───────────────
  {
    id: 'praying',
    label: 'Namaste',
    emoji: '🙏',
    camera: 'upper',
    bones: {
      Spine: { x: deg(3), y: deg(0), z: deg(0) },
      Head: { x: deg(5), y: deg(0), z: deg(0) },
      Neck: { x: deg(3), y: deg(0), z: deg(0) },

      // Arms raised (-X) and twisted inward, elbows bent to bring palms together
      LeftArm: { x: deg(-25), y: deg(15), z: deg(0) },
      LeftForeArm: { x: deg(0), y: deg(0), z: deg(55) },

      RightArm: { x: deg(-25), y: deg(-15), z: deg(0) },
      RightForeArm: { x: deg(0), y: deg(0), z: deg(-55) },
    },
  },

  // ── 13. Dab — left arm extended, right arm bent covering face ──
  {
    id: 'dab',
    label: 'Dab',
    emoji: '🕺',
    camera: 'upper',
    bones: {
      Spine: { x: deg(3), y: deg(12), z: deg(8) },
      Head: { x: deg(10), y: deg(15), z: deg(0) },

      // Right arm: bent across face
      RightArm: { x: deg(-30), y: deg(0), z: deg(0) },
      RightForeArm: { x: deg(0), y: deg(0), z: deg(-70) },

      // Left arm: extended out and up
      LeftArm: { x: deg(-50), y: deg(0), z: deg(10) },
      LeftForeArm: { x: deg(0), y: deg(0), z: deg(8) },
    },
  },

  // ── 14. Shy — hunched, arms in front, looking down ──────
  {
    id: 'shy',
    label: 'Shy',
    emoji: '🥺',
    camera: 'upper',
    bones: {
      Spine: { x: deg(5), y: deg(0), z: deg(0) },
      Spine1: { x: deg(3), y: deg(0), z: deg(0) },
      Head: { x: deg(8), y: deg(-3), z: deg(-3) },

      // Arms raised slightly, hands fidgeting in front
      LeftArm: { x: deg(-15), y: deg(15), z: deg(0) },
      LeftForeArm: { x: deg(0), y: deg(0), z: deg(45) },

      RightArm: { x: deg(-15), y: deg(-15), z: deg(0) },
      RightForeArm: { x: deg(0), y: deg(0), z: deg(-45) },

      LeftUpLeg: { x: deg(0), y: deg(8), z: deg(2) },
      RightUpLeg: { x: deg(0), y: deg(-8), z: deg(-2) },
    },
  },

  // ── 15. Dancing — dynamic party pose ────────────────────
  {
    id: 'dancing',
    label: 'Dancing',
    emoji: '💃',
    camera: 'full',
    bones: {
      Spine: { x: deg(-3), y: deg(-10), z: deg(3) },
      Head: { x: deg(0), y: deg(8), z: deg(-3) },

      // Right arm: high up, disco style
      RightArm: { x: deg(-55), y: deg(0), z: deg(-10) },
      RightForeArm: { x: deg(0), y: deg(0), z: deg(-25) },

      // Left arm: out to the side
      LeftArm: { x: deg(-25), y: deg(0), z: deg(10) },
      LeftForeArm: { x: deg(0), y: deg(0), z: deg(35) },

      LeftUpLeg: { x: deg(-8), y: deg(0), z: deg(8) },
      LeftLeg: { x: deg(15), y: deg(0), z: deg(0) },
      RightUpLeg: { x: deg(10), y: deg(0), z: deg(-3) },
    },
  },
]

// ─── Camera constants ────────────────────────────────────────

export const POSE_CAMERA = {
  full: { y: 0.8, z: 3.0 },
  upper: { y: 1.2, z: 1.5 },
} as const

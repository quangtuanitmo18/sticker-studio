import * as THREE from 'three'

/**
 * 3D Vertex Displacement Shader for Face Warping
 * Hoạt động bằng cách áp dụng lên một FaceMesh tàng hình.
 * Các đỉnh của FaceMesh (ở mắt, cằm) sẽ bị dịch chuyển (push out / pull in) trong không gian 3D.
 * Texture của nó được lấy chính xác từ tọa độ Screen của đỉnh gốc (undisplaced).
 * Kết quả: Mép FaceMesh hòa quyện 100% với video nền, trong khi vùng giữa mặt móp méo chân thực!
 */
export const FaceWarpShader = {
  uniforms: {
    tDiffuse: { value: null },      // Video Texture nguyên bản
    uAspect: { value: 1.0 },        // Canvas width / height

    // UV video mapping for object-fit: cover
    uVideoScale: { value: new THREE.Vector2(1, 1) },
    uVideoOffset: { value: new THREE.Vector2(0, 0) },

    // 4 Tâm bóp méo 2D Screen Space (0..1)
    uPoints: { value: [new THREE.Vector2(), new THREE.Vector2(), new THREE.Vector2(), new THREE.Vector2()] },
    uRadii: { value: [0, 0, 0, 0] },
    uStrengths: { value: [0, 0, 0, 0] },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float uAspect;
    uniform vec2 uVideoScale;
    uniform vec2 uVideoOffset;

    uniform vec2 uPoints[4];
    uniform float uRadii[4];
    uniform float uStrengths[4];

    varying vec2 vUv;

    void main() {
      vec2 p = vUv;
      bool distorted = false;

      for(int i = 0; i < 4; i++) {
        if (uRadii[i] > 0.0) {
          // Tính khoảng cách có bóp méo theo AR của aspect ratio
          // Vì vUv.x và vUv.y có tỷ lệ theo pixel khác nhau, ta phải nhân aspect để không bị méo ellipse
          vec2 offset = p - uPoints[i];
          offset.y /= uAspect; 
          float d = length(offset);
          
          if (d < uRadii[i]) {
            float percent = 1.0 - (d / uRadii[i]);
            // Pinch/Bulge Distortion Algorithm
            float amount = uStrengths[i] * percent * percent;
            p -= (p - uPoints[i]) * amount;
            distorted = true;
          }
        }
      }

      if (!distorted) {
        // Pixel nằm ngoài vùng bóp méo -> Trong suốt 100% để hiển thị DOM <video> gốc
        gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
        return;
      }

      // Convert Screen UV to Video UV using object-fit Cover bounds.
      vec2 vidUv = p;
      // THREE.VideoTexture reads native video orientation with Y=0 at TOP.
      // Since plane UV Y=0 is BOTTOM, we must invert the Y sampling.
      vidUv.y = 1.0 - vidUv.y;
      vidUv = vidUv * uVideoScale + uVideoOffset;

      // Xử lý tràn viền Texture
      if (vidUv.x < 0.0 || vidUv.x > 1.0 || vidUv.y < 0.0 || vidUv.y > 1.0) {
         gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
      } else {
         gl_FragColor = vec4(texture2D(tDiffuse, vidUv).rgb, 1.0); // Hiển thị pixel bị méo
      }
    }
  `
}

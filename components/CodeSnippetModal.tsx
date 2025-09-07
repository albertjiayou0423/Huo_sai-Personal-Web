import React, { useEffect } from 'react';
import { Icon } from './Icons';

interface CodeSnippetModalProps {
  onClose: () => void;
}

const codeSnippet = `
// --- REWORKED: Flocking, Clustering, and Separation Logic ---
let avg_vx = 0, avg_vy = 0, neighbor_count = 0;
let same_color_center_x = 0, same_color_center_y = 0, same_color_count = 0;
let separation_vx = 0, separation_vy = 0;

for (const other of allShapes) {
    if (shape.id === other.id) continue;
    const d_sq = (shape.x - other.x)**2 + (shape.y - other.y)**2;
    
    if (d_sq < CONSTELLATION_DISTANCE ** 2) {
        avg_vx += other.vx;
        avg_vy += other.vy;
        neighbor_count++;

        // Add separation force to prevent clumping
        if (d_sq < ((shape.size + other.size) / 1.5)**2) {
            const d = Math.sqrt(d_sq) || 1;
            separation_vx += (shape.x - other.x) / d;
            separation_vy += (shape.y - other.y) / d;
        }
    }

    if (isIdle && shape.originalColor.fill === other.originalColor.fill) {
        same_color_center_x += other.x;
        same_color_center_y += other.y;
        same_color_count++;
    }
}

// Apply flocking (alignment) force
if (neighbor_count > 0) {
    avg_vx /= neighbor_count;
    avg_vy /= neighbor_count;
    vx += (avg_vx - vx) * FLOCKING_STRENGTH * neighbor_count;
    vy += (avg_vy - vy) * FLOCKING_STRENGTH * neighbor_count;
}

// Apply clustering (cohesion) force when idle
if (isIdle && same_color_count > 0) {
    const targetX = same_color_center_x / same_color_count;
    const targetY = same_color_center_y / same_color_count;
    vx += (targetX - shape.x) * 0.0001;
    vy += (targetY - shape.y) * 0.0001;
}

// Apply separation force
vx += separation_vx * SEPARATION_FORCE;
vy += separation_vy * SEPARATION_FORCE;
`.trim();

const CodeSnippetModal: React.FC<CodeSnippetModalProps> = ({ onClose }) => {
  useEffect(() => {
    (window as any).hljs?.highlightAll();
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-auto">
      <div className="absolute inset-0 bg-black/50 animate-fadeIn" onClick={onClose}></div>
      <div className="relative flex flex-col w-full max-w-2xl max-h-[80vh] bg-[rgb(var(--background-card))] p-6 sm:p-8 rounded-lg border border-[rgb(var(--border-primary))] shadow-lg text-left animate-scaleUp">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[rgb(var(--text-quaternary))] hover:text-[rgb(var(--text-tertiary))] transition-colors z-10"
          aria-label="关闭"
        >
          <Icon name="close" />
        </button>
        <h2 className="text-2xl font-bold tracking-tight mb-4 text-[rgb(var(--text-secondary))]">代码之美</h2>
        <p className="text-sm text-[rgb(var(--text-tertiary))] mb-4">
          这是驱动背景形状运动的核心逻辑之一，它模拟了群体行为（聚集、对齐、分离），创造出自然的动态效果。
        </p>
        <div className="overflow-auto rounded-lg bg-gray-50 p-4 border border-[rgb(var(--border-primary))]">
          <pre><code className="language-javascript rounded text-sm">{codeSnippet}</code></pre>
        </div>
      </div>
    </div>
  );
};

export default CodeSnippetModal;
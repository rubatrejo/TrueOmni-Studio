# Remotion Best Practices — Programmatic Video Creation

---

name: remotion-best-practices
description: Comprehensive guide for creating programmatic videos with Remotion in a Next.js project. Covers setup, animations, transitions, audio, text effects, social media specs, export options, and practical templates for product demos, social ads, and promotional content.
triggers:

- remotion
- video
- programmatic video
- animation video
- social media video
- product demo video
- promo video
- video rendering
- mp4
- video export

---

## 1. Remotion Setup with Next.js

### 1.1 Installation

```bash
# Core packages
npm install remotion @remotion/cli @remotion/player @remotion/renderer

# Optional but recommended
npm install @remotion/paths        # SVG path animations
npm install @remotion/noise        # Noise/grain effects
npm install @remotion/media-utils  # Audio/video utilities
npm install @remotion/gif          # GIF support
npm install @remotion/lottie       # Lottie animation support
npm install @remotion/three        # 3D with Three.js
npm install @remotion/tailwind     # Tailwind support in compositions
```

### 1.2 Configuration File

```typescript
// remotion.config.ts (project root)
import { Config } from '@remotion/cli/config';

Config.setVideoImageFormat('jpeg'); // or 'png' for transparency
Config.setOverwriteOutput(true);
Config.setConcurrency(4); // parallel render threads
Config.setPixelFormat('yuv420p'); // best compatibility
Config.setCodec('h264'); // default codec
Config.setChromiumOpenGlRenderer('angle'); // GPU rendering
```

### 1.3 Folder Structure

```
src/
├── remotion/
│   ├── Root.tsx                    # Entry point — registers all compositions
│   ├── compositions/
│   │   ├── ProductDemo/
│   │   │   ├── index.tsx           # Main composition
│   │   │   ├── scenes/
│   │   │   │   ├── IntroScene.tsx
│   │   │   │   ├── FeatureScene.tsx
│   │   │   │   └── OutroScene.tsx
│   │   │   └── types.ts
│   │   ├── SocialAd/
│   │   │   ├── index.tsx
│   │   │   └── scenes/
│   │   ├── BlogPromo/
│   │   │   └── index.tsx
│   │   └── FeatureAnnouncement/
│   │       └── index.tsx
│   ├── components/
│   │   ├── Logo.tsx                # Animated brand logo
│   │   ├── TextReveal.tsx          # Text animation component
│   │   ├── TransitionWipe.tsx      # Transition effects
│   │   ├── BackgroundGradient.tsx  # Animated gradients
│   │   └── ProgressBar.tsx         # Video progress indicator
│   ├── hooks/
│   │   ├── useAnimatedValue.ts     # Custom interpolation hook
│   │   └── useStaggerDelay.ts      # Stagger timing hook
│   ├── utils/
│   │   ├── colors.ts               # Brand color constants
│   │   ├── fonts.ts                 # Font loading
│   │   ├── easings.ts              # Custom easing functions
│   │   └── timing.ts               # Frame-to-time helpers
│   └── assets/
│       ├── audio/
│       ├── images/
│       └── fonts/
├── app/
│   └── video/
│       └── page.tsx                # Web preview page with Player
```

### 1.4 Root.tsx — Composition Registry

```typescript
// src/remotion/Root.tsx
import { Composition } from 'remotion';
import { ProductDemo } from './compositions/ProductDemo';
import { SocialAd } from './compositions/SocialAd';
import { BlogPromo } from './compositions/BlogPromo';
import { FeatureAnnouncement } from './compositions/FeatureAnnouncement';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* YouTube / General (16:9) */}
      <Composition
        id="ProductDemo"
        component={ProductDemo}
        durationInFrames={900}   // 30 seconds at 30fps
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          title: 'TrueOmni Platform Demo',
          features: ['Feature 1', 'Feature 2', 'Feature 3'],
        }}
      />

      {/* Instagram Post (1:1) */}
      <Composition
        id="SocialAd-Square"
        component={SocialAd}
        durationInFrames={450}   // 15 seconds
        fps={30}
        width={1080}
        height={1080}
        defaultProps={{ variant: 'square' }}
      />

      {/* Instagram Story / TikTok / Reels (9:16) */}
      <Composition
        id="SocialAd-Vertical"
        component={SocialAd}
        durationInFrames={450}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ variant: 'vertical' }}
      />

      {/* Blog post promo */}
      <Composition
        id="BlogPromo"
        component={BlogPromo}
        durationInFrames={300}   // 10 seconds
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          blogTitle: 'How to Scale Your Business',
          author: 'Ruben Ramirez',
        }}
      />

      {/* Feature announcement */}
      <Composition
        id="FeatureAnnouncement"
        component={FeatureAnnouncement}
        durationInFrames={600}   // 20 seconds
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          featureName: 'AI Analytics Dashboard',
          description: 'Real-time insights powered by AI',
        }}
      />
    </>
  );
};
```

### 1.5 Package.json Scripts

```json
{
  "scripts": {
    "video:preview": "remotion studio src/remotion/Root.tsx",
    "video:render": "remotion render src/remotion/Root.tsx ProductDemo out/product-demo.mp4",
    "video:render:all": "remotion render src/remotion/Root.tsx --all",
    "video:render:gif": "remotion render src/remotion/Root.tsx SocialAd-Square out/social.gif --image-format png --codec gif",
    "video:still": "remotion still src/remotion/Root.tsx ProductDemo out/thumbnail.png --frame=60",
    "video:upgrade": "remotion upgrade"
  }
}
```

---

## 2. Core Concepts

### 2.1 useCurrentFrame() and useVideoConfig()

```typescript
import { useCurrentFrame, useVideoConfig } from 'remotion';

const MyComponent: React.FC = () => {
  const frame = useCurrentFrame();           // Current frame number (0-based)
  const { fps, durationInFrames, width, height } = useVideoConfig();

  const currentSecond = frame / fps;         // Current time in seconds
  const progress = frame / durationInFrames; // 0 to 1 progress

  return (
    <div style={{ opacity: Math.min(1, frame / 30) }}>
      Frame: {frame} / {durationInFrames}
      Time: {currentSecond.toFixed(2)}s
    </div>
  );
};
```

### 2.2 interpolate() — The Core Animation Function

```typescript
import { interpolate, Easing } from 'remotion';

// Basic: map frame 0-30 to opacity 0-1
const opacity = interpolate(frame, [0, 30], [0, 1]);

// With clamping (default — clamps output to [0, 1]):
const opacity = interpolate(frame, [0, 30], [0, 1], {
  extrapolateLeft: 'clamp', // default
  extrapolateRight: 'clamp', // default
});

// Allow values to extend beyond output range:
const position = interpolate(frame, [0, 30], [0, 100], {
  extrapolateRight: 'extend', // goes past 100 after frame 30
});

// With easing:
const scale = interpolate(frame, [0, 30], [0, 1], {
  easing: Easing.bezier(0.25, 0.1, 0, 1),
});

// Multi-point interpolation (keyframes):
const y = interpolate(
  frame,
  [0, 15, 30, 45, 60], // keyframe frames
  [100, 0, -20, 0, 0], // keyframe values
  { extrapolateRight: 'clamp' },
);

// COMMON PATTERNS:
// Fade in during frames 0-20:
const fadeIn = interpolate(frame, [0, 20], [0, 1], {
  extrapolateRight: 'clamp',
});

// Fade out during frames 80-100:
const fadeOut = interpolate(frame, [80, 100], [1, 0], {
  extrapolateLeft: 'clamp',
});

// Slide in from left:
const slideX = interpolate(frame, [0, 30], [-200, 0], {
  easing: Easing.out(Easing.cubic),
  extrapolateRight: 'clamp',
});
```

### 2.3 spring() — Physics-Based Animation

```typescript
import { spring, useCurrentFrame, useVideoConfig } from 'remotion';

const MyComponent: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Basic spring (0 → 1)
  const scale = spring({
    frame,
    fps,
    config: {
      damping: 200,      // Higher = less bounce (100-300 typical)
      stiffness: 200,    // Higher = faster (100-400 typical)
      mass: 1,           // Higher = heavier feel (0.5-2 typical)
      overshootClamping: false, // true = no overshoot
    },
  });

  // Delayed spring (starts at frame 20)
  const delayedScale = spring({
    frame: frame - 20,  // subtract delay frames
    fps,
    config: { damping: 100, stiffness: 200 },
  });

  // USEFUL SPRING PRESETS:
  const springPresets = {
    // Snappy (buttons, small UI elements)
    snappy: { damping: 200, stiffness: 400, mass: 0.5 },
    // Gentle (larger elements, modals)
    gentle: { damping: 20, stiffness: 100, mass: 1 },
    // Bouncy (playful, attention-grabbing)
    bouncy: { damping: 10, stiffness: 150, mass: 0.8 },
    // Heavy (dramatic, weighty movement)
    heavy: { damping: 25, stiffness: 80, mass: 2 },
    // Quick settle (UI transitions)
    quickSettle: { damping: 30, stiffness: 300, mass: 0.8 },
  };

  return (
    <div style={{ transform: `scale(${scale})` }}>
      Spring animated!
    </div>
  );
};
```

### 2.4 Easing Functions Reference

```typescript
import { Easing } from 'remotion';

// Built-in easings:
Easing.linear        // No easing
Easing.ease          // Standard ease
Easing.quad          // Quadratic
Easing.cubic         // Cubic
Easing.sin           // Sinusoidal
Easing.circle        // Circular
Easing.exp           // Exponential
Easing.bounce        // Bounce at end
Easing.back(s?)      // Overshoot (s = overshoot amount, default 1.70158)
Easing.elastic(b?)   // Elastic bounce (b = bounciness)
Easing.poly(n)       // Polynomial (n = degree)

// Modifiers (apply to any easing):
Easing.in(Easing.cubic)      // Accelerate
Easing.out(Easing.cubic)     // Decelerate
Easing.inOut(Easing.cubic)   // Accelerate then decelerate

// Custom bezier curve:
Easing.bezier(0.25, 0.1, 0.25, 1)

// USAGE:
const value = interpolate(frame, [0, 30], [0, 1], {
  easing: Easing.out(Easing.cubic),
});
```

---

## 3. Sequences — Timing Clips

```typescript
import { Sequence, useCurrentFrame } from 'remotion';

const MyVideo: React.FC = () => {
  return (
    <div style={{ flex: 1, backgroundColor: '#000' }}>
      {/* Intro plays from frame 0 to 89 (3 seconds at 30fps) */}
      <Sequence from={0} durationInFrames={90}>
        <IntroScene />
      </Sequence>

      {/* Feature scene plays from frame 60 (overlaps intro by 1 second) */}
      <Sequence from={60} durationInFrames={150}>
        <FeatureScene />
      </Sequence>

      {/* Outro plays from frame 180 to end */}
      <Sequence from={180}>
        <OutroScene />
      </Sequence>

      {/* Named sequence (shows in timeline) */}
      <Sequence from={0} durationInFrames={30} name="Logo Animation">
        <LogoReveal />
      </Sequence>

      {/* Layout: "none" means sequence doesn't create a wrapper div */}
      <Sequence from={0} layout="none">
        <BackgroundMusic />
      </Sequence>
    </div>
  );
};

// INSIDE a Sequence, useCurrentFrame() resets to 0
// So IntroScene sees frame 0-89 as its local timeline
const IntroScene: React.FC = () => {
  const frame = useCurrentFrame(); // 0 at the start of THIS sequence
  const opacity = interpolate(frame, [0, 20], [0, 1]);
  return <div style={{ opacity }}>Hello</div>;
};
```

---

## 4. Animation Patterns

### 4.1 Fade In / Out

```typescript
const FadeIn: React.FC<{ children: React.ReactNode; delay?: number; duration?: number }> = ({
  children,
  delay = 0,
  duration = 20,
}) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame - delay, [0, duration], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return <div style={{ opacity }}>{children}</div>;
};

const FadeOut: React.FC<{ children: React.ReactNode; startFrame: number; duration?: number }> = ({
  children,
  startFrame,
  duration = 20,
}) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [startFrame, startFrame + duration], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return <div style={{ opacity }}>{children}</div>;
};
```

### 4.2 Slide from Direction

```typescript
type Direction = 'left' | 'right' | 'top' | 'bottom';

const SlideIn: React.FC<{
  children: React.ReactNode;
  direction?: Direction;
  delay?: number;
  distance?: number;
}> = ({ children, direction = 'left', delay = 0, distance = 100 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame: frame - delay,
    fps,
    config: { damping: 200, stiffness: 200 },
  });

  const transforms: Record<Direction, string> = {
    left: `translateX(${interpolate(progress, [0, 1], [-distance, 0])}px)`,
    right: `translateX(${interpolate(progress, [0, 1], [distance, 0])}px)`,
    top: `translateY(${interpolate(progress, [0, 1], [-distance, 0])}px)`,
    bottom: `translateY(${interpolate(progress, [0, 1], [distance, 0])}px)`,
  };

  return (
    <div style={{ transform: transforms[direction], opacity: progress }}>
      {children}
    </div>
  );
};
```

### 4.3 Scale Up / Down

```typescript
const ScaleIn: React.FC<{ children: React.ReactNode; delay?: number }> = ({
  children,
  delay = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({
    frame: frame - delay,
    fps,
    config: { damping: 15, stiffness: 200, mass: 0.8 },
  });

  const opacity = interpolate(frame - delay, [0, 10], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div style={{ transform: `scale(${scale})`, opacity }}>
      {children}
    </div>
  );
};
```

### 4.4 Text Reveal (Character by Character)

```typescript
const TextReveal: React.FC<{
  text: string;
  startFrame?: number;
  framesPerChar?: number;
}> = ({ text, startFrame = 0, framesPerChar = 2 }) => {
  const frame = useCurrentFrame();
  const charsToShow = Math.floor((frame - startFrame) / framesPerChar);

  return (
    <span>
      {text.split('').map((char, i) => {
        const isVisible = i < charsToShow;
        const charOpacity = interpolate(
          frame - startFrame - i * framesPerChar,
          [0, framesPerChar],
          [0, 1],
          { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
        );
        return (
          <span key={i} style={{ opacity: charOpacity }}>
            {char}
          </span>
        );
      })}
    </span>
  );
};
```

### 4.5 Number Counter Animation

```typescript
const NumberCounter: React.FC<{
  from: number;
  to: number;
  startFrame?: number;
  duration?: number;
  suffix?: string;
  prefix?: string;
}> = ({ from, to, startFrame = 0, duration = 60, suffix = '', prefix = '' }) => {
  const frame = useCurrentFrame();

  const value = interpolate(frame - startFrame, [0, duration], [from, to], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  return (
    <span>
      {prefix}{Math.round(value).toLocaleString()}{suffix}
    </span>
  );
};

// Usage: <NumberCounter from={0} to={10000} suffix="+" prefix="$" />
```

### 4.6 Stagger Animations

```typescript
const StaggerContainer: React.FC<{
  children: React.ReactNode[];
  staggerDelay?: number;
}> = ({ children, staggerDelay = 5 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <div>
      {React.Children.map(children, (child, index) => {
        const delay = index * staggerDelay;
        const progress = spring({
          frame: frame - delay,
          fps,
          config: { damping: 200, stiffness: 200 },
        });
        return (
          <div
            style={{
              opacity: progress,
              transform: `translateY(${interpolate(progress, [0, 1], [30, 0])}px)`,
            }}
          >
            {child}
          </div>
        );
      })}
    </div>
  );
};
```

### 4.7 SVG Path Drawing

```typescript
import { useCurrentFrame, interpolate, Easing } from 'remotion';
import { evolvePath } from '@remotion/paths';

const PathDraw: React.FC<{ d: string; duration?: number; color?: string }> = ({
  d,
  duration = 60,
  color = '#0066FF',
}) => {
  const frame = useCurrentFrame();

  const progress = interpolate(frame, [0, duration], [0, 1], {
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.cubic),
  });

  const { strokeDasharray, strokeDashoffset } = evolvePath(progress, d);

  return (
    <svg viewBox="0 0 200 200" width={200} height={200}>
      <path
        d={d}
        stroke={color}
        strokeWidth={3}
        fill="none"
        strokeDasharray={strokeDasharray}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
      />
    </svg>
  );
};
```

---

## 5. Text Animation Patterns

### 5.1 Word-by-Word Reveal

```typescript
const WordReveal: React.FC<{
  text: string;
  startFrame?: number;
  framesPerWord?: number;
}> = ({ text, startFrame = 0, framesPerWord = 8 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const words = text.split(' ');

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3em' }}>
      {words.map((word, i) => {
        const delay = startFrame + i * framesPerWord;
        const progress = spring({
          frame: frame - delay,
          fps,
          config: { damping: 200, stiffness: 300 },
        });

        return (
          <span
            key={i}
            style={{
              opacity: progress,
              transform: `translateY(${interpolate(progress, [0, 1], [20, 0])}px)`,
              display: 'inline-block',
            }}
          >
            {word}
          </span>
        );
      })}
    </div>
  );
};
```

### 5.2 Typewriter Effect

```typescript
const Typewriter: React.FC<{
  text: string;
  startFrame?: number;
  speed?: number; // frames per character
  showCursor?: boolean;
}> = ({ text, startFrame = 0, speed = 3, showCursor = true }) => {
  const frame = useCurrentFrame();
  const elapsed = frame - startFrame;
  const charsToShow = Math.min(Math.floor(elapsed / speed), text.length);
  const displayText = text.substring(0, charsToShow);

  // Blinking cursor
  const cursorOpacity = showCursor ? (Math.floor(frame / 15) % 2 === 0 ? 1 : 0) : 0;

  return (
    <span style={{ fontFamily: 'monospace' }}>
      {displayText}
      <span style={{ opacity: cursorOpacity }}>|</span>
    </span>
  );
};
```

### 5.3 Glitch Text

```typescript
const GlitchText: React.FC<{
  text: string;
  intensity?: number;
}> = ({ text, intensity = 1 }) => {
  const frame = useCurrentFrame();

  // Create glitch at specific intervals
  const isGlitching = frame % 30 < 4; // Glitch every second for ~4 frames
  const glitchX = isGlitching ? (Math.random() - 0.5) * 10 * intensity : 0;
  const glitchY = isGlitching ? (Math.random() - 0.5) * 5 * intensity : 0;

  return (
    <div style={{ position: 'relative' }}>
      {/* Main text */}
      <span style={{ position: 'relative', zIndex: 2 }}>{text}</span>

      {/* Red offset layer */}
      {isGlitching && (
        <span
          style={{
            position: 'absolute',
            left: glitchX,
            top: glitchY,
            color: 'rgba(255, 0, 0, 0.7)',
            zIndex: 1,
            clipPath: `inset(${Math.random() * 100}% 0 ${Math.random() * 100}% 0)`,
          }}
        >
          {text}
        </span>
      )}

      {/* Blue offset layer */}
      {isGlitching && (
        <span
          style={{
            position: 'absolute',
            left: -glitchX,
            top: -glitchY,
            color: 'rgba(0, 0, 255, 0.7)',
            zIndex: 1,
            clipPath: `inset(${Math.random() * 100}% 0 ${Math.random() * 100}% 0)`,
          }}
        >
          {text}
        </span>
      )}
    </div>
  );
};
```

### 5.4 Gradient Text Animation

```typescript
const GradientText: React.FC<{
  text: string;
  colors?: string[];
}> = ({ text, colors = ['#0066FF', '#7C3AED', '#06B6D4'] }) => {
  const frame = useCurrentFrame();
  const gradientPosition = interpolate(frame, [0, 120], [0, 200], {
    extrapolateRight: 'extend', // continuous loop
  });

  return (
    <span
      style={{
        backgroundImage: `linear-gradient(90deg, ${colors.join(', ')}, ${colors[0]})`,
        backgroundSize: '200% auto',
        backgroundPosition: `${gradientPosition}% center`,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
      }}
    >
      {text}
    </span>
  );
};
```

---

## 6. Transitions Between Scenes

### 6.1 Cross-Fade

```typescript
const CrossFade: React.FC<{
  children: [React.ReactNode, React.ReactNode];
  transitionStart: number;
  transitionDuration?: number;
}> = ({ children, transitionStart, transitionDuration = 15 }) => {
  const frame = useCurrentFrame();

  const progress = interpolate(
    frame,
    [transitionStart, transitionStart + transitionDuration],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div style={{ position: 'absolute', inset: 0, opacity: 1 - progress }}>
        {children[0]}
      </div>
      <div style={{ position: 'absolute', inset: 0, opacity: progress }}>
        {children[1]}
      </div>
    </div>
  );
};
```

### 6.2 Slide Transition

```typescript
const SlideTransition: React.FC<{
  children: [React.ReactNode, React.ReactNode];
  transitionStart: number;
  transitionDuration?: number;
  direction?: 'left' | 'right' | 'up' | 'down';
}> = ({ children, transitionStart, transitionDuration = 20, direction = 'left' }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  const progress = interpolate(
    frame,
    [transitionStart, transitionStart + transitionDuration],
    [0, 1],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.inOut(Easing.cubic),
    }
  );

  const getTransform = (isOutgoing: boolean) => {
    const multiplier = isOutgoing ? -1 : 1;
    const offset = isOutgoing ? progress : progress - 1;

    switch (direction) {
      case 'left': return `translateX(${offset * multiplier * width}px)`;
      case 'right': return `translateX(${-offset * multiplier * width}px)`;
      case 'up': return `translateY(${offset * multiplier * height}px)`;
      case 'down': return `translateY(${-offset * multiplier * height}px)`;
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, transform: getTransform(true) }}>
        {children[0]}
      </div>
      <div style={{ position: 'absolute', inset: 0, transform: getTransform(false) }}>
        {children[1]}
      </div>
    </div>
  );
};
```

### 6.3 Wipe Transition

```typescript
const WipeTransition: React.FC<{
  children: [React.ReactNode, React.ReactNode];
  transitionStart: number;
  transitionDuration?: number;
}> = ({ children, transitionStart, transitionDuration = 20 }) => {
  const frame = useCurrentFrame();

  const progress = interpolate(
    frame,
    [transitionStart, transitionStart + transitionDuration],
    [0, 100],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.inOut(Easing.cubic),
    }
  );

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div style={{ position: 'absolute', inset: 0 }}>
        {children[0]}
      </div>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          clipPath: `inset(0 ${100 - progress}% 0 0)`,
        }}
      >
        {children[1]}
      </div>
    </div>
  );
};
```

### 6.4 Zoom Transition

```typescript
const ZoomTransition: React.FC<{
  children: [React.ReactNode, React.ReactNode];
  transitionStart: number;
  transitionDuration?: number;
}> = ({ children, transitionStart, transitionDuration = 20 }) => {
  const frame = useCurrentFrame();

  const progress = interpolate(
    frame,
    [transitionStart, transitionStart + transitionDuration],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          transform: `scale(${1 + progress * 0.5})`,
          opacity: 1 - progress,
        }}
      >
        {children[0]}
      </div>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          transform: `scale(${interpolate(progress, [0, 1], [0.8, 1])})`,
          opacity: progress,
        }}
      >
        {children[1]}
      </div>
    </div>
  );
};
```

---

## 7. Audio Integration

### 7.1 Background Music

```typescript
import { Audio, staticFile, interpolate } from 'remotion';

const VideoWithMusic: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  // Fade in for first second, fade out for last 2 seconds
  const volume = interpolate(
    frame,
    [0, 30, durationInFrames - 60, durationInFrames],
    [0, 0.5, 0.5, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  return (
    <>
      <Audio
        src={staticFile('audio/background-music.mp3')}
        volume={volume}
        startFrom={0}       // Start from this frame in the audio
        endAt={durationInFrames}
      />
      {/* Visual content here */}
    </>
  );
};
```

### 7.2 Sound Effects on Events

```typescript
import { Audio, Sequence, staticFile } from 'remotion';

const VideoWithSFX: React.FC = () => {
  return (
    <>
      {/* Whoosh sound when title appears (frame 30) */}
      <Sequence from={30} layout="none">
        <Audio src={staticFile('audio/whoosh.mp3')} volume={0.6} />
      </Sequence>

      {/* Click sound on button interaction (frame 90) */}
      <Sequence from={90} layout="none">
        <Audio src={staticFile('audio/click.mp3')} volume={0.3} />
      </Sequence>

      {/* Success chime at end */}
      <Sequence from={150} layout="none">
        <Audio src={staticFile('audio/success.mp3')} volume={0.5} />
      </Sequence>
    </>
  );
};
```

### 7.3 Audio Visualization

```typescript
import { getAudioData, useAudioData, visualizeAudio } from '@remotion/media-utils';

const AudioVisualizer: React.FC<{ src: string }> = ({ src }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const audioData = useAudioData(src);

  if (!audioData) return null;

  const visualization = visualizeAudio({
    fps,
    frame,
    audioData,
    numberOfSamples: 64, // number of frequency bars
  });

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', height: 200, gap: 2 }}>
      {visualization.map((amplitude, i) => (
        <div
          key={i}
          style={{
            width: 8,
            height: `${amplitude * 100}%`,
            backgroundColor: '#0066FF',
            borderRadius: 4,
          }}
        />
      ))}
    </div>
  );
};
```

---

## 8. Working with Images and Video

### 8.1 Images

```typescript
import { Img, staticFile } from 'remotion';

// Static image (from public folder)
<Img src={staticFile('images/screenshot.png')} style={{ width: 800 }} />

// Remote image (URL)
<Img src="https://example.com/image.png" style={{ width: 800 }} />

// Note: <Img> waits for the image to load before rendering the frame
// Regular <img> does NOT — use <Img> for reliable rendering
```

### 8.2 Video

```typescript
import { Video, OffthreadVideo, staticFile } from 'remotion';

// Standard video embed
<Video
  src={staticFile('video/demo.mp4')}
  startFrom={30}        // Start from frame 30 of the source
  endAt={150}           // End at frame 150 of the source
  volume={0.5}
  style={{ width: '100%' }}
/>

// OffthreadVideo — RECOMMENDED for better render performance
<OffthreadVideo
  src={staticFile('video/demo.mp4')}
  style={{ width: '100%' }}
/>
// OffthreadVideo extracts frames in a separate thread
// → much faster rendering, especially for long videos
```

---

## 9. Export Options and Render Settings

### 9.1 Codecs and Formats

```bash
# MP4 (H.264) — most compatible, good for web/social
remotion render src/remotion/Root.tsx ProductDemo out/video.mp4 --codec h264

# MP4 (H.265/HEVC) — smaller file, newer devices
remotion render src/remotion/Root.tsx ProductDemo out/video.mp4 --codec h265

# WebM (VP8) — web-friendly, smaller than H.264
remotion render src/remotion/Root.tsx ProductDemo out/video.webm --codec vp8

# WebM (VP9) — best quality/size ratio for web
remotion render src/remotion/Root.tsx ProductDemo out/video.webm --codec vp9

# GIF — for short loops, social embeds
remotion render src/remotion/Root.tsx SocialAd out/ad.gif --codec gif --every-nth-frame 2

# PNG sequence — for post-processing in other tools
remotion render src/remotion/Root.tsx ProductDemo out/frames --image-format png --sequence

# ProRes — for professional post-production (macOS)
remotion render src/remotion/Root.tsx ProductDemo out/video.mov --codec prores --prores-profile 4444

# Still frame (thumbnail)
remotion still src/remotion/Root.tsx ProductDemo out/thumb.png --frame 60
```

### 9.2 Quality Settings

```bash
# CRF (Constant Rate Factor) — lower = better quality, bigger file
# Range: 0 (lossless) to 51 (worst). Default: 18
remotion render ... --crf 15    # High quality
remotion render ... --crf 23    # Medium quality (good for web)
remotion render ... --crf 28    # Lower quality, smaller file

# Custom resolution
remotion render ... --width 3840 --height 2160   # 4K
remotion render ... --width 1920 --height 1080   # 1080p (default)
remotion render ... --width 1280 --height 720    # 720p

# Custom FPS
remotion render ... --fps 60    # 60fps (smooth)
remotion render ... --fps 30    # 30fps (default, good for most)
remotion render ... --fps 24    # 24fps (cinematic)
```

---

## 10. Social Media Specs

```
PLATFORM SPECIFICATIONS:
┌─────────────────────┬──────────┬──────────────┬─────────┬───────────┐
│  Platform           │  Ratio   │  Resolution  │  FPS    │  Max Len  │
├─────────────────────┼──────────┼──────────────┼─────────┼───────────┤
│  YouTube            │  16:9    │  1920×1080   │  30/60  │  12h      │
│  YouTube Shorts     │  9:16    │  1080×1920   │  30/60  │  60s      │
│  Instagram Post     │  1:1     │  1080×1080   │  30     │  60s      │
│  Instagram Story    │  9:16    │  1080×1920   │  30     │  15s      │
│  Instagram Reels    │  9:16    │  1080×1920   │  30     │  90s      │
│  TikTok             │  9:16    │  1080×1920   │  30     │  10min    │
│  Twitter/X          │  16:9    │  1280×720    │  30/60  │  2:20     │
│  Twitter/X (square) │  1:1     │  720×720     │  30     │  2:20     │
│  LinkedIn           │  16:9    │  1920×1080   │  30     │  10min    │
│  LinkedIn (square)  │  1:1     │  1080×1080   │  30     │  10min    │
│  Facebook           │  16:9    │  1920×1080   │  30     │  240min   │
│  Facebook Story     │  9:16    │  1080×1920   │  30     │  20s      │
│  Pinterest          │  2:3     │  1000×1500   │  30     │  15min    │
│  Threads            │  9:16    │  1080×1920   │  30     │  5min     │
└─────────────────────┴──────────┴──────────────┴─────────┴───────────┘

SAFE ZONES (for vertical video 9:16):
┌────────────────────────────────┐
│  ┌──────────────────────┐     │
│  │ TOP SAFE (64px)      │     │ ← Status bar / platform UI
│  │                      │     │
│  │                      │     │
│  │   MAIN CONTENT       │     │ ← Keep key info here
│  │   SAFE ZONE          │     │
│  │                      │     │
│  │                      │     │
│  │ BOTTOM SAFE (250px)  │     │ ← Covered by comments/UI
│  └──────────────────────┘     │
└────────────────────────────────┘
```

---

## 11. Using Design System Assets

### 11.1 Importing Brand Colors

```typescript
// src/remotion/utils/colors.ts
// Import from your design system tokens

export const brand = {
  primary: {
    50: '#EFF6FF',
    100: '#DBEAFE',
    500: '#0066FF',
    600: '#0052CC',
    900: '#001A42',
  },
  secondary: {
    500: '#7C3AED',
  },
  accent: {
    500: '#06B6D4',
  },
  neutral: {
    50: '#F8FAFC',
    100: '#F1F5F9',
    800: '#1E293B',
    900: '#0F172A',
    950: '#020617',
  },
} as const;

// Gradient presets matching website
export const gradients = {
  primary: `linear-gradient(135deg, ${brand.primary[500]}, ${brand.secondary[500]})`,
  hero: `linear-gradient(180deg, ${brand.primary[50]}, white)`,
  dark: `linear-gradient(180deg, ${brand.neutral[900]}, ${brand.neutral[950]})`,
};
```

### 11.2 Using Brand Fonts

```typescript
// src/remotion/utils/fonts.ts
import { staticFile, continueRender, delayRender } from 'remotion';

export const loadFonts = () => {
  const waitForFont = delayRender();

  const inter = new FontFace('Inter', `url(${staticFile('fonts/Inter-Variable.woff2')})`);
  const geist = new FontFace('Geist', `url(${staticFile('fonts/Geist-Variable.woff2')})`);

  Promise.all([inter.load(), geist.load()])
    .then(() => {
      document.fonts.add(inter);
      document.fonts.add(geist);
      continueRender(waitForFont);
    })
    .catch((err) => {
      console.error('Font loading error:', err);
      continueRender(waitForFont);
    });
};

// Alternative: use @remotion/google-fonts
import { getAvailableFonts } from '@remotion/google-fonts';
import { loadFont } from '@remotion/google-fonts/Inter';

const { fontFamily } = loadFont();
// Use fontFamily in your styles
```

### 11.3 Logo Animation

```typescript
const AnimatedLogo: React.FC<{
  delay?: number;
  size?: number;
}> = ({ delay = 0, size = 120 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Scale spring
  const scale = spring({
    frame: frame - delay,
    fps,
    config: { damping: 15, stiffness: 200 },
  });

  // Opacity
  const opacity = interpolate(frame - delay, [0, 15], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Subtle rotation
  const rotation = interpolate(frame - delay, [0, 20], [-10, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  return (
    <div
      style={{
        opacity,
        transform: `scale(${scale}) rotate(${rotation}deg)`,
        width: size,
        height: size,
      }}
    >
      <Img
        src={staticFile('images/logo.svg')}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
};
```

---

## 12. Performance Tips

```
RENDERING PERFORMANCE:
┌──────────────────────────────────────────────────────────────────────┐
│  Tip                           │  Impact   │  Details               │
├──────────────────────────────────────────────────────────────────────┤
│  Use OffthreadVideo            │  HIGH     │  5-10x faster than     │
│  instead of Video              │           │  regular Video element │
├──────────────────────────────────────────────────────────────────────┤
│  Set --concurrency flag        │  HIGH     │  Use CPU cores for     │
│                                │           │  parallel frame render │
├──────────────────────────────────────────────────────────────────────┤
│  Preload heavy assets with     │  MEDIUM   │  Prevents frame drops  │
│  delayRender/continueRender    │           │  from slow loads       │
├──────────────────────────────────────────────────────────────────────┤
│  Use staticFile() for assets   │  MEDIUM   │  Reliable path         │
│  in public/ folder             │           │  resolution            │
├──────────────────────────────────────────────────────────────────────┤
│  Avoid heavy re-renders        │  MEDIUM   │  Memoize components    │
│  (React.memo on static parts)  │           │  that don't animate    │
├──────────────────────────────────────────────────────────────────────┤
│  Use JPEG over PNG for stills  │  LOW      │  Faster frame encoding │
│  (unless transparency needed)  │           │  during render         │
├──────────────────────────────────────────────────────────────────────┤
│  Use --gl=angle for GPU        │  MEDIUM   │  Hardware acceleration │
│  rendering                     │           │  for complex scenes    │
└──────────────────────────────────────────────────────────────────────┘

BUNDLE SIZE:
- Do NOT import the entire design system CSS into Remotion compositions
- Only import the colors/fonts/tokens you need as JS constants
- Keep compositions in a separate folder from the main app
- Use dynamic imports for heavy components
```

---

## 13. @remotion/player — Web Embedding

### 13.1 Player Component

```typescript
'use client';

import { Player } from '@remotion/player';
import { ProductDemo } from '@/remotion/compositions/ProductDemo';

const VideoPreview: React.FC = () => {
  return (
    <Player
      component={ProductDemo}
      durationInFrames={900}
      fps={30}
      compositionWidth={1920}
      compositionHeight={1080}
      style={{
        width: '100%',
        maxWidth: 960,
        aspectRatio: '16/9',
        borderRadius: 12,
        overflow: 'hidden',
      }}
      controls                    // Show play/pause/scrubber
      autoPlay={false}
      loop={false}
      clickToPlay                 // Click anywhere to play/pause
      doubleClickToFullscreen     // Double click for fullscreen
      showVolumeControls
      allowFullscreen
      inputProps={{
        title: 'TrueOmni Platform Demo',
        features: ['AI Analytics', 'Automation', 'Integrations'],
      }}
    />
  );
};
```

### 13.2 Responsive Player

```typescript
const ResponsivePlayer: React.FC = () => {
  return (
    <div style={{ position: 'relative', paddingTop: '56.25%' /* 16:9 */ }}>
      <Player
        component={ProductDemo}
        durationInFrames={900}
        fps={30}
        compositionWidth={1920}
        compositionHeight={1080}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
        }}
        controls
      />
    </div>
  );
};
```

---

## 14. Practical Templates

### 14.1 Product Demo Video Template

```typescript
// src/remotion/compositions/ProductDemo/index.tsx
import { AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig } from 'remotion';

interface ProductDemoProps {
  title: string;
  features: string[];
  ctaText?: string;
}

export const ProductDemo: React.FC<ProductDemoProps> = ({
  title,
  features,
  ctaText = 'Try Free',
}) => {
  return (
    <AbsoluteFill style={{ backgroundColor: brand.neutral[950] }}>
      {/* Scene 1: Logo + Title (0-3s) */}
      <Sequence from={0} durationInFrames={90} name="Intro">
        <IntroScene title={title} />
      </Sequence>

      {/* Scene 2: Feature Showcase (3-20s) — 5.6s per feature */}
      {features.map((feature, i) => (
        <Sequence
          key={feature}
          from={90 + i * 170}
          durationInFrames={170}
          name={`Feature: ${feature}`}
        >
          <FeatureScene feature={feature} index={i} />
        </Sequence>
      ))}

      {/* Scene 3: CTA + Outro (last 5s) */}
      <Sequence from={750} name="Outro">
        <OutroScene ctaText={ctaText} />
      </Sequence>

      {/* Background music (entire duration) */}
      <Sequence from={0} layout="none">
        <Audio src={staticFile('audio/bg-music.mp3')} volume={0.15} />
      </Sequence>
    </AbsoluteFill>
  );
};
```

### 14.2 Social Media Ad Template

```typescript
// src/remotion/compositions/SocialAd/index.tsx
import { AbsoluteFill, Sequence } from 'remotion';

interface SocialAdProps {
  variant: 'square' | 'vertical';
  headline?: string;
  subline?: string;
  ctaText?: string;
}

export const SocialAd: React.FC<SocialAdProps> = ({
  variant,
  headline = 'Transform Your Workflow',
  subline = 'AI-powered automation for modern teams',
  ctaText = 'Start Free Trial',
}) => {
  const isVertical = variant === 'vertical';

  return (
    <AbsoluteFill
      style={{
        background: gradients.primary,
        padding: isVertical ? '200px 60px' : '80px 60px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      {/* Logo reveal */}
      <Sequence from={0} durationInFrames={90}>
        <AnimatedLogo delay={10} />
      </Sequence>

      {/* Headline */}
      <Sequence from={20}>
        <WordReveal text={headline} framesPerWord={6} />
      </Sequence>

      {/* Subline */}
      <Sequence from={60}>
        <FadeIn delay={0} duration={20}>
          <p>{subline}</p>
        </FadeIn>
      </Sequence>

      {/* CTA */}
      <Sequence from={90}>
        <ScaleIn delay={10}>
          <div style={{
            background: 'white',
            color: brand.primary[600],
            padding: '16px 40px',
            borderRadius: 999,
            fontWeight: 700,
            fontSize: 24,
          }}>
            {ctaText}
          </div>
        </ScaleIn>
      </Sequence>
    </AbsoluteFill>
  );
};
```

### 14.3 Feature Announcement Template

```typescript
// src/remotion/compositions/FeatureAnnouncement/index.tsx
export const FeatureAnnouncement: React.FC<{
  featureName: string;
  description: string;
  screenshotSrc?: string;
}> = ({ featureName, description, screenshotSrc }) => {
  return (
    <AbsoluteFill style={{ background: brand.neutral[950], color: 'white' }}>
      {/* "NEW" badge */}
      <Sequence from={0} durationInFrames={30}>
        <ScaleIn>
          <div style={{
            background: brand.accent[500],
            padding: '8px 24px',
            borderRadius: 999,
            fontSize: 18,
            fontWeight: 700,
            letterSpacing: '0.05em',
          }}>
            NEW FEATURE
          </div>
        </ScaleIn>
      </Sequence>

      {/* Feature name with gradient text */}
      <Sequence from={20}>
        <WordReveal text={featureName} framesPerWord={8} />
      </Sequence>

      {/* Description */}
      <Sequence from={60}>
        <FadeIn duration={30}>
          <p style={{ maxWidth: 600, textAlign: 'center' }}>{description}</p>
        </FadeIn>
      </Sequence>

      {/* Screenshot with device mockup */}
      {screenshotSrc && (
        <Sequence from={90}>
          <SlideIn direction="bottom" distance={200}>
            <div style={{
              background: brand.neutral[800],
              borderRadius: 16,
              padding: 8,
              boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
            }}>
              <Img src={screenshotSrc} style={{ borderRadius: 8, width: 800 }} />
            </div>
          </SlideIn>
        </Sequence>
      )}

      {/* CTA at end */}
      <Sequence from={400}>
        <ScaleIn delay={10}>
          <div style={{
            background: brand.primary[500],
            padding: '16px 40px',
            borderRadius: 12,
            fontWeight: 600,
          }}>
            Try It Now
          </div>
        </ScaleIn>
      </Sequence>
    </AbsoluteFill>
  );
};
```

### 14.4 Stats / Metrics Animation Template

```typescript
const StatsAnimation: React.FC<{
  stats: Array<{ label: string; value: number; suffix: string }>;
}> = ({ stats }) => {
  return (
    <AbsoluteFill style={{
      background: brand.neutral[950],
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 80,
    }}>
      {stats.map((stat, i) => (
        <Sequence key={stat.label} from={i * 15}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 72, fontWeight: 800, color: brand.primary[400] }}>
              <NumberCounter
                from={0}
                to={stat.value}
                duration={60}
                suffix={stat.suffix}
              />
            </div>
            <FadeIn delay={20}>
              <div style={{ fontSize: 20, color: brand.neutral[400], marginTop: 12 }}>
                {stat.label}
              </div>
            </FadeIn>
          </div>
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

// Usage:
// <StatsAnimation stats={[
//   { label: 'Active Users', value: 50000, suffix: '+' },
//   { label: 'Uptime', value: 99.9, suffix: '%' },
//   { label: 'Time Saved', value: 12, suffix: 'hrs/wk' },
// ]} />
```

### 14.5 Testimonial Video Template

```typescript
const TestimonialVideo: React.FC<{
  quote: string;
  author: string;
  role: string;
  company: string;
  avatarSrc?: string;
}> = ({ quote, author, role, company, avatarSrc }) => {
  return (
    <AbsoluteFill style={{
      background: `linear-gradient(135deg, ${brand.primary[900]}, ${brand.neutral[950]})`,
      padding: 120,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      color: 'white',
    }}>
      {/* Giant quote mark */}
      <Sequence from={0}>
        <FadeIn duration={20}>
          <div style={{
            fontSize: 200,
            color: brand.primary[500],
            opacity: 0.3,
            lineHeight: 1,
            fontFamily: 'serif',
          }}>
            &ldquo;
          </div>
        </FadeIn>
      </Sequence>

      {/* Quote text — word by word */}
      <Sequence from={10}>
        <div style={{ maxWidth: 900, textAlign: 'center' }}>
          <WordReveal
            text={quote}
            framesPerWord={6}
          />
        </div>
      </Sequence>

      {/* Author info */}
      <Sequence from={Math.ceil(quote.split(' ').length * 6) + 20}>
        <FadeIn duration={20}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 48 }}>
            {avatarSrc && (
              <Img
                src={avatarSrc}
                style={{ width: 56, height: 56, borderRadius: '50%' }}
              />
            )}
            <div>
              <div style={{ fontWeight: 600, fontSize: 20 }}>{author}</div>
              <div style={{ color: brand.neutral[400], fontSize: 16 }}>
                {role}, {company}
              </div>
            </div>
          </div>
        </FadeIn>
      </Sequence>
    </AbsoluteFill>
  );
};
```

---

## 15. Render Workflow for TrueOmni

```bash
# Development: preview compositions in browser
npm run video:preview
# Opens at http://localhost:3000 with Remotion Studio

# Render specific composition
npm run video:render -- --props='{"title":"TrueOmni Demo"}'

# Render for all social platforms
remotion render src/remotion/Root.tsx SocialAd-Square out/social-square.mp4
remotion render src/remotion/Root.tsx SocialAd-Vertical out/social-vertical.mp4
remotion render src/remotion/Root.tsx ProductDemo out/product-demo.mp4
remotion render src/remotion/Root.tsx BlogPromo out/blog-promo.mp4

# Generate thumbnail
remotion still src/remotion/Root.tsx ProductDemo out/og-image.png --frame=60

# Batch render with different props (data-driven)
remotion render src/remotion/Root.tsx BlogPromo out/blog-1.mp4 \
  --props='{"blogTitle":"How AI is Changing Business","author":"Ruben"}'
```

This skill provides everything needed to create professional programmatic videos for the TrueOmni website, from product demos to social media content, fully integrated with the project's design system and brand assets.

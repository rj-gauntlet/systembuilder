/**
 * SVG path data for each component type icon.
 * Designed to be drawn at 32x32 within the component sprite.
 */

export const COMPONENT_ICONS: Record<string, { paths: string[]; color: string }> = {
  client: {
    // Monitor/user icon
    paths: [
      'M6 6h20v14H6z',           // screen
      'M10 20h12v2H10z',         // base
      'M14 22h4v2h-4z',          // stand
    ],
    color: '#93c5fd',
  },
  server: {
    // Server rack icon
    paths: [
      'M6 4h20v8H6z',            // top unit
      'M6 14h20v8H6z',           // bottom unit
      'M9 7h2v2H9z',             // top LED
      'M9 17h2v2H9z',            // bottom LED
      'M14 7h8v2h-8z',           // top vent
      'M14 17h8v2h-8z',          // bottom vent
    ],
    color: '#c4b5fd',
  },
  'load-balancer': {
    // Fork/split icon
    paths: [
      'M4 16h8',                  // left line
      'M12 16l8-8',               // top fork
      'M12 16l8 8',               // bottom fork
      'M12 16l8 0',               // middle fork
    ],
    color: '#67e8f9',
  },
  database: {
    // Cylinder icon
    paths: [
      'M8 8 Q16 4 24 8 Q16 12 8 8z',   // top ellipse
      'M8 8v14 Q16 26 24 22 V8',         // body
    ],
    color: '#fcd34d',
  },
  cache: {
    // Lightning/fast icon
    paths: [
      'M18 4L10 16h6l-2 12 10-14h-7z',  // lightning bolt
    ],
    color: '#6ee7b7',
  },
  cdn: {
    // Globe icon
    paths: [
      'M16 4a12 12 0 1 0 0 24 12 12 0 0 0 0-24z',  // circle
      'M4 16h24',                                      // equator
      'M16 4c-4 4-4 20 0 24',                         // left meridian
      'M16 4c4 4 4 20 0 24',                           // right meridian
    ],
    color: '#7dd3fc',
  },
  'message-queue': {
    // Queue/stack icon
    paths: [
      'M4 8h6v6H4z',             // item 1
      'M12 8h6v6h-6z',           // item 2
      'M20 8h6v6h-6z',           // item 3
      'M7 18l4-2v4z',            // arrow
      'M11 16h12',               // arrow line
    ],
    color: '#fdba74',
  },
  'rate-limiter': {
    // Shield/gate icon
    paths: [
      'M16 4L6 10v8c0 6 4 10 10 12 6-2 10-6 10-12v-8z',  // shield
      'M12 14h8',                                            // horizontal bar
      'M16 10v8',                                            // vertical bar
    ],
    color: '#f9a8d4',
  },
};

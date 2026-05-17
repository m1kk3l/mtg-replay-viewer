import { useEffect, useState } from 'react';

const BASE_W = 1920;
const BASE_H = 1080;

export function useScale() {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    function update() {
      const sx = window.innerWidth / BASE_W;
      const sy = window.innerHeight / BASE_H;
      setScale(Math.min(sx, sy));
    }
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return { scale, baseW: BASE_W, baseH: BASE_H };
}

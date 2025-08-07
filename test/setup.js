import 'node-abort-controller';
import { vi } from 'vitest';
vi.stubGlobal('CanvasRenderingContext2D', vi.fn(() => ({
    canvas: {
        style: {},
        getContext: () => ({})
    }
})));

import { render, fireEvent } from '@testing-library/react';
import Pong from './Pong';
import usePongGame from './usePongGame';

// Dragging a paddle with a finger was never tested. The hook is mocked so the test can
// read stateRef (where the touch handler writes the paddle positions) directly. jsdom
// has no layout, so the canvas's on-screen rectangle is stubbed; that also lets the
// tests cover a canvas that is scaled down or offset, as it is on a phone.
jest.mock('./usePongGame');

const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 450;
const PADDLE_HEIGHT = 70;

let rect;
beforeAll(() => {
  HTMLCanvasElement.prototype.getContext = () => ({
    clearRect() {}, fillRect() {}, beginPath() {}, moveTo() {}, lineTo() {}, stroke() {},
    setLineDash() {},
  });
  HTMLCanvasElement.prototype.getBoundingClientRect = () => rect;
});

let stateRef;
function renderPong(mode) {
  stateRef = { current: { leftY: 0, rightY: 0, ballX: 0, ballY: 0, ballVX: 0, ballVY: 0 } };
  usePongGame.mockReturnValue({
    leftScore: 0, rightScore: 0, gameState: 'playing', winner: null,
    mode, cpuWins: 0, aiDifficulty: 'medium', setAiDifficulty: jest.fn(),
    leftScorePop: false, rightScorePop: false, stateRef,
    resetGame: jest.fn(), setMode: jest.fn(),
    CANVAS_WIDTH, CANVAS_HEIGHT, PADDLE_WIDTH: 10, PADDLE_HEIGHT, BALL_SIZE: 8,
    WINNING_SCORE: 7,
  });
  return render(<Pong />).container.querySelector('canvas');
}

const touches = (...points) => points.map(([clientX, clientY]) => ({ clientX, clientY }));

beforeEach(() => {
  rect = { left: 0, top: 0, width: CANVAS_WIDTH, height: CANVAS_HEIGHT };
});

describe('dragging a paddle', () => {
  test('a touch on the left half centers the left paddle on the finger', () => {
    const canvas = renderPong('ai');
    fireEvent.touchMove(canvas, { touches: touches([100, 200]) });
    expect(stateRef.current.leftY).toBe(200 - PADDLE_HEIGHT / 2);
  });

  test('a touch cannot push the paddle off the top or bottom of the canvas', () => {
    const canvas = renderPong('ai');
    fireEvent.touchMove(canvas, { touches: touches([100, 0]) });
    expect(stateRef.current.leftY).toBe(0);
    fireEvent.touchMove(canvas, { touches: touches([100, CANVAS_HEIGHT]) });
    expect(stateRef.current.leftY).toBe(CANVAS_HEIGHT - PADDLE_HEIGHT);
  });

  test('in 2-player mode a touch on the right half moves the right paddle only', () => {
    const canvas = renderPong('2p');
    fireEvent.touchMove(canvas, { touches: touches([500, 300]) });
    expect(stateRef.current.rightY).toBe(300 - PADDLE_HEIGHT / 2);
    expect(stateRef.current.leftY).toBe(0);
  });

  test('against the CPU a touch on the right half is ignored (the CPU owns that paddle)', () => {
    const canvas = renderPong('ai');
    fireEvent.touchMove(canvas, { touches: touches([500, 300]) });
    expect(stateRef.current.rightY).toBe(0);
    expect(stateRef.current.leftY).toBe(0);
  });

  test('in 2-player mode two fingers move both paddles at once', () => {
    const canvas = renderPong('2p');
    fireEvent.touchMove(canvas, { touches: touches([100, 150], [500, 350]) });
    expect(stateRef.current.leftY).toBe(150 - PADDLE_HEIGHT / 2);
    expect(stateRef.current.rightY).toBe(350 - PADDLE_HEIGHT / 2);
  });

  test('the halves meet at the middle: just left of center is left, center is right', () => {
    const canvas = renderPong('2p');
    fireEvent.touchMove(canvas, { touches: touches([299, 200]) });
    expect(stateRef.current.leftY).toBe(165);
    expect(stateRef.current.rightY).toBe(0);
    fireEvent.touchMove(canvas, { touches: touches([300, 250]) });
    expect(stateRef.current.rightY).toBe(250 - PADDLE_HEIGHT / 2);
  });
});

describe('when the canvas is not drawn at its natural size and position', () => {
  test('a canvas shrunk to half size maps touches back to game coordinates', () => {
    rect = { left: 0, top: 0, width: CANVAS_WIDTH / 2, height: CANVAS_HEIGHT / 2 };
    const canvas = renderPong('2p');
    // finger at (100,100) on a half-size canvas is (200,200) in game coordinates: left half
    fireEvent.touchMove(canvas, { touches: touches([100, 100]) });
    expect(stateRef.current.leftY).toBe(200 - PADDLE_HEIGHT / 2);
    // finger at x=200 on a half-size canvas is x=400 in game coordinates: right half
    fireEvent.touchMove(canvas, { touches: touches([200, 120]) });
    expect(stateRef.current.rightY).toBe(240 - PADDLE_HEIGHT / 2);
  });

  test('a canvas offset from the page corner is measured from its own top-left', () => {
    rect = { left: 50, top: 80, width: CANVAS_WIDTH, height: CANVAS_HEIGHT };
    const canvas = renderPong('2p');
    // page position (150, 280) is (100, 200) on the canvas
    fireEvent.touchMove(canvas, { touches: touches([150, 280]) });
    expect(stateRef.current.leftY).toBe(200 - PADDLE_HEIGHT / 2);
  });

  test('which half a touch falls in is decided from the canvas\'s own left edge', () => {
    rect = { left: 200, top: 0, width: CANVAS_WIDTH, height: CANVAS_HEIGHT };
    const canvas = renderPong('2p');
    // page x=350 is x=150 on the canvas (left half). Measured from the page corner it
    // would be x=350, which is in the right half, so the wrong paddle would move.
    fireEvent.touchMove(canvas, { touches: touches([350, 200]) });
    expect(stateRef.current.leftY).toBe(200 - PADDLE_HEIGHT / 2);
    expect(stateRef.current.rightY).toBe(0);
  });
});

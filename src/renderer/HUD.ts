import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import type { GameState } from '../engine/types';

const HUD_BG_COLOR = 0x000000;
const HUD_BG_ALPHA = 0.6;

const labelStyle = new TextStyle({
  fontFamily: 'monospace',
  fontSize: 11,
  fill: 0x94a3b8,
  fontWeight: 'bold',
});

const valueStyle = new TextStyle({
  fontFamily: 'monospace',
  fontSize: 12,
  fill: 0xe2e8f0,
  fontWeight: 'bold',
});

const eventStyle = new TextStyle({
  fontFamily: 'monospace',
  fontSize: 11,
  fill: 0xfbbf24,
  fontWeight: 'bold',
});

export class HUD {
  readonly container: Container;
  private bg: Graphics;
  private budgetLabel: Text;
  private budgetValue: Text;
  private budgetBar: Graphics;
  private uptimeLabel: Text;
  private uptimeValue: Text;
  private latencyLabel: Text;
  private latencyValue: Text;
  private requestsLabel: Text;
  private requestsValue: Text;
  private eventBanner: Text;

  constructor(canvasWidth: number) {
    this.container = new Container();

    // Background bar at top
    this.bg = new Graphics();
    this.bg.rect(0, 0, canvasWidth, 32);
    this.bg.fill({ color: HUD_BG_COLOR, alpha: HUD_BG_ALPHA });
    this.container.addChild(this.bg);

    let x = 8;

    // Budget
    this.budgetLabel = new Text({ text: 'BUDGET', style: labelStyle });
    this.budgetLabel.position.set(x, 2);
    this.container.addChild(this.budgetLabel);

    this.budgetBar = new Graphics();
    this.budgetBar.position.set(x, 16);
    this.container.addChild(this.budgetBar);

    this.budgetValue = new Text({ text: '$0', style: valueStyle });
    this.budgetValue.position.set(x + 105, 2);
    this.container.addChild(this.budgetValue);

    x += 190;

    // Uptime
    this.uptimeLabel = new Text({ text: 'UPTIME', style: labelStyle });
    this.uptimeLabel.position.set(x, 2);
    this.container.addChild(this.uptimeLabel);

    this.uptimeValue = new Text({ text: '100%', style: valueStyle });
    this.uptimeValue.position.set(x + 55, 2);
    this.container.addChild(this.uptimeValue);

    x += 130;

    // Latency
    this.latencyLabel = new Text({ text: 'LATENCY', style: labelStyle });
    this.latencyLabel.position.set(x, 2);
    this.container.addChild(this.latencyLabel);

    this.latencyValue = new Text({ text: '0ms', style: valueStyle });
    this.latencyValue.position.set(x + 60, 2);
    this.container.addChild(this.latencyValue);

    x += 140;

    // Requests
    this.requestsLabel = new Text({ text: 'REQS', style: labelStyle });
    this.requestsLabel.position.set(x, 2);
    this.container.addChild(this.requestsLabel);

    this.requestsValue = new Text({ text: '0', style: valueStyle });
    this.requestsValue.position.set(x + 42, 2);
    this.container.addChild(this.requestsValue);

    x += 130;

    // Event banner
    this.eventBanner = new Text({ text: '', style: eventStyle });
    this.eventBanner.position.set(x, 2);
    this.container.addChild(this.eventBanner);
  }

  update(state: GameState): void {
    const b = state.budget;

    this.budgetValue.text = `$${b.remaining}/$${b.monthlyLimit}`;

    // Budget bar
    this.budgetBar.clear();
    const barWidth = 100;
    const barHeight = 10;
    const ratio = b.monthlyLimit > 0 ? b.remaining / b.monthlyLimit : 1;

    this.budgetBar.rect(0, 0, barWidth, barHeight);
    this.budgetBar.fill({ color: 0x1e293b });

    const barColor = ratio > 0.5 ? 0x22c55e : ratio > 0.2 ? 0xeab308 : 0xef4444;
    this.budgetBar.rect(0, 0, barWidth * ratio, barHeight);
    this.budgetBar.fill({ color: barColor });

    // Stats
    this.uptimeValue.text = `${state.score.uptime.toFixed(1)}%`;
    this.latencyValue.text = `${Math.round(state.score.avgLatency)}ms`;
    this.requestsValue.text = `${state.simulation.totalRequests}`;

    // Active events
    const activeEvents = state.events.filter((e) => e.active);
    if (activeEvents.length > 0) {
      this.eventBanner.text = activeEvents.map((e) => e.title).join(' | ');
    } else {
      this.eventBanner.text = '';
    }
  }

  destroy(): void {
    this.container.destroy({ children: true });
  }
}

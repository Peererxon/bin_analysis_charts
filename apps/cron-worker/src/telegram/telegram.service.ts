import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const TELEGRAM_API_BASE = 'https://api.telegram.org/bot';

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);
  private readonly botToken: string;

  constructor(private readonly configService: ConfigService) {
    this.botToken = this.configService.get<string>('TELEGRAM_BOT_TOKEN', '');
  }

  /**
   * Send a price alert notification when price crosses a threshold.
   */
  async sendPriceAlert(params: {
    chatId: string;
    direction: 'up' | 'down';
    thresholdPct: number;
    currentPrice: number;
    previousPrice: number;
    bankName: string;
  }): Promise<void> {
    const emoji = params.direction === 'up' ? '📈' : '📉';
    const changePct = (
      ((params.currentPrice - params.previousPrice) / params.previousPrice) *
      100
    ).toFixed(2);

    const message =
      `${emoji} *Alerta de Precio USDT/VES*\n\n` +
      `Banco: *${params.bankName}*\n` +
      `Dirección: *${params.direction === 'up' ? 'SUBE' : 'BAJA'}*\n` +
      `Precio anterior: *${params.previousPrice.toFixed(2)} VES*\n` +
      `Precio actual: *${params.currentPrice.toFixed(2)} VES*\n` +
      `Cambio: *${changePct}%*\n` +
      `Umbral configurado: *${params.thresholdPct}%*`;

    await this.sendMessage(params.chatId, message);
  }

  /**
   * Send a cron status notification (snapshot collection result).
   */
  async sendCronStatus(params: {
    chatId: string;
    banksProcessed: number;
    totalOffers: number;
    timestamp: string;
    errors?: string[];
  }): Promise<void> {
    let message =
      `🤖 *Estado del Cron*\n\n` +
      `⏰ ${params.timestamp}\n` +
      `🏦 Bancos procesados: *${params.banksProcessed}*\n` +
      `📊 Ofertas recolectadas: *${params.totalOffers}*`;

    if (params.errors && params.errors.length > 0) {
      message += `\n\n⚠️ Errores:\n${params.errors.map((e) => `• ${e}`).join('\n')}`;
    }

    await this.sendMessage(params.chatId, message);
  }

  /**
   * Send a raw message to a Telegram chat.
   */
  async sendMessage(chatId: string, text: string): Promise<void> {
    if (!this.botToken) {
      this.logger.warn('Telegram bot token not configured, skipping message');
      return;
    }

    const url = `${TELEGRAM_API_BASE}${this.botToken}/sendMessage`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: 'Markdown',
        }),
      });

      if (!response.ok) {
        const body = await response.text();
        this.logger.error(
          `Telegram API error: ${response.status} - ${body}`,
        );
      } else {
        this.logger.debug(`Message sent to chat ${chatId}`);
      }
    } catch (error) {
      this.logger.error(
        'Failed to send Telegram message',
        error instanceof Error ? error.message : error,
      );
    }
  }
}

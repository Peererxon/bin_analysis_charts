import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { AppConfigService, type FilterConfig } from '../config/config.service.js';

const BINANCE_P2P_URL =
  'https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search';

/** Raw ad shape from Binance P2P API */
interface BinanceAd {
  adv: {
    advNo: string;
    price: string;
    surplusAmount: string;
    maxSingleTransAmount: string;
    minSingleTransAmount: string;
    tradableQuantity: string;
    nickName: string;
  };
  advertiser: {
    nickName: string;
    userNo: string;
  };
}

/** Processed offer after filtering */
export interface ProcessedOffer {
  rank: number;
  price: number;
  merchantName: string;
  availableAmount: number;
  maxSingleTrans: number;
  minSingleTrans: number;
}

/** Result for a single bank */
export interface BankSnapshot {
  bankId: number;
  offers: ProcessedOffer[];
  stdDeviation: number;
  capturedAt: string;
}

@Injectable()
export class BinanceP2PService {
  private readonly logger = new Logger(BinanceP2PService.name);

  constructor(private readonly configService: AppConfigService) {}

  /**
   * Fetch SELL USDT/VES ads from Binance P2P API for a specific bank.
   * Applies Criterio 0 filter, takes top 5 by highest price, calculates std dev.
   */
  async fetchAdsByBank(
    bankId: number,
    binancePayType: string,
    filterConfig?: FilterConfig,
  ): Promise<BankSnapshot> {
    const filter = filterConfig ?? (await this.configService.getFilterConfig());

    const capturedAt = new Date().toISOString();

    try {
      const payload = {
        fiat: 'VES',
        asset: 'USDT',
        tradeType: 'SELL',
        page: 1,
        rows: 20,
        payTypes: [binancePayType],
        publisherType: null,
        merchantCheck: false,
      };

      const response = await axios.post<{ data: BinanceAd[] }>(
        BINANCE_P2P_URL,
        payload,
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 10_000,
        },
      );

      const ads = response.data?.data ?? [];

      // Apply Criterio 0 filter
      const validAds = ads.filter((ad) => {
        const surplusAmount = parseFloat(ad.adv.surplusAmount);
        const maxSingleTrans = parseFloat(ad.adv.maxSingleTransAmount);
        const minCapitalThreshold = filter.minCapitalUsd;
        const minMaxOfferThreshold =
          (filter.minMaxOfferPct / 100) * surplusAmount;

        return (
          surplusAmount >= minCapitalThreshold &&
          maxSingleTrans >= minMaxOfferThreshold
        );
      });

      // Sort by highest price and take top 5
      const sortedAds = validAds
        .sort(
          (a, b) => parseFloat(b.adv.price) - parseFloat(a.adv.price),
        )
        .slice(0, 5);

      const offers: ProcessedOffer[] = sortedAds.map((ad, index) => ({
        rank: index + 1,
        price: parseFloat(ad.adv.price),
        merchantName: ad.advertiser.nickName,
        availableAmount: parseFloat(ad.adv.surplusAmount),
        maxSingleTrans: parseFloat(ad.adv.maxSingleTransAmount),
        minSingleTrans: parseFloat(ad.adv.minSingleTransAmount),
      }));

      const stdDeviation = this.calculateStdDeviation(
        offers.map((o) => o.price),
      );

      this.logger.log(
        `Bank ${bankId} (${binancePayType}): ${offers.length} valid offers, ` +
          `top price: ${offers[0]?.price ?? 'N/A'}, stdDev: ${stdDeviation.toFixed(4)}`,
      );

      return { bankId, offers, stdDeviation, capturedAt };
    } catch (error) {
      this.logger.error(
        `Failed to fetch ads for bank ${bankId} (${binancePayType})`,
        error instanceof Error ? error.message : error,
      );
      return { bankId, offers: [], stdDeviation: 0, capturedAt };
    }
  }

  /**
   * Calculate standard deviation from a list of prices.
   */
  private calculateStdDeviation(prices: number[]): number {
    if (prices.length < 2) return 0;
    const mean = prices.reduce((sum, p) => sum + p, 0) / prices.length;
    const squaredDiffs = prices.map((p) => Math.pow(p - mean, 2));
    const variance =
      squaredDiffs.reduce((sum, d) => sum + d, 0) / prices.length;
    return Math.sqrt(variance);
  }
}

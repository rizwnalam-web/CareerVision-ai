export interface DeepSeekCostCalculatorOptions {
  model?: "flash" | "pro";
  cacheHitRate?: number;
  batchSize?: number;
}

export interface MonthlyCostUsage {
  monthlyActiveUsers: number;
  avgRoadmapsPerUser: number;
  avgInputTokens?: number;
  avgOutputTokens?: number;
}

export interface MonthlyCostResult {
  totalRequests: number;
  costPerRequest: string;
  monthlyCost: string;
  breakdown: {
    inputTokens: number;
    outputTokens: number;
    cacheHitRate: number;
    batchDiscount: string;
  };
}

export class DeepSeekCostCalculator {
  model: "flash" | "pro";
  cacheHitRate: number;
  batchSize: number;

  pricing = {
    flash: { inputMiss: 0.14, inputHit: 0.003, output: 0.28 },
    pro: { inputMiss: 0.42, inputHit: 0.0035, output: 0.84 },
  };

  constructor(options: DeepSeekCostCalculatorOptions = {}) {
    this.model = options.model || "flash";
    this.cacheHitRate = options.cacheHitRate ?? 0.85;
    this.batchSize = options.batchSize || 1;
  }

  calculateRequestCost(inputTokens: number, outputTokens: number) {
    const p = this.pricing[this.model];
    const effectiveInputRate = p.inputMiss * (1 - this.cacheHitRate) + p.inputHit * this.cacheHitRate;
    const inputCost = (inputTokens / 1_000_000) * effectiveInputRate;
    const outputCost = (outputTokens / 1_000_000) * p.output;
    return inputCost + outputCost;
  }

  calculateMonthlyCost({
    monthlyActiveUsers,
    avgRoadmapsPerUser,
    avgInputTokens = 2000,
    avgOutputTokens = 1500,
  }: MonthlyCostUsage): MonthlyCostResult {
    const totalRequests = monthlyActiveUsers * avgRoadmapsPerUser;
    const costPerRequest = this.calculateRequestCost(avgInputTokens, avgOutputTokens);
    const monthlyCost = totalRequests * costPerRequest;
    const batchDiscount = this.batchSize > 1 ? (1 - 1 / this.batchSize) * 0.3 : 0;
    const finalCost = monthlyCost * (1 - batchDiscount);

    return {
      totalRequests,
      costPerRequest: costPerRequest.toFixed(6),
      monthlyCost: finalCost.toFixed(2),
      breakdown: {
        inputTokens: monthlyActiveUsers * avgRoadmapsPerUser * avgInputTokens,
        outputTokens: monthlyActiveUsers * avgRoadmapsPerUser * avgOutputTokens,
        cacheHitRate: this.cacheHitRate,
        batchDiscount: `${(batchDiscount * 100).toFixed(1)}%`,
      },
    };
  }

  compareModels(usage: MonthlyCostUsage) {
    const flashCalc = new DeepSeekCostCalculator({ model: "flash", cacheHitRate: this.cacheHitRate, batchSize: this.batchSize });
    const proCalc = new DeepSeekCostCalculator({ model: "pro", cacheHitRate: this.cacheHitRate, batchSize: this.batchSize });
    const flashCost = flashCalc.calculateMonthlyCost(usage);
    const proCost = proCalc.calculateMonthlyCost(usage);

    const savingsWithFlash = proCost.monthlyCost && flashCost.monthlyCost
      ? `${(((Number(proCost.monthlyCost) - Number(flashCost.monthlyCost)) / Number(proCost.monthlyCost)) * 100).toFixed(1)}%`
      : "0.0%";

    return {
      v4Flash: flashCost,
      v4Pro: proCost,
      savingsWithFlash,
    };
  }
}

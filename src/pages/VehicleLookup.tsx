import { useState, useEffect, useMemo } from 'react';
import { useData } from '@/context/DataContext';
import {
  makeOptionsWithCounts,
  modelOptionsWithCounts,
  variantOptionsWithCounts,
  rankModelsForMake,
  rankConfigsForModel,
  modelMonthSeries,
  prodYearDistribution,
  crossCategoryData,
  aggregateMakes,
  CATEGORY_LABELS,
} from '@/lib/data-utils';
import { colorFor } from '@/lib/colors';
import {
  findPriceAggregate,
  classifyPrice,
  computeDepreciation,
  classifyRetention,
  listingsBySource,
} from '@/lib/price-utils';
import { decodeVIN } from '@/lib/vin-decoder';
import Topbar from '@/components/layout/Topbar';
import StatPill from '@/components/shared/StatPill';
import InsightCard from '@/components/shared/InsightCard';
import ChartCard from '@/components/shared/ChartCard';
import VehicleCombobox from '@/components/shared/VehicleCombobox';
import TrendLineChart from '@/components/charts/TrendLineChart';
import ProductionYearChart from '@/components/charts/ProductionYearChart';
import MonthlyBarChart from '@/components/charts/MonthlyBarChart';
import PriceBoxPlot from '@/components/charts/PriceBoxPlot';
import DepreciationChart from '@/components/charts/DepreciationChart';
import SourceComparisonChart from '@/components/charts/SourceComparisonChart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  Search,
  Hash,
  Car,
  AlertCircle,
  TrendingUp,
  Award,
  BarChart3,
  Layers,
  Clock,
} from 'lucide-react';
import { Bar } from 'react-chartjs-2';
import { baseChartOptions } from '@/lib/chart-config';

interface ReportState {
  make: string;
  model: string | null;
  variant: string | null;
  year: number | null;
  vin: string | null;
}

export default function VehicleLookup() {
  const { filteredMonths, allMonths, db, loading, prices, pricesLoading, fetchPrices } =
    useData();
  const months = filteredMonths;

  const [activeTab, setActiveTab] = useState<string>('vin');
  const [vinInput, setVinInput] = useState('');
  const [vinError, setVinError] = useState('');
  const [selection, setSelection] = useState({
    make: '',
    model: '',
    variant: '',
  });
  const [report, setReport] = useState<ReportState | null>(null);
  const [checkPrice, setCheckPrice] = useState<number | undefined>();

  // Lazy-load prices on mount
  useEffect(() => {
    fetchPrices();
  }, [fetchPrices]);

  // Make/model/variant options
  const makeOpts = useMemo(() => makeOptionsWithCounts(months), [months]);
  const modelOpts = useMemo(
    () => (selection.make ? modelOptionsWithCounts(months, selection.make) : []),
    [months, selection.make]
  );
  const variantOpts = useMemo(
    () =>
      selection.make && selection.model
        ? variantOptionsWithCounts(months, selection.make, selection.model)
        : [],
    [months, selection.make, selection.model]
  );

  // VIN decode handler
  function handleVINDecode() {
    const result = decodeVIN(vinInput);
    if (!result.isValid) {
      setVinError(result.error || 'Invalid VIN');
      return;
    }
    setVinError('');
    setReport({
      make: result.make || 'Unknown',
      model: null,
      variant: null,
      year: result.modelYear || null,
      vin: result.vin || null,
    });
    // Set selection make for drill-down
    setSelection({
      make: result.make || '',
      model: '',
      variant: '',
    });
  }

  // Selector handler
  function handleSelectorLookup() {
    if (!selection.make) return;
    setReport({
      make: selection.make,
      model: selection.model || null,
      variant: selection.variant || null,
      year: null,
      vin: null,
    });
  }

  // Report data computation
  const reportData = useMemo(() => {
    if (!report) return null;

    const { make, model, variant } = report;
    const allMakesMap = aggregateMakes(months);
    const allMakesSorted = Array.from(allMakesMap.entries()).sort(
      (a, b) => b[1] - a[1]
    );
    const total = allMakesSorted.reduce((s, [, v]) => s + v, 0);
    const makeTotal = allMakesMap.get(make) || 0;
    const makeRank =
      allMakesSorted.findIndex(([m]) => m === make) + 1 || allMakesSorted.length;
    const makeShare = total > 0 ? ((makeTotal / total) * 100).toFixed(1) : '0.0';

    // Models within make
    const modelsRanked = rankModelsForMake(months, make);
    const modelCount = modelsRanked.length;

    // Selected model data
    const modelRank = model
      ? modelsRanked.findIndex((m) => m.model === model) + 1 || modelsRanked.length
      : 0;
    const modelTotal = model
      ? modelsRanked.find((m) => m.model === model)?.total || 0
      : 0;
    const modelShareOfMake =
      makeTotal > 0 ? ((modelTotal / makeTotal) * 100).toFixed(1) : '0.0';

    // Configs within model
    const configsRanked = model ? rankConfigsForModel(months, make, model) : [];
    const configRank = variant
      ? configsRanked.findIndex((c) => c.variant === variant) + 1 ||
        configsRanked.length
      : 0;

    // Monthly series for trend
    const series = modelMonthSeries(
      months,
      make,
      model || '',
      variant || undefined
    );
    const seriesTotal = series.reduce((s, v) => s + v, 0);

    // Production year distribution
    const prodYearDist = model
      ? prodYearDistribution(months, make, model, variant || undefined)
      : new Map<number, number>();

    // Cross-category
    const crossCat = crossCategoryData(db, make, model || undefined);

    // Price data
    const priceAgg = model
      ? findPriceAggregate(prices, make, model, report.year || undefined) ||
        findPriceAggregate(prices, make, model)
      : null;

    // Depreciation
    const depreciation = model ? computeDepreciation(prices, make, model) : null;

    // Source comparison
    const sources = model ? listingsBySource(prices, make, model) : [];

    return {
      make,
      model,
      variant,
      makeTotal,
      makeRank,
      makeShare,
      modelsRanked,
      modelCount,
      modelRank,
      modelTotal,
      modelShareOfMake,
      configsRanked,
      configRank,
      series,
      seriesTotal,
      prodYearDist,
      crossCat,
      priceAgg,
      depreciation,
      sources,
      total,
      labels: months.map((m) => m.label),
    };
  }, [report, months, db, prices]);

  // Liquidity classification
  function getLiquidity(txCount: number): string {
    if (txCount > 3000) return 'high-liquidity';
    if (txCount > 1000) return 'moderate-liquidity';
    return 'niche';
  }

  return (
    <main className="flex-1 overflow-y-auto">
      <Topbar title="Vehicle Lookup" subtitle="Decode VIN or search by make/model" />

      <div className="px-6 py-6 space-y-6">
        {/* Input card */}
        <Card>
          <CardContent className="p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="vin" className="gap-1.5">
                  <Hash className="h-3.5 w-3.5" />
                  VIN Code
                </TabsTrigger>
                <TabsTrigger value="reg" className="gap-1.5">
                  <Car className="h-3.5 w-3.5" />
                  Reg Number
                </TabsTrigger>
                <TabsTrigger value="selector" className="gap-1.5">
                  <Search className="h-3.5 w-3.5" />
                  Make / Model
                </TabsTrigger>
              </TabsList>

              <TabsContent value="vin">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1">
                    <Input
                      placeholder="Enter 17-character VIN code"
                      value={vinInput}
                      onChange={(e) =>
                        setVinInput(e.target.value.toUpperCase().slice(0, 17))
                      }
                      maxLength={17}
                      className="font-mono uppercase"
                    />
                    {vinError && (
                      <div className="flex items-center gap-1.5 mt-2 text-sm text-destructive">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                        {vinError}
                      </div>
                    )}
                  </div>
                  <Button
                    onClick={handleVINDecode}
                    disabled={vinInput.length < 17}
                    className="shrink-0"
                  >
                    Decode
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  The VIN is decoded client-side. No data is sent to any server.
                </p>
              </TabsContent>

              <TabsContent value="reg">
                <div className="flex flex-col sm:flex-row gap-3">
                  <Input
                    placeholder="e.g. 123ABC"
                    disabled
                    className="flex-1 font-mono uppercase"
                  />
                  <Button disabled className="shrink-0">
                    Look up
                  </Button>
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <Badge variant="secondary" className="text-xs">
                    Coming Q2 2026
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    Registration number lookup requires server-side mntstat.ee
                    integration.
                  </span>
                </div>
              </TabsContent>

              <TabsContent value="selector">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <VehicleCombobox
                    placeholder="Make"
                    options={makeOpts}
                    value={selection.make}
                    onSelect={(v) =>
                      setSelection({ make: v, model: '', variant: '' })
                    }
                  />
                  <VehicleCombobox
                    placeholder="Model"
                    options={modelOpts}
                    value={selection.model}
                    onSelect={(v) =>
                      setSelection((s) => ({ ...s, model: v, variant: '' }))
                    }
                    disabled={!selection.make}
                  />
                  <VehicleCombobox
                    placeholder="Variant"
                    options={variantOpts}
                    value={selection.variant}
                    onSelect={(v) =>
                      setSelection((s) => ({ ...s, variant: v }))
                    }
                    disabled={!selection.make || !selection.model}
                    allLabel="All variants"
                  />
                </div>
                <Button
                  onClick={handleSelectorLookup}
                  disabled={!selection.make}
                  className="mt-3"
                >
                  Show Market Data
                </Button>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Loading state */}
        {loading && (
          <div className="space-y-4">
            <Skeleton className="h-24 rounded-lg" />
            <Skeleton className="h-80 rounded-lg" />
          </div>
        )}

        {/* Vehicle Report */}
        {report && reportData && !loading && (
          <div className="space-y-6">
            {/* Hero */}
            <div>
              <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">
                {reportData.make}
              </p>
              <h2 className="text-3xl font-bold tracking-tight mt-1">
                {reportData.model || 'All Models'}
                {reportData.variant && (
                  <span className="text-muted-foreground font-normal ml-2 text-xl">
                    {reportData.variant}
                  </span>
                )}
              </h2>
              <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                {report.year && (
                  <Badge variant="outline" className="text-xs">
                    Year: {report.year}
                  </Badge>
                )}
                {report.vin && (
                  <span className="font-mono text-xs">{report.vin}</span>
                )}
              </div>
            </div>

            <Separator />

            {/* Stats grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {!reportData.model ? (
                // Make-only stats
                <>
                  <StatPill
                    label="Total Transactions"
                    value={reportData.makeTotal}
                    color="#c8960a"
                    icon={<TrendingUp className="h-5 w-5" />}
                  />
                  <StatPill
                    label="Market Share"
                    value={`${reportData.makeShare}%`}
                    color="#2563eb"
                    icon={<BarChart3 className="h-5 w-5" />}
                  />
                  <StatPill
                    label="Market Rank"
                    value={`#${reportData.makeRank}`}
                    color="#16a34a"
                    icon={<Award className="h-5 w-5" />}
                  />
                  <StatPill
                    label="Models"
                    value={reportData.modelCount}
                    color="#7c3aed"
                    icon={<Layers className="h-5 w-5" />}
                  />
                </>
              ) : !reportData.variant ? (
                // Make+Model stats
                <>
                  <StatPill
                    label="Model Rank"
                    value={`#${reportData.modelRank} of ${reportData.modelCount}`}
                    color="#c8960a"
                    subtitle={`within ${reportData.make}`}
                    icon={<Award className="h-5 w-5" />}
                  />
                  <StatPill
                    label="Share of Make"
                    value={`${reportData.modelShareOfMake}%`}
                    color="#2563eb"
                    icon={<BarChart3 className="h-5 w-5" />}
                  />
                  <StatPill
                    label="Transactions"
                    value={reportData.seriesTotal}
                    color="#16a34a"
                    icon={<TrendingUp className="h-5 w-5" />}
                  />
                  <StatPill
                    label="Configurations"
                    value={reportData.configsRanked.length}
                    color="#7c3aed"
                    icon={<Layers className="h-5 w-5" />}
                  />
                </>
              ) : (
                // Make+Model+Variant stats
                <>
                  <StatPill
                    label="Model Rank"
                    value={`#${reportData.modelRank} of ${reportData.modelCount}`}
                    color="#c8960a"
                    subtitle={`within ${reportData.make}`}
                    icon={<Award className="h-5 w-5" />}
                  />
                  <StatPill
                    label="Config Rank"
                    value={`#${reportData.configRank} of ${reportData.configsRanked.length}`}
                    color="#2563eb"
                    subtitle={`within ${reportData.model}`}
                    icon={<BarChart3 className="h-5 w-5" />}
                  />
                  <StatPill
                    label="Transactions"
                    value={reportData.seriesTotal}
                    color="#16a34a"
                    icon={<TrendingUp className="h-5 w-5" />}
                  />
                  <StatPill
                    label="Share of Make"
                    value={`${reportData.modelShareOfMake}%`}
                    color="#7c3aed"
                    icon={<Layers className="h-5 w-5" />}
                  />
                </>
              )}
            </div>

            {/* Insight card */}
            {reportData.model && (
              <InsightCard>
                <span>
                  <strong>
                    {reportData.make} {reportData.model}
                  </strong>{' '}
                  is the #{reportData.modelRank} most popular model within{' '}
                  {reportData.make}, accounting for {reportData.modelShareOfMake}% of
                  all {reportData.make} transactions. With{' '}
                  {reportData.seriesTotal.toLocaleString()} transactions, it&apos;s a{' '}
                  {getLiquidity(reportData.seriesTotal)} choice.
                </span>
              </InsightCard>
            )}

            {/* Drill-down selector */}
            {(!reportData.model || !reportData.variant) && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Narrow Selection</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {!reportData.model && (
                      <VehicleCombobox
                        placeholder="Select model"
                        options={modelOptionsWithCounts(months, reportData.make)}
                        value={selection.model}
                        onSelect={(v) => {
                          setSelection((s) => ({ ...s, model: v, variant: '' }));
                          setReport((r) =>
                            r ? { ...r, model: v || null, variant: null } : null
                          );
                        }}
                      />
                    )}
                    {reportData.model && !reportData.variant && (
                      <VehicleCombobox
                        placeholder="Select variant"
                        options={variantOptionsWithCounts(
                          months,
                          reportData.make,
                          reportData.model
                        )}
                        value={selection.variant}
                        onSelect={(v) => {
                          setSelection((s) => ({ ...s, variant: v }));
                          setReport((r) =>
                            r ? { ...r, variant: v || null } : null
                          );
                        }}
                        allLabel="All variants"
                      />
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Model comparison chart (horizontal bar) */}
            {reportData.modelsRanked.length > 0 && (
              <ChartCard
                title={`Top Models within ${reportData.make}`}
                subtitle="Ranked by total transaction count"
              >
                <HorizontalBarChart
                  items={reportData.modelsRanked.slice(0, 15)}
                  labelKey="model"
                  valueKey="total"
                  highlightLabel={reportData.model || undefined}
                  accentColor={colorFor(reportData.make, 0)}
                />
              </ChartCard>
            )}

            {/* Config comparison chart */}
            {reportData.model && reportData.configsRanked.length > 1 && (
              <ChartCard
                title={`Configurations for ${reportData.make} ${reportData.model}`}
                subtitle="Ranked by transaction count"
              >
                <HorizontalBarChart
                  items={reportData.configsRanked.slice(0, 10)}
                  labelKey="variant"
                  valueKey="total"
                  highlightLabel={reportData.variant || undefined}
                  accentColor={colorFor(reportData.make, 0)}
                />
              </ChartCard>
            )}

            {/* Trend chart */}
            <ChartCard
              title="Monthly Transaction Volume"
              subtitle="Over loaded time range"
            >
              <TrendLineChart
                labels={reportData.labels}
                datasets={[
                  {
                    label: [
                      reportData.make,
                      reportData.model,
                      reportData.variant,
                    ]
                      .filter(Boolean)
                      .join(' '),
                    data: reportData.series,
                    color: colorFor(reportData.make, 0),
                  },
                ]}
                yLabel="Transactions"
                height={300}
              />
            </ChartCard>

            {/* Production year distribution */}
            {reportData.model && reportData.prodYearDist.size > 0 && (
              <ChartCard
                title="Production Year Distribution"
                subtitle={`${reportData.make} ${reportData.model}`}
              >
                <ProductionYearChart
                  data={reportData.prodYearDist}
                  color={colorFor(reportData.make, 0)}
                  height={280}
                />
              </ChartCard>
            )}

            {/* Cross-category chart */}
            {reportData.crossCat && (
              <ChartCard
                title="Cross-Category Breakdown"
                subtitle="Same vehicle across market segments"
              >
                <MonthlyBarChart
                  labels={reportData.crossCat.labels}
                  datasets={[
                    {
                      label: CATEGORY_LABELS.jarelturg,
                      data: reportData.crossCat.jarelturg,
                      color: '#c8960a',
                    },
                    {
                      label: CATEGORY_LABELS.newCars,
                      data: reportData.crossCat.newCars,
                      color: '#2563eb',
                    },
                    {
                      label: CATEGORY_LABELS.imports,
                      data: reportData.crossCat.imports,
                      color: '#16a34a',
                    },
                  ]}
                  stacked
                  yLabel="Transactions"
                  height={280}
                />
              </ChartCard>
            )}

            {/* Pricing section */}
            {reportData.model && reportData.priceAgg && (
              <>
                <Separator />
                <div>
                  <h3 className="text-lg font-semibold mb-1">Pricing Intelligence</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Based on {reportData.priceAgg.sampleSize} listings, last updated{' '}
                    {reportData.priceAgg.lastUpdated}
                  </p>

                  {/* Price cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                    <Card
                      className="overflow-hidden"
                      style={{ borderLeft: '3px solid #16a34a' }}
                    >
                      <CardContent className="p-4">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          Median Price
                        </p>
                        <p className="text-2xl font-bold font-mono tabular-nums mt-1">
                          &euro;{reportData.priceAgg.medianPrice.toLocaleString()}
                        </p>
                      </CardContent>
                    </Card>
                    <Card
                      className="overflow-hidden"
                      style={{ borderLeft: '3px solid #2563eb' }}
                    >
                      <CardContent className="p-4">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          Range (P25-P75)
                        </p>
                        <p className="text-2xl font-bold font-mono tabular-nums mt-1">
                          &euro;{reportData.priceAgg.p25Price.toLocaleString()} &ndash;
                          &euro;{reportData.priceAgg.p75Price.toLocaleString()}
                        </p>
                      </CardContent>
                    </Card>
                    <Card
                      className="overflow-hidden"
                      style={{ borderLeft: '3px solid #c8960a' }}
                    >
                      <CardContent className="p-4">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          Sample Size
                        </p>
                        <p className="text-2xl font-bold font-mono tabular-nums mt-1">
                          {reportData.priceAgg.sampleSize.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          listings analyzed
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Box plot */}
                  <ChartCard title="Price Distribution" subtitle="Box plot visualization">
                    <PriceBoxPlot
                      min={reportData.priceAgg.minPrice}
                      p25={reportData.priceAgg.p25Price}
                      median={reportData.priceAgg.medianPrice}
                      p75={reportData.priceAgg.p75Price}
                      max={reportData.priceAgg.maxPrice}
                      checkedPrice={checkPrice}
                    />
                  </ChartCard>

                  {/* Price checker */}
                  <Card className="mt-4">
                    <CardContent className="p-4">
                      <p className="text-sm font-medium mb-2">Price Checker</p>
                      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                        <div className="flex items-center gap-2 flex-1">
                          <span className="text-muted-foreground text-sm">&euro;</span>
                          <Input
                            type="number"
                            placeholder="Enter price"
                            className="font-mono max-w-[200px]"
                            value={checkPrice ?? ''}
                            onChange={(e) =>
                              setCheckPrice(
                                e.target.value
                                  ? Number(e.target.value)
                                  : undefined
                              )
                            }
                          />
                        </div>
                        {checkPrice != null && reportData.priceAgg && (
                          <Badge
                            className={`text-sm px-3 py-1 ${
                              classifyPrice(checkPrice, reportData.priceAgg)
                                .className
                            }`}
                            variant="outline"
                          >
                            {
                              classifyPrice(checkPrice, reportData.priceAgg)
                                .label
                            }
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Source comparison */}
                  {reportData.sources.length > 1 && (
                    <div className="mt-4">
                      <ChartCard
                        title="Price by Source"
                        subtitle="Median price comparison across platforms"
                      >
                        <SourceComparisonChart
                          data={reportData.sources}
                          height={Math.max(200, reportData.sources.length * 50)}
                        />
                      </ChartCard>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Depreciation section */}
            {reportData.model && reportData.depreciation && (
              <>
                <Separator />
                <div>
                  <h3 className="text-lg font-semibold mb-1">
                    Depreciation Analysis
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Based on price data across production years
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                    <Card
                      className="overflow-hidden"
                      style={{ borderLeft: '3px solid #c8960a' }}
                    >
                      <CardContent className="p-4">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          Annual Depreciation
                        </p>
                        <p className="text-2xl font-bold font-mono tabular-nums mt-1">
                          {reportData.depreciation.annualDepreciationPct.toFixed(
                            1
                          )}
                          %
                        </p>
                      </CardContent>
                    </Card>
                    <Card
                      className="overflow-hidden"
                      style={{ borderLeft: '3px solid #2563eb' }}
                    >
                      <CardContent className="p-4">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          Value Retention
                        </p>
                        <Badge
                          variant="outline"
                          className={`mt-2 ${
                            classifyRetention(
                              reportData.depreciation.annualDepreciationPct
                            ).className
                          }`}
                        >
                          {
                            classifyRetention(
                              reportData.depreciation.annualDepreciationPct
                            ).label
                          }
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {
                            classifyRetention(
                              reportData.depreciation.annualDepreciationPct
                            ).desc
                          }
                        </p>
                      </CardContent>
                    </Card>
                    <Card
                      className="overflow-hidden"
                      style={{ borderLeft: '3px solid #16a34a' }}
                    >
                      <CardContent className="p-4">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          5-Year Residual
                        </p>
                        <p className="text-2xl font-bold font-mono tabular-nums mt-1">
                          {(
                            Math.pow(
                              1 -
                                reportData.depreciation.annualDepreciationPct /
                                  100,
                              5
                            ) * 100
                          ).toFixed(0)}
                          %
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          of original value
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  <ChartCard
                    title="Depreciation Curve"
                    subtitle="Median price by vehicle age"
                  >
                    <DepreciationChart
                      datasets={[
                        {
                          label: `${reportData.make} ${reportData.model}`,
                          dataPoints: reportData.depreciation.dataPoints,
                          color: colorFor(reportData.make, 0),
                        },
                      ]}
                      height={320}
                    />
                  </ChartCard>
                </div>
              </>
            )}

            {/* Prices loading indicator */}
            {pricesLoading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                <Clock className="h-4 w-4 animate-spin" />
                Loading pricing data...
              </div>
            )}
          </div>
        )}

        {/* Empty state */}
        {!report && !loading && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Search className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground text-sm">
              Enter a VIN code or select a make/model above to view market data.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}

// Internal horizontal bar chart component for model/config ranking
function HorizontalBarChart({
  items,
  labelKey,
  valueKey,
  highlightLabel,
  accentColor,
}: {
  items: Record<string, any>[];
  labelKey: string;
  valueKey: string;
  highlightLabel?: string;
  accentColor: string;
}) {
  const labels = items.map((item) => item[labelKey]);
  const values = items.map((item) => item[valueKey]);

  const colors = items.map((item) =>
    item[labelKey] === highlightLabel
      ? accentColor
      : hexToRgba(accentColor, 0.4)
  );

  const chartData = {
    labels,
    datasets: [
      {
        data: values,
        backgroundColor: colors,
        borderColor: colors.map((c) =>
          c.includes('rgba') ? c : accentColor
        ),
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };

  const opts = baseChartOptions({
    showLegend: false,
    barMode: true,
  });

  const options = {
    ...opts,
    indexAxis: 'y' as const,
    plugins: {
      ...opts.plugins,
      legend: { display: false },
    },
    scales: {
      ...opts.scales,
      x: {
        ...(opts.scales as any)?.x,
        title: {
          display: true,
          text: 'Transactions',
          color: '#9ca3af',
          font: { family: 'DM Sans', size: 12 },
        },
      },
      y: {
        ...(opts.scales as any)?.y,
        title: undefined,
        ticks: {
          font: { family: 'DM Mono', size: 11 },
          color: '#9ca3af',
        },
      },
    },
  };

  return (
    <div style={{ height: Math.max(250, items.length * 32) }}>
      <Bar data={chartData} options={options} />
    </div>
  );
}

function hexToRgba(hex: string, alpha: number): string {
  const cleaned = hex.replace('#', '');
  if (cleaned.length < 6) return `rgba(100, 100, 100, ${alpha})`;
  const r = parseInt(cleaned.substring(0, 2), 16);
  const g = parseInt(cleaned.substring(2, 4), 16);
  const b = parseInt(cleaned.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

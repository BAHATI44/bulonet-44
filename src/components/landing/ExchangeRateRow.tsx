interface ExchangeRateRowProps {
  from: string;
  to: string;
  rate: string;
  change: string;
  positive: boolean;
}

const ExchangeRateRow = ({ from, to, rate, change, positive }: ExchangeRateRowProps) => {
  return (
    <div className="flex items-center justify-between border-b border-dashed border-border py-3 last:border-0">
      <span className="text-sm font-medium text-foreground">{from}/{to}</span>
      <div className="flex items-center gap-3">
        <span className="font-mono text-sm tabular-nums text-foreground">{rate}</span>
        <span className={`font-mono text-xs tabular-nums ${positive ? "text-success" : "text-destructive"}`}>
          {change}
        </span>
      </div>
    </div>
  );
};

export default ExchangeRateRow;

"use client";

import dynamic from "next/dynamic";

const NetworkRevenueChart = dynamic(() => import("./NetworkRevenueChart"), { ssr: false });

interface RevenueDataPoint {
  month: string;
  revenue: number;
}

export default function NetworkRevenueChartWrapper({ data }: { data: RevenueDataPoint[] }) {
  return <NetworkRevenueChart data={data} />;
}

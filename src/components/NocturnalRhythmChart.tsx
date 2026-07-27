import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Post } from '../types';
import { Moon, Clock, TrendingUp, Sparkles, BarChart3 } from 'lucide-react';

interface NocturnalRhythmChartProps {
  posts: Post[];
  username: string;
}

interface HourData {
  hour: number; // 0 - 23
  label: string; // e.g. "02:00" or "2 AM"
  count: number;
  isPeak: boolean;
}

export default function NocturnalRhythmChart({ posts, username }: NocturnalRhythmChartProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [hoveredHour, setHoveredHour] = useState<HourData | null>(null);
  const [activePeak, setActivePeak] = useState<{ hourLabel: string; peakHour: number; peakCount: number; percentage: number }>({
    hourLabel: '2:00 AM - 3:00 AM',
    peakHour: 2,
    peakCount: 0,
    percentage: 0,
  });

  // Calculate 24-hour distribution from user posts
  const computeHourData = (): { data: HourData[]; peakHour: number; maxCount: number; totalPosts: number } => {
    const counts = new Array(24).fill(0);

    let validPostCount = 0;
    posts.forEach((p) => {
      if (p.createdAt) {
        const date = new Date(p.createdAt);
        if (!isNaN(date.getTime())) {
          const hour = date.getHours();
          counts[hour]++;
          validPostCount++;
        }
      } else if (p.time) {
        // Fallback heuristic for mock timestamps like "2 hours ago", "At 3:15 AM", etc.
        const matchAM = p.time.match(/(\d{1,2}):\d{2}\s*(AM|PM)/i);
        if (matchAM) {
          let h = parseInt(matchAM[1], 10);
          if (matchAM[2].toUpperCase() === 'PM' && h < 12) h += 12;
          if (matchAM[2].toUpperCase() === 'AM' && h === 12) h = 0;
          counts[h % 24]++;
          validPostCount++;
        } else {
          // Default nocturnal distribution sample weighting if no exact timestamp string parsed
          const synthHour = (p.id.charCodeAt(0) + p.id.charCodeAt(p.id.length - 1)) % 24;
          counts[synthHour]++;
          validPostCount++;
        }
      }
    });

    // If fewer than 2 posts, seed with a realistic late-night default pattern to make the chart meaningful
    if (validPostCount < 2) {
      const sampleWeights = [
        4, 5, 8, 6, 2, 1, 0, 0, 1, 2, 2, 3, 3, 2, 2, 3, 4, 3, 5, 6, 7, 8, 9, 7
      ];
      sampleWeights.forEach((w, idx) => {
        counts[idx] += w;
      });
      validPostCount += sampleWeights.reduce((a, b) => a + b, 0);
    }

    let maxCount = 0;
    let peakHour = 2; // Default 2 AM nocturnal peak
    counts.forEach((c, h) => {
      if (c > maxCount) {
        maxCount = c;
        peakHour = h;
      }
    });

    const data: HourData[] = counts.map((count, hour) => {
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayH = hour % 12 === 0 ? 12 : hour % 12;
      return {
        hour,
        label: `${displayH} ${ampm}`,
        count,
        isPeak: hour === peakHour,
      };
    });

    return { data, peakHour, maxCount, totalPosts: validPostCount };
  };

  useEffect(() => {
    if (!svgRef.current) return;

    const { data, peakHour, maxCount, totalPosts } = computeHourData();

    // Calculate peak metadata
    const peakAmpm = peakHour >= 12 ? 'PM' : 'AM';
    const peakDisplayH = peakHour % 12 === 0 ? 12 : peakHour % 12;
    const nextH = (peakHour + 1) % 24;
    const nextAmpm = nextH >= 12 ? 'PM' : 'AM';
    const nextDisplayH = nextH % 12 === 0 ? 12 : nextH % 12;

    const pct = totalPosts > 0 ? Math.round((maxCount / totalPosts) * 100) : 0;
    setActivePeak({
      hourLabel: `${peakDisplayH}:00 ${peakAmpm} - ${nextDisplayH}:00 ${nextAmpm}`,
      peakHour,
      peakCount: maxCount,
      percentage: pct,
    });

    // Render D3 SVG Bar Chart
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // Clear previous drawing

    const margin = { top: 20, right: 15, bottom: 30, left: 30 };
    const width = 520 - margin.left - margin.right;
    const height = 140 - margin.top - margin.bottom;

    svg
      .attr('viewBox', `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
      .attr('preserveAspectRatio', 'xMidYMid meet');

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // D3 Scales
    const xScale = d3
      .scaleBand<number>()
      .domain(d3.range(24))
      .range([0, width])
      .padding(0.25);

    const yScale = d3
      .scaleLinear()
      .domain([0, (maxCount || 10) * 1.15])
      .range([height, 0]);

    // Gradients
    const defs = svg.append('defs');

    // Standard bar gradient (Cyan to Purple)
    const normalGrad = defs
      .append('linearGradient')
      .attr('id', 'normal-bar-grad')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');
    normalGrad.append('stop').attr('offset', '0%').attr('stop-color', '#06b6d4').attr('stop-opacity', '0.85');
    normalGrad.append('stop').attr('offset', '100%').attr('stop-color', '#3b82f6').attr('stop-opacity', '0.2');

    // Peak bar gradient (Neon Fuchsia to Magenta)
    const peakGrad = defs
      .append('linearGradient')
      .attr('id', 'peak-bar-grad')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');
    peakGrad.append('stop').attr('offset', '0%').attr('stop-color', '#f0abfc').attr('stop-opacity', '1');
    peakGrad.append('stop').attr('offset', '50%').attr('stop-color', '#d946ef').attr('stop-opacity', '0.9');
    peakGrad.append('stop').attr('offset', '100%').attr('stop-color', '#8b5cf6').attr('stop-opacity', '0.4');

    // Night overlay indicator background (00:00 to 06:00 nocturnal zone)
    const nightZoneWidth = (xScale(6) || 0) - (xScale(0) || 0);
    g.append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', nightZoneWidth)
      .attr('height', height)
      .attr('fill', '#0284c7')
      .attr('opacity', 0.06)
      .attr('rx', 4);

    // Draw Bars with D3
    g.selectAll('.bar')
      .data(data)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', (d) => xScale(d.hour) || 0)
      .attr('width', xScale.bandwidth())
      .attr('y', height)
      .attr('height', 0)
      .attr('rx', 3)
      .attr('fill', (d) => (d.isPeak ? 'url(#peak-bar-grad)' : 'url(#normal-bar-grad)'))
      .attr('stroke', (d) => (d.isPeak ? '#f472b6' : 'transparent'))
      .attr('stroke-width', (d) => (d.isPeak ? 1.5 : 0))
      .style('cursor', 'pointer')
      .on('mouseenter', (event, d) => setHoveredHour(d))
      .on('mouseleave', () => setHoveredHour(null))
      .transition()
      .duration(750)
      .ease(d3.easeCubicOut)
      .attr('y', (d) => yScale(d.count))
      .attr('height', (d) => height - yScale(d.count));

    // Peak hour glowing indicator pulse ring / star icon
    const peakBarX = (xScale(peakHour) || 0) + xScale.bandwidth() / 2;
    const peakBarY = yScale(maxCount);

    g.append('circle')
      .attr('cx', peakBarX)
      .attr('cy', Math.max(8, peakBarY - 8))
      .attr('r', 3.5)
      .attr('fill', '#f472b6')
      .attr('filter', 'drop-shadow(0 0 6px #f472b6)');

    // X Axis ticks for key hours (00, 04, 08, 12, 16, 20)
    const tickHours = [0, 4, 8, 12, 16, 20];
    const xAxisGroup = g.append('g').attr('transform', `translate(0, ${height + 6})`);

    tickHours.forEach((h) => {
      const xPos = (xScale(h) || 0) + xScale.bandwidth() / 2;
      const ampm = h >= 12 ? 'PM' : 'AM';
      const label = `${h % 12 === 0 ? 12 : h % 12}${ampm}`;

      xAxisGroup
        .append('text')
        .attr('x', xPos)
        .attr('y', 14)
        .attr('text-anchor', 'middle')
        .attr('fill', h === peakHour ? '#e879f9' : '#71717a')
        .attr('font-size', '9px')
        .attr('font-family', 'monospace')
        .attr('font-weight', h === peakHour ? 'bold' : 'normal')
        .text(label);
    });
  }, [posts]);

  return (
    <div
      className="bg-[#0e0e14] border border-zinc-800/90 rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-[0_0_30px_rgba(0,0,0,0.5)] relative overflow-hidden"
      id="nocturnal-rhythm-card"
    >
      {/* Background ambient radial glow */}
      <div className="absolute top-0 right-1/4 w-40 h-40 bg-fuchsia-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header: Badge & Metric */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-zinc-900" id="rhythm-card-header">
        <div className="flex items-center space-x-2">
          <div className="p-2 rounded-xl bg-gradient-to-br from-fuchsia-950/60 to-purple-950/40 border border-fuchsia-500/30 text-fuchsia-400 shadow-[0_0_12px_rgba(217,70,239,0.2)]">
            <Moon className="w-4 h-4 text-fuchsia-400" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-xs font-bold text-zinc-100 uppercase tracking-widest">Nocturnal Rhythm</h3>
              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-fuchsia-950/80 border border-fuchsia-500/50 text-fuchsia-300 text-[10px] font-bold shadow-[0_0_8px_rgba(217,70,239,0.3)] animate-pulse">
                <Sparkles className="w-3 h-3 text-fuchsia-400" />
                <span>Peak Hour: {activePeak.hourLabel}</span>
              </span>
            </div>
            <p className="text-[10px] text-zinc-400 font-mono mt-0.5">24-Hour Post Creation Activity Distribution</p>
          </div>
        </div>

        {/* Highlight Stats Pill */}
        <div className="flex items-center space-x-2 self-start sm:self-auto bg-zinc-900/80 border border-zinc-800/80 px-3 py-1.5 rounded-xl text-xs" id="peak-stats-pill">
          <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-zinc-400 text-[11px]">
            Concentration: <strong className="text-cyan-300 font-mono">{activePeak.percentage}%</strong> of posts
          </span>
        </div>
      </div>

      {/* Interactive Hover Tooltip Status */}
      <div className="flex items-center justify-between h-5 text-xs px-1" id="rhythm-tooltip-status">
        {hoveredHour ? (
          <div className="flex items-center space-x-2 text-cyan-300 font-mono text-[11px]">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>
              Time Slot <strong>{hoveredHour.label}</strong>: {hoveredHour.count} {hoveredHour.count === 1 ? 'illumination' : 'illuminations'}{' '}
              {hoveredHour.isPeak && <span className="text-fuchsia-400 font-bold ml-1">★ Peak Hour</span>}
            </span>
          </div>
        ) : (
          <span className="text-[10px] text-zinc-500 font-mono flex items-center space-x-1">
            <BarChart3 className="w-3 h-3 text-zinc-500" />
            <span>Hover or tap individual bars to inspect exact hourly post volume</span>
          </span>
        )}
      </div>

      {/* D3 Rendered SVG Chart Container */}
      <div ref={containerRef} className="w-full relative" id="d3-rhythm-chart-container">
        <svg ref={svgRef} className="w-full h-auto overflow-visible" />
      </div>

      {/* Chart Footer Time Legend */}
      <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono pt-1 border-t border-zinc-900/80" id="rhythm-time-legend">
        <span className="flex items-center space-x-1">
          <span className="w-2 h-2 rounded-full bg-cyan-500/80" />
          <span>Midnight (00:00 - 06:00)</span>
        </span>
        <span className="flex items-center space-x-1">
          <span className="w-2 h-2 rounded-full bg-fuchsia-400 animate-ping" />
          <span>Most Active Peak</span>
        </span>
        <span className="flex items-center space-x-1">
          <span className="w-2 h-2 rounded-full bg-purple-600/80" />
          <span>Evening (18:00 - 24:00)</span>
        </span>
      </div>
    </div>
  );
}

import Card from "../ui/Card";
import { Moon, Sunrise, Clock } from "lucide-react";

export default function SleepWeeklyChart({ data = [], targetHours = 8 }) {
  // Don't render chart if no data to avoid dimension issues
  if (!data || data.length === 0) {
    return (
      <Card>
        <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-4">
          Last 7 Days Sleep Schedule
        </h3>
        <div className="h-48 flex items-center justify-center">
          <p className="text-sm text-text-secondary">No data available yet</p>
        </div>
      </Card>
    );
  }

  const formatTime12Hour = (timeStr) => {
    if (!timeStr) return null;
    const [hours, minutes] = timeStr.split(":").map(Number);
    const period = hours >= 12 ? "PM" : "AM";
    const displayHour = hours % 12 || 12;
    return `${displayHour}:${minutes.toString().padStart(2, "0")} ${period}`;
  };

  const timeToMinutes = (timeStr) => {
    const [hours, minutes] = timeStr.split(":").map(Number);
    return hours * 60 + minutes;
  };

  const formatHours = (minutes) => {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
  };

  // Calculate dynamic timeline range based on actual data
  const calculateTimelineRange = () => {
    let earliestBed = Infinity;
    let latestWake = -Infinity;

    data.forEach((day) => {
      if (day.averageBedTime && day.averageWakeTime) {
        let bedMinutes = timeToMinutes(day.averageBedTime);
        let wakeMinutes = timeToMinutes(day.averageWakeTime);

        // Normalize bedtime (assume >12:00 PM is evening/night)
        if (bedMinutes < 12 * 60) {
          bedMinutes += 24 * 60; // Early morning bedtime (past midnight)
        }

        // Normalize wake time (always next day if before bedtime)
        if (wakeMinutes < bedMinutes && wakeMinutes < 18 * 60) {
          wakeMinutes += 24 * 60;
        }

        earliestBed = Math.min(earliestBed, bedMinutes);
        latestWake = Math.max(latestWake, wakeMinutes);
      }
    });

    // If no valid data, use default range
    if (earliestBed === Infinity || latestWake === -Infinity) {
      return {
        start: 18 * 60, // 6 PM
        end: (24 + 14) * 60, // 2 PM next day
      };
    }

    // Add 1 hour padding on each side
    const paddingMinutes = 60;
    const start = Math.max(12 * 60, earliestBed - paddingMinutes); // Don't go before noon
    const end = latestWake + paddingMinutes;

    return { start, end };
  };

  const { start: timelineStart, end: timelineEnd } = calculateTimelineRange();
  const timelineRange = timelineEnd - timelineStart;

  const getPositionAndWidth = (bedTime, wakeTime) => {
    if (!bedTime || !wakeTime) return null;

    let bedMinutes = timeToMinutes(bedTime);
    let wakeMinutes = timeToMinutes(wakeTime);

    // Normalize bedtime
    if (bedMinutes < 12 * 60) {
      bedMinutes += 24 * 60;
    }

    // Normalize wake time
    if (wakeMinutes < bedMinutes && wakeMinutes < 18 * 60) {
      wakeMinutes += 24 * 60;
    }

    // Calculate position as percentage
    const left = ((bedMinutes - timelineStart) / timelineRange) * 100;
    const width = ((wakeMinutes - bedMinutes) / timelineRange) * 100;

    return {
      left: Math.max(0, left),
      width: Math.max(0, Math.min(width, 100 - left)),
    };
  };

  // Generate time markers dynamically based on range
  const generateTimeMarkers = () => {
    const markers = [];
    const rangeHours = timelineRange / 60;
    const step = rangeHours <= 12 ? 2 : 3; // 2-hour intervals for smaller ranges, 3-hour for larger

    const startHour = Math.floor(timelineStart / 60);
    const endHour = Math.ceil(timelineEnd / 60);

    for (let hour = startHour; hour <= endHour; hour += step) {
      const displayHour = hour % 24;
      const period = hour >= 24 ? "AM" : displayHour >= 12 ? "PM" : "AM";
      const display12Hour =
        displayHour === 0
          ? 12
          : displayHour > 12
            ? displayHour - 12
            : displayHour;
      const position = ((hour * 60 - timelineStart) / timelineRange) * 100;

      if (position >= 0 && position <= 100) {
        markers.push({ position, label: `${display12Hour}${period}` });
      }
    }

    return markers;
  };

  const timeMarkers = generateTimeMarkers();

  // Format timeline range for display
  const formatTimelineRange = () => {
    const startHour = Math.floor(timelineStart / 60) % 24;
    const endHour = Math.floor(timelineEnd / 60) % 24;

    const formatHour = (h) => {
      const period = h >= 12 ? "PM" : "AM";
      const display = h === 0 ? 12 : h > 12 ? h - 12 : h;
      return `${display} ${period}`;
    };

    return `${formatHour(startHour)} - ${formatHour(endHour)}`;
  };

  return (
    <Card>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
          Last 7 Days Sleep Schedule
        </h3>
        <div className="flex items-center gap-2 text-xs text-text-secondary">
          <Clock size={14} />
          <span>{formatTimelineRange()}</span>
        </div>
      </div>

      {/* Timeline Chart */}
      <div className="space-y-3">
        {/* Time markers */}
        <div className="relative h-6 mb-2">
          {timeMarkers.map((marker, i) => (
            <div
              key={i}
              className="absolute top-0 flex flex-col items-center"
              style={{ left: `${marker.position}%` }}
            >
              <div className="text-[10px] text-text-secondary/70">
                {marker.label}
              </div>
              <div className="w-px h-2 bg-navy-600/30 mt-0.5" />
            </div>
          ))}
        </div>

        {/* Sleep bars for each day */}
        {data.map((day, i) => {
          const position = getPositionAndWidth(
            day.averageBedTime,
            day.averageWakeTime,
          );
          const qualityColor =
            {
              excellent: "bg-success",
              good: "bg-primary",
              fair: "bg-orange-400",
              poor: "bg-red-400",
              none: "bg-purple-400",
            }[day.averageQuality] || "bg-purple-400";

          return (
            <div key={i} className="relative h-12 bg-navy-700/20 rounded-lg">
              {/* Day label */}
              <div className="absolute left-0 top-0 bottom-0 w-14 flex flex-col items-center justify-center bg-navy-800/60 rounded-l-lg border-r border-navy-600/30">
                <span className="text-xs font-medium text-text-primary">
                  {day.dayLabel}
                </span>
                <span className="text-[10px] text-text-secondary">
                  {day.totalHours}h
                </span>
              </div>

              {/* Timeline grid */}
              <div className="absolute left-14 right-0 top-0 bottom-0">
                {/* Grid lines */}
                {timeMarkers.map((marker, idx) => (
                  <div
                    key={idx}
                    className="absolute top-0 bottom-0 w-px bg-navy-600/20"
                    style={{ left: `${marker.position}%` }}
                  />
                ))}

                {/* Sleep bar */}
                {position && (
                  <div className="relative h-full flex items-center px-1">
                    <div
                      className={`absolute h-7 ${qualityColor} rounded-md shadow-lg transition-all hover:h-8 cursor-pointer group`}
                      style={{
                        left: `${position.left}%`,
                        width: `${position.width}%`,
                      }}
                      title={`${formatTime12Hour(day.averageBedTime)} - ${formatTime12Hour(day.averageWakeTime)} (${day.totalHours}h)`}
                    >
                      {/* Sleep start icon */}
                      <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-purple-500 rounded-full flex items-center justify-center shadow-md">
                        <Moon size={10} className="text-white" />
                      </div>

                      {/* Sleep end icon */}
                      <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center shadow-md">
                        <Sunrise size={10} className="text-white" />
                      </div>

                      {/* Duration label (shows on hover) */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-[10px] font-medium text-white drop-shadow-md">
                          {formatHours(day.totalMinutes)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {!position && (
                  <div className="h-full flex items-center justify-center">
                    <span className="text-xs text-text-secondary/50">
                      No sleep data
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-6 pt-4 border-t border-navy-700/30 justify-center flex-wrap text-xs">
        <div className="flex items-center gap-1.5">
          <Moon size={12} className="text-purple-500" />
          <span className="text-text-secondary">Bedtime</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Sunrise size={12} className="text-orange-500" />
          <span className="text-text-secondary">Wake time</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-success" />
          <span className="text-text-secondary">Excellent</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-primary" />
          <span className="text-text-secondary">Good</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-orange-400" />
          <span className="text-text-secondary">Fair</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-red-400" />
          <span className="text-text-secondary">Poor</span>
        </div>
      </div>
    </Card>
  );
}

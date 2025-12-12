import { useMemo } from 'react';
import { format, parseISO, isToday, isTomorrow } from 'date-fns';
import { FiClock } from 'react-icons/fi';
import type { Slot } from '../../types';

interface SlotPickerProps {
  slots: Slot[];
  selectedSlot: Slot | null;
  onSelect: (slot: Slot) => void;
  isLoading?: boolean;
}

export function SlotPicker({ slots, selectedSlot, onSelect, isLoading }: SlotPickerProps) {
  // Group slots by date
  const groupedSlots = useMemo(() => {
    const groups: Record<string, Slot[]> = {};
    
    slots.forEach((slot) => {
      const date = format(parseISO(slot.start_time), 'yyyy-MM-dd');
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(slot);
    });

    return Object.entries(groups).map(([date, dateSlots]) => ({
      date,
      label: formatDateLabel(date),
      slots: groupByPeriod(dateSlots),
    }));
  }, [slots]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="h-6 bg-slate-200 rounded w-32 mb-3" />
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((j) => (
                <div key={j} className="h-10 w-20 bg-slate-200 rounded-lg" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <div className="text-center py-8">
        <FiClock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-500">No available slots at the moment</p>
        <p className="text-sm text-slate-400 mt-1">Please check back later</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {groupedSlots.map(({ date, label, slots: periodSlots }) => (
        <div key={date}>
          <h4 className="text-sm font-semibold text-slate-900 mb-3">{label}</h4>
          
          {Object.entries(periodSlots).map(([period, periodSlotList]) => (
            periodSlotList.length > 0 && (
              <div key={period} className="mb-4">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
                  {period}
                </p>
                <div className="flex flex-wrap gap-2">
                  {periodSlotList.map((slot) => (
                    <button
                      key={slot.id}
                      onClick={() => onSelect(slot)}
                      disabled={!slot.is_available}
                      className={`
                        px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                        ${selectedSlot?.id === slot.id
                          ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/30'
                          : slot.is_available
                          ? 'bg-white border border-slate-200 text-slate-700 hover:border-primary-300 hover:bg-primary-50'
                          : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        }
                      `}
                    >
                      {format(parseISO(slot.start_time), 'h:mm a')}
                    </button>
                  ))}
                </div>
              </div>
            )
          ))}
        </div>
      ))}
    </div>
  );
}

function formatDateLabel(dateStr: string): string {
  const date = parseISO(dateStr);
  if (isToday(date)) return 'Today';
  if (isTomorrow(date)) return 'Tomorrow';
  return format(date, 'EEEE, MMMM d');
}

function groupByPeriod(slots: Slot[]): Record<string, Slot[]> {
  const periods: Record<string, Slot[]> = {
    morning: [],
    afternoon: [],
    evening: [],
  };

  slots.forEach((slot) => {
    const hour = parseISO(slot.start_time).getHours();
    if (hour < 12) {
      periods.morning.push(slot);
    } else if (hour < 17) {
      periods.afternoon.push(slot);
    } else {
      periods.evening.push(slot);
    }
  });

  return periods;
}


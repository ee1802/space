'use client';

import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/lib/auth';
import { calendar as calendarAPI } from '@/lib/api';

interface EventType {
  id: number;
  name: string;
  color: string;
}

interface CalendarEvent {
  id: number;
  title: string;
  start_date: string;
  end_date: string | null;
  time: string | null;
  description: string;
  external_url: string;
  event_type: number;
  event_type_name: string;
  event_type_color: string;
}

const MONTHS_RU = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
];

type ViewMode = 'month' | 'list';

export default function CalendarPage() {
  const { token } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedType, setSelectedType] = useState<number | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('month');

  useEffect(() => {
    if (!token) return;
    calendarAPI.events(token).then((data: any) => {
      setEvents(data.results || data || []);
    }).catch(() => {});
    calendarAPI.eventTypes(token).then((data: any) => {
      setEventTypes(data.results || data || []);
    }).catch(() => {});
  }, [token]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = (new Date(year, month, 1).getDay() + 6) % 7;

  const filteredEvents = useMemo(() => {
    return events.filter(e => {
      if (selectedType !== null && e.event_type !== selectedType) return false;
      return true;
    });
  }, [events, selectedType]);

  const getEventsForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return filteredEvents.filter(e => {
      if (e.start_date === dateStr) return true;
      if (e.end_date && e.start_date <= dateStr && e.end_date >= dateStr) return true;
      return false;
    });
  };

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const today = new Date().toISOString().split('T')[0];
  const upcomingEvents = filteredEvents
    .filter(e => e.start_date >= today)
    .sort((a, b) => a.start_date.localeCompare(b.start_date));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#F0EDE8]">Календарь олимпиад</h1>
        <div className="flex bg-[#0D1525] border border-[#1E2D4A] rounded-lg overflow-hidden">
          <button
            onClick={() => setViewMode('month')}
            className={`px-4 py-2 text-sm transition-colors ${viewMode === 'month' ? 'bg-[#4ECDD4] text-[#0A0E1A] font-medium' : 'text-[#A8A5A0] hover:bg-[#152035]'}`}
          >
            Месяц
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 text-sm transition-colors ${viewMode === 'list' ? 'bg-[#4ECDD4] text-[#0A0E1A] font-medium' : 'text-[#A8A5A0] hover:bg-[#152035]'}`}
          >
            Список
          </button>
        </div>
      </div>

      {/* Type filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setSelectedType(null)}
          className={`px-3 py-1 text-sm rounded-full border transition-colors ${
            selectedType === null ? 'bg-[#4ECDD4] text-[#0A0E1A] border-[#4ECDD4] font-medium' : 'border-[#1E2D4A] text-[#A8A5A0] hover:bg-[#152035]'
          }`}
        >
          Все
        </button>
        {eventTypes.map(et => (
          <button
            key={et.id}
            onClick={() => setSelectedType(selectedType === et.id ? null : et.id)}
            className={`px-3 py-1 text-sm rounded-full border transition-colors ${
              selectedType === et.id ? 'text-white font-medium' : 'border-[#1E2D4A] text-[#A8A5A0] hover:bg-[#152035]'
            }`}
            style={selectedType === et.id ? { backgroundColor: et.color, borderColor: et.color } : {}}
          >
            <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: et.color }} />
            {et.name}
          </button>
        ))}
      </div>

      {/* Month view */}
      {viewMode === 'month' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <button onClick={prevMonth} className="p-2 text-[#A8A5A0] hover:bg-[#152035] rounded-lg transition-colors">&lt;</button>
            <h2 className="text-lg font-semibold text-[#F0EDE8]">{MONTHS_RU[month]} {year}</h2>
            <button onClick={nextMonth} className="p-2 text-[#A8A5A0] hover:bg-[#152035] rounded-lg transition-colors">&gt;</button>
          </div>

          <div className="grid grid-cols-7 gap-px bg-[#1E2D4A] border border-[#1E2D4A] rounded-xl overflow-hidden">
            {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(d => (
              <div key={d} className="bg-[#0D1525] p-2 text-center text-xs font-medium text-[#6A6860]">{d}</div>
            ))}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="bg-[#070C18] p-2 min-h-[80px]" />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dayEvents = getEventsForDay(day);
              const isToday = today ===
                `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              return (
                <div key={day} className={`bg-[#070C18] p-2 min-h-[80px] ${isToday ? 'ring-2 ring-[#4ECDD4] ring-inset' : ''}`}>
                  <div className={`text-xs mb-1 ${isToday ? 'font-bold text-[#4ECDD4]' : 'text-[#6A6860]'}`}>{day}</div>
                  {dayEvents.slice(0, 2).map(e => (
                    <button
                      key={e.id}
                      onClick={() => setSelectedEvent(e)}
                      className="w-full text-left text-xs p-0.5 rounded truncate mb-0.5 hover:opacity-80 transition-opacity"
                      style={{ backgroundColor: e.event_type_color + '20', color: e.event_type_color }}
                    >
                      {e.title}
                    </button>
                  ))}
                  {dayEvents.length > 2 && (
                    <span className="text-xs text-[#6A6860]">+{dayEvents.length - 2}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* List view */}
      {viewMode === 'list' && (
        <div>
          <h3 className="font-semibold mb-4 text-[#F0EDE8]">Предстоящие события</h3>
          {upcomingEvents.length === 0 ? (
            <p className="text-sm text-[#6A6860]">Нет предстоящих событий.</p>
          ) : (
            <div className="space-y-3">
              {upcomingEvents.map(e => (
                <button
                  key={e.id}
                  onClick={() => setSelectedEvent(e)}
                  className="w-full text-left bg-[#0D1525] border border-[#1E2D4A] rounded-xl p-4 hover:border-[#253558] transition-colors"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: e.event_type_color }} />
                    <span className="text-sm text-[#6A6860]">{e.event_type_name}</span>
                  </div>
                  <div className="font-medium text-[#F0EDE8]">{e.title}</div>
                  <div className="text-sm text-[#A8A5A0] mt-1">
                    {new Date(e.start_date).toLocaleDateString('ru-RU')}
                    {e.end_date && e.end_date !== e.start_date && ` — ${new Date(e.end_date).toLocaleDateString('ru-RU')}`}
                    {e.time && ` в ${e.time}`}
                  </div>
                  {e.description && (
                    <p className="text-sm text-[#A8A5A0] mt-2 line-clamp-2">{e.description}</p>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Event detail modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setSelectedEvent(null)}>
          <div className="bg-[#0D1525] border border-[#1E2D4A] rounded-xl max-w-lg w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: selectedEvent.event_type_color }} />
              <span className="text-sm text-[#6A6860]">{selectedEvent.event_type_name}</span>
            </div>
            <h2 className="text-xl font-bold mb-2 text-[#F0EDE8]">{selectedEvent.title}</h2>
            <p className="text-sm text-[#A8A5A0] mb-4">
              {new Date(selectedEvent.start_date).toLocaleDateString('ru-RU')}
              {selectedEvent.end_date && selectedEvent.end_date !== selectedEvent.start_date &&
                ` — ${new Date(selectedEvent.end_date).toLocaleDateString('ru-RU')}`}
              {selectedEvent.time && ` в ${selectedEvent.time}`}
            </p>
            {selectedEvent.description && (
              <p className="text-sm text-[#A8A5A0] mb-4">{selectedEvent.description}</p>
            )}
            {selectedEvent.external_url && (
              <a href={selectedEvent.external_url} target="_blank" rel="noopener noreferrer"
                className="inline-block px-4 py-2 bg-[#D9A441] text-[#0A0E1A] text-sm font-medium rounded-lg hover:bg-[#F4B860] transition-colors mb-4">
                Перейти на сайт
              </a>
            )}
            <div className="text-right">
              <button onClick={() => setSelectedEvent(null)} className="text-sm text-[#6A6860] hover:text-[#A8A5A0] transition-colors">
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

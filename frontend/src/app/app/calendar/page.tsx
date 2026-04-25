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

export default function CalendarPage() {
  const { token } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedType, setSelectedType] = useState<number | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

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
  const firstDayOfWeek = (new Date(year, month, 1).getDay() + 6) % 7; // Monday = 0

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

  // Upcoming events list
  const today = new Date().toISOString().split('T')[0];
  const upcomingEvents = filteredEvents
    .filter(e => e.start_date >= today)
    .sort((a, b) => a.start_date.localeCompare(b.start_date));

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Календарь олимпиад</h1>

      {/* Type filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setSelectedType(null)}
          className={`px-3 py-1 text-sm rounded-full border ${
            selectedType === null ? 'bg-blue-600 text-white border-blue-600' : 'hover:bg-gray-50'
          }`}
        >
          Все
        </button>
        {eventTypes.map(et => (
          <button
            key={et.id}
            onClick={() => setSelectedType(selectedType === et.id ? null : et.id)}
            className={`px-3 py-1 text-sm rounded-full border ${
              selectedType === et.id ? 'text-white' : 'hover:bg-gray-50'
            }`}
            style={selectedType === et.id ? { backgroundColor: et.color, borderColor: et.color } : {}}
          >
            <span className="inline-block w-2 h-2 rounded-full mr-1" style={{ backgroundColor: et.color }} />
            {et.name}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Calendar grid */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded">&lt;</button>
            <h2 className="text-lg font-semibold">{MONTHS_RU[month]} {year}</h2>
            <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded">&gt;</button>
          </div>

          <div className="grid grid-cols-7 gap-px bg-gray-200 border rounded-lg overflow-hidden">
            {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(d => (
              <div key={d} className="bg-gray-50 p-2 text-center text-xs font-medium text-gray-500">{d}</div>
            ))}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="bg-white p-2 min-h-[80px]" />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dayEvents = getEventsForDay(day);
              const isToday = new Date().toISOString().split('T')[0] ===
                `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              return (
                <div key={day} className={`bg-white p-2 min-h-[80px] ${isToday ? 'ring-2 ring-blue-500 ring-inset' : ''}`}>
                  <div className={`text-xs mb-1 ${isToday ? 'font-bold text-blue-600' : 'text-gray-500'}`}>{day}</div>
                  {dayEvents.slice(0, 2).map(e => (
                    <button
                      key={e.id}
                      onClick={() => setSelectedEvent(e)}
                      className="w-full text-left text-xs p-0.5 rounded truncate mb-0.5"
                      style={{ backgroundColor: e.event_type_color + '20', color: e.event_type_color }}
                    >
                      {e.title}
                    </button>
                  ))}
                  {dayEvents.length > 2 && (
                    <span className="text-xs text-gray-400">+{dayEvents.length - 2}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Upcoming events list */}
        <div>
          <h3 className="font-semibold mb-4">Предстоящие события</h3>
          {upcomingEvents.length === 0 ? (
            <p className="text-sm text-gray-500">Нет предстоящих событий.</p>
          ) : (
            <div className="space-y-3">
              {upcomingEvents.map(e => (
                <button
                  key={e.id}
                  onClick={() => setSelectedEvent(e)}
                  className="w-full text-left border rounded-lg p-3 hover:bg-gray-50"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: e.event_type_color }} />
                    <span className="text-xs text-gray-500">{e.event_type_name}</span>
                  </div>
                  <div className="font-medium text-sm">{e.title}</div>
                  <div className="text-xs text-gray-400 mt-1">
                    {new Date(e.start_date).toLocaleDateString('ru-RU')}
                    {e.end_date && e.end_date !== e.start_date && ` — ${new Date(e.end_date).toLocaleDateString('ru-RU')}`}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Event detail modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={() => setSelectedEvent(null)}>
          <div className="bg-white rounded-lg max-w-lg w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: selectedEvent.event_type_color }} />
              <span className="text-sm text-gray-500">{selectedEvent.event_type_name}</span>
            </div>
            <h2 className="text-xl font-bold mb-2">{selectedEvent.title}</h2>
            <p className="text-sm text-gray-500 mb-4">
              {new Date(selectedEvent.start_date).toLocaleDateString('ru-RU')}
              {selectedEvent.end_date && selectedEvent.end_date !== selectedEvent.start_date &&
                ` — ${new Date(selectedEvent.end_date).toLocaleDateString('ru-RU')}`}
              {selectedEvent.time && ` в ${selectedEvent.time}`}
            </p>
            {selectedEvent.description && (
              <p className="text-sm text-gray-700 mb-4">{selectedEvent.description}</p>
            )}
            {selectedEvent.external_url && (
              <a href={selectedEvent.external_url} target="_blank" rel="noopener noreferrer"
                className="inline-block px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 mb-4">
                Перейти на сайт
              </a>
            )}
            <div className="text-right">
              <button onClick={() => setSelectedEvent(null)} className="text-sm text-gray-500 hover:text-gray-700">
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

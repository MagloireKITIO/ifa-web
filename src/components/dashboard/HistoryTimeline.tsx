'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, Home, Users, TrendingUp, Calendar } from 'lucide-react';

interface TimelineEvent {
  year: number;
  type: 'zone' | 'center' | 'house' | 'milestone';
  title: string;
  description?: string;
  count?: number;
  icon?: any;
}

interface HistoryTimelineProps {
  events: TimelineEvent[];
}

export function HistoryTimeline({ events }: HistoryTimelineProps) {
  // Grouper les événements par année
  const eventsByYear = events.reduce((acc, event) => {
    if (!acc[event.year]) {
      acc[event.year] = [];
    }
    acc[event.year].push(event);
    return acc;
  }, {} as Record<number, TimelineEvent[]>);

  const years = Object.keys(eventsByYear)
    .map(Number)
    .sort((a, b) => a - b);

  if (years.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground">
          <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>Aucun événement historique enregistré</p>
          <p className="text-xs mt-2">
            Les dates de fondation des centres et assemblées seront affichées ici
          </p>
        </div>
      </Card>
    );
  }

  const getEventColor = (type: string) => {
    switch (type) {
      case 'zone':
        return 'bg-blue-500';
      case 'center':
        return 'bg-green-500';
      case 'house':
        return 'bg-purple-500';
      case 'milestone':
        return 'bg-orange-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'zone':
        return TrendingUp;
      case 'center':
        return Building2;
      case 'house':
        return Home;
      case 'milestone':
        return Users;
      default:
        return Calendar;
    }
  };

  return (
    <Card className="p-6 overflow-hidden">
      <h3 className="font-semibold mb-6 flex items-center gap-2">
        <Calendar className="w-5 h-5" />
        Chronologie de l'Expansion (2011 - 2026)
      </h3>

      {/* Timeline horizontale scrollable */}
      <div className="relative">
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-8 min-w-max">
            {years.map((year, yearIndex) => {
              const yearEvents = eventsByYear[year];
              const isCurrentYear = year === new Date().getFullYear();

              return (
                <div
                  key={year}
                  className="relative flex flex-col items-center min-w-[200px]"
                >
                  {/* Ligne horizontale */}
                  {yearIndex < years.length - 1 && (
                    <div className="absolute top-8 left-1/2 w-full h-0.5 bg-gray-300 z-0" />
                  )}

                  {/* Point sur la timeline */}
                  <div
                    className={`w-16 h-16 rounded-full flex items-center justify-center z-10 mb-3 ${
                      isCurrentYear
                        ? 'bg-blue-600 ring-4 ring-blue-200'
                        : 'bg-white border-4 border-gray-300'
                    }`}
                  >
                    <span
                      className={`font-bold ${
                        isCurrentYear ? 'text-white' : 'text-gray-700'
                      }`}
                    >
                      {year}
                    </span>
                  </div>

                  {/* Événements de l'année */}
                  <div className="space-y-2 w-full">
                    {yearEvents.map((event, eventIndex) => {
                      const Icon = event.icon || getEventIcon(event.type);
                      const colorClass = getEventColor(event.type);

                      return (
                        <div
                          key={eventIndex}
                          className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start gap-2">
                            <div
                              className={`w-8 h-8 rounded-lg ${colorClass} bg-opacity-10 flex items-center justify-center flex-shrink-0`}
                            >
                              <Icon
                                className={`w-4 h-4 ${colorClass.replace('bg-', 'text-')}`}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {event.title}
                              </p>
                              {event.description && (
                                <p className="text-xs text-muted-foreground truncate">
                                  {event.description}
                                </p>
                              )}
                              {event.count !== undefined && (
                                <Badge
                                  variant="outline"
                                  className="mt-1 text-xs"
                                >
                                  {event.count} {event.type === 'house' ? 'assemblées' : 'centres'}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Scroll hint */}
        <div className="text-center mt-4">
          <p className="text-xs text-muted-foreground">
            ← Faites défiler horizontalement pour voir toute l'histoire →
          </p>
        </div>
      </div>

      {/* Légende */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex flex-wrap gap-4 justify-center">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-xs text-muted-foreground">Zones</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-xs text-muted-foreground">Centres</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-purple-500" />
            <span className="text-xs text-muted-foreground">Assemblées</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500" />
            <span className="text-xs text-muted-foreground">Jalons</span>
          </div>
        </div>
      </div>
    </Card>
  );
}

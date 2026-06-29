import React, { useEffect, useState } from 'react';
import { DataService } from '../dataService';
import { CardHeader, Button, Icons } from '../components/UIElements';
import { CompanyHoliday, CompanyEvent } from '../types';

export const Events: React.FC<{ isAdmin: boolean }> = ({ isAdmin }) => {
  const [holidays, setHolidays] = useState<CompanyHoliday[]>([]);
  const [events, setEvents] = useState<CompanyEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([DataService.getHolidays(), DataService.getEvents()]).then(([hRes, eRes]) => {
      setHolidays(hRes);
      setEvents(eRes);
      setLoading(false);
    });
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="page active">
      <div className="page-hd">
        <div className="page-hd-l">
          <h1>Events & Holidays</h1>
          <p>Company calendar and upcoming activities.</p>
        </div>
        {isAdmin && <Button variant="primary" icon={<Icons.Plus />}>Add Event</Button>}
      </div>

      <div className="grid g2">
        <div className="card">
          <CardHeader title="Upcoming Holidays" dotColor="var(--c-events)" />
          <div className="act-list">
            {holidays.length === 0 ? (
              <div className="ev-item">
                <div className="ev-date"><div className="day">01</div><div className="mon">JAN</div></div>
                <div className="ev-div"></div>
                <div className="ev-info">
                  <div className="et">New Year's Day</div>
                  <div className="es">Company-wide Holiday</div>
                </div>
                <span className="ev-tag ev-holiday">Holiday</span>
              </div>
            ) : (
              holidays.map((h) => (
                <div className="ev-item" key={h.ID || crypto.randomUUID()}>
                  <div className="ev-date"><div className="day">{(h.Date ? new Date(h.Date) : new Date()).getDate()}</div><div className="mon">{(h.Date ? new Date(h.Date) : new Date()).toLocaleString('default', { month: 'short' }).toUpperCase()}</div></div>
                  <div className="ev-div"></div>
                  <div className="ev-info">
                    <div className="et">{h.Title}</div>
                    <div className="es">Company-wide Holiday</div>
                  </div>
                  <span className="ev-tag ev-holiday">Holiday</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="card">
          <CardHeader title="Company Events" dotColor="var(--brand-600)" />
          <div className="act-list">
            {events.length === 0 ? (
              <div className="ev-item">
                <div className="ev-date"><div className="day">15</div><div className="mon">APR</div></div>
                <div className="ev-div"></div>
                <div className="ev-info">
                  <div className="et">Townhall Meeting</div>
                  <div className="es">Virtual · 10:00 AM</div>
                </div>
                <span className="ev-tag ev-event">Event</span>
              </div>
            ) : (
              events.map((e) => (
                <div className="ev-item" key={e.ID || crypto.randomUUID()}>
                  <div className="ev-date"><div className="day">{(e.Date ? new Date(e.Date) : new Date()).getDate()}</div><div className="mon">{(e.Date ? new Date(e.Date) : new Date()).toLocaleString('default', { month: 'short' }).toUpperCase()}</div></div>
                  <div className="ev-div"></div>
                  <div className="ev-info">
                    <div className="et">{e.Title}</div>
                    <div className="es">{e.Location || 'Virtual'}</div>
                  </div>
                  <span className="ev-tag ev-event">Event</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

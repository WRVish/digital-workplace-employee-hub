import React, { useEffect, useState } from 'react';
import { DataService } from '../dataService';
import { CardHeader, Button, Icons, Modal, FormGroup, Input } from '../components/UIElements';
import { CompanyHoliday, CompanyEvent } from '../types';

export const Events: React.FC<{ isAdmin: boolean }> = ({ isAdmin }) => {
  const [holidays, setHolidays] = useState<CompanyHoliday[]>([]);
  const [events, setEvents] = useState<CompanyEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({ Title: '', Date: '', Location: '' });

  const loadData = () => {
    Promise.all([DataService.getHolidays(), DataService.getEvents()]).then(([hRes, eRes]) => {
      setHolidays(hRes);
      setEvents(eRes);
      setLoading(false);
    });
  };

  useEffect(() => { loadData(); }, []);

  const handleAddEvent = async () => {
    setSubmitting(true);
    try {
      await DataService.createEvent({
        Title: formData.Title,
        EventName: formData.Title,
        Date: new Date(formData.Date).toISOString(),
        Location: formData.Location,
        Status: 'Upcoming'
      });
      setIsAddOpen(false);
      setFormData({ Title: '', Date: '', Location: '' });
      loadData();
    } catch (e: any) {
      alert("Failed to add event: " + e.message);
    }
    setSubmitting(false);
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="eh-page active">
      <div className="eh-page-hd">
        <div className="eh-page-hd-l">
          <h1>Events & Holidays</h1>
          <p>Company calendar and upcoming activities.</p>
        </div>
        {isAdmin && <Button variant="primary" icon={<Icons.Plus />} onClick={() => setIsAddOpen(true)}>Add Event</Button>}
      </div>

      <div className="eh-grid eh-g2">
        <div className="eh-card">
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
                <div className="ev-item" key={h.ID || Math.random().toString()}>
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

        <div className="eh-card">
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
                <div className="ev-item" key={e.ID || Math.random().toString()}>
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

      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Add Event">
        <FormGroup label="Event Title">
          <Input value={formData.Title} onChange={e => setFormData({...formData, Title: e.target.value})} placeholder="e.g. Townhall Meeting" />
        </FormGroup>
        <FormGroup label="Date">
          <Input type="date" value={formData.Date} onChange={e => setFormData({...formData, Date: e.target.value})} />
        </FormGroup>
        <FormGroup label="Location">
          <Input value={formData.Location} onChange={e => setFormData({...formData, Location: e.target.value})} placeholder="e.g. Virtual or Main Office" />
        </FormGroup>
        <div className="modal-actions">
          <Button onClick={() => setIsAddOpen(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleAddEvent}>{submitting ? 'Saving...' : 'Add Event'}</Button>
        </div>
      </Modal>
    </div>
  );
};
